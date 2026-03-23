import katex from 'katex'

type Segment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string }

function looksLikeMath(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.includes('\\') || trimmed.includes('^') || trimmed.includes('_')) return true
  if (/[=<>+\-*/()[\]{}]/.test(trimmed) && !/[.!?]/.test(trimmed)) return true
  return false
}

function parseMathSegments(content: string): Segment[] {
  if (!content.includes('$') && looksLikeMath(content)) {
    return [{ type: 'inline', value: content }]
  }

  const segments: Segment[] = []
  let i = 0

  while (i < content.length) {
    const blockStart = content.indexOf('$$', i)
    const inlineStart = content.indexOf('$', i)

    let start = -1
    let kind: 'inline' | 'block' | null = null

    if (blockStart !== -1 && (inlineStart === -1 || blockStart <= inlineStart)) {
      start = blockStart
      kind = 'block'
    } else if (inlineStart !== -1) {
      start = inlineStart
      kind = 'inline'
    }

    if (start === -1 || kind === null) {
      segments.push({ type: 'text', value: content.slice(i) })
      break
    }

    if (start > i) segments.push({ type: 'text', value: content.slice(i, start) })

    const delimiter = kind === 'block' ? '$$' : '$'
    const end = content.indexOf(delimiter, start + delimiter.length)

    if (end === -1) {
      const danglingValue = content.slice(start + delimiter.length)
      if (danglingValue.trim()) {
        segments.push({ type: kind, value: danglingValue })
      } else {
        segments.push({ type: 'text', value: content.slice(start) })
      }
      break
    }

    const value = content.slice(start + delimiter.length, end)
    segments.push({ type: kind, value })
    i = end + delimiter.length
  }

  return segments
}

function renderMath(value: string, displayMode: boolean) {
  try {
    return katex.renderToString(value, {
      throwOnError: false,
      displayMode,
      strict: 'ignore',
    })
  } catch {
    return null
  }
}

export default function MathText({
  content,
  align = 'left',
}: {
  content: string
  align?: 'left' | 'center' | 'right'
}) {
  const segments = parseMathSegments(content)

  return (
    <span style={{ whiteSpace: 'pre-wrap', textAlign: align, display: 'block' }}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.value}</span>
        }

        const html = renderMath(segment.value, segment.type === 'block')
        if (!html) return <span key={index}>{segment.value}</span>

        if (segment.type === 'block') {
          return (
            <span
              key={index}
              style={{ display: 'block', margin: '0.18em 0' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }

        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </span>
  )
}
