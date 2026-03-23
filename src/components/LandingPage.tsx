import { css } from '../../styled-system/css'

function DemoWindow() {
  const demoSrc = typeof window !== 'undefined'
    ? `${window.location.pathname}${window.location.search}#demo`
    : '#demo'

  return (
    <div
      className={css({
        position: 'relative',
        width: '100%',
        maxWidth: '760px',
        aspectRatio: '16 / 10',
        borderRadius: '28px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.08)',
        background: '#d9ecff',
        boxShadow: '0 42px 110px rgba(32,28,22,0.22)',
      })}
    >
      <iframe
        title="Thot Editor live demo"
        src={demoSrc}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          border: 'none',
          background: 'transparent',
        }}
      />
    </div>
  )
}

function ExampleCard({
  title,
  desc,
  tags,
}: {
  title: string
  desc: string
  tags: string[]
}) {
  return (
    <div
      className={css({
        borderRadius: '26px',
        border: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.78)',
        boxShadow: '0 24px 60px rgba(32,28,22,0.08)',
        padding: '24px',
      })}
    >
      <div
        className={css({
          height: '180px',
          borderRadius: '20px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.54) 0%, rgba(238,231,222,0.82) 100%)',
          border: '1px solid rgba(0,0,0,0.06)',
          marginBottom: '18px',
          position: 'relative',
          overflow: 'hidden',
        })}
      >
        <div style={{ position: 'absolute', inset: 0, padding: 18 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 56, borderRadius: 16, background: '#e8e6ff', border: '1px solid rgba(0,0,0,0.06)' }} />
            <div style={{ width: 92, height: 56, borderRadius: 16, background: '#d1f0e3', border: '1px solid rgba(0,0,0,0.06)' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: '999px', background: '#ffd7b8', border: '1px solid rgba(0,0,0,0.06)' }} />
            <div style={{ flex: 1, height: 90, borderRadius: 18, background: '#ffd5df', border: '1px solid rgba(0,0,0,0.06)' }} />
          </div>
        </div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a18', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: '#5f5e5a', marginBottom: 14 }}>{desc}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tags.map(tag => (
          <span
            key={tag}
            className={css({
              borderRadius: '999px',
              padding: '7px 12px',
              background: '#f0ede8',
              color: '#5f5e5a',
              fontSize: '12px',
              fontWeight: '600',
            })}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage({ onEnterEditor }: { onEnterEditor: () => void }) {
  return (
    <div
      className={css({
        minHeight: '100vh',
        overflowY: 'auto',
        background:
          'radial-gradient(circle at top left, rgba(124,158,255,0.24), transparent 32%), radial-gradient(circle at 80% 10%, rgba(255,183,133,0.22), transparent 28%), linear-gradient(180deg, #f2ede5 0%, #ebe4da 100%)',
        color: '#1a1a18',
      })}
    >
      <header
        className={css({
          position: 'sticky',
          top: 0,
          zIndex: 20,
          padding: '18px 22px',
        })}
      >
        <div
          className={css({
            maxWidth: '1220px',
            margin: '0 auto',
            height: '62px',
            borderRadius: '22px',
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 20px 46px rgba(22,18,12,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
          })}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/thot_dark_icon_transparency.svg" alt="Thot Editor" style={{ height: 26, width: 'auto' }} />
            <span style={{ fontSize: 16, color: '#1a1a18', fontWeight: 800, letterSpacing: '-0.02em' }}>Thot Editor</span>
            <span style={{ fontSize: 14, color: '#5f5e5a', fontWeight: 600 }}>v0.2.2</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href="https://github.com/masterfl0w/thot-editor"
              target="_blank"
              rel="noreferrer"
              className={css({
                fontSize: '13px',
                fontWeight: '600',
                color: '#5f5e5a',
                textDecoration: 'none',
                padding: '10px 14px',
                borderRadius: '14px',
                _hover: { background: 'rgba(0,0,0,0.04)' },
              })}
            >
              GitHub
            </a>
            <button
              onClick={onEnterEditor}
              className={css({
                border: 'none',
                cursor: 'pointer',
                borderRadius: '14px',
                padding: '11px 16px',
                background: '#1a1a18',
                color: '#f5f3ee',
                fontSize: '13px',
                fontWeight: '700',
                boxShadow: '0 10px 22px rgba(26,26,24,0.18)',
              })}
            >
              Open editor
            </button>
          </div>
        </div>
      </header>

      <main
        className={css({
          maxWidth: '1220px',
          margin: '0 auto',
          padding: '32px 22px 88px',
        })}
      >
        <section
          className={css({
            display: 'grid',
            gridTemplateColumns: '1.02fr 1fr',
            gap: '42px',
            alignItems: 'center',
            minHeight: 'calc(100vh - 140px)',
            '@media (max-width: 980px)': {
              gridTemplateColumns: '1fr',
              minHeight: 'auto',
            },
          })}
        >
          <div>
            <div
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#5f5e5a',
                marginBottom: '18px',
              })}
            >
              Infinite canvas for ideas, systems and local-first workflows
            </div>
            <h1
              className={css({
                fontSize: 'clamp(52px, 8vw, 90px)',
                lineHeight: '0.94',
                letterSpacing: '-0.045em',
                margin: '0 0 18px',
                fontWeight: '800',
              })}
            >
              Diagram fast.
              <br />
              Think in motion.
            </h1>
            <p
              className={css({
                fontSize: '18px',
                lineHeight: '1.65',
                color: '#5f5e5a',
                maxWidth: '560px',
                margin: '0 0 28px',
              })}
            >
              Thot Editor is a visual workspace for architecture maps, product thinking, system sketches and structured notes. Build connected diagrams, format math equations, import or export graph data as JSON, and keep everything editable on an infinite canvas with a simple UI.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 34 }}>
              <button
                onClick={onEnterEditor}
                className={css({
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '18px',
                  padding: '15px 20px',
                  background: '#1a1a18',
                  color: '#f5f3ee',
                  fontSize: '15px',
                  fontWeight: '700',
                  boxShadow: '0 14px 30px rgba(26,26,24,0.18)',
                })}
              >
                Launch live editor
              </button>
              <a
                href="#examples"
                className={css({
                  textDecoration: 'none',
                  borderRadius: '18px',
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.74)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  color: '#1a1a18',
                  fontSize: '15px',
                  fontWeight: '700',
                })}
              >
                See examples
              </a>
            </div>

            <div
              className={css({
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '12px',
                maxWidth: '620px',
                '@media (max-width: 640px)': { gridTemplateColumns: '1fr' },
              })}
            >
              {[
                ['Simple UX/UI', 'A focused interface built for thinking, not tool-hunting'],
                ['Math formatting', 'Write equations and notes together directly on the canvas'],
                ['JSON friendly', 'Import and export graphs as JSON without friction'],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className={css({
                    borderRadius: '18px',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.58)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  })}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: '#5f5e5a' }}>{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <DemoWindow />
          </div>
        </section>

        <section
          id="examples"
          className={css({
            paddingTop: '56px',
          })}
        >
          <div style={{ maxWidth: 640, marginBottom: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7c5e47', marginBottom: 10 }}>Examples</div>
            <h2 style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.02, margin: '0 0 12px', letterSpacing: '-0.04em' }}>
              Use Thot Editor for work that needs structure and speed.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: '#5f5e5a', margin: 0 }}>
              Present systems, map flows, explain local AI stacks, or prepare visual notes for a product review. The canvas stays fluid, but the output stays clean.
            </p>
          </div>

          <div
            className={css({
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '18px',
              '@media (max-width: 980px)': { gridTemplateColumns: '1fr' },
            })}
          >
            <ExampleCard
              title="Architecture maps"
              desc="Explain frontend, backend, model routing and local tooling in a single diagram with nested nodes, links and clean structure."
              tags={['System design', 'Nested boxes', 'Links']}
            />
            <ExampleCard
              title="JSON to graph"
              desc="Paste a JSON payload and turn it into a structured Thot workspace, then export the graph back to JSON after edits."
              tags={['Import JSON', 'Export JSON', 'Graph config']}
            />
            <ExampleCard
              title="Math and notes"
              desc="Mix free text, equations and visual structure in one place for technical notes, specs and architecture reviews."
              tags={['Equations', 'Notes', 'Technical docs']}
            />
          </div>
        </section>

        <section
          className={css({
            paddingTop: '74px',
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: '20px',
            '@media (max-width: 980px)': { gridTemplateColumns: '1fr' },
          })}
        >
          <div
            className={css({
              borderRadius: '30px',
              background: '#1b1a17',
              color: '#f5f3ee',
              padding: '34px',
              boxShadow: '0 28px 70px rgba(10,10,10,0.24)',
            })}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#b3afa8', marginBottom: 10 }}>Why it feels different</div>
            <div style={{ fontSize: 36, lineHeight: 1.04, letterSpacing: '-0.04em', fontWeight: 800, marginBottom: 16 }}>
              Built for thinking visually, not fighting UI.
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.72, color: 'rgba(245,243,238,0.72)', maxWidth: 560 }}>
              Thot Editor combines diagramming, note-taking, math notation, JSON-friendly workflows and persistent local sessions in one surface. It stays lightweight, open source and practical for real technical work.
            </div>
          </div>

          <div
            className={css({
              borderRadius: '30px',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,0,0,0.08)',
              padding: '30px',
            })}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7c5e47', marginBottom: 10 }}>Core features</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                'Simple UX/UI with a focused canvas and fast editing flow',
                'Math notation inside text nodes and box content for equations',
                'JSON-friendly import/export for graph configuration and automation',
                'Infinite workspace with pan, zoom and free/static positioning',
                'Free and open source, with local-first persistence and exports',
              ].map(item => (
                <div
                  key={item}
                  className={css({
                    borderRadius: '16px',
                    background: '#f5f3ee',
                    padding: '14px 16px',
                    color: '#3d3d3a',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    border: '1px solid rgba(0,0,0,0.05)',
                  })}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className={css({
            paddingTop: '70px',
          })}
        >
          <div
            className={css({
              borderRadius: '32px',
              padding: '38px',
              background:
                'linear-gradient(135deg, rgba(26,26,24,0.98) 0%, rgba(52,47,41,0.98) 100%)',
              color: '#f5f3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap',
            })}
          >
            <div>
              <div style={{ fontSize: 40, lineHeight: 1.02, letterSpacing: '-0.04em', fontWeight: 800, marginBottom: 12 }}>
                Open Thot Editor and start mapping.
              </div>
              <div style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(245,243,238,0.72)', maxWidth: 640 }}>
                Create boxes, connect ideas, format equations, move between JSON and graph views, export clean visuals, and come back later with the same workspace still there.
              </div>
            </div>
            <button
              onClick={onEnterEditor}
              className={css({
                border: 'none',
                cursor: 'pointer',
                borderRadius: '18px',
                padding: '16px 22px',
                background: '#f5f3ee',
                color: '#1a1a18',
                fontSize: '15px',
                fontWeight: '800',
                whiteSpace: 'nowrap',
              })}
            >
              Open live demo
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
