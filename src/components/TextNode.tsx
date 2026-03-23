import { useRef, useEffect } from 'react'
import { useDiagram } from '../store/diagramStore'
import type { TextNode as TextNodeType } from '../types'

const THRESH = 6

interface Props {
  text: TextNodeType
  canvasRef: React.RefObject<HTMLDivElement | null>
  viewport: { x: number; y: number }
}

export default function TextNode({ text, canvasRef, viewport }: Props) {
  const { selectText, selText, multiSel, startEditText, finishEditText, editingTextId, setCtxTarget, moveText } = useDiagram()

  const isSelected = selText === text.id
  const isMultiSel = multiSel.has(text.id) && !isSelected
  const isEditing = editingTextId === text.id
  const elRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, moved: false, ox: 0, oy: 0 })

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    left: text.x,
    top: text.y,
    cursor: isEditing ? 'text' : 'move',
    userSelect: 'none',
    border: `2px solid ${isSelected || isMultiSel ? '#6c6cff' : 'transparent'}`,
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
    textDecoration: [text.underline ? 'underline' : '', text.strike ? 'line-through' : ''].filter(Boolean).join(' '),
    textAlign: text.align,
    opacity: text.opacity / 100,
    boxShadow: isSelected || isMultiSel ? '0 0 0 2px rgba(108,108,255,0.18)' : 'none',
    background: isEditing ? '#f5f3ee' : 'transparent',
    outline: 'none',
  }

  useEffect(() => {
    if (!elRef.current) return
    if (isEditing) {
      elRef.current.contentEditable = 'true'
      elRef.current.focus()
      // put cursor at end
      const range = document.createRange()
      range.selectNodeContents(elRef.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    } else {
      elRef.current.contentEditable = 'false'
    }
  }, [isEditing])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditing) return
    if ((multiSel.has(text.id) && multiSel.size > 1)) return
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, moved: false, ox: 0, oy: 0 }

    const onMove = (me: MouseEvent) => {
      const d = dragRef.current
      const dx = me.clientX - d.startX, dy = me.clientY - d.startY
      if (!d.moved && Math.sqrt(dx*dx + dy*dy) < THRESH) return
      d.moved = true
      const cw = canvasRef.current
      if (!cw) return
      const wr = cw.getBoundingClientRect()
      if (!d.ox) {
        const el = elRef.current
        const r = el?.getBoundingClientRect()
        if (r) { d.ox = me.clientX - wr.left - (r.left - wr.left); d.oy = me.clientY - wr.top - (r.top - wr.top) }
      }
      moveText(text.id, me.clientX - wr.left - d.ox + viewport.x, me.clientY - wr.top - d.oy + viewport.y)
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      dragRef.current.active = false
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditing) return
    if (!dragRef.current.moved) selectText(text.id)
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
    if (isEditing && elRef.current) {
      finishEditText(text.id, elRef.current.textContent ?? '')
    }
  }

  return (
    <div
      id={'tn-' + text.id}
      ref={elRef}
      style={textStyle}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDblClick}
      onContextMenu={handleContextMenu}
      onBlur={handleBlur}
      suppressContentEditableWarning
    >
      {!isEditing ? text.content : undefined}
    </div>
  )
}
