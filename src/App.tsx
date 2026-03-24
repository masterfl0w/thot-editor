import { useEffect, useRef, useState } from 'react'
import type { FunctionComponent } from 'react'
import { css } from '../styled-system/css'
import Topbar from './components/Topbar'
import PropertiesPanel from './components/PropertiesPanel'
import Canvas from './components/Canvas'
import ContextMenu from './components/ContextMenu'
import LandingPage from './components/LandingPage'
import { useDiagram } from './store/diagramStore'
import { ensureCollaborationFromUrl } from './utils/collaboration'

const ToastViewport: FunctionComponent = () => {
  const { toasts, removeToast } = useDiagram()
  if (toasts.length === 0) return null

  return (
    <div
      className={css({
        position: 'fixed',
        right: '18px',
        bottom: '18px',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
      })}
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={css({
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: '16px',
            padding: '12px 14px',
            boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
            backdropFilter: 'blur(16px)',
            background: toast.kind === 'success' ? 'rgba(25,107,68,0.92)' : 'rgba(158,49,49,0.94)',
            color: '#f5f3ee',
            fontSize: '13px',
            lineHeight: '1.45',
            fontWeight: '600',
          })}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}

const DemoTopbar: FunctionComponent = () => {
  return (
    <div
      className={css({
        position: 'absolute',
        top: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 20px',
        borderRadius: '12px',
        background: 'rgba(44,44,42,0.84)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
        backdropFilter: 'blur(16px)',
        color: '#f5f3ee',
      })}
    >
      <img
        src="/thot_dark_icon_transparency.svg"
        alt="Thot Editor"
        style={{ height: 15, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
      />
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
      <span style={{ fontSize: 11, color: 'rgba(245,243,238,0.66)', whiteSpace: 'nowrap' }}>
        Drag nodes to explore the live demo
      </span>
    </div>
  )
}

const CollaborationPill: FunctionComponent = () => {
  const { collaboration, theme } = useDiagram()
  if (!collaboration.active) return null

  const label = collaboration.awaitingApproval
    ? 'Collaboration · waiting approval'
    : collaboration.isHost
      ? 'Live collaboration'
      : 'Collaboration joined'

  return (
    <div
      className={css({
        position: 'absolute',
        top: '18px',
        right: '18px',
        zIndex: 320,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '38px',
        padding: '0 14px',
        borderRadius: '999px',
        background: 'rgba(255,255,255,0.9)',
        border: '0.5px solid rgba(0,0,0,0.08)',
        boxShadow: '0 18px 40px rgba(25,25,20,0.12)',
        backdropFilter: 'blur(18px)',
        color: '#1a1a18',
        '[data-theme=dark] &': {
          background: 'rgba(44,44,42,0.88)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 20px 44px rgba(0,0,0,0.28)',
          color: '#f5f3ee',
        },
      })}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: collaboration.awaitingApproval
            ? '#f2df8f'
            : collaboration.selfColor ?? '#98dbc6',
          boxShadow:
            theme === 'dark' ? '0 0 0 4px rgba(255,255,255,0.06)' : '0 0 0 4px rgba(0,0,0,0.05)',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

type EditorWorkspaceProps = { miniDemo?: boolean }

const EditorWorkspace: FunctionComponent<EditorWorkspaceProps> = ({ miniDemo = false }) => {
  const {
    deselectAll,
    cancelConnect,
    deleteMultiSel,
    deleteNode,
    deleteText,
    deleteEdge,
    addBox,
    addText,
    selectNode,
    selectText,
    startEditText,
    undo,
    copySelectionToClipboard,
    pasteClipboard,
    moveNode,
    moveText,
    nodes,
    texts,
    layoutMode,
    viewport,
    pointer,
    zoom,
    selNode,
    selText,
    selEdge,
    multiSel,
    cmode,
    editingTextId,
    finishEditText,
  } = useDiagram()
  const demoSeeded = useRef(false)

  useEffect(() => {
    if (!miniDemo || demoSeeded.current) return
    demoSeeded.current = true
    useDiagram.setState({
      nodes: {
        n1: {
          id: 'n1',
          title: 'Frontend',
          desc: 'Tauri WebView\nCode editor\nChat panel',
          bg: '#e8e6ff',
          fg: '#1a1a18',
          shape: 'rect',
          family: 'inherit',
          size: 13,
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          radius: 10,
          x: 96,
          y: 132,
          parent: null,
          children: [],
        },
        n2: {
          id: 'n2',
          title: 'Rust backend',
          desc: 'LLM proxy\nFilesystem\nContext builder',
          bg: '#ffd7b8',
          fg: '#1a1a18',
          shape: 'rect',
          family: 'inherit',
          size: 13,
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          radius: 10,
          x: 420,
          y: 248,
          parent: null,
          children: [],
        },
      },
      edges: [
        {
          from: 'n1',
          to: 'n2',
          fromSide: 'pr',
          toSide: 'pl',
          label: '',
          desc: '',
          color: '#cbc7bf',
          style: 'solid',
          arrow: 'end',
          route: 'curve',
          bend: 24,
        },
      ],
      theme: 'dark',
      layoutMode: 'static',
      viewport: { x: 0, y: 0 },
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
      ctxTarget: null,
      historyPast: [],
      historyFuture: [],
      actionHistory: [],
      sceneClipboard: null,
      pointer: null,
      modeText: 'Demo mode',
      nc: 2,
      tc: 1,
    })
  }, [miniDemo])

  useEffect(() => {
    const getFallbackPoint = () => {
      const canvas = document.querySelector('[data-canvas-root="true"]') as HTMLDivElement | null
      if (!canvas) return { x: viewport.x + 160, y: viewport.y + 120 }
      const rect = canvas.getBoundingClientRect()
      return {
        x: viewport.x + rect.width / (2 * zoom),
        y: viewport.y + rect.height / (2 * zoom),
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (editingTextId) {
        if (e.key === 'Escape') {
          e.preventDefault()
          finishEditText(editingTextId)
        }
        return
      }
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        const key = e.key.toLowerCase()
        if (key === 'c') {
          if (multiSel.size > 0 || selNode || selText) {
            e.preventDefault()
            copySelectionToClipboard()
          }
          return
        }
        if (key === 'v') {
          e.preventDefault()
          pasteClipboard(pointer ?? getFallbackPoint())
          return
        }
        if (key === 'z') {
          e.preventDefault()
          undo()
          return
        }
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (
        layoutMode === 'static' &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        const step = 24
        const delta =
          e.key === 'ArrowUp'
            ? { x: 0, y: -step }
            : e.key === 'ArrowDown'
              ? { x: 0, y: step }
              : e.key === 'ArrowLeft'
                ? { x: -step, y: 0 }
                : { x: step, y: 0 }

        const selection =
          multiSel.size > 0 ? [...multiSel] : selNode ? [selNode] : selText ? [selText] : []

        if (selection.length > 0) {
          e.preventDefault()
          selection.forEach((id) => {
            if (nodes[id]) moveNode(id, nodes[id].x + delta.x, nodes[id].y + delta.y)
            else if (texts[id]) moveText(id, texts[id].x + delta.x, texts[id].y + delta.y)
          })
          return
        }
      }
      if (e.key === 'Escape') {
        if (cmode) cancelConnect()
        else deselectAll()
      }
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault()
        const point = pointer ?? getFallbackPoint()
        const id = addBox({ x: point.x - 60, y: point.y - 28 })
        selectNode(id)
        return
      }
      if (e.key.toLowerCase() === 't') {
        e.preventDefault()
        const point = pointer ?? getFallbackPoint()
        const id = addText({ x: point.x - 24, y: point.y - 12 })
        selectText(id)
        setTimeout(() => startEditText(id), 50)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (multiSel.size > 0) deleteMultiSel()
        else if (selNode) deleteNode(selNode)
        else if (selText) deleteText(selText)
        else if (selEdge !== null) deleteEdge(selEdge)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [
    editingTextId,
    cmode,
    selNode,
    selText,
    selEdge,
    multiSel,
    layoutMode,
    nodes,
    texts,
    viewport.x,
    viewport.y,
    pointer,
    zoom,
    copySelectionToClipboard,
    pasteClipboard,
    moveNode,
    moveText,
    undo,
    deselectAll,
    cancelConnect,
    deleteMultiSel,
    deleteNode,
    deleteText,
    deleteEdge,
    addBox,
    addText,
    selectNode,
    selectText,
    startEditText,
    finishEditText,
  ])

  return (
    <div
      className={css({
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        background: 'linear-gradient(180deg, #ece8e0 0%, #e7e1d7 100%)',
        '[data-theme=dark] &': {
          background: 'linear-gradient(180deg, #171715 0%, #121210 100%)',
        },
      })}
    >
      {miniDemo ? <DemoTopbar /> : <Topbar />}
      {!miniDemo && <CollaborationPill />}
      <div className={css({ position: 'absolute', inset: 0 })}>
        <Canvas />
      </div>
      {!miniDemo && <PropertiesPanel />}
      <ContextMenu />
      <ToastViewport />
    </div>
  )
}

const App: FunctionComponent = () => {
  const { theme } = useDiagram()
  const [screen, setScreen] = useState<'landing' | 'editor' | 'demo'>(() =>
    window.location.hash === '#editor' ||
    !!new URLSearchParams(window.location.search).get('collab')
      ? 'editor'
      : window.location.hash === '#demo'
        ? 'demo'
        : 'landing',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    document.body.style.overflow = screen === 'landing' ? 'auto' : 'hidden'
    return () => {
      document.body.style.overflow = 'hidden'
    }
  }, [screen])

  useEffect(() => {
    const syncFromHash = () => {
      setScreen(
        window.location.hash === '#editor' ||
          !!new URLSearchParams(window.location.search).get('collab')
          ? 'editor'
          : window.location.hash === '#demo'
            ? 'demo'
            : 'landing',
      )
    }
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  useEffect(() => {
    if (screen === 'demo') return
    if (ensureCollaborationFromUrl()) {
      setScreen('editor')
    }
  }, [screen])

  const enterEditor = () => {
    window.location.hash = 'editor'
    setScreen('editor')
  }

  if (screen === 'landing') {
    return <LandingPage onEnterEditor={enterEditor} />
  }

  if (screen === 'demo') {
    return <EditorWorkspace miniDemo />
  }

  return <EditorWorkspace />
}

export default App
