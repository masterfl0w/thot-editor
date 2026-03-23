import { useState } from 'react'
import { useDiagram } from '../store/diagramStore'

type TooltipState = { x: number; y: number; label: string; desc: string } | null

export default function EdgeLayer({ canvasRef }: { canvasRef: React.RefObject<HTMLDivElement | null> }) {
  const { edges, nodes, selEdge, selectEdge } = useDiagram()
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const getAbsRect = (id: string) => {
    const el = document.getElementById('nd-' + id)
    const cw = canvasRef.current
    if (!el || !cw) return null
    const r = el.getBoundingClientRect()
    const wr = cw.getBoundingClientRect()
    return { x: r.left - wr.left, y: r.top - wr.top, w: r.width, h: r.height,
      cx: r.left - wr.left + r.width / 2, cy: r.top - wr.top + r.height / 2 }
  }

  const edgePts = (fid: string, tid: string) => {
    const a = getAbsRect(fid), b = getAbsRect(tid)
    if (!a || !b) return null
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
    return { sx, sy, ex, ey, mx: (sx + ex) / 2, my: (sy + ey) / 2 }
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
          const p = edgePts(edge.from, edge.to)
          if (!p) return null
          const isSel = idx === selEdge
          const c = isSel ? '#6c6cff' : (edge.color || '#888780')
          const dash = edge.style === 'dashed' ? '8 5' : edge.style === 'dotted' ? '2 4' : undefined
          const lw = edge.label ? edge.label.length * 6.5 + 14 : 0

          return (
            <g key={idx} className="eg">
              {isSel && (
                <line x1={p.sx} y1={p.sy} x2={p.ex} y2={p.ey}
                  stroke="#6c6cff" strokeWidth="8" strokeOpacity="0.25" fill="none" />
              )}
              <line x1={p.sx} y1={p.sy} x2={p.ex} y2={p.ey}
                stroke={c} strokeWidth={isSel ? 2.5 : 1.5} fill="none"
                strokeDasharray={dash}
                markerEnd={edge.arrow !== 'none' ? 'url(#arr)' : undefined}
                markerStart={edge.arrow === 'both' ? 'url(#arr2)' : undefined}
              />
              {/* Invisible hit area */}
              <line x1={p.sx} y1={p.sy} x2={p.ex} y2={p.ey}
                stroke="transparent" strokeWidth="16"
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                onClick={(e) => { e.stopPropagation(); selectEdge(idx) }}
                onMouseEnter={() => {
                  if (edge.desc) setTooltip({ x: p.mx, y: p.my, label: edge.label, desc: edge.desc })
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
                  <rect x={p.mx - lw / 2} y={p.my - 10} width={lw} height={16} rx={4}
                    fill={bgRect} stroke={isSel ? '#6c6cff' : c} strokeWidth="0.5" />
                  <text x={p.mx} y={p.my + 2} textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: 11, fill: textFill, fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' }}>
                    {edge.label}
                  </text>
                </>
              )}
            </g>
          )
        })}
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
