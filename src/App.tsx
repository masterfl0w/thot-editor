import { useEffect } from 'react'
import { css } from '../styled-system/css'
import Topbar from './components/Topbar'
import PropertiesPanel from './components/PropertiesPanel'
import Canvas from './components/Canvas'
import ContextMenu from './components/ContextMenu'
import { useDiagram } from './store/diagramStore'

export default function App() {
  const { deselectAll, cancelConnect, deleteMultiSel, deleteNode, deleteText, deleteEdge,
    selNode, selText, selEdge, multiSel, cmode, editingTextId, finishEditText } = useDiagram()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editingTextId) {
        if (e.key === 'Escape') { e.preventDefault(); finishEditText(editingTextId) }
        return
      }
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.key === 'Escape') {
        if (cmode) cancelConnect()
        else deselectAll()
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
  }, [editingTextId, cmode, selNode, selText, selEdge, multiSel])

  return (
    <div className={css({
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    })}>
      <Topbar />
      <div className={css({ display: 'flex', flex: 1, overflow: 'hidden' })}>
        <PropertiesPanel />
        <Canvas />
      </div>
      <ContextMenu />
    </div>
  )
}
