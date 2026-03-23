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
const IconCursor = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M3 2.2v8.6l2.1-2.3 1.9 2.3 1.1-.9-1.9-2.3H10L3 2.2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
  </svg>
)
const IconHand = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M4.2 6.2V3.4a.8.8 0 011.6 0v2M5.8 5.9V2.7a.8.8 0 111.6 0v3M7.4 6.1V3.7a.8.8 0 111.6 0v3.1M3.1 6.9l.8 3a1.5 1.5 0 001.5 1.1h2.1a1.8 1.8 0 001.7-1.2l.4-1.2a3 3 0 00-.5-2.8l-.7-.8a.8.8 0 10-1.2 1l.2.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconMinus = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line x1="3" y1="6.5" x2="10" y2="6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line x1="3" y1="6.5" x2="10" y2="6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="6.5" y1="3" x2="6.5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
const IconSun = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="2.2" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M6.5 1.5v1.2M6.5 10.3v1.2M1.5 6.5h1.2M10.3 6.5h1.2M2.9 2.9l.8.8M9.3 9.3l.8.8M10.1 2.9l-.8.8M3.7 9.3l-.8.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
const IconMoon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M8.9 2.1a4.5 4.5 0 104 6.1A4.9 4.9 0 018.9 2.1z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconSettings = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 4.6a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8z" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M10.4 7.1v-1.2l-1-.3a3.3 3.3 0 00-.3-.7l.5-.9-.8-.8-.9.5a3.3 3.3 0 00-.7-.3l-.3-1H5.7l-.3 1a3.3 3.3 0 00-.7.3l-.9-.5-.8.8.5.9a3.3 3.3 0 00-.3.7l-1 .3v1.2l1 .3c.1.2.2.5.3.7l-.5.9.8.8.9-.5c.2.1.5.2.7.3l.3 1h1.2l.3-1c.2-.1.5-.2.7-.3l.9.5.8-.8-.5-.9c.1-.2.2-.5.3-.7l1-.3z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconGrid = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="2" y="2" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1"/>
    <rect x="8" y="2" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1"/>
    <rect x="2" y="8" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1"/>
    <rect x="8" y="8" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1"/>
  </svg>
)
const IconHistory = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2.1 6.5a4.4 4.4 0 108.8 0 4.4 4.4 0 00-7.4-3.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.1 2.7v2.1h2.1M6.5 4v2.7l1.8 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconUndo = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M4.3 4.1H9a2.9 2.9 0 010 5.8H4.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.6 2.6L2.2 5l2.4 2.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const topbarStyle = css({
  height: '48px',
  minHeight: '48px',
  background: 'rgba(255,255,255,0.9)',
  border: '0.5px solid rgba(0,0,0,0.08)',
  borderRadius: '18px',
  boxShadow: '0 18px 40px rgba(25,25,20,0.12)',
  backdropFilter: 'blur(18px)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  gap: '2px',
  position: 'absolute',
  top: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 300,
  '[data-theme=dark] &': {
    background: 'rgba(44,44,42,0.88)',
    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: '0 20px 44px rgba(0,0,0,0.28)',
  },
})

const sepStyle = css({
  width: '0.5px',
  height: '20px',
  background: 'rgba(0,0,0,0.1)',
  margin: '0 4px',
  flexShrink: 0,
  '[data-theme=dark] &': { background: 'rgba(255,255,255,0.1)' },
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
  '[data-theme=dark] &': {
    color: '#f5f3ee',
    '&:hover': { background: '#3d3d3a' },
  },
})

const brandStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 8px 0 4px',
  height: '30px',
  flexShrink: 0,
  '& img': {
    display: 'block',
    height: '19px',
    width: 'auto',
    objectFit: 'contain',
    opacity: 0.96,
  },
  '[data-theme=dark] &': {
    '& img': {
      filter: 'brightness(0) invert(1)',
      opacity: 0.92,
    },
  },
})

const menuStyle = css({
  position: 'absolute',
  top: '44px',
  left: 0,
  background: '#fff',
  border: '0.5px solid rgba(0,0,0,0.15)',
  borderRadius: '9px',
  boxShadow: '0 4px 18px rgba(0,0,0,0.13)',
  padding: '5px',
  minWidth: '180px',
  zIndex: 500,
  '[data-theme=dark] &': {
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
  '[data-theme=dark] &': {
    color: '#f5f3ee',
    '&:hover': { background: '#3d3d3a' },
  },
})

const menuSepStyle = css({
  height: '0.5px',
  background: 'rgba(0,0,0,0.08)',
  margin: '4px 0',
  '[data-theme=dark] &': { background: 'rgba(255,255,255,0.08)' },
})

export default function Topbar() {
  const [editOpen, setEditOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const editRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const {
    addBox, addText, clearAll, selectNode, selectText, startEditText,
    interactionMode, setInteractionMode, zoom, setZoom,
    theme, setTheme, layoutMode, setLayoutMode, actionHistory, historyPast, undo,
  } = useDiagram()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!editRef.current?.contains(e.target as Node)) setEditOpen(false)
      if (!settingsRef.current?.contains(e.target as Node)) {
        setSettingsOpen(false)
        setHistoryOpen(false)
      }
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

  const updateZoom = (delta: number) => {
    setZoom(Math.max(0.4, Math.min(2.5, Number((zoom + delta).toFixed(2)))))
  }

  return (
    <div className={topbarStyle}>
      <div className={brandStyle} aria-label="Thot Editor">
        <img src="/thot_dark_icon_transparency.svg" alt="Thot Editor" />
      </div>
      <div className={sepStyle} />
      <div style={{ position: 'relative' }} ref={editRef}>
        <button className={btnStyle} onClick={() => { setEditOpen(o => !o); setSettingsOpen(false) }}>
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
      <button
        className={btnStyle + ' ' + (interactionMode === 'select' ? css({ background: '#f0ede8', '[data-theme=dark] &': { background: '#3d3d3a' } }) : '')}
        onClick={() => setInteractionMode('select')}
      >
        <IconCursor /> Select
      </button>
      <button
        className={btnStyle + ' ' + (interactionMode === 'move' ? css({ background: '#f0ede8', '[data-theme=dark] &': { background: '#3d3d3a' } }) : '')}
        onClick={() => setInteractionMode('move')}
      >
        <IconHand /> Move
      </button>
      <div className={sepStyle} />
      <button className={btnStyle} onClick={() => undo()} disabled={historyPast.length === 0} style={{ opacity: historyPast.length === 0 ? 0.45 : 1 }}>
        <IconUndo /> Undo
      </button>
      <div className={sepStyle} />
      <div style={{ position: 'relative' }} ref={settingsRef}>
        <button className={btnStyle} onClick={() => { setSettingsOpen(o => !o); setHistoryOpen(false); setEditOpen(false) }}>
          <IconSettings /> Settings <IconChevron />
        </button>
        {settingsOpen && (
          <div className={menuStyle}>
            <div style={{ padding: '6px 10px 4px', fontSize: 11, color: '#888780', fontWeight: 600 }}>Theme</div>
            <div className={menuItemStyle} onClick={() => { setTheme('light'); setSettingsOpen(false) }}>
              <IconSun /> Light {theme === 'light' ? '•' : ''}
            </div>
            <div className={menuItemStyle} onClick={() => { setTheme('dark'); setSettingsOpen(false) }}>
              <IconMoon /> Dark {theme === 'dark' ? '•' : ''}
            </div>
            <div className={menuSepStyle} />
            <div style={{ padding: '6px 10px 4px', fontSize: 11, color: '#888780', fontWeight: 600 }}>Workspace mode</div>
            <div className={menuItemStyle} onClick={() => { setLayoutMode('free'); setSettingsOpen(false) }}>
              <IconHand /> Free {layoutMode === 'free' ? '•' : ''}
            </div>
            <div className={menuItemStyle} onClick={() => { setLayoutMode('static'); setSettingsOpen(false) }}>
              <IconGrid /> Static {layoutMode === 'static' ? '•' : ''}
            </div>
            <div className={menuSepStyle} />
            <div className={menuItemStyle} onClick={() => { setHistoryOpen(true); setSettingsOpen(false) }}>
              <IconHistory /> History
            </div>
          </div>
        )}
        {historyOpen && (
          <div className={menuStyle + ' ' + css({ left: 'calc(100% + 8px)', top: 0, minWidth: '280px', maxWidth: '320px', maxHeight: '320px', overflowY: 'auto' })}>
            <div style={{ padding: '6px 10px 8px', fontSize: 11, color: '#888780', fontWeight: 600 }}>Recent actions</div>
            {actionHistory.length === 0 ? (
              <div style={{ padding: '0 10px 10px', fontSize: 12, color: '#888780' }}>No actions yet.</div>
            ) : (
              [...actionHistory].reverse().map((action, index) => (
                <div key={`${action}-${index}`} className={menuItemStyle} style={{ cursor: 'default' }}>
                  <IconHistory /> {action}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div className={sepStyle} />
      <button className={btnStyle} onClick={() => updateZoom(-0.1)}><IconMinus /></button>
      <button className={btnStyle} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
      <button className={btnStyle} onClick={() => updateZoom(0.1)}><IconPlus /></button>
    </div>
  )
}
