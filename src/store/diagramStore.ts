import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DiagramNode, TextNode, Edge, ContextMenuTarget, PortSide } from '../types'

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

export function adjHex(hex: string, amt: number): string {
  return '#' + [1, 3, 5].map(i =>
    Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) + amt))
      .toString(16).padStart(2, '0')
  ).join('')
}

interface DiagramState {
  nodes: Record<string, DiagramNode>
  texts: Record<string, TextNode>
  edges: Edge[]
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
  setViewport: (viewport: { x: number; y: number }) => void
  setPointer: (pointer: { x: number; y: number } | null) => void
  setZoom: (zoom: number) => void
  moveNode: (id: string, x: number, y: number) => void
  moveText: (id: string, x: number, y: number) => void
}

const DEFAULT_MODE = 'Select mode: drag to multi-select · Shift-click to add to selection · Right-click to add'
const MOVE_MODE = 'Move mode: drag or scroll to pan · Right-click to add'
const STORAGE_KEY = 'thot-editor-workspace'

export const useDiagram = create<DiagramState>()(persist((set, get) => ({
  nodes: {},
  texts: {},
  edges: [],
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

  addBox: (opts = {}) => {
    const { nodes, nc } = get()
    const newNc = nc + 1
    const id = 'n' + newNc
    const bg = opts.bg ?? '#e8e6ff'
    const fg = opts.fg ?? autoFg(bg)
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
      x: opts.x ?? (80 + Math.random() * 240),
      y: opts.y ?? (60 + Math.random() * 180),
      parent: null,
      children: [],
    }
    const newNodes = { ...nodes, [id]: node }
    if (opts.parent && nodes[opts.parent]) {
      node.parent = opts.parent
      const parent = { ...nodes[opts.parent], children: [...nodes[opts.parent].children, id] }
      newNodes[opts.parent] = parent
    }
    set({ nodes: newNodes, nc: newNc })
    return id
  },

  addText: (opts = {}) => {
    const { texts, tc } = get()
    const newTc = tc + 1
    const id = 't' + newTc
    const text: TextNode = {
      id,
      content: opts.content ?? 'Text',
      x: opts.x ?? 100,
      y: opts.y ?? 80,
      size: opts.size ?? 16,
      color: opts.color ?? '#ffffff',
      family: opts.family ?? 'inherit',
      bold: opts.bold ?? false,
      italic: opts.italic ?? false,
      underline: opts.underline ?? false,
      strike: opts.strike ?? false,
      align: opts.align ?? 'left',
      opacity: opts.opacity ?? 100,
    }
    set({ texts: { ...texts, [id]: text }, tc: newTc })
    return id
  },

  addEdge: (from, to, fromSide = 'pr', toSide = 'pl') => {
    const { edges, nodes } = get()
    if (!nodes[from] || !nodes[to]) return
    set({
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
    set({
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
    set({
      texts: newTexts,
      selText: selText === id ? null : selText,
      editingTextId: editingTextId === id ? null : editingTextId,
    })
  },

  deleteEdge: (idx) => {
    const { edges } = get()
    set({ edges: edges.filter((_, i) => i !== idx), selEdge: null })
  },

  updateNode: (id, patch) => {
    const { nodes } = get()
    if (!nodes[id]) return
    set({ nodes: { ...nodes, [id]: { ...nodes[id], ...patch } } })
  },

  updateText: (id, patch) => {
    const { texts } = get()
    if (!texts[id]) return
    set({ texts: { ...texts, [id]: { ...texts[id], ...patch } } })
  },

  updateEdge: (idx, patch) => {
    const { edges } = get()
    const newEdges = [...edges]
    newEdges[idx] = { ...newEdges[idx], ...patch }
    set({ edges: newEdges })
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
    set({ nodes: newNodes })
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
    set({ nodes: newNodes })
  },

  clearAll: () => {
    const { interactionMode } = get()
    set({
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
    set({
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

  setViewport: (viewport) => set({ viewport }),

  setPointer: (pointer) => set({ pointer }),

  setZoom: (zoom) => set({ zoom }),

  moveNode: (id, x, y) => {
    const { nodes } = get()
    if (!nodes[id]) return
    set({ nodes: { ...nodes, [id]: { ...nodes[id], x, y } } })
  },

  moveText: (id, x, y) => {
    const { texts } = get()
    if (!texts[id]) return
    set({ texts: { ...texts, [id]: { ...texts[id], x, y } } })
  },
}), {
  name: STORAGE_KEY,
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    nodes: state.nodes,
    texts: state.texts,
    edges: state.edges,
    viewport: state.viewport,
    zoom: state.zoom,
    interactionMode: state.interactionMode,
    nc: state.nc,
    tc: state.tc,
  }),
  onRehydrateStorage: () => (state) => {
    if (!state) return
    state.pointer = null
    state.selNode = null
    state.selText = null
    state.selEdge = null
    state.multiSel = new Set()
    state.cmode = false
    state.csrc = null
    state.csrcSide = null
    state.editingTextId = null
    state.ctxTarget = null
    state.modeText = state.interactionMode === 'move' ? MOVE_MODE : DEFAULT_MODE
  },
}))
