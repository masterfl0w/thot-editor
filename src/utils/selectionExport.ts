import { toCanvas } from 'html-to-image'
import type { DiagramNode, Edge, TextNode } from '../types'

type DiagramStateSnapshot = {
  nodes: Record<string, DiagramNode>
  texts: Record<string, TextNode>
  edges: Edge[]
  selNode: string | null
  selText: string | null
  selEdge: number | null
  multiSel: Set<string>
}

type ExportScope = 'selection' | 'workspace'

type SelectionContent = {
  nodeIds: string[]
  textIds: string[]
  edgeIndices: number[]
}

type SelectionBounds = {
  left: number
  top: number
  width: number
  height: number
}

const EXPORT_PADDING = 24
const EXPORT_SCALE = Math.max(4, Math.ceil((window.devicePixelRatio || 1) * 2))

function getCanvasRoot() {
  return document.querySelector('[data-canvas-root="true"]') as HTMLDivElement | null
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function getSelectedContent(state: DiagramStateSnapshot): SelectionContent {
  const nodeIds = new Set<string>()
  const textIds = new Set<string>()
  const edgeIndices = new Set<number>()

  if (state.multiSel.size > 0) {
    state.multiSel.forEach((id) => {
      if (state.nodes[id]) nodeIds.add(id)
      if (state.texts[id]) textIds.add(id)
    })
  } else {
    if (state.selNode) nodeIds.add(state.selNode)
    if (state.selText) textIds.add(state.selText)
  }

  state.edges.forEach((edge, index) => {
    if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) edgeIndices.add(index)
  })

  if (state.selEdge !== null) {
    edgeIndices.add(state.selEdge)
    const edge = state.edges[state.selEdge]
    if (edge) {
      nodeIds.add(edge.from)
      nodeIds.add(edge.to)
    }
  }

  const filteredNodeIds = [...nodeIds].filter((id) => {
    let parent = state.nodes[id]?.parent
    while (parent) {
      if (nodeIds.has(parent)) return false
      parent = state.nodes[parent]?.parent
    }
    return true
  })

  return { nodeIds: filteredNodeIds, textIds: [...textIds], edgeIndices: [...edgeIndices] }
}

function getSelectionElements(state: DiagramStateSnapshot) {
  const { nodeIds, textIds, edgeIndices } = getSelectedContent(state)

  const nodeEls = nodeIds
    .map((id) => document.getElementById(`nd-${id}`))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
  const textEls = textIds
    .map((id) => document.getElementById(`tn-${id}`))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
  const edgeEls = edgeIndices
    .map((index) => document.querySelector(`[data-edge-index="${index}"]`))
    .filter((el): el is SVGGElement => el instanceof SVGGElement)

  const contentEls: Element[] = [...nodeEls, ...textEls, ...edgeEls]
  if (contentEls.length === 0) throw new Error('Nothing selected')
  return contentEls
}

function getWorkspaceElements(state: DiagramStateSnapshot) {
  const nodeEls = Object.keys(state.nodes)
    .filter((id) => !state.nodes[id].parent)
    .map((id) => document.getElementById(`nd-${id}`))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
  const textEls = Object.keys(state.texts)
    .map((id) => document.getElementById(`tn-${id}`))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
  const edgeEls = state.edges
    .map((_, index) => document.querySelector(`[data-edge-index="${index}"]`))
    .filter((el): el is SVGGElement => el instanceof SVGGElement)
  const contentEls: Element[] = [...nodeEls, ...textEls, ...edgeEls]
  if (contentEls.length === 0) throw new Error('Nothing to export')
  return contentEls
}

function getBounds(
  state: DiagramStateSnapshot,
  canvas: HTMLElement,
  scope: ExportScope,
): SelectionBounds {
  const elements = scope === 'workspace' ? getWorkspaceElements(state) : getSelectionElements(state)
  const canvasRect = canvas.getBoundingClientRect()

  let minLeft = Number.POSITIVE_INFINITY
  let minTop = Number.POSITIVE_INFINITY
  let maxRight = Number.NEGATIVE_INFINITY
  let maxBottom = Number.NEGATIVE_INFINITY

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 && rect.height <= 0) return
    minLeft = Math.min(minLeft, rect.left - canvasRect.left)
    minTop = Math.min(minTop, rect.top - canvasRect.top)
    maxRight = Math.max(maxRight, rect.right - canvasRect.left)
    maxBottom = Math.max(maxBottom, rect.bottom - canvasRect.top)
  })

  if (
    !Number.isFinite(minLeft) ||
    !Number.isFinite(minTop) ||
    !Number.isFinite(maxRight) ||
    !Number.isFinite(maxBottom)
  ) {
    throw new Error('Unable to export content')
  }

  return {
    left: Math.max(0, minLeft - EXPORT_PADDING),
    top: Math.max(0, minTop - EXPORT_PADDING),
    width: Math.max(
      1,
      Math.min(canvasRect.width, maxRight + EXPORT_PADDING) - Math.max(0, minLeft - EXPORT_PADDING),
    ),
    height: Math.max(
      1,
      Math.min(canvasRect.height, maxBottom + EXPORT_PADDING) -
        Math.max(0, minTop - EXPORT_PADDING),
    ),
  }
}

function hideSelectionDecorations(state: DiagramStateSnapshot) {
  const hidden: Array<{ el: HTMLElement; display: string }> = []
  const mutated: Array<{ el: HTMLElement; prop: keyof CSSStyleDeclaration; value: string }> = []

  document.querySelectorAll<HTMLElement>('.ports, .selection-badge').forEach((el) => {
    hidden.push({ el, display: el.style.display })
    el.style.display = 'none'
  })

  const canvas = getCanvasRoot()
  if (canvas) {
    mutated.push({ el: canvas, prop: 'background', value: canvas.style.background })
    canvas.style.background = 'transparent'
  }

  document.querySelectorAll<HTMLCanvasElement>('[data-canvas-root="true"] canvas').forEach((el) => {
    hidden.push({ el, display: el.style.display })
    el.style.display = 'none'
  })

  const setStyle = (el: HTMLElement | null, prop: keyof CSSStyleDeclaration, value: string) => {
    if (!el) return
    mutated.push({ el, prop, value: String(el.style[prop] ?? '') })
    ;(el.style[prop] as string) = value
  }

  Object.keys(state.nodes).forEach((id) => {
    const el = document.getElementById(`nd-${id}`) as HTMLElement | null
    if (!el) return
    const node = state.nodes[id]
    setStyle(el, 'transition', 'none')
    setStyle(el, 'animation', 'none')
    setStyle(el, 'boxShadow', 'none')
    setStyle(el, 'outline', 'none')
    setStyle(el, 'outlineOffset', '0px')
    setStyle(el, 'borderColor', node.parent ? 'rgba(255,255,255,0.25)' : 'transparent')
  })

  Object.keys(state.texts).forEach((id) => {
    const el = document.getElementById(`tn-${id}`) as HTMLElement | null
    if (!el) return
    setStyle(el, 'transition', 'none')
    setStyle(el, 'animation', 'none')
    setStyle(el, 'boxShadow', 'none')
    setStyle(el, 'borderColor', 'transparent')
    setStyle(el, 'background', 'transparent')
  })

  if (state.selEdge !== null) {
    const edgeGroup = document.querySelector(`[data-edge-index="${state.selEdge}"]`)
    edgeGroup?.querySelectorAll<SVGPathElement>('path').forEach((path) => {
      if (
        path.getAttribute('stroke') === '#6c6cff' &&
        path.getAttribute('stroke-opacity') === '0.25'
      ) {
        const el = path as unknown as HTMLElement
        mutated.push({ el, prop: 'display', value: el.style.display })
        el.style.display = 'none'
      }
    })
  }

  return () => {
    hidden.forEach(({ el, display }) => {
      el.style.display = display
    })
    mutated.forEach(({ el, prop, value }) => {
      ;(el.style[prop] as string) = value
    })
  }
}

async function waitForPaint() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

async function renderArea(state: DiagramStateSnapshot, scope: ExportScope) {
  const canvas = getCanvasRoot()
  if (!canvas) throw new Error('Canvas not found')

  const restore = hideSelectionDecorations(state)

  try {
    await waitForPaint()
    const bounds = getBounds(state, canvas, scope)
    const scale = EXPORT_SCALE
    const fullCanvas = await toCanvas(canvas, {
      cacheBust: true,
      pixelRatio: scale,
      backgroundColor: 'transparent',
    })

    const out = document.createElement('canvas')
    out.width = Math.ceil(bounds.width * scale)
    out.height = Math.ceil(bounds.height * scale)

    const ctx = out.getContext('2d')
    if (!ctx) throw new Error('Canvas unavailable')

    ctx.drawImage(
      fullCanvas,
      bounds.left * scale,
      bounds.top * scale,
      bounds.width * scale,
      bounds.height * scale,
      0,
      0,
      out.width,
      out.height,
    )

    const dataUrl = out.toDataURL('image/png')
    return { dataUrl, width: bounds.width, height: bounds.height, canvas: out }
  } finally {
    restore()
  }
}

async function copyBlobToClipboard(blob: Blob, type: string, fallbackText?: string) {
  if (navigator.clipboard?.write && 'ClipboardItem' in window) {
    const itemData: Record<string, Blob> = { [type]: blob }
    if (fallbackText) itemData['text/plain'] = new Blob([fallbackText], { type: 'text/plain' })
    await navigator.clipboard.write([new ClipboardItem(itemData)])
    return
  }
  if (fallbackText && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(fallbackText)
    return
  }
  throw new Error('Clipboard API unavailable')
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function copySelectionAsSvg(state: DiagramStateSnapshot) {
  const { dataUrl, width, height } = await renderArea(state, 'selection')
  const svgText = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="${escapeXml(dataUrl)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />
</svg>`
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  await copyBlobToClipboard(blob, 'image/svg+xml', svgText)
}

export async function copySelectionAsPng(state: DiagramStateSnapshot) {
  const { canvas } = await renderArea(state, 'selection')
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => (nextBlob ? resolve(nextBlob) : reject(new Error('Unable to encode PNG'))),
      'image/png',
    )
  })
  await copyBlobToClipboard(blob, 'image/png')
}

export async function saveWorkspaceAsSvg(state: DiagramStateSnapshot) {
  const { dataUrl, width, height } = await renderArea(state, 'workspace')
  const svgText = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="${escapeXml(dataUrl)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />
</svg>`
  downloadBlob(new Blob([svgText], { type: 'image/svg+xml' }), 'thot-workspace.svg')
}

export async function saveWorkspaceAsPng(state: DiagramStateSnapshot) {
  const { canvas } = await renderArea(state, 'workspace')
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => (nextBlob ? resolve(nextBlob) : reject(new Error('Unable to encode PNG'))),
      'image/png',
    )
  })
  downloadBlob(blob, 'thot-workspace.png')
}
