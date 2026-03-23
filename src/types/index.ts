export interface DiagramNode {
  id: string
  title: string
  desc: string
  bg: string
  fg: string
  radius: number
  x: number
  y: number
  parent: string | null
  children: string[]
}

export interface TextNode {
  id: string
  content: string
  x: number
  y: number
  size: number
  color: string
  family: string
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  align: 'left' | 'center' | 'right'
  opacity: number
}

export interface Edge {
  from: string
  to: string
  label: string
  desc: string
  color: string
  style: 'solid' | 'dashed' | 'dotted'
  arrow: 'end' | 'both' | 'none'
}

export type ContextMenuTarget =
  | { type: 'canvas'; x: number; y: number; wx: number; wy: number }
  | { type: 'node';   id: string; x: number; y: number }
  | { type: 'text';   id: string; x: number; y: number }
  | null
