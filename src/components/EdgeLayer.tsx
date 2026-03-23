import { useState } from 'react'
import { useDiagram } from '../store/diagramStore'
import type { PortSide } from '../types'

type TooltipState = { x: number; y: number; label: string; desc: string } | null
type EdgeEndpoints = { sx: number; sy: number; ex: number; ey: number }
export default function EdgeLayer({ canvasRef }: { canvasRef: React.RefObject<HTMLDivElement | null> }) {
  const { edges, nodes, selEdge, selectEdge, cmode, csrc, csrcSide, pointer, viewport, zoom } = useDiagram()
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const screenToWorld = (x: number, y: number) => ({
    x: x / zoom + viewport.x,
    y: y / zoom + viewport.y,
  })

  const getPortPoint = (id: string, side: PortSide) => {
    const el = document.getElementById(`port-${id}-${side}`)
    const cw = canvasRef.current
    if (!el || !cw) return null
    const r = el.getBoundingClientRect()
    const wr = cw.getBoundingClientRect()
    return screenToWorld(
      r.left - wr.left + r.width / 2,
      r.top - wr.top + r.height / 2,
    )
  }

  const edgePts = (fid: string, tid: string, fromSide?: PortSide, toSide?: PortSide): EdgeEndpoints | null => {
    if (fromSide && toSide) {
      const s = getPortPoint(fid, fromSide)
      const e = getPortPoint(tid, toSide)
      if (!s || !e) return null
      return { sx: s.x, sy: s.y, ex: e.x, ey: e.y }
    }
    const aEl = document.getElementById('nd-' + fid)
    const bEl = document.getElementById('nd-' + tid)
    const cw = canvasRef.current
    if (!aEl || !bEl || !cw) return null
    const wr = cw.getBoundingClientRect()
    const ar = aEl.getBoundingClientRect()
    const br = bEl.getBoundingClientRect()
    const aTopLeft = screenToWorld(ar.left - wr.left, ar.top - wr.top)
    const bTopLeft = screenToWorld(br.left - wr.left, br.top - wr.top)
    const a = {
      x: aTopLeft.x,
      y: aTopLeft.y,
      w: ar.width / zoom,
      h: ar.height / zoom,
      cx: aTopLeft.x + ar.width / (2 * zoom),
      cy: aTopLeft.y + ar.height / (2 * zoom),
    }
    const b = {
      x: bTopLeft.x,
      y: bTopLeft.y,
      w: br.width / zoom,
      h: br.height / zoom,
      cx: bTopLeft.x + br.width / (2 * zoom),
      cy: bTopLeft.y + br.height / (2 * zoom),
    }
    const dx = b.cx - a.cx, dy = b.cy - a.cy
    const m = Math.abs(dy / (dx || 0.001)), mb = a.h / (a.w || 1)
    let sx, sy, ex, ey
    if (m < mb) {
      sx = a.cx + (dx > 0 ? a.w / 2 : -a.w / 2)
      sy = a.cy + dy * (a.w / 2) / (Math.abs(dx) || 1)
      ex = b.cx + (dx > 0 ? -b.w / 2 : b.w / 2)
      ey = b.cy - dy * (b.w / 2) / (Math.abs(dx) || 1)
    } else {
      sy = a.cy + (dy > 0 ? a.h / 2 : -a.h / 2)
      sx = a.cx + dx * (a.h / 2) / (Math.abs(dy) || 1)
      ey = b.cy + (dy > 0 ? -b.h / 2 : b.h / 2)
      ex = b.cx - dx * (b.h / 2) / (Math.abs(dy) || 1)
    }
    return { sx, sy, ex, ey }
  }

  const edgeShape = (pts: EdgeEndpoints, route: 'straight' | 'curve' | 'angle', bend: number) => {
    if (route === 'curve') {
      const mx = (pts.sx + pts.ex) / 2
      const my = (pts.sy + pts.ey) / 2
      const dx = pts.ex - pts.sx
      const dy = pts.ey - pts.sy
      const len = Math.hypot(dx, dy) || 1
      const nx = -dy / len
      const ny = dx / len
      const cx = mx + nx * bend
      const cy = my + ny * bend
      return {
        path: `M ${pts.sx} ${pts.sy} Q ${cx} ${cy} ${pts.ex} ${pts.ey}`,
        labelX: 0.25 * pts.sx + 0.5 * cx + 0.25 * pts.ex,
        labelY: 0.25 * pts.sy + 0.5 * cy + 0.25 * pts.ey,
      }
    }

    if (route === 'angle') {
      const dx = pts.ex - pts.sx
      const dy = pts.ey - pts.sy
      if (Math.abs(dx) >= Math.abs(dy)) {
        const midX = (pts.sx + pts.ex) / 2 + bend
        return {
          path: `M ${pts.sx} ${pts.sy} L ${midX} ${pts.sy} L ${midX} ${pts.ey} L ${pts.ex} ${pts.ey}`,
          labelX: midX,
          labelY: (pts.sy + pts.ey) / 2,
        }
      }
      const midY = (pts.sy + pts.ey) / 2 + bend
      return {
        path: `M ${pts.sx} ${pts.sy} L ${pts.sx} ${midY} L ${pts.ex} ${midY} L ${pts.ex} ${pts.ey}`,
        labelX: (pts.sx + pts.ex) / 2,
        labelY: midY,
      }
    }

    return {
      path: `M ${pts.sx} ${pts.sy} L ${pts.ex} ${pts.ey}`,
      labelX: (pts.sx + pts.ex) / 2,
      labelY: (pts.sy + pts.ey) / 2,
    }
  }

  const bgRect = isDark ? '#2c2c2a' : '#ffffff'
  const textFill = isDark ? '#f5f3ee' : '#1a1a18'

  return (
    <>
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
      >
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
          <marker id="arr2" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M8 1L2 5L8 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
        {edges.map((edge, idx) => {
          if (!nodes[edge.from] || !nodes[edge.to]) return null
          const p = edgePts(edge.from, edge.to, edge.fromSide, edge.toSide)
          if (!p) return null
          const shape = edgeShape(p, edge.route ?? 'straight', edge.bend ?? 0)
          const isSel = idx === selEdge
          const c = isSel ? '#6c6cff' : (edge.color || '#888780')
          const dash = edge.style === 'dashed' ? '8 5' : edge.style === 'dotted' ? '2 4' : undefined
          const lw = edge.label ? edge.label.length * 6.5 + 14 : 0

          return (
            <g key={idx} className="eg">
              {isSel && (
                <path d={shape.path}
                  stroke="#6c6cff" strokeWidth="8" strokeOpacity="0.25" fill="none" />
              )}
              <path d={shape.path}
                stroke={c} strokeWidth={isSel ? 2.5 : 1.5} fill="none"
                strokeDasharray={dash}
                markerEnd={edge.arrow !== 'none' ? 'url(#arr)' : undefined}
                markerStart={edge.arrow === 'both' ? 'url(#arr2)' : undefined}
              />
              {/* Invisible hit area */}
              <path d={shape.path}
                stroke="transparent" strokeWidth="16"
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                onClick={(e) => { e.stopPropagation(); selectEdge(idx) }}
                onMouseEnter={() => {
                  if (edge.desc) setTooltip({ x: shape.labelX, y: shape.labelY, label: edge.label, desc: edge.desc })
                }}
                onMouseLeave={() => setTooltip(null)}
                onMouseMove={(e) => {
                  if (edge.desc) {
                    const cw = canvasRef.current
                    if (!cw) return
                    const wr = cw.getBoundingClientRect()
                    setTooltip({ x: e.clientX - wr.left + 12, y: e.clientY - wr.top - 34, label: edge.label, desc: edge.desc })
                  }
                }}
              />
              {edge.label && (
                <>
                  <rect x={shape.labelX - lw / 2} y={shape.labelY - 10} width={lw} height={16} rx={4}
                    fill={bgRect} stroke={isSel ? '#6c6cff' : c} strokeWidth="0.5" />
                  <text x={shape.labelX} y={shape.labelY + 2} textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: 11, fill: textFill, fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' }}>
                    {edge.label}
                  </text>
                </>
              )}
            </g>
          )
        })}
        {cmode && csrc && csrcSide && pointer && (() => {
          const src = getPortPoint(csrc, csrcSide)
          if (!src) return null
          const preview = edgeShape({ sx: src.x, sy: src.y, ex: pointer.x, ey: pointer.y }, 'straight', 0)
          return (
            <path
              d={preview.path}
              stroke="#6c6cff"
              strokeWidth="2"
              strokeDasharray="6 4"
              fill="none"
              opacity="0.9"
              markerEnd="url(#arr)"
            />
          )
        })()}
      </svg>

      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y,
          background: isDark ? '#2c2c2a' : '#fff',
          border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
          borderRadius: 8,
          padding: '7px 10px',
          fontSize: 11,
          maxWidth: 200,
          pointerEvents: 'none',
          boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
          zIndex: 100,
          color: isDark ? '#f5f3ee' : '#1a1a18',
        }}>
          <strong style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>{tooltip.label || 'Link'}</strong>
          <span style={{ color: '#888780', fontSize: 11 }}>{tooltip.desc}</span>
        </div>
      )}
    </>
  )
}
