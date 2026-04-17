export type ShapeType = 'circle' | 'rectangle';

export interface CanvasNode {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  radius?: number;   // circle only
  width?: number;    // rectangle only
  height?: number;   // rectangle only
  label: string;
  fill: string;
}

export interface CanvasState {
  nodes: CanvasNode[];
  prompt: string;
  updatedAt: number;
}

export interface GeneratePayload {
  prompt: string;
}

export interface MovePayload {
  id: string;
  x: number;
  y: number;
}

export interface AINode {
  type: ShapeType;
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  label: string;
  fill?: string;
}

export interface AIResponse {
  nodes: AINode[];
}
