import { useDiagram, type ActionHistoryEntry, type CollaborationRequest, type CollaboratorPresence } from '../store/diagramStore'

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

type ParticipantPayload = {
  id: string
  name: string
  color: string
  isHost: boolean
  pointer: { x: number; y: number } | null
}

type RequestPayload = {
  id: string
  name: string
  color: string
}

type ServerMessage =
  | { type: 'session-started'; roomId: string; participants: ParticipantPayload[]; pendingRequests: RequestPayload[] }
  | { type: 'join-requested'; roomId: string }
  | { type: 'approved'; roomId: string; workspace: unknown; participants: ParticipantPayload[]; pendingRequests: RequestPayload[] }
  | { type: 'collaboration-state'; roomId: string; participants: ParticipantPayload[]; pendingRequests: RequestPayload[] }
  | { type: 'pointer-state'; roomId: string; participantId: string; pointer: { x: number; y: number } | null }
  | { type: 'workspace'; roomId: string; workspace: unknown; actorId: string }
  | { type: 'room-closed' }
  | { type: 'kicked' }
  | { type: 'rejected' }
  | { type: 'error'; message: string }

type ClientMessage =
  | { type: 'host-open'; roomId: string; profile: Profile; workspace: unknown }
  | { type: 'guest-request'; roomId: string; profile: Profile }
  | { type: 'approve-guest'; roomId: string; guestId: string }
  | { type: 'reject-guest'; roomId: string; guestId: string }
  | { type: 'kick-guest'; roomId: string; guestId: string }
  | { type: 'close-room'; roomId: string }
  | { type: 'leave-room'; roomId: string }
  | { type: 'workspace-update'; roomId: string; workspace: unknown }
  | { type: 'pointer-update'; roomId: string; pointer: { x: number; y: number } | null }

let socket: WebSocket | null = null
let unsubStore: (() => void) | null = null
let lastSerializedWorkspace = ''
let canSyncLocalWorkspace = false
let currentRoomId: string | null = null
let currentIsHost = false
let isCleaningUp = false
let lastPointerSerialized = 'null'
let lastPointerSentAt = 0

function getCollabWsParam() {
  return new URLSearchParams(window.location.search).get('collabWs')
}

function getWsUrl(explicitUrl?: string | null) {
  if (explicitUrl) return explicitUrl
  const configured = import.meta.env.VITE_COLLAB_WS_URL
  if (configured) return configured
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.hostname}:1235`
}

function getCollabParam() {
  return new URLSearchParams(window.location.search).get('collab')
}

function setCollabParam(roomId: string | null, serverUrl?: string | null) {
  const url = new URL(window.location.href)
  if (roomId) url.searchParams.set('collab', roomId)
  else url.searchParams.delete('collab')
  if (serverUrl) url.searchParams.set('collabWs', serverUrl)
  else url.searchParams.delete('collabWs')
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
  const profile = {
    id,
    name: SCI_FI_NAMES[hash % SCI_FI_NAMES.length],
    color: COLOR_PALETTE[hash % COLOR_PALETTE.length],
  }
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
    ? persistedState.actionHistory.filter((item): item is ActionHistoryEntry =>
      !!item
      && typeof item === 'object'
      && typeof (item as ActionHistoryEntry).id === 'string'
      && typeof (item as ActionHistoryEntry).label === 'string'
      && typeof (item as ActionHistoryEntry).actor === 'string'
      && typeof (item as ActionHistoryEntry).createdAt === 'string')
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

function mapParticipants(participants: ParticipantPayload[]): CollaboratorPresence[] {
  const selfId = useDiagram.getState().collaboration.selfId
  return participants.map(participant => ({
    id: participant.id,
    name: participant.name,
    color: participant.color,
    pointer: participant.pointer,
    isHost: participant.isHost,
    self: participant.id === selfId,
  }))
}

function mapRequests(requests: RequestPayload[]): CollaborationRequest[] {
  return requests.map(request => ({
    id: request.id,
    name: request.name,
    color: request.color,
  }))
}

function sendMessage(message: ClientMessage) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false
  socket.send(JSON.stringify(message))
  return true
}

function syncWorkspaceToServer() {
  if (!currentRoomId || !canSyncLocalWorkspace) return
  const next = JSON.stringify(snapshotWorkspace())
  if (next === lastSerializedWorkspace) return
  lastSerializedWorkspace = next
  sendMessage({
    type: 'workspace-update',
    roomId: currentRoomId,
    workspace: JSON.parse(next),
  })
}

function setupStoreSync() {
  unsubStore?.()
  let lastActionLength = useDiagram.getState().actionHistory.length
  let lastHistoryPastLength = useDiagram.getState().historyPast.length
  let lastHistoryFutureLength = useDiagram.getState().historyFuture.length
  unsubStore = useDiagram.subscribe(state => {
    if (socket?.readyState !== WebSocket.OPEN || !currentRoomId) return
    const pointerSerialized = JSON.stringify(state.pointer)
    const now = Date.now()
    if (pointerSerialized !== lastPointerSerialized && now - lastPointerSentAt >= 40) {
      sendMessage({
        type: 'pointer-update',
        roomId: currentRoomId,
        pointer: state.pointer,
      })
      lastPointerSerialized = pointerSerialized
      lastPointerSentAt = now
    }

    if (
      state.actionHistory.length !== lastActionLength
      || state.historyPast.length !== lastHistoryPastLength
      || state.historyFuture.length !== lastHistoryFutureLength
    ) {
      lastActionLength = state.actionHistory.length
      lastHistoryPastLength = state.historyPast.length
      lastHistoryFutureLength = state.historyFuture.length
      syncWorkspaceToServer()
    }
  })
}

function teardownStoreSync() {
  unsubStore?.()
  unsubStore = null
}

function cleanupConnection(removeUrl = true, restoreGuest = true) {
  isCleaningUp = true
  teardownStoreSync()
  socket?.close()
  socket = null
  lastSerializedWorkspace = ''
  canSyncLocalWorkspace = false
  currentRoomId = null
  lastPointerSerialized = 'null'
  lastPointerSentAt = 0
  const shouldRestoreGuestWorkspace = restoreGuest && useDiagram.getState().collaboration.active && !useDiagram.getState().collaboration.isHost
  currentIsHost = false
  useDiagram.getState().resetCollaborationState()
  if (shouldRestoreGuestWorkspace) restoreGuestWorkspace()
  if (removeUrl) setCollabParam(null, null)
  isCleaningUp = false
}

function updateParticipantPointer(participantId: string, pointer: { x: number; y: number } | null) {
  const state = useDiagram.getState()
  state.setCollaborationParticipants(
    state.collaboration.participants.map(participant =>
      participant.id === participantId ? { ...participant, pointer } : participant,
    ),
  )
}

function handleServerMessage(message: ServerMessage) {
  const store = useDiagram.getState()
  switch (message.type) {
    case 'session-started': {
      currentRoomId = message.roomId
      canSyncLocalWorkspace = true
      lastSerializedWorkspace = JSON.stringify(snapshotWorkspace())
      store.setCollaborationState({
        active: true,
        roomId: message.roomId,
        isHost: true,
        awaitingApproval: false,
        participants: mapParticipants(message.participants),
        pendingRequests: mapRequests(message.pendingRequests),
      })
      break
    }
    case 'join-requested': {
      currentRoomId = message.roomId
      store.setCollaborationState({
        active: true,
        roomId: message.roomId,
        isHost: false,
        awaitingApproval: true,
        participants: [],
        pendingRequests: [],
      })
      store.pushToast('success', 'Join request sent to host')
      break
    }
    case 'approved': {
      currentRoomId = message.roomId
      if (store.applyCollaborativeWorkspace(message.workspace)) {
        lastSerializedWorkspace = JSON.stringify(message.workspace)
      }
      canSyncLocalWorkspace = true
      store.setCollaborationState({
        active: true,
        roomId: message.roomId,
        isHost: false,
        awaitingApproval: false,
        participants: mapParticipants(message.participants),
        pendingRequests: mapRequests(message.pendingRequests),
      })
      store.pushToast('success', 'Joined collaborative workspace')
      break
    }
    case 'collaboration-state': {
      store.setCollaborationState({
        active: true,
        roomId: message.roomId,
        participants: mapParticipants(message.participants),
        pendingRequests: mapRequests(message.pendingRequests),
      })
      break
    }
    case 'workspace': {
      const next = JSON.stringify(message.workspace)
      if (next !== lastSerializedWorkspace && store.applyCollaborativeWorkspace(message.workspace)) {
        lastSerializedWorkspace = next
      }
      break
    }
    case 'pointer-state': {
      updateParticipantPointer(message.participantId, message.pointer)
      break
    }
    case 'room-closed': {
      store.pushToast('error', 'Collaboration closed by host')
      cleanupConnection(true, true)
      break
    }
    case 'kicked': {
      store.pushToast('error', 'You were removed from the collaboration')
      cleanupConnection(true, true)
      break
    }
    case 'rejected': {
      store.pushToast('error', 'Join request rejected by host')
      cleanupConnection(true, true)
      break
    }
    case 'error': {
      store.pushToast('error', message.message)
      break
    }
  }
}

function connectSocket(serverUrl: string, onOpen: () => void) {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return
  socket = new WebSocket(serverUrl)
  socket.onopen = () => {
    setupStoreSync()
    onOpen()
  }
  socket.onmessage = (event) => {
    try {
      handleServerMessage(JSON.parse(event.data) as ServerMessage)
    } catch {
      useDiagram.getState().pushToast('error', 'Received an invalid collaboration message')
    }
  }
  socket.onclose = () => {
    teardownStoreSync()
    if (!isCleaningUp && useDiagram.getState().collaboration.active) {
      useDiagram.getState().pushToast('error', 'Collaboration connection lost')
      cleanupConnection(true, !currentIsHost)
    }
  }
}

export function ensureCollaborationFromUrl() {
  const roomId = getCollabParam()
  const serverUrl = getWsUrl(getCollabWsParam())
  if (!roomId || useDiagram.getState().collaboration.active) return false
  const profile = getSelfProfile()
  currentIsHost = false
  backupGuestWorkspace()
  useDiagram.getState().setCollaborationState({
    active: true,
    roomId,
    isHost: false,
    awaitingApproval: true,
    serverUrl,
    selfId: profile.id,
    selfName: profile.name,
    selfColor: profile.color,
    participants: [],
    pendingRequests: [],
  })
  connectSocket(serverUrl, () => {
    sendMessage({ type: 'guest-request', roomId, profile })
  })
  return true
}

export function startHostedCollaboration(serverUrl?: string) {
  if (useDiagram.getState().collaboration.active && useDiagram.getState().collaboration.isHost) return getInviteLink()
  const roomId = Math.random().toString(36).slice(2, 10)
  const profile = getSelfProfile()
  currentIsHost = true
  currentRoomId = roomId
  const resolvedServerUrl = getWsUrl(serverUrl?.trim() || null)
  useDiagram.getState().setCollaborationState({
    active: true,
    roomId,
    isHost: true,
    awaitingApproval: false,
    serverUrl: resolvedServerUrl,
    selfId: profile.id,
    selfName: profile.name,
    selfColor: profile.color,
    participants: [],
    pendingRequests: [],
  })
  connectSocket(resolvedServerUrl, () => {
    sendMessage({ type: 'host-open', roomId, profile, workspace: snapshotWorkspace() })
  })
  setCollabParam(roomId, resolvedServerUrl)
  return getInviteLink()
}

export function getInviteLink() {
  const roomId = useDiagram.getState().collaboration.roomId
  if (!roomId) return null
  const url = new URL(window.location.href)
  url.searchParams.set('collab', roomId)
  if (useDiagram.getState().collaboration.serverUrl) {
    url.searchParams.set('collabWs', useDiagram.getState().collaboration.serverUrl!)
  }
  url.hash = 'editor'
  return url.toString()
}

export async function copyInviteLink() {
  const link = getInviteLink()
  if (!link) return false
  await navigator.clipboard.writeText(link)
  return true
}

export function approveCollaborator(id: string) {
  if (!currentRoomId || !useDiagram.getState().collaboration.isHost) return false
  return sendMessage({ type: 'approve-guest', roomId: currentRoomId, guestId: id })
}

export function rejectCollaborator(id: string) {
  if (!currentRoomId || !useDiagram.getState().collaboration.isHost) return false
  return sendMessage({ type: 'reject-guest', roomId: currentRoomId, guestId: id })
}

export function kickCollaborator(id: string) {
  if (!currentRoomId || !useDiagram.getState().collaboration.isHost) return false
  return sendMessage({ type: 'kick-guest', roomId: currentRoomId, guestId: id })
}

export function stopCollaboration() {
  const roomId = currentRoomId
  if (!roomId || !useDiagram.getState().collaboration.active) return
  if (useDiagram.getState().collaboration.isHost) {
    sendMessage({ type: 'close-room', roomId })
    cleanupConnection(true, false)
    return
  }
  sendMessage({ type: 'leave-room', roomId })
  cleanupConnection(true, true)
}
