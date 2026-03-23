import { useState, useRef, useEffect } from 'react'
import { css } from '../../styled-system/css'
import { useDiagram } from '../store/diagramStore'

// Shared SVG icons
export const IconBox = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="1" width="11" height="11" rx="3" stroke="currentColor" strokeWidth="1.1"/>
    <line x1="6.5" y1="4" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
export const IconText = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 3.5h9M6.5 3.5v6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 10.5h9M8.5 2.5l2 2-5 5H3.5v-2l5-5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 3.5h9M4.5 3.5V3h4v.5M5.5 6v3.5M7.5 6v3.5M2.5 3.5l.75 6.5a.9.9 0 00.9.75h4.7a.9.9 0 00.9-.75l.75-6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
const IconChevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)

const topbarStyle = css({
  height: '42px',
  minHeight: '42px',
  background: '#fff',
  borderBottom: '0.5px solid rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 10px',
  gap: '2px',
  position: 'relative',
  zIndex: 200,
  '@media (prefers-color-scheme: dark)': {
    background: '#2c2c2a',
    borderColor: 'rgba(255,255,255,0.08)',
  },
})

const sepStyle = css({
  width: '0.5px',
  height: '20px',
  background: 'rgba(0,0,0,0.1)',
  margin: '0 4px',
  flexShrink: 0,
  '@media (prefers-color-scheme: dark)': { background: 'rgba(255,255,255,0.1)' },
})

const btnStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '4px 9px',
  fontSize: '12px',
  fontWeight: '500',
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: '#1a1a18',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  height: '30px',
  '&:hover': { background: '#f0ede8' },
  '@media (prefers-color-scheme: dark)': {
    color: '#f5f3ee',
    '&:hover': { background: '#3d3d3a' },
  },
})

const menuStyle = css({
  position: 'absolute',
  top: '36px',
  left: 0,
  background: '#fff',
  border: '0.5px solid rgba(0,0,0,0.15)',
  borderRadius: '9px',
  boxShadow: '0 4px 18px rgba(0,0,0,0.13)',
  padding: '5px',
  minWidth: '180px',
  zIndex: 500,
  '@media (prefers-color-scheme: dark)': {
    background: '#2c2c2a',
    borderColor: 'rgba(255,255,255,0.12)',
  },
})

const menuItemStyle = css({
  padding: '7px 11px',
  fontSize: '12px',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#1a1a18',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&:hover': { background: '#f5f3ee' },
  '@media (prefers-color-scheme: dark)': {
    color: '#f5f3ee',
    '&:hover': { background: '#3d3d3a' },
  },
})

const menuSepStyle = css({
  height: '0.5px',
  background: 'rgba(0,0,0,0.08)',
  margin: '4px 0',
  '@media (prefers-color-scheme: dark)': { background: 'rgba(255,255,255,0.08)' },
})

export default function Topbar() {
  const [editOpen, setEditOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { addBox, addText, clearAll, selectNode, selectText, startEditText } = useDiagram()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setEditOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const doAddBox = () => {
    const id = addBox({ x: 80 + Math.random() * 300, y: 60 + Math.random() * 200 })
    selectNode(id)
    setEditOpen(false)
  }

  const doAddText = () => {
    const id = addText({ x: 80 + Math.random() * 300, y: 60 + Math.random() * 200 })
    selectText(id)
    setTimeout(() => startEditText(id), 50)
    setEditOpen(false)
  }

  const doClearAll = () => {
    clearAll()
    setEditOpen(false)
  }

  return (
    <div className={topbarStyle}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#888780', padding: '0 6px', marginRight: 4 }}>
        Diagram
      </span>
      <div className={sepStyle} />
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button className={btnStyle} onClick={() => setEditOpen(o => !o)}>
          <IconEdit /> Edit <IconChevron />
        </button>
        {editOpen && (
          <div className={menuStyle}>
            <div className={menuItemStyle} onClick={doAddBox}><IconBox /> Add box</div>
            <div className={menuItemStyle} onClick={doAddText}><IconText /> Add text</div>
            <div className={menuSepStyle} />
            <div className={menuItemStyle + ' ' + css({ color: '#c0392b !important' })} onClick={doClearAll}>
              <IconTrash /> Clear all
            </div>
          </div>
        )}
      </div>
      <div className={sepStyle} />
      <button className={btnStyle} onClick={doAddBox}><IconBox /> Box</button>
      <button className={btnStyle} onClick={doAddText}><IconText /> Text</button>
    </div>
  )
}
