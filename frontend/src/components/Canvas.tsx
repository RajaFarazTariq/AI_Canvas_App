import React from 'react';
import { Stage, Layer, Circle, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../store/canvasStore';
import { useSocket } from '../hooks/useSocket';
import { CanvasNode } from '../types';

const CANVAS_W = 900;
const CANVAS_H = 600;

// ── Single draggable node ────────────────────────────────────────────────────
interface NodeShapeProps {
  node: CanvasNode;
  onDragEnd:  (id: string, x: number, y: number) => void;
  onDragMove: (id: string, x: number, y: number) => void;
}

const NodeShape: React.FC<NodeShapeProps> = ({ node, onDragEnd, onDragMove }) => {
  const { id, type, x, y, fill, label } = node;

  const dragBoundFunc = (pos: { x: number; y: number }) => {
    const pad = type === 'circle' ? (node.radius ?? 22) : 0;
    const hw  = type === 'rectangle' ? (node.width  ?? 80) / 2 : pad;
    const hh  = type === 'rectangle' ? (node.height ?? 50) / 2 : pad;
    return {
      x: Math.max(hw, Math.min(CANVAS_W - hw, pos.x)),
      y: Math.max(hh, Math.min(CANVAS_H - hh, pos.y)),
    };
  };

  const commonProps = {
    draggable: true,
    dragBoundFunc,
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => {
      const { x, y } = e.target.position();
      onDragMove(id, Math.round(x), Math.round(y));
    },
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      const { x, y } = e.target.position();
      onDragEnd(id, Math.round(x), Math.round(y));
    },
  };

  const textStyle = {
    text:           label,
    fontSize:       label.length > 1 ? 11 : 13,
    fontFamily:     'DM Mono, monospace',
    fontStyle:      'bold',
    fill:           'rgba(255,255,255,0.95)',
    align:          'center' as const,
    verticalAlign:  'middle' as const,
    listening:      false,
  };

  const shadowProps = {
    shadowColor:   'rgba(0,0,0,0.45)',
    shadowBlur:    14,
    shadowOffsetY: 4,
    shadowOpacity: 0.5,
  };

  if (type === 'circle') {
    const r = node.radius ?? 22;
    return (
      <Group x={x} y={y} {...commonProps}>
        {/* Soft outer glow */}
        <Circle radius={r + 6} fill={fill} opacity={0.12} listening={false} />
        {/* Main shape */}
        <Circle
          radius={r}
          fill={fill}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1.5}
          {...shadowProps}
        />
        {/* Inner highlight */}
        <Circle
          radius={r * 0.5}
          fill="rgba(255,255,255,0.1)"
          listening={false}
          offsetY={r * 0.22}
        />
        <Text {...textStyle} x={-r} y={-r} width={r * 2} height={r * 2} />
      </Group>
    );
  }

  const w = node.width  ?? 80;
  const h = node.height ?? 50;
  return (
    <Group x={x} y={y} {...commonProps}>
      {/* Soft glow */}
      <Rect
        x={-w / 2 - 5} y={-h / 2 - 5}
        width={w + 10} height={h + 10}
        fill={fill} cornerRadius={11}
        opacity={0.12} listening={false}
      />
      {/* Main rect */}
      <Rect
        x={-w / 2} y={-h / 2}
        width={w} height={h}
        fill={fill}
        cornerRadius={7}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
        {...shadowProps}
      />
      {/* Top shine */}
      <Rect
        x={-w / 2 + 5} y={-h / 2 + 4}
        width={w - 10} height={h * 0.28}
        fill="rgba(255,255,255,0.09)"
        cornerRadius={[5, 5, 0, 0]}
        listening={false}
      />
      <Text {...textStyle} x={-w / 2} y={-h / 2} width={w} height={h} />
    </Group>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <div className="canvas-empty">
    <div className="canvas-empty__glyph">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <circle cx="17.5" cy="17.5" r="3.5" />
      </svg>
    </div>
    <p className="canvas-empty__title">Your canvas is empty</p>
    <p className="canvas-empty__sub">Enter a prompt above to generate a layout</p>
    <div className="canvas-empty__hints">
      <span>"5 circles in a star"</span>
      <span>"3×4 grid"</span>
      <span>"4 rects in a row"</span>
    </div>
  </div>
);

// ── Main canvas ──────────────────────────────────────────────────────────────
export const Canvas: React.FC = () => {
  const { nodes, isGenerating } = useCanvasStore();
  const { emitMove }            = useSocket();
  const { moveNode }            = useCanvasStore();

  const handleDragMove = (id: string, x: number, y: number) => {
    moveNode(id, x, y);
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    moveNode(id, x, y);
    emitMove(id, x, y);
  };

  return (
    <div className="canvas-wrapper">

      {/* Corner accents */}
      <div className="canvas-corner canvas-corner--tl" />
      <div className="canvas-corner canvas-corner--tr" />
      <div className="canvas-corner canvas-corner--bl" />
      <div className="canvas-corner canvas-corner--br" />

      {/* Top-left live label */}
      <div className="canvas-label">
        <span className="canvas-label__dot" />
        canvas
      </div>

      {/* Generating overlay */}
      {isGenerating && (
        <div className="canvas-overlay">
          <div className="canvas-overlay__ring" />
          <span className="canvas-overlay__label">generating layout</span>
          <div className="canvas-overlay__dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* Konva Stage */}
      <Stage width={CANVAS_W} height={CANVAS_H} className="canvas-stage">
        <Layer>
          {nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              onDragEnd={handleDragEnd}
              onDragMove={handleDragMove}
            />
          ))}
        </Layer>
      </Stage>

      {/* Empty state */}
      {nodes.length === 0 && !isGenerating && <EmptyState />}

      {/* Node count badge */}
      {nodes.length > 0 && (
        <div className="canvas-badge">
          <span className="canvas-badge__dot" />
          {nodes.length} / 12 nodes
        </div>
      )}

    </div>
  );
};
