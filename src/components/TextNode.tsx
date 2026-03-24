import { useRef, useEffect } from 'react'
import type { FunctionComponent, RefObject } from 'react'
import { useDiagram } from '../store/diagramStore'
import type { TextNode as TextNodeType } from '../types'
import MathText from './MathText'

const THRESH = 6

interface Props {
  text: TextNodeType
  canvasRef: RefObject<HTMLDivElement | null>
  viewport: { x: number; y: number }
  zoom: number
}

const TextNode: FunctionComponent<Props> = ({ text, canvasRef, viewport, zoom }) => {
  const {
    selectText,
    toggleMultiSel,
    selText,
    multiSel,
    startEditText,
    finishEditText,
    editingTextId,
    setCtxTarget,
    setTextPosition,
    commitWorkspaceSnapshot,
    captureWorkspaceSnapshot,
    updateText,
  } = useDiagram()

  const isSelected = selText === text.id
  const isMultiSel = multiSel.has(text.id) && !isSelected
  const isEditing = editingTextId === text.id
  const elRef = useRef<HTMLDivElement | HTMLTextAreaElement>(null)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, moved: false, ox: 0, oy: 0 })

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    left: text.x,
    top: text.y,
    cursor: isEditing ? 'text' : 'move',
    userSelect: 'none',
    border: `2px solid ${isSelected ? '#6c6cff' : isMultiSel ? '#4f7cff' : 'transparent'}`,
    padding: '4px 6px',
    borderRadius: 4,
    minWidth: 40,
    minHeight: 20,
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: text.size,
    color: text.color,
    fontFamily: text.family,
    fontWeight: text.bold ? '700' : '400',
    fontStyle: text.italic ? 'italic' : 'normal',
    textDecoration: [text.underline ? 'underline' : '', text.strike ? 'line-through' : '']
      .filter(Boolean)
      .join(' '),
    textAlign: text.align,
    opacity: text.opacity / 100,
    boxShadow: isSelected
      ? '0 0 0 2px rgba(108,108,255,0.18)'
      : isMultiSel
        ? '0 0 0 3px rgba(79,124,255,0.18), 0 8px 18px rgba(79,124,255,0.12)'
        : 'none',
    background: isEditing
      ? 'rgba(245,243,238,0.12)'
      : isMultiSel
        ? 'rgba(79,124,255,0.08)'
        : 'transparent',
    outline: 'none',
  }

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    if (isEditing) {
      el.focus()
      if (el instanceof HTMLTextAreaElement) {
        el.selectionStart = el.value.length
        el.selectionEnd = el.value.length
      }
    }
  }, [isEditing])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditing) return
    if (multiSel.has(text.id) && multiSel.size > 1) return
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
      const dx = me.clientX - d.startX,
        dy = me.clientY - d.startY
      if (!d.moved && Math.sqrt(dx * dx + dy * dy) < THRESH) return
      d.moved = true
      const cw = canvasRef.current
      if (!cw) return
      const wr = cw.getBoundingClientRect()
      if (!d.ox) {
        const el = elRef.current
        const r = el?.getBoundingClientRect()
        if (r) {
          d.ox = me.clientX - wr.left - (r.left - wr.left)
          d.oy = me.clientY - wr.top - (r.top - wr.top)
        }
      }
      setTextPosition(
        text.id,
        viewport.x + (me.clientX - wr.left - d.ox) / zoom,
        viewport.y + (me.clientY - wr.top - d.oy) / zoom,
      )
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      dragRef.current.active = false
      commitWorkspaceSnapshot('Move text', before)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditing) return
    if (dragRef.current.moved) return
    if (e.shiftKey) {
      toggleMultiSel(text.id)
      return
    }
    selectText(text.id)
  }

  const handleDblClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    startEditText(text.id)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxTarget({ type: 'text', id: text.id, x: e.clientX, y: e.clientY })
  }

  const handleBlur = () => {
    if (isEditing) finishEditText(text.id)
  }

  const badge =
    isMultiSel && !isEditing ? (
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

  if (isEditing) {
    return (
      <div style={{ position: 'absolute', left: text.x, top: text.y }}>
        <textarea
          id={'tn-' + text.id}
          ref={elRef as React.RefObject<HTMLTextAreaElement>}
          value={text.content}
          style={{
            ...textStyle,
            position: 'relative',
            left: 0,
            top: 0,
            display: 'block',
            resize: 'none',
            overflow: 'hidden',
            minWidth: 80,
            minHeight: Math.max(text.size * 1.8, 32),
            border: '2px solid #6c6cff',
            boxShadow: '0 0 0 3px rgba(108,108,255,0.18)',
          }}
          onChange={(e) => updateText(text.id, { content: e.target.value })}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={handleContextMenu}
        />
      </div>
    )
  }

  return (
    <div
      id={'tn-' + text.id}
      ref={elRef as React.RefObject<HTMLDivElement>}
      style={textStyle}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      onContextMenu={handleContextMenu}
    >
      {badge}
      <MathText content={text.content} align={text.align} />
    </div>
  )
}

export default TextNode
