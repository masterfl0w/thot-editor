import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { useDiagram, type CollaboratorPresence } from '../store/diagramStore'

const COLOR_PALETTE = [
  '#f4a8a8',
  '#f7c79d',
  '#f2df8f',
  '#b8e0a5',
  '#98dbc6',
  '#8fc7ff',
  '#b9b0ff',
  '#e0b2ff',
  '#ffb7d4',
  '#d8c3a5',
]

const SCI_FI_NAMES = [
  'Skywalker',
  'Atreides',
  'Spock',
  'Ripley',
  'Andor',
  'Sato',
  'Picard',
  'Leeloo',
  'Kira',
  'Solo',
  'Tarkin',
  'Janeway',
  'Paul MuadDib',
  'Uhura',
  'Deckard',
  'Neo',
]

const STORAGE_KEY = 'thot-editor-workspace'
const GUEST_BACKUP_KEY = 'thot-editor-collab-guest-backup'
const DEFAULT_MODE = 'Select mode: drag to multi-select · Shift-click to add to selection · Right-click to add'
const MOVE_MODE = 'Move mode: drag or scroll to pan · Right-click to add'

type Profile = {
  id: string
  name: string
  color: string
}

let doc: Y.Doc | null = null
let provider: WebrtcProvider | null = null
let roomMap: Y.Map<string> | null = null
let unsubStore: (() => void) | null = null
let stopAwarenessObserver: (() => void) | null = null
let stopRoomObserver: (() => void) | null = null
let applyingRemote = false
let lastSerializedWorkspace = ''
let canSyncLocalWorkspace = false

function getCollabParam() {
  return new URLSearchParams(window.location.search).get('collab')
}

function setCollabParam(roomId: string | null) {
  const url = new URL(window.location.href)
  if (roomId) url.searchParams.set('collab', roomId)
  else url.searchParams.delete('collab')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${window.location.hash}`)
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function getSelfProfile(): Profile {
  const existing = sessionStorage.getItem('thot-collab-profile')
  if (existing) {
    try {
      return JSON.parse(existing) as Profile
    } catch {
      sessionStorage.removeItem('thot-collab-profile')
    }
  }

  const id = `peer-${Math.random().toString(36).slice(2, 10)}`
  const hash = hashString(id)
  const color = COLOR_PALETTE[hash % COLOR_PALETTE.length]
  const name = SCI_FI_NAMES[hash % SCI_FI_NAMES.length]
  const profile = { id, name, color }
  sessionStorage.setItem('thot-collab-profile', JSON.stringify(profile))
  return profile
}

function snapshotWorkspace() {
  return useDiagram.getState().exportWorkspace()
}

function backupGuestWorkspace() {
  if (sessionStorage.getItem(GUEST_BACKUP_KEY) !== null) return
  const raw = localStorage.getItem(STORAGE_KEY)
  sessionStorage.setItem(GUEST_BACKUP_KEY, raw ?? '__empty__')
}

function restorePersistedGuestWorkspace(raw: string | null) {
  let persistedState: Record<string, unknown> | null = null
  if (raw) {
    try {
      persistedState = (JSON.parse(raw) as { state?: Record<string, unknown> }).state ?? null
    } catch {
      persistedState = null
    }
  }

  const nodes = persistedState?.nodes && typeof persistedState.nodes === 'object'
    ? persistedState.nodes as ReturnType<typeof useDiagram.getState>['nodes']
    : {}
  const texts = persistedState?.texts && typeof persistedState.texts === 'object'
    ? persistedState.texts as ReturnType<typeof useDiagram.getState>['texts']
    : {}
  const edges = Array.isArray(persistedState?.edges)
    ? persistedState.edges as ReturnType<typeof useDiagram.getState>['edges']
    : []
  const theme = persistedState?.theme === 'dark' ? 'dark' : 'light'
  const layoutMode = persistedState?.layoutMode === 'static' ? 'static' : 'free'
  const interactionMode = persistedState?.interactionMode === 'move' ? 'move' : 'select'
  const viewport = persistedState?.viewport && typeof persistedState.viewport === 'object'
    ? {
        x: typeof (persistedState.viewport as { x?: unknown }).x === 'number' ? (persistedState.viewport as { x: number }).x : 0,
        y: typeof (persistedState.viewport as { y?: unknown }).y === 'number' ? (persistedState.viewport as { y: number }).y : 0,
      }
    : { x: 0, y: 0 }
  const zoom = typeof persistedState?.zoom === 'number' ? persistedState.zoom : 1
  const nc = typeof persistedState?.nc === 'number' ? persistedState.nc : 0
  const tc = typeof persistedState?.tc === 'number' ? persistedState.tc : 0
  const actionHistory = Array.isArray(persistedState?.actionHistory)
    ? persistedState.actionHistory.filter((item): item is string => typeof item === 'string')
    : []

  useDiagram.setState(state => ({
    ...state,
    nodes,
    texts,
    edges,
    actionHistory,
    theme,
    layoutMode,
    viewport,
    zoom,
    interactionMode,
    nc,
    tc,
    selNode: null,
    selText: null,
    selEdge: null,
    multiSel: new Set(),
    cmode: false,
    csrc: null,
    csrcSide: null,
    editingTextId: null,
    sceneClipboard: null,
    historyPast: [],
    historyFuture: [],
    ctxTarget: null,
    pointer: null,
    modeText: interactionMode === 'move' ? MOVE_MODE : DEFAULT_MODE,
  }))
}

function restoreGuestWorkspace() {
  const backup = sessionStorage.getItem(GUEST_BACKUP_KEY)
  if (backup === null) return
  sessionStorage.removeItem(GUEST_BACKUP_KEY)
  if (backup === '__empty__') {
    localStorage.removeItem(STORAGE_KEY)
    restorePersistedGuestWorkspace(null)
    return
  }
  localStorage.setItem(STORAGE_KEY, backup)
  restorePersistedGuestWorkspace(backup)
}

function syncWorkspaceToRoom() {
  if (!roomMap || applyingRemote || !canSyncLocalWorkspace) return
  const next = JSON.stringify(snapshotWorkspace())
  if (next === lastSerializedWorkspace) return
  lastSerializedWorkspace = next
  roomMap.set('workspace', next)
}

function updateParticipants() {
  if (!provider || !roomMap) return
  const awarenessStates = Array.from(provider.awareness.getStates().values()) as Array<{
    user?: { id?: string; name?: string; color?: string }
    pointer?: { x: number; y: number } | null
  }>
  const hostId = roomMap.get('hostId') ?? ''
  const selfId = useDiagram.getState().collaboration.selfId
  const participants: CollaboratorPresence[] = awarenessStates
    .filter(state => state.user?.id && state.user.name && state.user.color)
    .map(state => ({
      id: state.user!.id!,
      name: state.user!.name!,
      color: state.user!.color!,
      pointer: state.pointer ?? null,
      isHost: state.user!.id === hostId,
      self: state.user!.id === selfId,
    }))
    .sort((a, b) => Number(b.isHost) - Number(a.isHost) || a.id.localeCompare(b.id))
    .map((participant, index) => ({
      ...participant,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }))
  useDiagram.getState().setCollaborationParticipants(participants)
  const selfParticipant = participants.find(participant => participant.self)
  if (selfParticipant) {
    useDiagram.getState().setCollaborationState({ selfColor: selfParticipant.color })
  }
}

function cleanupConnection(removeUrl = true) {
  const shouldRestoreGuestWorkspace = useDiagram.getState().collaboration.active && !useDiagram.getState().collaboration.isHost
  unsubStore?.()
  unsubStore = null
  stopAwarenessObserver?.()
  stopAwarenessObserver = null
  stopRoomObserver?.()
  stopRoomObserver = null
  provider?.disconnect()
  provider?.destroy()
  provider = null
  doc?.destroy()
  doc = null
  roomMap = null
  applyingRemote = false
  lastSerializedWorkspace = ''
  canSyncLocalWorkspace = false
  useDiagram.getState().resetCollaborationState()
  if (shouldRestoreGuestWorkspace) restoreGuestWorkspace()
  if (removeUrl) setCollabParam(null)
}

function observeRoomState(profile: Profile) {
  if (!roomMap) return
  const observer = () => {
    if (!roomMap || !provider) return
    const closed = roomMap.get('closed') === 'true'
    const kickedRaw = roomMap.get('kicked') ?? '[]'
    let kicked: string[] = []
    try {
      kicked = JSON.parse(kickedRaw)
    } catch {
      kicked = []
    }

    if (closed) {
      useDiagram.getState().pushToast('error', 'Collaboration closed by host')
      cleanupConnection(true)
      return
    }
    if (kicked.includes(profile.id)) {
      useDiagram.getState().pushToast('error', 'You were removed from the collaboration')
      cleanupConnection(true)
      return
    }

    const workspace = roomMap.get('workspace')
    if (workspace && workspace !== lastSerializedWorkspace) {
      try {
        applyingRemote = true
        const parsed = JSON.parse(workspace)
        if (useDiagram.getState().applyCollaborativeWorkspace(parsed)) {
          lastSerializedWorkspace = workspace
          canSyncLocalWorkspace = true
        }
      } finally {
        applyingRemote = false
      }
    }
    updateParticipants()
  }
  roomMap.observe(observer)
  stopRoomObserver = () => roomMap?.unobserve(observer)
  observer()
}

function observeAwareness() {
  if (!provider) return
  const handler = () => updateParticipants()
  provider.awareness.on('change', handler)
  stopAwarenessObserver = () => provider?.awareness.off('change', handler)
  handler()
}

function connectToRoom(roomId: string, isHost: boolean) {
  cleanupConnection(false)
  const profile = getSelfProfile()
  if (!isHost) backupGuestWorkspace()
  doc = new Y.Doc()
  provider = new WebrtcProvider(`thot-editor-${roomId}`, doc)
  roomMap = doc.getMap('room')

  if (isHost) {
    roomMap.set('hostId', profile.id)
    roomMap.set('closed', 'false')
    roomMap.set('kicked', '[]')
    const initial = JSON.stringify(snapshotWorkspace())
    roomMap.set('workspace', initial)
    lastSerializedWorkspace = initial
    canSyncLocalWorkspace = true
  } else {
    lastSerializedWorkspace = ''
    canSyncLocalWorkspace = false
  }

  useDiagram.getState().setCollaborationState({
    active: true,
    roomId,
    isHost,
    selfId: profile.id,
    selfName: profile.name,
    selfColor: profile.color,
  })

  provider.awareness.setLocalStateField('user', profile)
  provider.awareness.setLocalStateField('pointer', null)

  unsubStore = useDiagram.subscribe(state => {
    if (!provider || !roomMap) return
    provider.awareness.setLocalStateField('pointer', state.pointer)
    syncWorkspaceToRoom()
  })

  observeAwareness()
  observeRoomState(profile)
  setCollabParam(roomId)
}

export function ensureCollaborationFromUrl() {
  const roomId = getCollabParam()
  if (!roomId || useDiagram.getState().collaboration.active) return false
  connectToRoom(roomId, false)
  useDiagram.getState().pushToast('success', 'Joined collaborative workspace')
  return true
}

export function startHostedCollaboration() {
  if (useDiagram.getState().collaboration.active) return getInviteLink()
  const roomId = Math.random().toString(36).slice(2, 10)
  connectToRoom(roomId, true)
  return getInviteLink()
}

export function getInviteLink() {
  const roomId = useDiagram.getState().collaboration.roomId
  if (!roomId) return null
  const url = new URL(window.location.href)
  url.searchParams.set('collab', roomId)
  url.hash = 'editor'
  return url.toString()
}

export async function copyInviteLink() {
  const link = getInviteLink()
  if (!link) return false
  await navigator.clipboard.writeText(link)
  return true
}

export function stopCollaboration() {
  if (!roomMap || !useDiagram.getState().collaboration.active) return
  if (useDiagram.getState().collaboration.isHost) {
    roomMap.set('closed', 'true')
  }
  cleanupConnection(true)
}

export function kickCollaborator(id: string) {
  if (!roomMap || !useDiagram.getState().collaboration.isHost) return false
  const kickedRaw = roomMap.get('kicked') ?? '[]'
  const kicked = new Set<string>(JSON.parse(kickedRaw))
  kicked.add(id)
  roomMap.set('kicked', JSON.stringify([...kicked]))
  return true
}
