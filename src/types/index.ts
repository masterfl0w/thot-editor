export type PortSide = 'pt' | 'pb' | 'pl' | 'pr'
export type NodeShape = 'rect' | 'circle' | 'diamond' | 'triangle'

export interface DiagramNode {
  id: string
  title: string
  desc: string
  bg: string
  fg: string
  shape: NodeShape
  family: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
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
  fromSide: PortSide
  toSide: PortSide
  label: string
  desc: string
  color: string
  style: 'solid' | 'dashed' | 'dotted'
  arrow: 'end' | 'both' | 'none'
  route: 'straight' | 'curve' | 'angle'
  bend: number
}

export type ContextMenuTarget =
  | { type: 'canvas'; x: number; y: number; wx: number; wy: number }
  | { type: 'node';   id: string; x: number; y: number }
  | { type: 'text';   id: string; x: number; y: number }
  | null
