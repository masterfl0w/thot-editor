import { useState, useRef, useEffect } from 'react'
import type { FunctionComponent } from 'react'
import { css } from '../../styled-system/css'
import { useDiagram } from '../store/diagramStore'
import { saveWorkspaceAsPng, saveWorkspaceAsSvg } from '../utils/selectionExport'
import {
  approveCollaborator,
  copyInviteLink,
  kickCollaborator,
  rejectCollaborator,
  startHostedCollaboration,
  stopCollaboration,
} from '../utils/collaboration'

// Shared SVG icons
export const IconBox = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="1" width="11" height="11" rx="3" stroke="currentColor" strokeWidth="1.1" />
    <line
      x1="6.5"
      y1="4"
      x2="6.5"
      y2="9"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    <line
      x1="4"
      y1="6.5"
      x2="9"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)
export const IconText = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 3.5h9M6.5 3.5v6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
)
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M2 10.5h9M8.5 2.5l2 2-5 5H3.5v-2l5-5z"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M2 3.5h9M4.5 3.5V3h4v.5M5.5 6v3.5M7.5 6v3.5M2.5 3.5l.75 6.5a.9.9 0 00.9.75h4.7a.9.9 0 00.9-.75l.75-6.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)
const IconCursor = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M3 2.2v8.6l2.1-2.3 1.9 2.3 1.1-.9-1.9-2.3H10L3 2.2z"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  </svg>
)
const IconHand = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M4.2 6.2V3.4a.8.8 0 011.6 0v2M5.8 5.9V2.7a.8.8 0 111.6 0v3M7.4 6.1V3.7a.8.8 0 111.6 0v3.1M3.1 6.9l.8 3a1.5 1.5 0 001.5 1.1h2.1a1.8 1.8 0 001.7-1.2l.4-1.2a3 3 0 00-.5-2.8l-.7-.8a.8.8 0 10-1.2 1l.2.2"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconMinus = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line
      x1="3"
      y1="6.5"
      x2="10"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line
      x1="3"
      y1="6.5"
      x2="10"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    <line
      x1="6.5"
      y1="3"
      x2="6.5"
      y2="10"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)
const IconSun = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="2.2" stroke="currentColor" strokeWidth="1.1" />
    <path
      d="M6.5 1.5v1.2M6.5 10.3v1.2M1.5 6.5h1.2M10.3 6.5h1.2M2.9 2.9l.8.8M9.3 9.3l.8.8M10.1 2.9l-.8.8M3.7 9.3l-.8.8"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)
const IconMoon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M8.9 2.1a4.5 4.5 0 104 6.1A4.9 4.9 0 018.9 2.1z"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconGrid = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="2" y="2" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1" />
    <rect x="8" y="2" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1" />
    <rect x="2" y="8" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1" />
    <rect x="8" y="8" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth="1" />
  </svg>
)
const IconHistory = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M2.1 6.5a4.4 4.4 0 108.8 0 4.4 4.4 0 00-7.4-3.2"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.1 2.7v2.1h2.1M6.5 4v2.7l1.8 1"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconUndo = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M4.3 4.1H9a2.9 2.9 0 010 5.8H4.8"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.6 2.6L2.2 5l2.4 2.4"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconMore = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line
      x1="2.5"
      y1="3.5"
      x2="10.5"
      y2="3.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="2.5"
      y1="6.5"
      x2="10.5"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="2.5"
      y1="9.5"
      x2="10.5"
      y2="9.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
)
const IconImport = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M6.5 2.2v5.4M4.4 5.6l2.1 2.1 2.1-2.1M2.4 9.7h8.2"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconExport = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M6.5 10.8V5.4M4.4 7.4l2.1-2.1 2.1 2.1M2.4 3.3h8.2"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M5 6a1.8 1.8 0 100-3.6A1.8 1.8 0 005 6zm3.9-.7a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8zM2.5 10.4c.3-1.4 1.5-2.3 3-2.3s2.7.9 3 2.3M8 10.3c.2-.8.8-1.5 1.7-1.8.6-.2 1.2-.2 1.8 0"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconLink = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M5.2 7.8l2.6-2.6M4.1 8.9l-1 .9a1.8 1.8 0 102.6 2.6l1-.9M8.9 4.1l1-.9a1.8 1.8 0 112.6 2.6l-1 .9"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconUserMinus = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M4.8 6a1.8 1.8 0 100-3.6A1.8 1.8 0 004.8 6zm-2.2 4.4c.3-1.4 1.5-2.3 3-2.3s2.7.9 3 2.3M8.8 4.6h3"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M2.7 6.8l2.1 2.1 5.5-5.2"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconChevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
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

const sectionTitleStyle = css({
  padding: '7px 10px 4px',
  fontSize: '11px',
  color: '#888780',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  '[data-theme=dark] &': { color: '#9c9a92' },
})

const Topbar: FunctionComponent = () => {
  const [editOpen, setEditOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [collabOpen, setCollabOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [collabServerUrl, setCollabServerUrl] = useState(
    () => localStorage.getItem('thot-collab-server-url') ?? '',
  )
  const editRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const {
    addBox,
    addText,
    clearAll,
    selectNode,
    selectText,
    startEditText,
    interactionMode,
    setInteractionMode,
    zoom,
    setZoom,
    theme,
    setTheme,
    layoutMode,
    setLayoutMode,
    actionHistory,
    historyPast,
    undo,
    exportWorkspace,
    importWorkspace,
    nodes,
    texts,
    edges,
    selNode,
    selText,
    selEdge,
    multiSel,
    pushToast,
    collaboration,
  } = useDiagram()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!editRef.current?.contains(e.target as Node)) setEditOpen(false)
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const doAddBox = () => {
    const id = addBox({ x: 80 + Math.random() * 300, y: 60 + Math.random() * 200 })
    selectNode(id)
    setMoreOpen(false)
  }

  const doAddText = () => {
    const id = addText({ x: 80 + Math.random() * 300, y: 60 + Math.random() * 200 })
    selectText(id)
    setTimeout(() => startEditText(id), 50)
    setMoreOpen(false)
  }

  const doClearAll = () => {
    clearAll()
    setMoreOpen(false)
  }

  const updateZoom = (delta: number) => {
    setZoom(Math.max(0.4, Math.min(2.5, Number((zoom + delta).toFixed(2)))))
  }

  const doExportJson = () => {
    const blob = new Blob([JSON.stringify(exportWorkspace(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'thot-workspace.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMoreOpen(false)
    pushToast('success', 'Workspace exported to JSON')
  }

  const getSnapshot = () => ({ nodes, texts, edges, selNode, selText, selEdge, multiSel })

  const doSavePng = async () => {
    try {
      await saveWorkspaceAsPng(getSnapshot())
      setMoreOpen(false)
      pushToast('success', 'Workspace saved as PNG')
    } catch {
      pushToast('error', 'Unable to save PNG')
    }
  }

  const doSaveSvg = async () => {
    try {
      await saveWorkspaceAsSvg(getSnapshot())
      setMoreOpen(false)
      pushToast('success', 'Workspace saved as SVG')
    } catch {
      pushToast('error', 'Unable to save SVG')
    }
  }

  const doImportClick = () => {
    setMoreOpen(false)
    setImportOpen(true)
  }

  const doOpenCollaboration = () => {
    setMoreOpen(false)
    setCollabOpen(true)
  }

  const doImportJson = () => {
    try {
      const parsed = JSON.parse(importJson)
      if (!importWorkspace(parsed)) {
        pushToast('error', 'Invalid Thot JSON payload')
        return
      }
      setImportOpen(false)
      setImportJson('')
      pushToast('success', 'Workspace imported from JSON')
    } catch {
      pushToast('error', 'Unable to import this JSON payload')
    }
  }

  const doStartCollaboration = async () => {
    try {
      localStorage.setItem('thot-collab-server-url', collabServerUrl.trim())
      const link = startHostedCollaboration(collabServerUrl)
      await navigator.clipboard.writeText(link ?? '')
      pushToast('success', 'Collaboration opened. Invite link copied.')
      setCollabOpen(true)
    } catch {
      pushToast('error', 'Unable to start collaboration')
    }
  }

  const doCopyInvite = async () => {
    try {
      const ok = await copyInviteLink()
      if (!ok) {
        pushToast('error', 'No active collaboration link')
        return
      }
      pushToast('success', 'Invite link copied')
    } catch {
      pushToast('error', 'Unable to copy invite link')
    }
  }

  const doLeaveOrCloseCollaboration = () => {
    stopCollaboration()
    setCollabOpen(false)
    pushToast(
      'success',
      collaboration.isHost ? 'Collaboration closed' : 'Left collaborative workspace',
    )
  }

  const doKickParticipant = (id: string, name: string) => {
    try {
      if (!kickCollaborator(id)) {
        pushToast('error', 'Unable to remove this participant')
        return
      }
      pushToast('success', `${name} removed from workspace`)
    } catch {
      pushToast('error', 'Unable to remove this participant')
    }
  }

  const doApproveRequest = (id: string, name: string) => {
    if (!approveCollaborator(id)) {
      pushToast('error', 'Unable to approve this join request')
      return
    }
    pushToast('success', `${name} can now edit the workspace`)
  }

  const doRejectRequest = (id: string, name: string) => {
    if (!rejectCollaborator(id)) {
      pushToast('error', 'Unable to reject this join request')
      return
    }
    pushToast('success', `${name} was denied access`)
  }

  const modalTextColor = theme === 'dark' ? '#f5f3ee' : '#1a1a18'
  const modalSubtleColor = theme === 'dark' ? '#b8b3aa' : '#888780'
  const formatHistoryTime = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
  }

  return (
    <>
      <div className={topbarStyle}>
        <div className={brandStyle} aria-label="Thot Editor">
          <img src="/thot_dark_icon_transparency.svg" alt="Thot Editor" />
        </div>
        <div className={sepStyle} />
        <div style={{ position: 'relative' }} ref={editRef}>
          <button
            className={btnStyle}
            onClick={() => {
              setEditOpen((o) => !o)
              setMoreOpen(false)
            }}
          >
            <IconEdit /> Edit <IconChevron />
          </button>
          {editOpen && (
            <div className={menuStyle}>
              <div className={menuItemStyle} onClick={doAddBox}>
                <IconBox /> Add box
              </div>
              <div className={menuItemStyle} onClick={doAddText}>
                <IconText /> Add text
              </div>
              <div className={menuSepStyle} />
              <div
                className={
                  menuItemStyle +
                  ' ' +
                  (interactionMode === 'select'
                    ? css({
                        background: '#f5f3ee',
                        '[data-theme=dark] &': { background: '#3d3d3a' },
                      })
                    : '')
                }
                onClick={() => {
                  setInteractionMode('select')
                  setEditOpen(false)
                }}
              >
                <IconCursor /> Select mode {interactionMode === 'select' ? '•' : ''}
              </div>
              <div
                className={
                  menuItemStyle +
                  ' ' +
                  (interactionMode === 'move'
                    ? css({
                        background: '#f5f3ee',
                        '[data-theme=dark] &': { background: '#3d3d3a' },
                      })
                    : '')
                }
                onClick={() => {
                  setInteractionMode('move')
                  setEditOpen(false)
                }}
              >
                <IconHand /> Move mode {interactionMode === 'move' ? '•' : ''}
              </div>
              <div className={menuSepStyle} />
              <div
                className={menuItemStyle + ' ' + css({ color: '#c0392b !important' })}
                onClick={doClearAll}
              >
                <IconTrash /> Clear all
              </div>
            </div>
          )}
        </div>
        <div className={sepStyle} />
        <button
          className={btnStyle}
          onClick={() => undo()}
          disabled={historyPast.length === 0}
          style={{ opacity: historyPast.length === 0 ? 0.45 : 1 }}
        >
          <IconUndo /> Undo
        </button>
        <div className={sepStyle} />
        <button className={btnStyle} onClick={() => updateZoom(-0.1)}>
          <IconMinus />
        </button>
        <button className={btnStyle} onClick={() => setZoom(1)}>
          {Math.round(zoom * 100)}%
        </button>
        <button className={btnStyle} onClick={() => updateZoom(0.1)}>
          <IconPlus />
        </button>
        <div className={sepStyle} />
        <div style={{ position: 'relative' }} ref={moreRef}>
          <button
            className={btnStyle}
            onClick={() => {
              setMoreOpen((o) => !o)
              setEditOpen(false)
            }}
          >
            <IconMore />
          </button>
          {moreOpen && (
            <div
              className={
                menuStyle +
                ' ' +
                css({
                  right: 0,
                  left: 'auto',
                  minWidth: '260px',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                })
              }
            >
              <div className={sectionTitleStyle}>Workspace</div>
              <div
                className={menuItemStyle}
                onClick={() => {
                  setTheme('light')
                  setMoreOpen(false)
                }}
              >
                <IconSun /> Light theme {theme === 'light' ? '•' : ''}
              </div>
              <div
                className={menuItemStyle}
                onClick={() => {
                  setTheme('dark')
                  setMoreOpen(false)
                }}
              >
                <IconMoon /> Dark theme {theme === 'dark' ? '•' : ''}
              </div>
              <div
                className={menuItemStyle}
                onClick={() => {
                  setLayoutMode('free')
                  setMoreOpen(false)
                }}
              >
                <IconHand /> Free mode {layoutMode === 'free' ? '•' : ''}
              </div>
              <div
                className={menuItemStyle}
                onClick={() => {
                  setLayoutMode('static')
                  setMoreOpen(false)
                }}
              >
                <IconGrid /> Static mode {layoutMode === 'static' ? '•' : ''}
              </div>
              <div className={menuSepStyle} />
              <div className={sectionTitleStyle}>Import / Export</div>
              <div className={menuItemStyle} onClick={doImportClick}>
                <IconImport /> Import from JSON
              </div>
              <div
                className={menuItemStyle}
                onClick={() => {
                  void doSavePng()
                }}
              >
                <IconExport /> Save as PNG
              </div>
              <div
                className={menuItemStyle}
                onClick={() => {
                  void doSaveSvg()
                }}
              >
                <IconExport /> Save as SVG
              </div>
              <div className={menuItemStyle} onClick={doExportJson}>
                <IconExport /> Export to JSON
              </div>
              <div className={menuSepStyle} />
              <div className={sectionTitleStyle}>Collaboration</div>
              <div className={menuItemStyle} onClick={doOpenCollaboration}>
                <IconUsers /> Collaboration
              </div>
              <div className={menuSepStyle} />
              <div className={sectionTitleStyle}>History</div>
              <div
                className={menuItemStyle}
                onClick={() => {
                  setHistoryOpen(true)
                  setMoreOpen(false)
                }}
              >
                <IconHistory /> See history
              </div>
            </div>
          )}
        </div>
      </div>
      {importOpen && (
        <div
          className={css({
            position: 'fixed',
            inset: 0,
            background: 'rgba(18,18,16,0.36)',
            backdropFilter: 'blur(8px)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          })}
          onClick={() => setImportOpen(false)}
        >
          <div
            className={css({
              width: 'min(720px, 100%)',
              borderRadius: '22px',
              background: '#fff',
              border: '0.5px solid rgba(0,0,0,0.1)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.18)',
              padding: '18px',
              '[data-theme=dark] &': {
                background: '#2c2c2a',
                borderColor: 'rgba(255,255,255,0.08)',
              },
            })}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: modalTextColor, marginBottom: 6 }}>
              Import from JSON
            </div>
            <div
              style={{ fontSize: 13, lineHeight: 1.6, color: modalSubtleColor, marginBottom: 14 }}
            >
              Paste a Thot workspace JSON payload to replace the current graph.
            </div>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{\n  "nodes": {},\n  "texts": {},\n  "edges": []\n}'
              className={css({
                width: '100%',
                minHeight: '320px',
                resize: 'vertical',
                borderRadius: '16px',
                border: '0.5px solid rgba(0,0,0,0.12)',
                background: '#f8f6f2',
                color: '#1a1a18',
                padding: '14px 16px',
                fontSize: '13px',
                lineHeight: '1.6',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                outline: 'none',
                '[data-theme=dark] &': {
                  background: '#1f1f1d',
                  color: '#f5f3ee',
                  borderColor: 'rgba(255,255,255,0.08)',
                },
              })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button className={btnStyle} onClick={() => setImportOpen(false)}>
                Cancel
              </button>
              <button
                className={
                  btnStyle +
                  ' ' +
                  css({
                    background: '#1a1a18 !important',
                    color: '#f5f3ee !important',
                    '[data-theme=dark] &': {
                      background: '#f5f3ee !important',
                      color: '#1a1a18 !important',
                    },
                  })
                }
                onClick={doImportJson}
              >
                Import JSON
              </button>
            </div>
          </div>
        </div>
      )}
      {collabOpen && (
        <div
          className={css({
            position: 'fixed',
            inset: 0,
            background: 'rgba(18,18,16,0.36)',
            backdropFilter: 'blur(8px)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          })}
          onClick={() => setCollabOpen(false)}
        >
          <div
            className={css({
              width: 'min(720px, 100%)',
              borderRadius: '22px',
              background: '#fff',
              border: '0.5px solid rgba(0,0,0,0.1)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.18)',
              padding: '18px',
              '[data-theme=dark] &': {
                background: '#2c2c2a',
                borderColor: 'rgba(255,255,255,0.08)',
              },
            })}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: modalTextColor, marginBottom: 6 }}>
              Collaboration
            </div>
            <div
              style={{ fontSize: 13, lineHeight: 1.6, color: modalSubtleColor, marginBottom: 14 }}
            >
              Open this workspace to collaborators with a magic link. Live edits stay synced, and
              the host keeps the local saved workspace.
            </div>

            {!collaboration.active ? (
              <div
                className={css({
                  borderRadius: '18px',
                  border: '0.5px solid rgba(0,0,0,0.1)',
                  padding: '16px',
                  background: '#f8f6f2',
                  '[data-theme=dark] &': {
                    background: '#1f1f1d',
                    borderColor: 'rgba(255,255,255,0.08)',
                  },
                })}
              >
                <div
                  style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: modalTextColor }}
                >
                  Start a shared session
                </div>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: modalSubtleColor,
                    marginBottom: 12,
                  }}
                >
                  Guests can edit the board, and you can track live cursors, remove participants, or
                  close the room at any moment.
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: modalSubtleColor,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Collaboration server URL
                  </div>
                  <input
                    value={collabServerUrl}
                    onChange={(e) => setCollabServerUrl(e.target.value)}
                    placeholder="ws://127.0.0.1:1235"
                    className={css({
                      width: '100%',
                      height: '38px',
                      borderRadius: '12px',
                      border: '0.5px solid rgba(0,0,0,0.12)',
                      background: '#fff',
                      color: '#1a1a18',
                      padding: '0 12px',
                      fontSize: '12px',
                      outline: 'none',
                      '[data-theme=dark] &': {
                        background: '#141412',
                        color: '#f5f3ee',
                        borderColor: 'rgba(255,255,255,0.08)',
                      },
                    })}
                  />
                  <div
                    style={{ fontSize: 11, color: modalSubtleColor, marginTop: 6, lineHeight: 1.5 }}
                  >
                    Leave empty to use the default server for the current host. Set this to your own
                    Node websocket server if you want a dedicated collaboration backend.
                  </div>
                </div>
                <button
                  className={
                    btnStyle +
                    ' ' +
                    css({
                      background: '#1a1a18 !important',
                      color: '#f5f3ee !important',
                      '[data-theme=dark] &': {
                        background: '#f5f3ee !important',
                        color: '#1a1a18 !important',
                      },
                    })
                  }
                  onClick={() => {
                    void doStartCollaboration()
                  }}
                >
                  <IconUsers /> Open collaboration
                </button>
              </div>
            ) : (
              <>
                <div
                  className={css({
                    borderRadius: '18px',
                    border: '0.5px solid rgba(0,0,0,0.1)',
                    padding: '16px',
                    background: '#f8f6f2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    '[data-theme=dark] &': {
                      background: '#1f1f1d',
                      borderColor: 'rgba(255,255,255,0.08)',
                    },
                  })}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 16,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          marginBottom: 4,
                          color: modalTextColor,
                        }}
                      >
                        {collaboration.isHost
                          ? 'Hosted collaborative workspace'
                          : 'Shared collaborative workspace'}
                      </div>
                      <div style={{ fontSize: 12, color: modalSubtleColor, lineHeight: 1.6 }}>
                        Room{' '}
                        <span
                          style={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          }}
                        >
                          {collaboration.roomId}
                        </span>
                      </div>
                      {collaboration.serverUrl && (
                        <div style={{ fontSize: 12, color: modalSubtleColor, lineHeight: 1.6 }}>
                          Server{' '}
                          <span
                            style={{
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            }}
                          >
                            {collaboration.serverUrl}
                          </span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: modalSubtleColor, lineHeight: 1.6 }}>
                        You are {collaboration.selfName}{' '}
                        {collaboration.isHost ? '(host)' : '(guest)'}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 999,
                        padding: '6px 10px',
                        background: 'rgba(108,108,255,0.08)',
                        color: '#6c6cff',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: collaboration.selfColor ?? '#6c6cff',
                        }}
                      />
                      Live sync enabled
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {collaboration.isHost && (
                      <button
                        className={btnStyle}
                        onClick={() => {
                          void doCopyInvite()
                        }}
                      >
                        <IconLink /> Copy invite link
                      </button>
                    )}
                    <button
                      className={
                        btnStyle +
                        ' ' +
                        css({
                          background: '#1a1a18 !important',
                          color: '#f5f3ee !important',
                          '[data-theme=dark] &': {
                            background: '#f5f3ee !important',
                            color: '#1a1a18 !important',
                          },
                        })
                      }
                      onClick={doLeaveOrCloseCollaboration}
                    >
                      {collaboration.isHost ? 'Close workspace' : 'Leave workspace'}
                    </button>
                  </div>
                </div>

                {collaboration.isHost && collaboration.pendingRequests.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: modalSubtleColor,
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      Join requests ({collaboration.pendingRequests.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {collaboration.pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className={css({
                            borderRadius: '16px',
                            border: '0.5px solid rgba(0,0,0,0.08)',
                            background: '#f8f6f2',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '14px',
                            '[data-theme=dark] &': {
                              background: '#1f1f1d',
                              borderColor: 'rgba(255,255,255,0.08)',
                            },
                          })}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: request.color,
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: modalTextColor }}>
                                {request.name}
                              </div>
                              <div style={{ fontSize: 11, color: modalSubtleColor }}>
                                Waiting for host approval
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className={btnStyle}
                              onClick={() => doApproveRequest(request.id, request.name)}
                            >
                              <IconCheck /> Accept
                            </button>
                            <button
                              className={btnStyle}
                              onClick={() => doRejectRequest(request.id, request.name)}
                            >
                              <IconUserMinus /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!collaboration.isHost && collaboration.awaitingApproval && (
                  <div
                    className={css({
                      marginTop: '16px',
                      borderRadius: '16px',
                      border: '0.5px solid rgba(0,0,0,0.08)',
                      background: '#f8f6f2',
                      padding: '14px 16px',
                      '[data-theme=dark] &': {
                        background: '#1f1f1d',
                        borderColor: 'rgba(255,255,255,0.08)',
                      },
                    })}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: modalTextColor,
                        marginBottom: 4,
                      }}
                    >
                      Waiting for host approval
                    </div>
                    <div style={{ fontSize: 12, color: modalSubtleColor, lineHeight: 1.6 }}>
                      The host needs to accept your request before you can see and edit the shared
                      workspace.
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: modalSubtleColor,
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    Participants ({collaboration.participants.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {collaboration.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className={css({
                          borderRadius: '16px',
                          border: '0.5px solid rgba(0,0,0,0.08)',
                          background: '#f8f6f2',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '14px',
                          '[data-theme=dark] &': {
                            background: '#1f1f1d',
                            borderColor: 'rgba(255,255,255,0.08)',
                          },
                        })}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: participant.color,
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                color: modalTextColor,
                              }}
                            >
                              {participant.name}
                              {participant.isHost && (
                                <span style={{ fontSize: 10, color: modalSubtleColor }}>HOST</span>
                              )}
                              {participant.self && (
                                <span style={{ fontSize: 10, color: modalSubtleColor }}>YOU</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: modalSubtleColor }}>
                              {participant.pointer ? 'Cursor active on workspace' : 'Idle'}
                            </div>
                          </div>
                        </div>
                        {collaboration.isHost && !participant.self && (
                          <button
                            className={btnStyle}
                            onClick={() => doKickParticipant(participant.id, participant.name)}
                          >
                            <IconUserMinus /> Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className={btnStyle} onClick={() => setCollabOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {historyOpen && (
        <div
          className={css({
            position: 'fixed',
            inset: 0,
            background: 'rgba(18,18,16,0.36)',
            backdropFilter: 'blur(8px)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          })}
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className={css({
              width: 'min(760px, 100%)',
              maxHeight: '80vh',
              overflow: 'hidden',
              borderRadius: '22px',
              background: '#fff',
              border: '0.5px solid rgba(0,0,0,0.1)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.18)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              '[data-theme=dark] &': {
                background: '#2c2c2a',
                borderColor: 'rgba(255,255,255,0.08)',
              },
            })}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: modalTextColor, marginBottom: 6 }}>
              History
            </div>
            <div
              style={{ fontSize: 13, lineHeight: 1.6, color: modalSubtleColor, marginBottom: 14 }}
            >
              Full workspace operation history with time and actor.
            </div>
            <div
              style={{
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingRight: 4,
              }}
            >
              {actionHistory.length === 0 ? (
                <div style={{ fontSize: 13, color: modalSubtleColor, padding: '4px 2px 12px' }}>
                  No actions yet.
                </div>
              ) : (
                [...actionHistory].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className={css({
                      borderRadius: '16px',
                      border: '0.5px solid rgba(0,0,0,0.08)',
                      background: '#f8f6f2',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '14px',
                      '[data-theme=dark] &': {
                        background: '#1f1f1d',
                        borderColor: 'rgba(255,255,255,0.08)',
                      },
                    })}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: modalTextColor }}>
                        {entry.label}
                      </div>
                      <div style={{ fontSize: 11, color: modalSubtleColor, marginTop: 4 }}>
                        {entry.actor}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: modalSubtleColor, whiteSpace: 'nowrap' }}>
                      {formatHistoryTime(entry.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className={btnStyle} onClick={() => setHistoryOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Topbar
