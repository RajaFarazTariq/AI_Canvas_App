export type ShapeType = 'circle' | 'rectangle';

export interface CanvasNode {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  label: string;
  fill: string;
}

export interface CanvasState {
  nodes: CanvasNode[];
  prompt: string;
  updatedAt: number;
}
