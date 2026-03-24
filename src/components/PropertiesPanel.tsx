import type { FunctionComponent } from 'react'
import { css } from '../../styled-system/css'
import { useDiagram, autoFg } from '../store/diagramStore'

const PASTEL_NODE_COLORS = [
  { bg: '#f4b7b2', fg: '#7b3d39' },
  { bg: '#f8c6a8', fg: '#7d4a2f' },
  { bg: '#f6dfa6', fg: '#71581d' },
  { bg: '#d7ecb3', fg: '#476327' },
  { bg: '#bde7d1', fg: '#255d49' },
  { bg: '#b9e3ea', fg: '#255767' },
  { bg: '#bfd4f6', fg: '#344f7c' },
  { bg: '#d8c6f3', fg: '#5c447f' },
  { bg: '#efc3df', fg: '#7a4262' },
  { bg: '#e3d8cd', fg: '#625346' },
]

const panelStyle = css({
  position: 'absolute',
  top: '80px',
  left: '16px',
  width: '240px',
  minWidth: '240px',
  maxHeight: 'calc(100vh - 96px)',
  background: 'rgba(255,255,255,0.88)',
  border: '0.5px solid rgba(0,0,0,0.08)',
  borderRadius: '24px',
  boxShadow: '0 18px 40px rgba(25,25,20,0.1)',
  backdropFilter: 'blur(18px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  zIndex: 280,
  '[data-theme=dark] &': {
    background: 'rgba(44,44,42,0.88)',
    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: '0 20px 44px rgba(0,0,0,0.24)',
  },
})

const headerStyle = css({
  padding: '12px 16px 8px',
  borderBottom: '0.5px solid rgba(0,0,0,0.08)',
  '[data-theme=dark] &': { borderColor: 'rgba(255,255,255,0.08)' },
})

const titleStyle = css({
  fontSize: '13px',
  fontWeight: '500',
  color: '#1a1a18',
  '[data-theme=dark] &': { color: '#f5f3ee' },
})

const subStyle = css({
  fontSize: '11px',
  color: '#888780',
  marginTop: '2px',
  '[data-theme=dark] &': { color: '#9c9a92' },
})

const bodyStyle = css({ flex: 1, overflowY: 'auto', padding: '12px 14px' })

const labelStyle = css({
  fontSize: '11px',
  fontWeight: '500',
  color: '#5f5e5a',
  marginBottom: '4px',
  display: 'block',
  '[data-theme=dark] &': { color: '#9c9a92' },
})

const inputStyle = css({
  width: '100%',
  padding: '5px 8px',
  fontSize: '12px',
  border: '0.5px solid rgba(0,0,0,0.18)',
  borderRadius: '6px',
  background: '#f5f3ee',
  color: '#1a1a18',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
  '&:focus': { borderColor: 'rgba(0,0,0,0.35)' },
  '[data-theme=dark] &': {
    background: '#3d3d3a',
    borderColor: 'rgba(255,255,255,0.15)',
    color: '#f5f3ee',
    '&:focus': { borderColor: 'rgba(255,255,255,0.3)' },
  },
})

const sepStyle = css({
  height: '0.5px',
  background: 'rgba(0,0,0,0.08)',
  margin: '12px 0',
  '[data-theme=dark] &': { background: 'rgba(255,255,255,0.08)' },
})

const actionBtnStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  padding: '6px 9px',
  fontSize: '12px',
  fontWeight: '500',
  border: '0.5px solid rgba(0,0,0,0.15)',
  borderRadius: '6px',
  background: '#f5f3ee',
  color: '#1a1a18',
  cursor: 'pointer',
  transition: 'background 0.12s',
  marginBottom: '6px',
  '&:hover': { background: '#ede9e3' },
  '[data-theme=dark] &': {
    background: '#3d3d3a',
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#f5f3ee',
    '&:hover': { background: '#4d4d4a' },
  },
})

const dangerBtnStyle = css({
  color: '#c0392b !important',
  '[data-theme=dark] &': { color: '#e57373 !important' },
})

const fmtBtnStyle = css({
  width: '28px',
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '0.5px solid rgba(0,0,0,0.15)',
  borderRadius: '5px',
  background: '#f5f3ee',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  color: '#5f5e5a',
  transition: 'background 0.12s',
  '&:hover': { background: '#ede9e3', color: '#1a1a18' },
  '[data-theme=dark] &': {
    background: '#3d3d3a',
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#f5f3ee',
    '&:hover': { background: '#4d4d4a' },
  },
})

const fmtBtnOnStyle = css({
  background: '#1a1a18 !important',
  color: '#fff !important',
  borderColor: '#1a1a18 !important',
  '[data-theme=dark] &': {
    background: '#f5f3ee !important',
    color: '#1a1a18 !important',
    borderColor: '#f5f3ee !important',
  },
})

const alignBtnStyle = css({
  flex: 1,
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '0.5px solid rgba(0,0,0,0.15)',
  borderRadius: '5px',
  background: '#f5f3ee',
  cursor: 'pointer',
  color: '#5f5e5a',
  transition: 'background 0.12s',
  '&:hover': { background: '#ede9e3' },
  '[data-theme=dark] &': {
    background: '#3d3d3a',
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#f5f3ee',
    '&:hover': { background: '#4d4d4a' },
  },
})

const colorLabelStyle = css({
  fontSize: '12px',
  color: '#5f5e5a',
  flex: 1,
  '[data-theme=dark] &': { color: '#9c9a92' },
})

const fAutoStyle = css({
  fontSize: '11px',
  padding: '3px 7px',
  border: '0.5px solid rgba(0,0,0,0.15)',
  borderRadius: '5px',
  background: '#f5f3ee',
  color: '#5f5e5a',
  cursor: 'pointer',
  '&:hover': { background: '#ede9e3' },
  '[data-theme=dark] &': {
    background: '#3d3d3a',
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#f5f3ee',
    '&:hover': { background: '#4d4d4a' },
  },
})

const swatchGridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: '6px',
  marginTop: '8px',
})

const swatchStyle = css({
  width: '100%',
  aspectRatio: '1 / 1',
  borderRadius: '999px',
  border: '1px solid rgba(0,0,0,0.1)',
  cursor: 'pointer',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)',
  transition: 'transform 0.12s, box-shadow 0.12s',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5), 0 4px 10px rgba(0,0,0,0.08)',
  },
  '[data-theme=dark] &': {
    borderColor: 'rgba(255,255,255,0.14)',
    '&:hover': {
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35), 0 4px 10px rgba(0,0,0,0.2)',
    },
  },
})

const IconConnect = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="2.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="10.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
    <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="currentColor" strokeWidth="1.1" />
  </svg>
)
const IconTrashSm = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M2 3.5h9M4.5 3.5V3h4v.5M5.5 6v3.5M7.5 6v3.5M2.5 3.5l.75 6.5a.9.9 0 00.9.75h4.7a.9.9 0 00.9-.75l.75-6.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)
const IconAlignLeft = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line
      x1="1"
      y1="3"
      x2="12"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    <line
      x1="1"
      y1="6.5"
      x2="8"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    <line
      x1="1"
      y1="10"
      x2="10"
      y2="10"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)
const IconAlignCenter = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line
      x1="1"
      y1="3"
      x2="12"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
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
      x1="2"
      y1="10"
      x2="11"
      y2="10"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)
const IconAlignRight = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line
      x1="1"
      y1="3"
      x2="12"
      y2="3"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    <line
      x1="5"
      y1="6.5"
      x2="12"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    <line
      x1="3"
      y1="10"
      x2="12"
      y2="10"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
)

const PropertiesPanel: FunctionComponent = () => {
  const {
    selNode,
    selText,
    selEdge,
    multiSel,
    nodes,
    texts,
    edges,
    updateNode,
    updateText,
    updateEdge,
    deleteNode,
    deleteText,
    deleteEdge,
    startConnect,
    deselectAll,
    detachNode,
    deleteMultiSel,
  } = useDiagram()

  const node = selNode ? nodes[selNode] : null
  const text = selText ? texts[selText] : null
  const edge = selEdge !== null ? edges[selEdge] : null
  const hasMulti = multiSel.size > 0 && !selNode && !selText && !selEdge

  let panelTitle = 'Properties'
  let panelSub = 'Nothing selected'
  if (node) {
    panelTitle = 'Box'
    panelSub = node.title || 'Untitled'
  } else if (text) {
    panelTitle = 'Text'
    panelSub = text.content.slice(0, 20) + (text.content.length > 20 ? '…' : '')
  } else if (edge !== null) {
    panelTitle = 'Link'
    panelSub = edge.label || 'No label'
  } else if (hasMulti) {
    panelTitle = 'Selection'
    panelSub = `${multiSel.size} elements`
  }

  return (
    <div className={panelStyle}>
      <div className={headerStyle}>
        <div className={titleStyle}>{panelTitle}</div>
        <div className={subStyle}>{panelSub}</div>
      </div>
      <div className={bodyStyle}>
        {!node && !text && !edge && !hasMulti && (
          <p style={{ color: '#888780', fontSize: 12, lineHeight: 1.6, padding: '4px 0' }}>
            Drag on the canvas to select multiple elements.
            <br />
            <br />
            Right-click to add · Click a link to select it.
          </p>
        )}

        {/* Node Form */}
        {node && (
          <div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Title</label>
              <input
                className={inputStyle}
                value={node.title}
                placeholder="Box title"
                onChange={(e) => updateNode(node.id, { title: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Description</label>
              <textarea
                className={inputStyle}
                value={node.desc}
                placeholder="Optional subtitle"
                style={{ resize: 'vertical', minHeight: 48, lineHeight: 1.5 }}
                onChange={(e) => updateNode(node.id, { desc: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Shape</label>
              <select
                className={inputStyle}
                value={node.shape}
                onChange={(e) =>
                  updateNode(node.id, { shape: e.target.value as typeof node.shape })
                }
              >
                <option value="rect">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="diamond">Diamond</option>
                <option value="triangle">Triangle</option>
              </select>
            </div>
            <div className={sepStyle} />
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Background</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="color"
                  value={node.bg}
                  style={{
                    width: 32,
                    height: 26,
                    padding: 2,
                    border: '0.5px solid rgba(0,0,0,0.15)',
                    borderRadius: 6,
                    background: '#f5f3ee',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onChange={(e) =>
                    updateNode(node.id, { bg: e.target.value, fg: autoFg(e.target.value) })
                  }
                />
                <span className={colorLabelStyle}>{node.bg}</span>
              </div>
              <div className={swatchGridStyle}>
                {PASTEL_NODE_COLORS.map(({ bg, fg }) => (
                  <button
                    key={bg}
                    className={swatchStyle}
                    style={{
                      background: bg,
                      outline: node.bg === bg ? '2px solid #6c6cff' : 'none',
                      outlineOffset: 1,
                    }}
                    onClick={() => updateNode(node.id, { bg, fg })}
                    aria-label={`Set pastel color ${bg}`}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Text color</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="color"
                  value={node.fg}
                  style={{
                    width: 32,
                    height: 26,
                    padding: 2,
                    border: '0.5px solid rgba(0,0,0,0.15)',
                    borderRadius: 6,
                    background: '#f5f3ee',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onChange={(e) => updateNode(node.id, { fg: e.target.value })}
                />
                <span className={colorLabelStyle}>{node.fg}</span>
                <button
                  className={fAutoStyle}
                  onClick={() => updateNode(node.id, { fg: autoFg(node.bg) })}
                >
                  Auto
                </button>
              </div>
            </div>
            <div className={sepStyle} />
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Text</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  className={inputStyle}
                  style={{ flex: 1 }}
                  value={node.family}
                  onChange={(e) => updateNode(node.id, { family: e.target.value })}
                >
                  <option value="inherit">Default</option>
                  <option value="Georgia,serif">Georgia</option>
                  <option value="'Courier New',monospace">Monospace</option>
                  <option value="Impact,sans-serif">Impact</option>
                </select>
                <input
                  type="number"
                  className={inputStyle}
                  value={node.size}
                  min={8}
                  max={96}
                  style={{ width: 58 }}
                  onChange={(e) => updateNode(node.id, { size: +e.target.value || 13 })}
                />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label className={labelStyle}>Attributes</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(
                  [
                    ['bold', 'B', 'bold'],
                    ['italic', 'I', 'italic'],
                    ['underline', 'U', 'under'],
                    ['strike', 'S', 'strike'],
                  ] as const
                ).map(([prop, label, key]) => (
                  <button
                    key={key}
                    className={`${fmtBtnStyle} ${node[prop] ? fmtBtnOnStyle : ''}`}
                    onClick={() =>
                      updateNode(node.id, { [prop]: !node[prop] } as Pick<typeof node, typeof prop>)
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>
                Radius — <span>{node.radius}</span>px
              </label>
              <input
                type="range"
                min={0}
                max={28}
                value={node.radius}
                style={{ width: '100%' }}
                onChange={(e) => updateNode(node.id, { radius: +e.target.value })}
              />
            </div>
            <div className={sepStyle} />
            {node.parent && (
              <div style={{ marginBottom: 11 }}>
                <label className={labelStyle}>Nested inside</label>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 12, color: '#888780' }}>
                    {nodes[node.parent]?.title || '—'}
                  </span>
                  <button className={fAutoStyle} onClick={() => detachNode(node.id, true)}>
                    Detach
                  </button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <button
                className={actionBtnStyle}
                style={{ marginBottom: 0 }}
                onClick={() => startConnect()}
              >
                <IconConnect /> Connect
              </button>
              <button
                className={`${actionBtnStyle} ${dangerBtnStyle}`}
                style={{ marginBottom: 0 }}
                onClick={() => {
                  deselectAll()
                  deleteNode(node.id)
                }}
              >
                <IconTrashSm /> Delete
              </button>
            </div>
          </div>
        )}

        {/* Text Form */}
        {text && (
          <div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Content</label>
              <textarea
                className={inputStyle}
                value={text.content}
                placeholder="Text content"
                style={{ minHeight: 60, resize: 'vertical' }}
                onChange={(e) => updateText(text.id, { content: e.target.value })}
              />
            </div>
            <div className={sepStyle} />
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Font</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  className={inputStyle}
                  style={{ flex: 1 }}
                  value={text.family}
                  onChange={(e) => updateText(text.id, { family: e.target.value })}
                >
                  <option value="inherit">Default</option>
                  <option value="Georgia,serif">Georgia</option>
                  <option value="'Courier New',monospace">Monospace</option>
                  <option value="Impact,sans-serif">Impact</option>
                </select>
                <input
                  type="number"
                  className={inputStyle}
                  value={text.size}
                  min={8}
                  max={96}
                  style={{ width: 58 }}
                  onChange={(e) => updateText(text.id, { size: +e.target.value || 16 })}
                />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label className={labelStyle}>Style</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(
                  [
                    ['bold', 'B', 'bold'],
                    ['italic', 'I', 'italic'],
                    ['underline', 'U', 'under'],
                    ['strike', 'S', 'strike'],
                  ] as const
                ).map(([prop, label, key]) => (
                  <button
                    key={key}
                    className={`${fmtBtnStyle} ${(text as any)[prop] ? fmtBtnOnStyle : ''}`}
                    onClick={() => updateText(text.id, { [prop]: !(text as any)[prop] } as any)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label className={labelStyle}>Align</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button
                    key={a}
                    className={`${alignBtnStyle} ${text.align === a ? fmtBtnOnStyle : ''}`}
                    onClick={() => updateText(text.id, { align: a })}
                  >
                    {a === 'left' ? (
                      <IconAlignLeft />
                    ) : a === 'center' ? (
                      <IconAlignCenter />
                    ) : (
                      <IconAlignRight />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Color</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="color"
                  value={text.color}
                  style={{
                    width: 32,
                    height: 26,
                    padding: 2,
                    border: '0.5px solid rgba(0,0,0,0.15)',
                    borderRadius: 6,
                    background: '#f5f3ee',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onChange={(e) => updateText(text.id, { color: e.target.value })}
                />
                <span className={colorLabelStyle}>{text.color}</span>
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>
                Opacity — <span>{text.opacity}</span>%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={text.opacity}
                style={{ width: '100%' }}
                onChange={(e) => updateText(text.id, { opacity: +e.target.value })}
              />
            </div>
            <div className={sepStyle} />
            <button
              className={`${actionBtnStyle} ${dangerBtnStyle}`}
              onClick={() => {
                deselectAll()
                deleteText(text.id)
              }}
            >
              <IconTrashSm /> Delete text
            </button>
          </div>
        )}

        {/* Edge Form */}
        {edge !== null && selEdge !== null && (
          <div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Label</label>
              <input
                className={inputStyle}
                value={edge.label}
                placeholder="Short label"
                onChange={(e) => updateEdge(selEdge, { label: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Link shape</label>
              <select
                className={inputStyle}
                value={edge.route}
                onChange={(e) => updateEdge(selEdge, { route: e.target.value as any })}
              >
                <option value="straight">Straight</option>
                <option value="curve">Curve</option>
                <option value="angle">Angle</option>
              </select>
            </div>
            {edge.route !== 'straight' && (
              <div style={{ marginBottom: 11 }}>
                <label className={labelStyle}>
                  Bend — <span>{edge.bend}</span>px
                </label>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  value={edge.bend}
                  style={{ width: '100%' }}
                  onChange={(e) => updateEdge(selEdge, { bend: +e.target.value })}
                />
              </div>
            )}
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Description</label>
              <textarea
                className={inputStyle}
                value={edge.desc}
                placeholder="Shown on hover"
                style={{ resize: 'vertical' }}
                onChange={(e) => updateEdge(selEdge, { desc: e.target.value })}
              />
            </div>
            <div className={sepStyle} />
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Color</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="color"
                  value={edge.color}
                  style={{
                    width: 32,
                    height: 26,
                    padding: 2,
                    border: '0.5px solid rgba(0,0,0,0.15)',
                    borderRadius: 6,
                    background: '#f5f3ee',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onChange={(e) => updateEdge(selEdge, { color: e.target.value })}
                />
                <span className={colorLabelStyle}>{edge.color}</span>
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Line style</label>
              <select
                className={inputStyle}
                value={edge.style}
                onChange={(e) => updateEdge(selEdge, { style: e.target.value as any })}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className={labelStyle}>Arrow</label>
              <select
                className={inputStyle}
                value={edge.arrow}
                onChange={(e) => updateEdge(selEdge, { arrow: e.target.value as any })}
              >
                <option value="end">One way →</option>
                <option value="both">Both ↔</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className={sepStyle} />
            <button
              className={`${actionBtnStyle} ${dangerBtnStyle}`}
              onClick={() => {
                deselectAll()
                deleteEdge(selEdge)
              }}
            >
              <IconTrashSm /> Delete link
            </button>
          </div>
        )}

        {/* Multi Form */}
        {hasMulti && (
          <div>
            <p style={{ fontSize: 12, color: '#888780', marginBottom: 12 }}>
              {multiSel.size} elements selected
            </p>
            <button className={`${actionBtnStyle} ${dangerBtnStyle}`} onClick={deleteMultiSel}>
              <IconTrashSm /> Delete selected
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertiesPanel
