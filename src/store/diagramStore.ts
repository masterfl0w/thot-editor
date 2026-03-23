import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DiagramNode, TextNode, Edge, ContextMenuTarget, PortSide } from '../types'

type WorkspaceSnapshot = {
  nodes: Record<string, DiagramNode>
  texts: Record<string, TextNode>
  edges: Edge[]
  viewport: { x: number; y: number }
  zoom: number
}

export type Toast = {
  id: string
  kind: 'success' | 'error'
  message: string
}

export type ActionHistoryEntry = {
  id: string
  label: string
  actor: string
  createdAt: string
}

export type CollaboratorPresence = {
  id: string
  name: string
  color: string
  pointer: { x: number; y: number } | null
  isHost: boolean
  self: boolean
}

export type CollaborationRequest = {
  id: string
  name: string
  color: string
}

export type CollaborationState = {
  active: boolean
  roomId: string | null
  isHost: boolean
  awaitingApproval: boolean
  serverUrl: string | null
  selfId: string | null
  selfName: string | null
  selfColor: string | null
  participants: CollaboratorPresence[]
  pendingRequests: CollaborationRequest[]
}

function lum(h: string) {
  const r = parseInt(h.slice(1, 3), 16) / 255
  const g = parseInt(h.slice(3, 5), 16) / 255
  const b = parseInt(h.slice(5, 7), 16) / 255
  const f = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function autoFg(bg: string): string {
  return lum(bg) > 0.35 ? '#1a1a18' : '#f5f3ee'
}

export function autoBorder(bg: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(bg)) {
    return lum(bg) > 0.35 ? adjHex(bg, -28) : adjHex(bg, 28)
  }
  return bg === 'transparent' ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.2)'
}

export function adjHex(hex: string, amt: number): string {
  return '#' + [1, 3, 5].map(i =>
    Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) + amt))
      .toString(16).padStart(2, '0')
  ).join('')
}

function snap(value: number) {
  return Math.round(value / SNAP_STEP) * SNAP_STEP
}

interface DiagramState {
  nodes: Record<string, DiagramNode>
  texts: Record<string, TextNode>
  edges: Edge[]
  sceneClipboard: { nodes: DiagramNode[]; texts: TextNode[]; edges: Edge[] } | null
  historyPast: WorkspaceSnapshot[]
  historyFuture: WorkspaceSnapshot[]
  actionHistory: ActionHistoryEntry[]
  theme: 'light' | 'dark'
  layoutMode: 'free' | 'static'
  viewport: { x: number; y: number }
  pointer: { x: number; y: number } | null
  zoom: number
  interactionMode: 'select' | 'move'
  selNode: string | null
  selText: string | null
  selEdge: number | null
  multiSel: Set<string>
  cmode: boolean
  csrc: string | null
  csrcSide: PortSide | null
  editingTextId: string | null
  nc: number
  tc: number
  ctxTarget: ContextMenuTarget
  modeText: string
  toasts: Toast[]
  collaboration: CollaborationState

  // actions
  addBox: (opts?: Partial<DiagramNode> & { parent?: string }) => string
  addText: (opts?: Partial<TextNode>) => string
  addEdge: (from: string, to: string, fromSide?: PortSide, toSide?: PortSide) => void
  deleteNode: (id: string) => void
  deleteText: (id: string) => void
  deleteEdge: (idx: number) => void
  updateNode: (id: string, patch: Partial<DiagramNode>) => void
  updateText: (id: string, patch: Partial<TextNode>) => void
  updateEdge: (idx: number, patch: Partial<Edge>) => void
  selectNode: (id: string) => void
  selectText: (id: string) => void
  selectEdge: (idx: number) => void
  toggleMultiSel: (id: string) => void
  deselectAll: () => void
  attachChild: (childId: string, parentId: string) => void
  detachNode: (id: string, place?: boolean, ax?: number, ay?: number) => void
  clearAll: () => void
  startConnect: (nodeId?: string, side?: PortSide) => void
  cancelConnect: () => void
  startEditText: (id: string) => void
  finishEditText: (id: string, content?: string) => void
  setMultiSel: (ids: Set<string>) => void
  clearMultiSel: () => void
  deleteMultiSel: () => void
  setCtxTarget: (t: ContextMenuTarget) => void
  setModeText: (t: string) => void
  setInteractionMode: (mode: 'select' | 'move') => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setLayoutMode: (layoutMode: 'free' | 'static') => void
  undo: () => boolean
  copySelectionToClipboard: () => boolean
  pasteClipboard: (at?: { x: number; y: number } | null) => boolean
  setViewport: (viewport: { x: number; y: number }) => void
  setPointer: (pointer: { x: number; y: number } | null) => void
  setZoom: (zoom: number) => void
  captureWorkspaceSnapshot: () => WorkspaceSnapshot
  commitWorkspaceSnapshot: (action: string, before: WorkspaceSnapshot) => void
  setNodePosition: (id: string, x: number, y: number) => void
  setTextPosition: (id: string, x: number, y: number) => void
  moveNode: (id: string, x: number, y: number) => void
  moveText: (id: string, x: number, y: number) => void
  exportWorkspace: () => {
    version: string
    theme: 'light' | 'dark'
    layoutMode: 'free' | 'static'
    viewport: { x: number; y: number }
    zoom: number
    nodes: Record<string, DiagramNode>
    texts: Record<string, TextNode>
    edges: Edge[]
  }
  importWorkspace: (data: unknown) => boolean
  applyCollaborativeWorkspace: (data: unknown) => boolean
  pushToast: (kind: 'success' | 'error', message: string) => void
  removeToast: (id: string) => void
  setCollaborationState: (patch: Partial<CollaborationState>) => void
  resetCollaborationState: () => void
  setCollaborationParticipants: (participants: CollaboratorPresence[]) => void
}

const DEFAULT_MODE = 'Select mode: drag to multi-select · Shift-click to add to selection · Right-click to add'
const MOVE_MODE = 'Move mode: drag or scroll to pan · Right-click to add'
const STORAGE_KEY = typeof window !== 'undefined' && window.location.hash === '#demo'
  ? 'thot-editor-demo-workspace'
  : 'thot-editor-workspace'
const SNAP_STEP = 24
const MAX_UNDO = 50
const MAX_ACTION_HISTORY = 120
const EMPTY_COLLABORATION: CollaborationState = {
  active: false,
  roomId: null,
  isHost: false,
  awaitingApproval: false,
  serverUrl: null,
  selfId: null,
  selfName: null,
  selfColor: null,
  participants: [],
  pendingRequests: [],
}
const DEFAULT_THEME: 'light' | 'dark' =
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

function makeHistoryEntry(label: string, collaboration: CollaborationState): ActionHistoryEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    actor: collaboration.active ? (collaboration.selfName ?? 'Collaborator') : 'You',
    createdAt: new Date().toISOString(),
  }
}

function cloneWorkspaceSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    nodes: Object.fromEntries(Object.entries(snapshot.nodes).map(([id, node]) => [id, { ...node, children: [...node.children] }])),
    texts: Object.fromEntries(Object.entries(snapshot.texts).map(([id, text]) => [id, { ...text }])),
    edges: snapshot.edges.map(edge => ({ ...edge })),
    viewport: { ...snapshot.viewport },
    zoom: snapshot.zoom,
  }
}

function getWorkspaceSnapshot(state: Pick<DiagramState, 'nodes' | 'texts' | 'edges' | 'viewport' | 'zoom'>): WorkspaceSnapshot {
  return cloneWorkspaceSnapshot({
    nodes: state.nodes,
    texts: state.texts,
    edges: state.edges,
    viewport: state.viewport,
    zoom: state.zoom,
  })
}

function sameWorkspace(a: WorkspaceSnapshot, b: WorkspaceSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function isPortSide(value: unknown): value is PortSide {
  return value === 'pt' || value === 'pb' || value === 'pl' || value === 'pr'
}

function isDiagramNode(value: unknown): value is DiagramNode {
  if (!value || typeof value !== 'object') return false
  const node = value as DiagramNode
  return typeof node.id === 'string'
    && typeof node.title === 'string'
    && typeof node.desc === 'string'
    && typeof node.bg === 'string'
    && typeof node.fg === 'string'
    && typeof node.shape === 'string'
    && typeof node.family === 'string'
    && typeof node.size === 'number'
    && typeof node.bold === 'boolean'
    && typeof node.italic === 'boolean'
    && typeof node.underline === 'boolean'
    && typeof node.strike === 'boolean'
    && typeof node.radius === 'number'
    && typeof node.x === 'number'
    && typeof node.y === 'number'
    && (typeof node.parent === 'string' || node.parent === null)
    && Array.isArray(node.children)
}

function isTextNode(value: unknown): value is TextNode {
  if (!value || typeof value !== 'object') return false
  const text = value as TextNode
  return typeof text.id === 'string'
    && typeof text.content === 'string'
    && typeof text.x === 'number'
    && typeof text.y === 'number'
    && typeof text.size === 'number'
    && typeof text.color === 'string'
    && typeof text.family === 'string'
    && typeof text.bold === 'boolean'
    && typeof text.italic === 'boolean'
    && typeof text.underline === 'boolean'
    && typeof text.strike === 'boolean'
    && (text.align === 'left' || text.align === 'center' || text.align === 'right')
    && typeof text.opacity === 'number'
}

function isEdge(value: unknown): value is Edge {
  if (!value || typeof value !== 'object') return false
  const edge = value as Edge
  return typeof edge.from === 'string'
    && typeof edge.to === 'string'
    && isPortSide(edge.fromSide)
    && isPortSide(edge.toSide)
    && typeof edge.label === 'string'
    && typeof edge.desc === 'string'
    && typeof edge.color === 'string'
    && (edge.style === 'solid' || edge.style === 'dashed' || edge.style === 'dotted')
    && (edge.arrow === 'end' || edge.arrow === 'both' || edge.arrow === 'none')
    && (edge.route === 'straight' || edge.route === 'curve' || edge.route === 'angle')
    && typeof edge.bend === 'number'
}

function normalizeWorkspaceData(data: unknown) {
  if (!data || typeof data !== 'object') return null
  const incoming = data as {
    theme?: unknown
    layoutMode?: unknown
    viewport?: unknown
    zoom?: unknown
    nodes?: unknown
    texts?: unknown
    edges?: unknown
  }

  if (incoming.theme !== 'light' && incoming.theme !== 'dark') return null
  if (incoming.layoutMode !== 'free' && incoming.layoutMode !== 'static') return null
  if (!incoming.viewport || typeof incoming.viewport !== 'object') return null
  const viewport = incoming.viewport as { x?: unknown; y?: unknown }
  if (typeof viewport.x !== 'number' || typeof viewport.y !== 'number') return null
  if (typeof incoming.zoom !== 'number') return null
  if (!incoming.nodes || typeof incoming.nodes !== 'object') return null
  if (!incoming.texts || typeof incoming.texts !== 'object') return null
  if (!Array.isArray(incoming.edges)) return null

  const nodeEntries = Object.entries(incoming.nodes as Record<string, unknown>)
  const textEntries = Object.entries(incoming.texts as Record<string, unknown>)
  if (!nodeEntries.every(([, value]) => isDiagramNode(value))) return null
  if (!textEntries.every(([, value]) => isTextNode(value))) return null
  if (!incoming.edges.every(isEdge)) return null

  const nodes = Object.fromEntries(
    nodeEntries.map(([id, value]) => [id, { ...(value as DiagramNode), children: [...(value as DiagramNode).children] }]),
  )
  const texts = Object.fromEntries(
    textEntries.map(([id, value]) => [id, { ...(value as TextNode) }]),
  )
  const edges = incoming.edges.map(edge => ({ ...edge }))
  const nodeIds = new Set(Object.keys(nodes))

  if (!Object.values(nodes).every(node =>
    (node.parent === null || nodeIds.has(node.parent))
    && node.children.every(childId => nodeIds.has(childId)),
  )) return null
  if (!edges.every(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to))) return null

  const nextNc = Math.max(0, ...Object.keys(nodes).map(id => Number(id.replace(/^\D+/, '')) || 0))
  const nextTc = Math.max(0, ...Object.keys(texts).map(id => Number(id.replace(/^\D+/, '')) || 0))

  return {
    nodes,
    texts,
    edges,
    theme: incoming.theme as 'light' | 'dark',
    layoutMode: incoming.layoutMode as 'free' | 'static',
    viewport: { x: viewport.x, y: viewport.y },
    zoom: incoming.zoom,
    nc: nextNc,
    tc: nextTc,
  }
}

export const useDiagram = create<DiagramState>()(persist((set, get) => ({
  ...(() => {
    const applyWorkspaceChange = (
      action: string,
      updater: Partial<DiagramState> | ((state: DiagramState) => Partial<DiagramState>),
    ) => {
      const before = getWorkspaceSnapshot(get())
      set(updater as never)
      const after = getWorkspaceSnapshot(get())
        if (sameWorkspace(before, after)) return
        set(state => ({
          historyPast: [...state.historyPast.slice(-(MAX_UNDO - 1)), before],
          historyFuture: [],
          actionHistory: [...state.actionHistory.slice(-(MAX_ACTION_HISTORY - 1)), makeHistoryEntry(action, state.collaboration)],
        }))
      }

    return {
  nodes: {},
  texts: {},
  edges: [],
  sceneClipboard: null,
  historyPast: [],
  historyFuture: [],
  actionHistory: [],
  theme: DEFAULT_THEME,
  layoutMode: 'free',
  viewport: { x: 0, y: 0 },
  pointer: null,
  zoom: 1,
  interactionMode: 'select',
  selNode: null,
  selText: null,
  selEdge: null,
  multiSel: new Set(),
  cmode: false,
  csrc: null,
  csrcSide: null,
  editingTextId: null,
  nc: 0,
  tc: 0,
  ctxTarget: null,
  modeText: DEFAULT_MODE,
  toasts: [],
  collaboration: EMPTY_COLLABORATION,

  addBox: (opts = {}) => {
    const { nodes, nc, layoutMode } = get()
    const newNc = nc + 1
    const id = 'n' + newNc
    const bg = opts.bg ?? '#e8e6ff'
    const fg = opts.fg ?? autoFg(bg)
    const x = opts.x ?? (80 + Math.random() * 240)
    const y = opts.y ?? (60 + Math.random() * 180)
    const node: DiagramNode = {
      id,
      title: opts.title ?? 'New box',
      desc: opts.desc ?? '',
      bg,
      fg,
      shape: opts.shape ?? 'rect',
      family: opts.family ?? 'inherit',
      size: opts.size ?? 13,
      bold: opts.bold ?? false,
      italic: opts.italic ?? false,
      underline: opts.underline ?? false,
      strike: opts.strike ?? false,
      radius: opts.radius ?? 10,
      x: layoutMode === 'static' ? snap(x) : x,
      y: layoutMode === 'static' ? snap(y) : y,
      parent: null,
      children: [],
    }
    const newNodes = { ...nodes, [id]: node }
    if (opts.parent && nodes[opts.parent]) {
      node.parent = opts.parent
      const parent = { ...nodes[opts.parent], children: [...nodes[opts.parent].children, id] }
      newNodes[opts.parent] = parent
    }
    applyWorkspaceChange('Add box', { nodes: newNodes, nc: newNc })
    return id
  },

  addText: (opts = {}) => {
    const { texts, tc, theme, layoutMode } = get()
    const newTc = tc + 1
    const id = 't' + newTc
    const x = opts.x ?? 100
    const y = opts.y ?? 80
    const text: TextNode = {
      id,
      content: opts.content ?? 'Text',
      x: layoutMode === 'static' ? snap(x) : x,
      y: layoutMode === 'static' ? snap(y) : y,
      size: opts.size ?? 16,
      color: opts.color ?? (theme === 'dark' ? '#ffffff' : '#1a1a18'),
      family: opts.family ?? 'inherit',
      bold: opts.bold ?? false,
      italic: opts.italic ?? false,
      underline: opts.underline ?? false,
      strike: opts.strike ?? false,
      align: opts.align ?? 'left',
      opacity: opts.opacity ?? 100,
    }
    applyWorkspaceChange('Add text', { texts: { ...texts, [id]: text }, tc: newTc })
    return id
  },

  addEdge: (from, to, fromSide = 'pr', toSide = 'pl') => {
    const { edges, nodes } = get()
    if (!nodes[from] || !nodes[to]) return
    applyWorkspaceChange('Add link', {
      edges: [
        ...edges,
        { from, to, fromSide, toSide, label: '', desc: '', color: '#888780', style: 'solid', arrow: 'end', route: 'straight', bend: 0 },
      ],
    })
  },

  deleteNode: (id) => {
    const { nodes, edges, selNode, detachNode } = get()
    const node = nodes[id]
    if (!node) return
    if (node.parent) detachNode(id, false)
    ;[...node.children].forEach(cid => detachNode(cid, true))
    const newNodes = { ...get().nodes }
    delete newNodes[id]
    const newEdges = edges.filter(e => e.from !== id && e.to !== id)
    applyWorkspaceChange('Delete box', {
      nodes: newNodes,
      edges: newEdges,
      selNode: selNode === id ? null : selNode,
    })
  },

  deleteText: (id) => {
    const { texts, selText, editingTextId } = get()
    if (!texts[id]) return
    const newTexts = { ...texts }
    delete newTexts[id]
    applyWorkspaceChange('Delete text', {
      texts: newTexts,
      selText: selText === id ? null : selText,
      editingTextId: editingTextId === id ? null : editingTextId,
    })
  },

  deleteEdge: (idx) => {
    const { edges } = get()
    applyWorkspaceChange('Delete link', { edges: edges.filter((_, i) => i !== idx), selEdge: null })
  },

  updateNode: (id, patch) => {
    const { nodes } = get()
    if (!nodes[id]) return
    applyWorkspaceChange('Edit box', { nodes: { ...nodes, [id]: { ...nodes[id], ...patch } } })
  },

  updateText: (id, patch) => {
    const { texts } = get()
    if (!texts[id]) return
    applyWorkspaceChange('Edit text', { texts: { ...texts, [id]: { ...texts[id], ...patch } } })
  },

  updateEdge: (idx, patch) => {
    const { edges } = get()
    const newEdges = [...edges]
    newEdges[idx] = { ...newEdges[idx], ...patch }
    applyWorkspaceChange('Edit link', { edges: newEdges })
  },

  selectNode: (id) => {
    set({ selNode: id, selText: null, selEdge: null, multiSel: new Set(), modeText: 'Drag outside parent to extract · Drag onto another box to nest' })
  },

  selectText: (id) => {
    set({ selText: id, selNode: null, selEdge: null, multiSel: new Set(), modeText: 'Double-click text to edit inline' })
  },

  selectEdge: (idx) => {
    set({ selEdge: idx, selNode: null, selText: null, multiSel: new Set(), modeText: 'Link selected — edit or Delete to remove' })
  },

  toggleMultiSel: (id) => {
    const { multiSel, selNode, selText, nodes, texts } = get()
    if (!nodes[id] && !texts[id]) return
    const next = new Set(multiSel)
    if (selNode) next.add(selNode)
    if (selText) next.add(selText)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    set({
      multiSel: next,
      selNode: null,
      selText: null,
      selEdge: null,
      modeText: next.size > 0 ? `${next.size} elements selected` : DEFAULT_MODE,
    })
  },

  deselectAll: () => {
    const { interactionMode } = get()
    set({
      selNode: null,
      selText: null,
      selEdge: null,
      multiSel: new Set(),
      editingTextId: null,
      modeText: interactionMode === 'move' ? MOVE_MODE : DEFAULT_MODE,
    })
  },

  attachChild: (childId, parentId) => {
    const { nodes, detachNode } = get()
    const child = nodes[childId]
    const parent = nodes[parentId]
    if (!child || !parent || childId === parentId) return
    if (child.parent) detachNode(childId, false)
    const newNodes = { ...get().nodes }
    newNodes[childId] = { ...newNodes[childId], parent: parentId }
    newNodes[parentId] = { ...newNodes[parentId], children: [...newNodes[parentId].children, childId] }
    applyWorkspaceChange('Nest box', { nodes: newNodes })
  },

  detachNode: (id, place = true, ax, ay) => {
    const { nodes } = get()
    const node = nodes[id]
    if (!node || !node.parent) return
    const parent = nodes[node.parent]
    if (!parent) return
    const newNodes = { ...nodes }
    newNodes[node.parent] = { ...parent, children: parent.children.filter(c => c !== id) }
    newNodes[id] = {
      ...node,
      parent: null,
      x: place ? (ax ?? node.x ?? 80) : node.x,
      y: place ? (ay ?? node.y ?? 80) : node.y,
    }
    applyWorkspaceChange('Detach box', { nodes: newNodes })
  },

  clearAll: () => {
    const { interactionMode } = get()
    applyWorkspaceChange('Clear workspace', {
      nodes: {},
      texts: {},
      edges: [],
      selNode: null,
      selText: null,
      selEdge: null,
      multiSel: new Set(),
      editingTextId: null,
      modeText: interactionMode === 'move' ? MOVE_MODE : DEFAULT_MODE,
    })
  },

  startConnect: (nodeId, side = 'pr') => {
    const { selNode } = get()
    const src = nodeId ?? selNode
    if (!src) return
    set({ cmode: true, csrc: src, csrcSide: side, modeText: 'Drag from one port to another port · Esc to cancel' })
  },

  cancelConnect: () => {
    const { interactionMode } = get()
    set({
      cmode: false,
      csrc: null,
      csrcSide: null,
      modeText: interactionMode === 'move' ? MOVE_MODE : DEFAULT_MODE,
    })
  },

  startEditText: (id) => {
    set({ editingTextId: id, modeText: 'Editing text — Esc to finish' })
  },

  finishEditText: (id, content) => {
    const { texts, interactionMode } = get()
    if (!texts[id]) return
    const patch: Partial<TextNode> = {}
    if (content !== undefined) patch.content = content
    applyWorkspaceChange('Finish text edit', {
      texts: { ...texts, [id]: { ...texts[id], ...patch } },
      editingTextId: null,
      modeText: interactionMode === 'move' ? MOVE_MODE : DEFAULT_MODE,
    })
  },

  setMultiSel: (ids) => set({ multiSel: ids, selNode: null, selText: null, selEdge: null }),

  clearMultiSel: () => set({ multiSel: new Set() }),

  deleteMultiSel: () => {
    const { multiSel, deleteNode, deleteText } = get()
    multiSel.forEach(id => {
      const { nodes, texts } = get()
      if (nodes[id]) deleteNode(id)
      else if (texts[id]) deleteText(id)
    })
    set({ multiSel: new Set(), selNode: null, selText: null })
  },

  setCtxTarget: (t) => set({ ctxTarget: t }),

  setModeText: (t) => set({ modeText: t }),

  setInteractionMode: (interactionMode) => set({
    interactionMode,
    modeText: interactionMode === 'move'
      ? MOVE_MODE
      : DEFAULT_MODE,
  }),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setLayoutMode: (layoutMode) => set({
    layoutMode,
    modeText: layoutMode === 'static' ? 'Static mode: nodes snap to grid positions' : DEFAULT_MODE,
  }),

  undo: () => {
    const state = get()
    if (state.historyPast.length === 0) return false
    const previous = state.historyPast[state.historyPast.length - 1]
    const current = getWorkspaceSnapshot(state)
    set({
      ...cloneWorkspaceSnapshot(previous),
      historyPast: state.historyPast.slice(0, -1),
      historyFuture: [current, ...state.historyFuture].slice(0, MAX_UNDO),
      selNode: null,
      selText: null,
      selEdge: null,
      multiSel: new Set(),
      editingTextId: null,
      ctxTarget: null,
      cmode: false,
      csrc: null,
      csrcSide: null,
      modeText: 'Undid last action',
    })
    return true
  },

  copySelectionToClipboard: () => {
    const { nodes, texts, edges, multiSel, selNode, selText } = get()
    const rootNodeIds = new Set<string>()
    const textIds = new Set<string>()

    const includeNodeTree = (id: string) => {
      const node = nodes[id]
      if (!node || rootNodeIds.has(id)) return
      rootNodeIds.add(id)
      node.children.forEach(includeNodeTree)
    }

    if (multiSel.size > 0) {
      multiSel.forEach(id => {
        if (nodes[id]) includeNodeTree(id)
        if (texts[id]) textIds.add(id)
      })
    } else {
      if (selNode) includeNodeTree(selNode)
      if (selText) textIds.add(selText)
    }

    if (rootNodeIds.size === 0 && textIds.size === 0) return false

    const nodeList = [...rootNodeIds].map(id => ({ ...nodes[id], children: [...nodes[id].children] }))
    const textList = [...textIds].map(id => ({ ...texts[id] }))
    const nodeIdSet = new Set(rootNodeIds)
    const edgeList = edges
      .filter(edge => nodeIdSet.has(edge.from) && nodeIdSet.has(edge.to))
      .map(edge => ({ ...edge }))

    set({
      sceneClipboard: { nodes: nodeList, texts: textList, edges: edgeList },
      modeText: `Copied ${nodeList.length + textList.length} element${nodeList.length + textList.length > 1 ? 's' : ''}`,
    })
    return true
  },

  pasteClipboard: (at = null) => {
    const { sceneClipboard, nc, tc, nodes, texts, edges, layoutMode } = get()
    if (!sceneClipboard || (sceneClipboard.nodes.length === 0 && sceneClipboard.texts.length === 0)) return false

    const includedParents = new Set(sceneClipboard.nodes.map(node => node.id))
    const topLevelNodes = sceneClipboard.nodes.filter(node => !node.parent || !includedParents.has(node.parent))
    const positioned = [
      ...topLevelNodes.map(node => ({ x: node.x, y: node.y })),
      ...sceneClipboard.texts.map(text => ({ x: text.x, y: text.y })),
    ]
    const minX = positioned.length > 0 ? Math.min(...positioned.map(item => item.x)) : 0
    const minY = positioned.length > 0 ? Math.min(...positioned.map(item => item.y)) : 0
    const targetX = at ? at.x : minX + 32
    const targetY = at ? at.y : minY + 32
    const offsetX = (layoutMode === 'static' ? snap(targetX) : targetX) - minX + 24
    const offsetY = (layoutMode === 'static' ? snap(targetY) : targetY) - minY + 24

    let nextNc = nc
    let nextTc = tc
    const nodeIdMap = new Map<string, string>()
    const textIdMap = new Map<string, string>()
    const newNodes = { ...nodes }
    const newTexts = { ...texts }

    sceneClipboard.nodes.forEach(node => {
      nextNc += 1
      nodeIdMap.set(node.id, `n${nextNc}`)
    })

    sceneClipboard.texts.forEach(text => {
      nextTc += 1
      textIdMap.set(text.id, `t${nextTc}`)
    })

    sceneClipboard.nodes.forEach(node => {
      const newId = nodeIdMap.get(node.id)!
      const hasCopiedParent = !!node.parent && nodeIdMap.has(node.parent)
      const parentId = hasCopiedParent && node.parent ? nodeIdMap.get(node.parent) ?? null : null
      newNodes[newId] = {
        ...node,
        id: newId,
        parent: parentId,
        children: node.children.map(childId => nodeIdMap.get(childId)!).filter(Boolean),
        x: hasCopiedParent ? node.x : node.x + offsetX,
        y: hasCopiedParent ? node.y : node.y + offsetY,
      }
    })

    sceneClipboard.texts.forEach(text => {
      const newId = textIdMap.get(text.id)!
      newTexts[newId] = {
        ...text,
        id: newId,
        x: text.x + offsetX,
        y: text.y + offsetY,
      }
    })

    const newEdges = [
      ...edges,
      ...sceneClipboard.edges.map(edge => ({
        ...edge,
        from: nodeIdMap.get(edge.from) ?? edge.from,
        to: nodeIdMap.get(edge.to) ?? edge.to,
      })),
    ]

    const pastedIds = new Set<string>([
      ...topLevelNodes.map(node => nodeIdMap.get(node.id)!).filter(Boolean),
      ...sceneClipboard.texts.map(text => textIdMap.get(text.id)!).filter(Boolean),
    ])

    applyWorkspaceChange('Paste selection', {
      nodes: newNodes,
      texts: newTexts,
      edges: newEdges,
      nc: nextNc,
      tc: nextTc,
      selNode: null,
      selText: null,
      selEdge: null,
      multiSel: pastedIds.size > 1 ? pastedIds : new Set(),
      modeText: `Pasted ${pastedIds.size} element${pastedIds.size > 1 ? 's' : ''}`,
    })

    if (pastedIds.size === 1) {
      const [id] = [...pastedIds]
      if (newNodes[id]) set({ selNode: id, modeText: 'Drag outside parent to extract · Drag onto another box to nest' })
      else if (newTexts[id]) set({ selText: id, modeText: 'Double-click text to edit inline' })
    }

    return true
  },

  setViewport: (viewport) => set({ viewport }),

  setPointer: (pointer) => set({ pointer }),

  setZoom: (zoom) => set({ zoom }),

  captureWorkspaceSnapshot: () => getWorkspaceSnapshot(get()),

  commitWorkspaceSnapshot: (action, before) => {
    const after = getWorkspaceSnapshot(get())
    if (sameWorkspace(before, after)) return
    set(state => ({
      historyPast: [...state.historyPast.slice(-(MAX_UNDO - 1)), cloneWorkspaceSnapshot(before)],
      historyFuture: [],
      actionHistory: [...state.actionHistory.slice(-(MAX_ACTION_HISTORY - 1)), makeHistoryEntry(action, state.collaboration)],
    }))
  },

  setNodePosition: (id, x, y) => {
    const { nodes, layoutMode } = get()
    if (!nodes[id]) return
    set({
      nodes: {
        ...nodes,
        [id]: {
          ...nodes[id],
          x: layoutMode === 'static' ? snap(x) : x,
          y: layoutMode === 'static' ? snap(y) : y,
        },
      },
    })
  },

  setTextPosition: (id, x, y) => {
    const { texts, layoutMode } = get()
    if (!texts[id]) return
    set({
      texts: {
        ...texts,
        [id]: {
          ...texts[id],
          x: layoutMode === 'static' ? snap(x) : x,
          y: layoutMode === 'static' ? snap(y) : y,
        },
      },
    })
  },

  moveNode: (id, x, y) => {
    const { nodes, layoutMode } = get()
    if (!nodes[id]) return
    applyWorkspaceChange('Move box', {
      nodes: {
        ...nodes,
        [id]: {
          ...nodes[id],
          x: layoutMode === 'static' ? snap(x) : x,
          y: layoutMode === 'static' ? snap(y) : y,
        },
      },
    })
  },

  moveText: (id, x, y) => {
    const { texts, layoutMode } = get()
    if (!texts[id]) return
    applyWorkspaceChange('Move text', {
      texts: {
        ...texts,
        [id]: {
          ...texts[id],
          x: layoutMode === 'static' ? snap(x) : x,
          y: layoutMode === 'static' ? snap(y) : y,
        },
      },
    })
  },

  exportWorkspace: () => {
    const state = get()
    return {
      version: '0.2.2',
      theme: state.theme,
      layoutMode: state.layoutMode,
      viewport: { ...state.viewport },
      zoom: state.zoom,
      nodes: Object.fromEntries(
        Object.entries(state.nodes).map(([id, node]) => [id, { ...node, children: [...node.children] }]),
      ),
      texts: Object.fromEntries(
        Object.entries(state.texts).map(([id, text]) => [id, { ...text }]),
      ),
      edges: state.edges.map(edge => ({ ...edge })),
    }
  },

  importWorkspace: (data) => {
    const normalized = normalizeWorkspaceData(data)
    if (!normalized) return false

    set({
      ...normalized,
      selNode: null,
      selText: null,
      selEdge: null,
      multiSel: new Set(),
      cmode: false,
      csrc: null,
      csrcSide: null,
      editingTextId: null,
      ctxTarget: null,
      pointer: null,
      historyPast: [],
      historyFuture: [],
      actionHistory: [makeHistoryEntry('Import JSON', get().collaboration)],
      sceneClipboard: null,
      toasts: [],
      modeText: 'Imported workspace from JSON',
    })
    return true
  },

  applyCollaborativeWorkspace: (data) => {
    const normalized = normalizeWorkspaceData(data)
    if (!normalized) return false

    set(state => ({
      ...normalized,
      selNode: null,
      selText: null,
      selEdge: null,
      multiSel: new Set(),
      cmode: false,
      csrc: null,
      csrcSide: null,
      editingTextId: null,
      ctxTarget: null,
      pointer: state.pointer,
      historyPast: [],
      historyFuture: [],
      actionHistory: state.actionHistory,
      sceneClipboard: state.sceneClipboard,
      toasts: state.toasts,
      collaboration: state.collaboration,
      modeText: 'Live collaboration active',
    }))
    return true
  },

  pushToast: (kind, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set(state => ({
      toasts: [...state.toasts, { id, kind, message }],
    }))
    window.setTimeout(() => {
      const current = get().toasts
      if (current.some(toast => toast.id === id)) {
        set({ toasts: current.filter(toast => toast.id !== id) })
      }
    }, 2800)
  },

  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(toast => toast.id !== id),
  })),

  setCollaborationState: (patch) => set(state => ({
    collaboration: {
      ...state.collaboration,
      ...patch,
    },
  })),

  resetCollaborationState: () => set({ collaboration: EMPTY_COLLABORATION }),

  setCollaborationParticipants: (participants) => set(state => ({
    collaboration: {
      ...state.collaboration,
      participants,
    },
  })),
}
  })(),
}), {
  name: STORAGE_KEY,
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    nodes: state.nodes,
    texts: state.texts,
    edges: state.edges,
    actionHistory: state.actionHistory,
    theme: state.theme,
    layoutMode: state.layoutMode,
    viewport: state.viewport,
    zoom: state.zoom,
    interactionMode: state.interactionMode,
    nc: state.nc,
    tc: state.tc,
  }),
  onRehydrateStorage: () => (state) => {
    if (!state) return
    state.pointer = null
    state.historyPast = []
    state.historyFuture = []
    state.selNode = null
    state.selText = null
    state.selEdge = null
    state.multiSel = new Set()
    state.cmode = false
    state.csrc = null
    state.csrcSide = null
    state.editingTextId = null
    state.sceneClipboard = null
    state.ctxTarget = null
    state.modeText = state.interactionMode === 'move' ? MOVE_MODE : DEFAULT_MODE
    state.collaboration = EMPTY_COLLABORATION
  },
}))
