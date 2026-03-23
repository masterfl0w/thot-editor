import { useEffect, useRef } from 'react'
import { useDiagram, adjHex } from '../store/diagramStore'

const IconBox = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="1" width="11" height="11" rx="3" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="6.5" y1="4" x2="6.5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
const IconText = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 3.5h9M6.5 3.5v6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
const IconChild = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="1" width="11" height="11" rx="3" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="3" y="5.5" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1"/>
  </svg>
)
const IconConnect = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="2.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
    <circle cx="10.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
    <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="currentColor" strokeWidth="1.1"/>
  </svg>
)
const IconExtract = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5h9M7 3l4 3.5L7 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 3.5h9M4.5 3.5V3h4v.5M5.5 6v3.5M7.5 6v3.5M2.5 3.5l.75 6.5a.9.9 0 00.9.75h4.7a.9.9 0 00.9-.75l.75-6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)

const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

const menuStyle: React.CSSProperties = {
  position: 'fixed',
  background: isDark() ? '#2c2c2a' : '#fff',
  border: `0.5px solid ${isDark() ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'}`,
  borderRadius: 9,
  boxShadow: '0 4px 18px rgba(0,0,0,0.13)',
  padding: 5,
  minWidth: 172,
  zIndex: 1000,
}

const itemStyle: React.CSSProperties = {
  padding: '7px 11px',
  fontSize: 12,
  borderRadius: 6,
  cursor: 'pointer',
  color: isDark() ? '#f5f3ee' : '#1a1a18',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const sepStyle: React.CSSProperties = {
  height: '0.5px',
  background: isDark() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  margin: '4px 0',
}

export default function ContextMenu() {
  const { ctxTarget, setCtxTarget, addBox, addText, nodes, selectNode, selectText,
    startConnect, detachNode, deleteNode, deleteText, deselectAll, startEditText } = useDiagram()

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setCtxTarget(null)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  if (!ctxTarget) return null

  const x = Math.min(ctxTarget.x, window.innerWidth - 185)
  const y = Math.min(ctxTarget.y, window.innerHeight - 220)

  const close = () => setCtxTarget(null)

  const Item = ({ icon, label, danger, onClick }: { icon: React.ReactNode, label: string, danger?: boolean, onClick: () => void }) => (
    <div
      style={{ ...itemStyle, color: danger ? (isDark() ? '#e57373' : '#c0392b') : itemStyle.color }}
      onMouseEnter={e => (e.currentTarget.style.background = isDark() ? '#3d3d3a' : '#f5f3ee')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      onClick={() => { onClick(); close() }}
    >
      {icon} {label}
    </div>
  )

  return (
    <div ref={ref} style={{ ...menuStyle, left: x, top: y }}>
      {ctxTarget.type === 'canvas' && (
        <>
          <Item icon={<IconBox />} label="Add box here" onClick={() => {
            const id = addBox({ x: ctxTarget.wx - 50, y: ctxTarget.wy - 22 })
            selectNode(id)
          }} />
          <Item icon={<IconText />} label="Add text here" onClick={() => {
            const id = addText({ x: ctxTarget.wx - 20, y: ctxTarget.wy - 10 })
            selectText(id)
            setTimeout(() => startEditText(id), 50)
          }} />
        </>
      )}

      {ctxTarget.type === 'node' && (() => {
        const node = nodes[ctxTarget.id]
        return (
          <>
            <Item icon={<IconChild />} label="Add child box" onClick={() => {
              const pb = nodes[ctxTarget.id]
              if (!pb) return
              const isDarkMode = isDark()
              const bg = adjHex(pb.bg, isDarkMode ? 30 : -30)
              const id = addBox({ parent: ctxTarget.id, title: 'Child box', bg, fg: pb.fg })
              selectNode(id)
            }} />
            <div style={sepStyle} />
            <Item icon={<IconConnect />} label="Connect" onClick={() => {
              selectNode(ctxTarget.id)
              startConnect()
            }} />
            {node?.parent && (
              <Item icon={<IconExtract />} label="Extract from parent" onClick={() => detachNode(ctxTarget.id, true)} />
            )}
            <div style={sepStyle} />
            <Item icon={<IconTrash />} label="Delete" danger onClick={() => {
              deselectAll()
              deleteNode(ctxTarget.id)
            }} />
          </>
        )
      })()}

      {ctxTarget.type === 'text' && (
        <>
          <div style={sepStyle} />
          <Item icon={<IconTrash />} label="Delete" danger onClick={() => {
            deselectAll()
            deleteText(ctxTarget.id)
          }} />
        </>
      )}
    </div>
  )
}
