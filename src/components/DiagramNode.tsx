import { useRef, useCallback } from 'react'
import { useDiagram } from '../store/diagramStore'
import type { DiagramNode as DiagramNodeType } from '../types'

const THRESH = 6

interface Props {
  node: DiagramNodeType
  canvasRef: React.RefObject<HTMLDivElement | null>
  viewport: { x: number; y: number }
}

export default function DiagramNode({ node, canvasRef, viewport }: Props) {
  const {
    selectNode, selNode, csrc, multiSel, cmode,
    attachChild, detachNode, addEdge, cancelConnect,
    setCtxTarget, moveNode,
  } = useDiagram()

  const isChild = !!node.parent
  const hasChildren = node.children.length > 0
  const isSelected = selNode === node.id
  const isConnSrc = csrc === node.id
  const isMultiSel = multiSel.has(node.id) && !isSelected

  const dragRef = useRef({ active: false, startX: 0, startY: 0, moved: false, ox: 0, oy: 0 })
  const multiDragRef = useRef({ active: false, startX: 0, startY: 0, origins: {} as Record<string, {x:number,y:number}> })
  const dragOverRef = useRef<string | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  const findDropTarget = useCallback((cx: number, cy: number, excl: string): string | null => {
    const allNodes = useDiagram.getState().nodes
    let best: string | null = null
    let bestArea = Infinity
    Object.values(allNodes).forEach(n => {
      if (n.id === excl || n.parent) return
      if (isDescendant(n.id, excl, allNodes)) return
      const el = document.getElementById('nd-' + n.id)
      if (!el) return
      const r = el.getBoundingClientRect()
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        const a = r.width * r.height
        if (a < bestArea) { bestArea = a; best = n.id }
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
      const origins: Record<string, {x:number, y:number}> = {}
      multiSel.forEach(id => {
        if (allNodes[id]) origins[id] = { x: allNodes[id].x, y: allNodes[id].y }
        else if (allTexts[id]) origins[id] = { x: allTexts[id].x, y: allTexts[id].y }
      })
      multiDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origins }
      const onMove = (me: MouseEvent) => {
        const { moveNode, moveText } = useDiagram.getState()
        const dx = me.clientX - multiDragRef.current.startX
        const dy = me.clientY - multiDragRef.current.startY
        multiSel.forEach(id => {
          const o = multiDragRef.current.origins[id]
          if (!o) return
          const { nodes: n2, texts: t2 } = useDiagram.getState()
          if (n2[id]) moveNode(id, o.x + dx, o.y + dy)
          else if (t2[id]) moveText(id, o.x + dx, o.y + dy)
        })
      }
      const onUp = () => {
        multiDragRef.current.active = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      return
    }

    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, moved: false, ox: 0, oy: 0 }

    const onMove = (me: MouseEvent) => {
      const d = dragRef.current
      if (!d.active) return
      const dx = me.clientX - d.startX
      const dy = me.clientY - d.startY
      if (!d.moved && Math.sqrt(dx*dx + dy*dy) < THRESH) return
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
          const outside = me.clientX < pr2.left || me.clientX > pr2.right || me.clientY < pr2.top || me.clientY > pr2.bottom
          if (!outside) return
          const nel = document.getElementById('nd-' + node.id)
          const nr = nel?.getBoundingClientRect()
          detachNode(
            node.id,
            true,
            nr ? nr.left - wr.left + viewport.x : cur.x,
            nr ? nr.top - wr.top + viewport.y : cur.y,
          )
        }
      }

      if (!d.ox) {
        const el = document.getElementById('nd-' + node.id)
        const r = el?.getBoundingClientRect()
        if (r) { d.ox = me.clientX - wr.left - (r.left - wr.left); d.oy = me.clientY - wr.top - (r.top - wr.top) }
      }

      const newX = me.clientX - wr.left - d.ox + viewport.x
      const newY = me.clientY - wr.top - d.oy + viewport.y
      moveNode(node.id, newX, newY)

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
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (dragRef.current.moved) return
    if (cmode) {
      if (node.id !== csrc) {
        addEdge(csrc!, node.id)
        cancelConnect()
        selectNode(node.id)
      }
      return
    }
    selectNode(node.id)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxTarget({ type: 'node', id: node.id, x: e.clientX, y: e.clientY })
  }

  const handlePortMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    selectNode(node.id)
    useDiagram.getState().startConnect()
  }

  const borderColor = isSelected ? '#6c6cff' : isConnSrc ? '#22c57a' : (isChild ? 'rgba(255,255,255,0.25)' : 'transparent')
  const boxShadow = isSelected ? '0 0 0 3px rgba(108,108,255,0.18)' : isMultiSel ? '0 0 0 2px rgba(108,108,255,0.14)' : 'none'

  const ports = (
    <div className="ports" style={{ opacity: isSelected || isConnSrc ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}>
      {(['pt','pb','pl','pr'] as const).map(pos => {
        const style: React.CSSProperties = {
          width: 10, height: 10, background: '#6c6cff', borderRadius: '50%',
          border: '2px solid #fff', position: 'absolute', cursor: 'crosshair',
          zIndex: 20, transition: 'transform 0.1s', pointerEvents: 'all',
          ...(pos === 'pt' ? { top: -6, left: '50%', transform: 'translateX(-50%)' } :
             pos === 'pb' ? { bottom: -6, left: '50%', transform: 'translateX(-50%)' } :
             pos === 'pl' ? { left: -6, top: '50%', transform: 'translateY(-50%)' } :
             { right: -6, top: '50%', transform: 'translateY(-50%)' })
        }
        return <div key={pos} style={style} onMouseDown={handlePortMouseDown} />
      })}
    </div>
  )

  // Child node
  if (isChild) {
    return (
      <div
        id={'nd-' + node.id}
        ref={nodeRef}
        style={{
          position: 'relative',
          minWidth: 80,
          flex: '0 0 auto',
          borderRadius: node.radius,
          cursor: 'move',
          background: 'rgba(255,255,255,0.1)',
          border: `1.5px solid ${borderColor}`,
          padding: '8px 12px',
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
      >
        {ports}
        <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, pointerEvents: 'none' }}>{node.title}</span>
        {node.desc && <span style={{ fontSize: 10, display: 'block', marginTop: 2, pointerEvents: 'none', opacity: 0.75 }}>{node.desc}</span>}
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
          borderRadius: node.radius,
          position: 'absolute',
          left: node.x,
          top: node.y,
          userSelect: 'none',
          border: `2px solid ${borderColor}`,
          boxShadow,
          minWidth: 120,
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {ports}
        <div style={{ padding: '10px 14px 8px', cursor: 'move', textAlign: 'center' }} onMouseDown={handleMouseDown}>
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, display: 'block', pointerEvents: 'none' }}>{node.title}</span>
          {node.desc && <span style={{ fontSize: 11, display: 'block', marginTop: 2, pointerEvents: 'none', opacity: 0.75 }}>{node.desc}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 8, padding: '8px 10px 10px', alignItems: 'stretch', minHeight: 30 }}>
          {node.children.map(cid => {
            const child = useDiagram.getState().nodes[cid]
            return child ? <DiagramNode key={cid} node={child} canvasRef={canvasRef} viewport={viewport} /> : null
          })}
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
        borderRadius: node.radius,
        position: 'absolute',
        left: node.x,
        top: node.y,
        padding: '10px 14px',
        cursor: 'move',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        border: `2px solid ${borderColor}`,
        boxShadow,
        transition: 'box-shadow 0.12s, border-color 0.12s',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {ports}
      <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, display: 'block', pointerEvents: 'none' }}>{node.title}</span>
      {node.desc && <span style={{ fontSize: 11, display: 'block', marginTop: 2, pointerEvents: 'none', opacity: 0.75 }}>{node.desc}</span>}
    </div>
  )
}

function isDescendant(anc: string, child: string, nodes: Record<string, DiagramNodeType>): boolean {
  let c = nodes[child]?.parent
  while (c) {
    if (c === anc) return true
    c = nodes[c]?.parent
  }
  return false
}
