import { useRef, useEffect, useState, useCallback } from 'react'
import { useDiagram } from '../store/diagramStore'
import DiagramNode from './DiagramNode'
import TextNode from './TextNode'
import EdgeLayer from './EdgeLayer'

function useGrid(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  gridRef: React.RefObject<HTMLCanvasElement | null>,
  viewport: { x: number; y: number },
  zoom: number,
  theme: 'light' | 'dark',
) {
  const draw = useCallback(() => {
    const gc = gridRef.current?.getContext('2d')
    const cw = canvasRef.current
    if (!gc || !cw) return
    const W = cw.offsetWidth, H = cw.offsetHeight
    gridRef.current!.width = W
    gridRef.current!.height = H
    gc.clearRect(0, 0, W, H)
    const step = 24 * zoom
    const isDark = theme === 'dark'
    gc.fillStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    const startX = ((-(viewport.x * zoom) % step) + step) % step
    const startY = ((-(viewport.y * zoom) % step) + step) % step
    for (let x = startX; x < W; x += step)
      for (let y = startY; y < H; y += step) {
        gc.beginPath(); gc.arc(x, y, 1, 0, Math.PI * 2); gc.fill()
      }
  }, [canvasRef, gridRef, viewport.x, viewport.y, zoom, theme])

  useEffect(() => {
    draw()
    window.addEventListener('resize', draw)
    return () => {
      window.removeEventListener('resize', draw)
    }
  }, [draw])
}

export default function Canvas() {
  const {
    nodes,
    texts,
    viewport,
    zoom,
    interactionMode,
    cmode,
    cancelConnect,
    editingTextId,
    finishEditText,
    setCtxTarget,
    setMultiSel,
    clearMultiSel,
    deselectAll,
    setPointer,
    setViewport,
    setZoom,
    theme,
    collaboration,
  } = useDiagram()

  const cwRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLCanvasElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  useGrid(cwRef, gridRef, viewport, zoom, theme)

  // Lasso
  const lassoRef = useRef({ active: false, x0: 0, y0: 0 })
  const [lassoRect, setLassoRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const panRef = useRef({ active: false, startX: 0, startY: 0, vx: 0, vy: 0, moved: false })

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isCanvas =
      target === cwRef.current ||
      target === gridRef.current ||
      !!target.closest('#esvg-root') ||
      !!target.closest('[data-workspace="true"]')
    if (!isCanvas) return
    if (cmode) { cancelConnect(); return }
    if (editingTextId) { finishEditText(editingTextId); return }

    const wr = cwRef.current!.getBoundingClientRect()
    const x0 = e.clientX - wr.left, y0 = e.clientY - wr.top
    if (interactionMode === 'select') {
      lassoRef.current = { active: true, x0, y0 }
      setLassoRect({ x: x0, y: y0, w: 0, h: 0 })
      deselectAll()
    } else {
      panRef.current = { active: true, startX: e.clientX, startY: e.clientY, vx: viewport.x, vy: viewport.y, moved: false }
      setIsPanning(true)
    }

    const onMove = (me: MouseEvent) => {
      if (lassoRef.current.active) {
        const cx = me.clientX - wr.left, cy = me.clientY - wr.top
        const x = Math.min(cx, x0), y = Math.min(cy, y0), w = Math.abs(cx - x0), h = Math.abs(cy - y0)
        setLassoRect({ x, y, w, h })
        if (w > 4 || h > 4) {
          const { nodes: allNodes, texts: allTexts } = useDiagram.getState()
          const sel = new Set<string>()
          Object.values(allNodes).forEach(n => {
            if (n.parent) return
            const el = document.getElementById('nd-' + n.id)
            if (!el) return
            const r = el.getBoundingClientRect()
            const nx = r.left - wr.left, ny = r.top - wr.top
            if (nx < x + w && nx + r.width > x && ny < y + h && ny + r.height > y) sel.add(n.id)
          })
          Object.values(allTexts).forEach(t => {
            const el = document.getElementById('tn-' + t.id)
            if (!el) return
            const r = el.getBoundingClientRect()
            const tx = r.left - wr.left, ty = r.top - wr.top
            if (tx < x + w && tx + r.width > x && ty < y + h && ty + r.height > y) sel.add(t.id)
          })
          if (sel.size > 0) setMultiSel(sel)
          else clearMultiSel()
        }
        return
      }

      if (!panRef.current.active) return
      const dx = me.clientX - panRef.current.startX
      const dy = me.clientY - panRef.current.startY
      if (!panRef.current.moved && Math.sqrt(dx * dx + dy * dy) >= 3) panRef.current.moved = true
      setViewport({ x: panRef.current.vx - dx / zoom, y: panRef.current.vy - dy / zoom })
    }

    const onUp = () => {
      if (lassoRef.current.active) lassoRef.current.active = false
      setLassoRect(null)
      if (panRef.current.active && !panRef.current.moved) deselectAll()
      panRef.current.active = false
      setIsPanning(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const onContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isCanvas =
      target === cwRef.current ||
      target === gridRef.current ||
      !!target.closest('#esvg-root') ||
      !!target.closest('[data-workspace="true"]')
    if (isCanvas) {
      e.preventDefault()
      const wr = cwRef.current!.getBoundingClientRect()
      setCtxTarget({
        type: 'canvas',
        x: e.clientX,
        y: e.clientY,
        wx: viewport.x + (e.clientX - wr.left) / zoom,
        wy: viewport.y + (e.clientY - wr.top) / zoom,
      })
    }
  }

  const onPointerMove = (e: React.MouseEvent) => {
    const wr = cwRef.current?.getBoundingClientRect()
    if (!wr) return
    setPointer({
      x: viewport.x + (e.clientX - wr.left) / zoom,
      y: viewport.y + (e.clientY - wr.top) / zoom,
    })
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!e.deltaX && !e.deltaY) return
    e.preventDefault()
    const wr = cwRef.current?.getBoundingClientRect()
    if (!wr) return
    if (e.ctrlKey || e.metaKey) {
      const px = e.clientX - wr.left
      const py = e.clientY - wr.top
      const worldX = viewport.x + px / zoom
      const worldY = viewport.y + py / zoom
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      const nextZoom = Math.max(0.4, Math.min(2.5, Number((zoom * factor).toFixed(3))))
      setZoom(nextZoom)
      setViewport({
        x: worldX - px / nextZoom,
        y: worldY - py / nextZoom,
      })
      return
    }
    setViewport({ x: viewport.x + e.deltaX / zoom, y: viewport.y + e.deltaY / zoom })
  }

  const isDark = theme === 'dark'
  const remoteParticipants = collaboration.participants.filter(participant => !participant.self && participant.pointer)

  return (
    <div
      ref={cwRef}
      data-canvas-root="true"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        touchAction: 'none',
        cursor: isPanning ? 'grabbing' : interactionMode === 'move' ? 'grab' : 'crosshair',
        background: isDark ? '#1a1a18' : '#f5f3ee',
      }}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onPointerMove}
      onMouseLeave={() => setPointer(null)}
      onContextMenu={onContextMenu}
      onWheel={onWheel}
    >
      {/* Dot grid */}
      <canvas ref={gridRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <div
        data-workspace="true"
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${-viewport.x * zoom}px, ${-viewport.y * zoom}px) scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* SVG edges */}
        <div id="esvg-root" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <EdgeLayer canvasRef={cwRef} />
        </div>

        {/* Nodes */}
        {Object.values(nodes).filter(n => !n.parent).map(n => (
          <DiagramNode key={n.id} node={n} canvasRef={cwRef} viewport={viewport} zoom={zoom} />
        ))}

        {/* Text nodes */}
        {Object.values(texts).map(t => (
          <TextNode key={t.id} text={t} canvasRef={cwRef} viewport={viewport} zoom={zoom} />
        ))}
      </div>

      {/* Lasso rect */}
      {lassoRect && lassoRect.w > 0 && (
        <div style={{
          position: 'absolute',
          left: lassoRect.x, top: lassoRect.y,
          width: lassoRect.w, height: lassoRect.h,
          border: '1.5px solid #6c6cff',
          background: 'rgba(108,108,255,0.07)',
          borderRadius: 2,
          pointerEvents: 'none',
          zIndex: 50,
        }} />
      )}

      {remoteParticipants.map(participant => {
        if (!participant.pointer) return null
        const left = (participant.pointer.x - viewport.x) * zoom
        const top = (participant.pointer.y - viewport.y) * zoom
        return (
          <div
            key={participant.id}
            style={{
              position: 'absolute',
              left,
              top,
              transform: 'translate(-2px, -2px)',
              pointerEvents: 'none',
              zIndex: 180,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: participant.color,
                border: `2px solid ${isDark ? '#121210' : '#f5f3ee'}`,
                boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
              }}
            />
            <div
              style={{
                marginTop: 6,
                marginLeft: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 9px',
                borderRadius: 999,
                background: isDark ? '#2c2c2a' : '#ffffff',
                border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                boxShadow: '0 12px 22px rgba(0,0,0,0.14)',
                color: isDark ? '#f5f3ee' : '#1a1a18',
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: participant.color,
                  flexShrink: 0,
                }}
              />
              {participant.name}
            </div>
          </div>
        )
      })}

      {/* Version bar */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        background: isDark ? '#2c2c2a' : '#fff',
        border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
        borderRadius: 20,
        padding: '4px 14px',
        fontSize: 11,
        color: isDark ? '#9c9a92' : '#5f5e5a',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        opacity: 0.85,
      }}>
        v0.3
      </div>
    </div>
  )
}
