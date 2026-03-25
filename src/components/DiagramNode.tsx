import { useRef, useCallback, useState } from 'react'
import type { FunctionComponent, RefObject } from 'react'
import { autoBorder, useDiagram } from '../store/diagramStore'
import type { DiagramNode as DiagramNodeType, PortSide } from '../types'
import MathText from './MathText'

const THRESH = 6

interface Props {
  node: DiagramNodeType
  canvasRef: RefObject<HTMLDivElement | null>
  viewport: { x: number; y: number }
  zoom: number
}

const DiagramNode: FunctionComponent<Props> = ({ node, canvasRef, viewport, zoom }) => {
  const {
    selectNode,
    toggleMultiSel,
    selNode,
    csrc,
    csrcSide,
    multiSel,
    cmode,
    attachChild,
    detachNode,
    addEdge,
    cancelConnect,
    setCtxTarget,
    setNodePosition,
    commitWorkspaceSnapshot,
    captureWorkspaceSnapshot,
    interactionMode,
    layoutMode,
  } = useDiagram()

  const isChild = !!node.parent
  const hasChildren = node.children.length > 0
  const isSelected = selNode === node.id
  const isConnSrc = csrc === node.id
  const isMultiSel = multiSel.has(node.id) && !isSelected

  const dragRef = useRef({ active: false, startX: 0, startY: 0, moved: false, ox: 0, oy: 0 })
  const multiDragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    origins: {} as Record<string, { x: number; y: number }>,
  })
  const dragOverRef = useRef<string | null>(null)
  const resizeRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    width: 0,
    height: 0,
  })
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  const findDropTarget = useCallback((cx: number, cy: number, excl: string): string | null => {
    const allNodes = useDiagram.getState().nodes
    let best: string | null = null
    let bestArea = Infinity
    Object.values(allNodes).forEach((n) => {
      if (n.id === excl || n.parent) return
      if (isDescendant(n.id, excl, allNodes)) return
      const el = document.getElementById('nd-' + n.id)
      if (!el) return
      const r = el.getBoundingClientRect()
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        const a = r.width * r.height
        if (a < bestArea) {
          bestArea = a
          best = n.id
        }
      }
    })
    return best
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('port')) return
    e.stopPropagation()
    if (cmode) return

    // Multi-drag
    if (multiSel.has(node.id) && multiSel.size > 1 && !isChild) {
      const { nodes: allNodes, texts: allTexts } = useDiagram.getState()
      const origins: Record<string, { x: number; y: number }> = {}
      multiSel.forEach((id) => {
        if (allNodes[id]) origins[id] = { x: allNodes[id].x, y: allNodes[id].y }
        else if (allTexts[id]) origins[id] = { x: allTexts[id].x, y: allTexts[id].y }
      })
      multiDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origins }
      const before = captureWorkspaceSnapshot()
      const onMove = (me: MouseEvent) => {
        const { setNodePosition, setTextPosition } = useDiagram.getState()
        const dx = (me.clientX - multiDragRef.current.startX) / zoom
        const dy = (me.clientY - multiDragRef.current.startY) / zoom
        multiSel.forEach((id) => {
          const o = multiDragRef.current.origins[id]
          if (!o) return
          const { nodes: n2, texts: t2 } = useDiagram.getState()
          if (n2[id]) setNodePosition(id, o.x + dx, o.y + dy)
          else if (t2[id]) setTextPosition(id, o.x + dx, o.y + dy)
        })
      }
      const onUp = () => {
        multiDragRef.current.active = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        commitWorkspaceSnapshot('Move selection', before)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      return
    }

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      ox: 0,
      oy: 0,
    }
    const before = captureWorkspaceSnapshot()

    const onMove = (me: MouseEvent) => {
      const d = dragRef.current
      if (!d.active) return
      const dx = me.clientX - d.startX
      const dy = me.clientY - d.startY
      if (!d.moved && Math.sqrt(dx * dx + dy * dy) < THRESH) return
      d.moved = true
      const cw = canvasRef.current
      if (!cw) return
      const wr = cw.getBoundingClientRect()

      const { nodes: allNodes } = useDiagram.getState()
      const cur = allNodes[node.id]
      if (!cur) return

      if (cur.parent) {
        const pel = document.getElementById('nd-' + cur.parent)
        if (pel) {
          const pr2 = pel.getBoundingClientRect()
          const outside =
            me.clientX < pr2.left ||
            me.clientX > pr2.right ||
            me.clientY < pr2.top ||
            me.clientY > pr2.bottom
          if (!outside) return
          const nel = document.getElementById('nd-' + node.id)
          const nr = nel?.getBoundingClientRect()
          detachNode(
            node.id,
            true,
            nr ? viewport.x + (nr.left - wr.left) / zoom : cur.x,
            nr ? viewport.y + (nr.top - wr.top) / zoom : cur.y,
          )
        }
      }

      if (!d.ox) {
        const el = document.getElementById('nd-' + node.id)
        const r = el?.getBoundingClientRect()
        if (r) {
          d.ox = me.clientX - wr.left - (r.left - wr.left)
          d.oy = me.clientY - wr.top - (r.top - wr.top)
        }
      }

      const newX = viewport.x + (me.clientX - wr.left - d.ox) / zoom
      const newY = viewport.y + (me.clientY - wr.top - d.oy) / zoom
      setNodePosition(node.id, newX, newY)

      const under = findDropTarget(me.clientX, me.clientY, node.id)
      if (dragOverRef.current && dragOverRef.current !== under) {
        document.getElementById('nd-' + dragOverRef.current)?.classList.remove('drag-over-target')
      }
      if (under) {
        document.getElementById('nd-' + under)?.classList.add('drag-over-target')
        dragOverRef.current = under
      } else {
        dragOverRef.current = null
      }
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (dragOverRef.current) {
        document.getElementById('nd-' + dragOverRef.current)?.classList.remove('drag-over-target')
        attachChild(node.id, dragOverRef.current)
        dragOverRef.current = null
      }
      dragRef.current.active = false
      if (!useDiagram.getState().nodes[node.id]?.parent) {
        commitWorkspaceSnapshot('Move box', before)
      }
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (dragRef.current.moved) return
    if (cmode) {
      return
    }
    if (e.shiftKey) {
      toggleMultiSel(node.id)
      return
    }
    selectNode(node.id)
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    selectNode(node.id)
    const before = captureWorkspaceSnapshot()
    resizeRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      width: node.width ?? 160,
      height: node.height ?? 88,
    }

    const snapSize = (value: number) => {
      if (layoutMode !== 'static') return value
      return Math.max(24, Math.round(value / 24) * 24)
    }

    const minWidth = node.shape === 'circle' ? 110 : node.shape === 'triangle' ? 120 : 96
    const minHeight = node.shape === 'circle' ? 110 : node.shape === 'triangle' ? 96 : 72

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - resizeRef.current.startX) / zoom
      const dy = (me.clientY - resizeRef.current.startY) / zoom
      const nextWidth = Math.max(minWidth, snapSize(resizeRef.current.width + dx))
      const nextHeight = Math.max(minHeight, snapSize(resizeRef.current.height + dy))
      useDiagram.setState((state) => ({
        nodes: (() => {
          const nextNodes = {
            ...state.nodes,
            [node.id]: {
              ...state.nodes[node.id],
              width: nextWidth,
              height: nextHeight,
            },
          }
          const parentId = state.nodes[node.id]?.parent
          if (!parentId) return nextNodes

          let currentParentId: string | null = parentId
          while (currentParentId) {
            const parent: DiagramNodeType | undefined = nextNodes[currentParentId]
            if (!parent) break
            const childNodes: DiagramNodeType[] = parent.children
              .map((childId: string) => nextNodes[childId])
              .filter((child): child is DiagramNodeType => Boolean(child))
            if (childNodes.length === 0) {
              currentParentId = parent.parent
              continue
            }

            const totalChildrenWidth =
              childNodes.reduce(
                (sum: number, child: DiagramNodeType) => sum + (child.width ?? 160),
                0,
              ) +
              Math.max(childNodes.length - 1, 0) * 8
            const tallestChild = childNodes.reduce(
              (max: number, child: DiagramNodeType) => Math.max(max, child.height ?? 88),
              0,
            )
            nextNodes[currentParentId] = {
              ...parent,
              width: Math.max(parent.width ?? 160, totalChildrenWidth + 20),
              height: Math.max(parent.height ?? 88, 64 + 8 + tallestChild + 10),
            }
            currentParentId = parent.parent
          }

          return nextNodes
        })(),
      }))
    }

    const onUp = () => {
      resizeRef.current.active = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      commitWorkspaceSnapshot('Resize box', before)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxTarget({ type: 'node', id: node.id, x: e.clientX, y: e.clientY })
  }

  const handlePortMouseDown = (side: PortSide) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (cmode) return
    selectNode(node.id)
    useDiagram.getState().startConnect(node.id, side)
  }

  const handlePortMouseUp = (side: PortSide) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!cmode || !csrc || !csrcSide || csrc === node.id) return
    addEdge(csrc, node.id, csrcSide, side)
    cancelConnect()
    selectNode(node.id)
  }

  const handlePortClick = (side: PortSide) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (cmode && csrc && csrcSide && csrc !== node.id) {
      addEdge(csrc, node.id, csrcSide, side)
      cancelConnect()
      selectNode(node.id)
      return
    }
  }

  const baseBorderColor = autoBorder(node.bg)
  const borderColor = isSelected ? '#6c6cff' : isConnSrc ? '#22c57a' : baseBorderColor
  const multiBorderColor = isMultiSel ? '#4f7cff' : borderColor
  const boxShadow = isSelected
    ? '0 0 0 3px rgba(108,108,255,0.18)'
    : isMultiSel
      ? '0 0 0 3px rgba(79,124,255,0.22), 0 10px 24px rgba(79,124,255,0.16)'
      : 'none'
  const selectionBadge = isMultiSel ? (
    <div
      className="selection-badge"
      style={{
        position: 'absolute',
        top: -10,
        right: -10,
        width: 18,
        height: 18,
        borderRadius: '999px',
        background: '#4f7cff',
        border: '2px solid #fff',
        boxShadow: '0 3px 10px rgba(79,124,255,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      +
    </div>
  ) : null

  const showPorts = isSelected || isConnSrc || (cmode && isHovering)
  const getPortPositionStyle = (side: PortSide): React.CSSProperties => {
    if (node.shape === 'triangle') {
      if (side === 'pt') return { top: -6, left: '50%', transform: 'translateX(-50%)' }
      if (side === 'pb') return { bottom: -6, left: '50%', transform: 'translateX(-50%)' }
      if (side === 'pl') return { left: '25%', top: '50%', transform: 'translate(-50%, -50%)' }
      return { left: '75%', top: '50%', transform: 'translate(-50%, -50%)' }
    }
    if (side === 'pt') return { top: -6, left: '50%', transform: 'translateX(-50%)' }
    if (side === 'pb') return { bottom: -6, left: '50%', transform: 'translateX(-50%)' }
    if (side === 'pl') return { left: -6, top: '50%', transform: 'translateY(-50%)' }
    return { right: -6, top: '50%', transform: 'translateY(-50%)' }
  }
  const ports = (
    <div
      className="ports"
      style={{ opacity: showPorts ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}
    >
      {(['pt', 'pb', 'pl', 'pr'] as const).map((pos) => {
        const style: React.CSSProperties = {
          width: 10,
          height: 10,
          background: csrc === node.id && csrcSide === pos ? '#22c57a' : '#6c6cff',
          borderRadius: '50%',
          border: '2px solid #fff',
          position: 'absolute',
          cursor: 'crosshair',
          zIndex: 20,
          transition: 'transform 0.1s',
          pointerEvents: 'all',
          ...getPortPositionStyle(pos),
        }
        return (
          <div
            key={pos}
            id={`port-${node.id}-${pos}`}
            className="port"
            style={style}
            onMouseDown={handlePortMouseDown(pos)}
            onMouseUp={handlePortMouseUp(pos)}
            onClick={handlePortClick(pos)}
          />
        )
      })}
    </div>
  )

  const textDecoration = [node.underline ? 'underline' : '', node.strike ? 'line-through' : '']
    .filter(Boolean)
    .join(' ')
  const isCircle = node.shape === 'circle'
  const isDiamond = node.shape === 'diamond'
  const isTriangle = node.shape === 'triangle'
  const nodeClipPath = isDiamond
    ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
    : isTriangle
      ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
      : undefined
  const nodeBorderRadius = isCircle ? 999 : node.radius
  const nodePadding = isTriangle ? '18px 14px 12px' : isDiamond ? '18px 16px' : undefined
  const nodeMinWidth = isCircle ? 110 : isTriangle ? 120 : isDiamond ? 120 : undefined
  const nodeMinHeight = isCircle ? 110 : isTriangle ? 96 : isDiamond ? 110 : undefined
  const nodeWidth = Math.max(node.width ?? nodeMinWidth ?? 160, nodeMinWidth ?? 96)
  const nodeHeight = Math.max(node.height ?? nodeMinHeight ?? 88, nodeMinHeight ?? 72)
  const childNodes = node.children
    .map((cid) => useDiagram.getState().nodes[cid])
    .filter((child): child is DiagramNodeType => Boolean(child))
  const singleRowWidth =
    childNodes.reduce((sum, child) => sum + Math.max(child.width ?? 160, 1), 0) +
    Math.max(childNodes.length - 1, 0) * 8 +
    20
  const wrapChildren = nodeWidth < singleRowWidth
  const showResizeHandle = isSelected && interactionMode !== 'move'
  const resizeHandle = showResizeHandle ? (
    <button
      type="button"
      aria-label="Resize box"
      onMouseDown={handleResizeMouseDown}
      style={{
        position: 'absolute',
        right: -8,
        bottom: -8,
        width: 16,
        height: 16,
        borderRadius: 999,
        border: '2px solid #fff',
        background: '#6c6cff',
        boxShadow: '0 4px 14px rgba(108,108,255,0.35)',
        cursor: 'nwse-resize',
        zIndex: 30,
      }}
    />
  ) : null
  const titleTextStyle: React.CSSProperties = {
    fontSize: node.size,
    fontFamily: node.family,
    fontWeight: node.bold ? '700' : '500',
    fontStyle: node.italic ? 'italic' : 'normal',
    textDecoration,
    lineHeight: 1.3,
    pointerEvents: 'none',
  }
  const descTextStyle: React.CSSProperties = {
    fontSize: Math.max(node.size - 2, 10),
    fontFamily: node.family,
    fontWeight: node.bold ? '700' : '400',
    fontStyle: node.italic ? 'italic' : 'normal',
    textDecoration,
    display: 'block',
    marginTop: 2,
    pointerEvents: 'none',
    opacity: 0.75,
  }

  // Child node
  if (isChild) {
    return (
      <div
        id={'nd-' + node.id}
        ref={nodeRef}
        style={{
          position: 'relative',
          width: nodeWidth,
          minWidth: nodeMinWidth ?? 80,
          minHeight: nodeMinHeight,
          height: nodeHeight,
          boxSizing: 'border-box',
          flex: '0 0 auto',
          borderRadius: nodeBorderRadius,
          clipPath: nodeClipPath,
          cursor: 'move',
          background: isMultiSel ? 'rgba(79,124,255,0.18)' : 'rgba(255,255,255,0.1)',
          border: `1.5px solid ${multiBorderColor}`,
          padding: nodePadding ?? '8px 12px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: node.fg,
          userSelect: 'none',
          boxShadow,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {selectionBadge}
        {ports}
        {resizeHandle}
        <span style={titleTextStyle}>
          <MathText content={node.title} align="center" />
        </span>
        {node.desc && (
          <span style={descTextStyle}>
            <MathText content={node.desc} align="center" />
          </span>
        )}
      </div>
    )
  }

  // Parent node (has children)
  if (hasChildren) {
    return (
      <div
        id={'nd-' + node.id}
        ref={nodeRef}
        style={{
          background: node.bg,
          color: node.fg,
          borderRadius: nodeBorderRadius,
          clipPath: nodeClipPath,
          position: 'absolute',
          left: node.x,
          top: node.y,
          width: nodeWidth,
          boxSizing: 'border-box',
          userSelect: 'none',
          border: `2px solid ${multiBorderColor}`,
          boxShadow,
          minWidth: nodeMinWidth ?? 120,
          minHeight: Math.max(nodeHeight, nodeMinHeight ?? 0),
          outline: isMultiSel ? '1.5px dashed rgba(79,124,255,0.8)' : 'none',
          outlineOffset: 4,
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {selectionBadge}
        {ports}
        {resizeHandle}
        <div
          style={{
            padding: '10px 14px 8px',
            cursor: 'move',
            textAlign: 'center',
            flexShrink: 0,
          }}
          onMouseDown={handleMouseDown}
        >
          <span style={{ ...titleTextStyle, display: 'block' }}>
            <MathText content={node.title} align="center" />
          </span>
          {node.desc && (
            <span style={descTextStyle}>
              <MathText content={node.desc} align="center" />
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: wrapChildren ? 'wrap' : 'nowrap',
            gap: 8,
            padding: '8px 10px 10px',
            alignItems: 'stretch',
            alignContent: 'flex-start',
            minHeight: 30,
            width: '100%',
            boxSizing: 'border-box',
            justifyContent: wrapChildren ? 'center' : 'flex-start',
          }}
        >
          {childNodes.map((child) => (
            <DiagramNode
              key={child.id}
              node={child}
              canvasRef={canvasRef}
              viewport={viewport}
              zoom={zoom}
            />
          ))}
        </div>
      </div>
    )
  }

  // Leaf node
  return (
    <div
      id={'nd-' + node.id}
      ref={nodeRef}
      style={{
        background: node.bg,
        color: node.fg,
        borderRadius: nodeBorderRadius,
        clipPath: nodeClipPath,
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: nodeWidth,
        height: nodeHeight,
        boxSizing: 'border-box',
        padding: nodePadding ?? '10px 14px',
        cursor: 'move',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        border: `2px solid ${multiBorderColor}`,
        boxShadow,
        minWidth: nodeMinWidth,
        minHeight: nodeMinHeight,
        outline: isMultiSel ? '1.5px dashed rgba(79,124,255,0.8)' : 'none',
        outlineOffset: 4,
        transition: 'box-shadow 0.12s, border-color 0.12s',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {selectionBadge}
      {ports}
      {resizeHandle}
      <span style={{ ...titleTextStyle, display: 'block' }}>
        <MathText content={node.title} align="center" />
      </span>
      {node.desc && (
        <span style={descTextStyle}>
          <MathText content={node.desc} align="center" />
        </span>
      )}
    </div>
  )
}

export default DiagramNode

function isDescendant(anc: string, child: string, nodes: Record<string, DiagramNodeType>): boolean {
  let c = nodes[child]?.parent
  while (c) {
    if (c === anc) return true
    c = nodes[c]?.parent
  }
  return false
}
