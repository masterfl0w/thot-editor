import { useEffect } from 'react'
import { css } from '../styled-system/css'
import Topbar from './components/Topbar'
import PropertiesPanel from './components/PropertiesPanel'
import Canvas from './components/Canvas'
import ContextMenu from './components/ContextMenu'
import { useDiagram } from './store/diagramStore'

export default function App() {
  const {
    theme,
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
    copySelectionToClipboard,
    pasteClipboard,
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

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
        if (e.key === 'Escape') { e.preventDefault(); finishEditText(editingTextId) }
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
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
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
  }, [editingTextId, cmode, selNode, selText, selEdge, multiSel, viewport.x, viewport.y, pointer, zoom, copySelectionToClipboard, pasteClipboard])

  return (
    <div className={css({
      position: 'relative',
      height: '100vh',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #ece8e0 0%, #e7e1d7 100%)',
      '[data-theme=dark] &': {
        background: 'linear-gradient(180deg, #171715 0%, #121210 100%)',
      },
    })}>
      <Topbar />
      <div className={css({ position: 'absolute', inset: 0 })}>
        <Canvas />
      </div>
      <PropertiesPanel />
      <ContextMenu />
    </div>
  )
}
