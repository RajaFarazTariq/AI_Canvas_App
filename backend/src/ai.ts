import Groq from 'groq-sdk';
import { AIResponse, AINode, ShapeType } from './types';

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const CANVAS_W = 900;
const CANVAS_H = 600;
const CX = CANVAS_W / 2; // 450
const CY = CANVAS_H / 2; // 300

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
  '#f97316', '#84cc16', '#06b6d4', '#a855f7',
];
const LABELS = 'ABCDEFGHIJKL'.split('');

// ── Helpers ──────────────────────────────────────────────────────────────────
const color  = (i: number) => COLORS[i % COLORS.length];
const label  = (i: number) => LABELS[i] ?? String(i + 1);
const clampX = (x: number) => Math.min(840, Math.max(60, Math.round(x)));
const clampY = (y: number) => Math.min(540, Math.max(60, Math.round(y)));

function ring(cx: number, cy: number, r: number, count: number, startIdx: number, type: ShapeType): AINode[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      type,
      x: clampX(cx + r * Math.cos(angle)),
      y: clampY(cy + r * Math.sin(angle)),
      ...(type === 'circle' ? { radius: 22 } : { width: 80, height: 50 }),
      label: label(startIdx + i),
      fill: color(startIdx + i),
    };
  });
}

function row(
  count: number,
  y: number,
  type: ShapeType,
  startIdx: number,
  canvasW = CANVAS_W
): AINode[] {
  const spacing = count > 1 ? Math.min(160, Math.round((canvasW - 160) / (count - 1))) : 0;
  const startX  = count > 1 ? Math.round(CX - (spacing * (count - 1)) / 2) : CX;
  return Array.from({ length: count }, (_, i) => ({
    type,
    x: clampX(startX + i * spacing),
    y: clampY(y),
    ...(type === 'circle' ? { radius: 22 } : { width: 80, height: 50 }),
    label: label(startIdx + i),
    fill: color(startIdx + i),
  }));
}

// ── System prompt with diverse few-shot examples ─────────────────────────────
const SYSTEM_PROMPT = `You are a canvas layout engine. Convert user prompts into JSON.

STRICT RULES:
- Output ONLY valid JSON. Zero explanation. Zero markdown. Zero code blocks.
- Allowed types: "circle" or "rectangle" ONLY.
- Max 12 nodes total.
- Label: 1-2 characters.
- Canvas bounds: x 60-840, y 60-540. Canvas center is x=450, y=300.
- Circle: radius 20-30. Rectangle: width 70-100, height 45-65.
- ALWAYS produce ALL nodes described. Count carefully.

FEW-SHOT EXAMPLES:

Prompt: "5 circles in a row and 5 rectangles directly below them"
{"nodes":[
  {"type":"circle","x":130,"y":200,"radius":22,"label":"A","fill":"#6366f1"},
  {"type":"circle","x":290,"y":200,"radius":22,"label":"B","fill":"#ec4899"},
  {"type":"circle","x":450,"y":200,"radius":22,"label":"C","fill":"#f59e0b"},
  {"type":"circle","x":610,"y":200,"radius":22,"label":"D","fill":"#10b981"},
  {"type":"circle","x":770,"y":200,"radius":22,"label":"E","fill":"#3b82f6"},
  {"type":"rectangle","x":130,"y":380,"width":85,"height":55,"label":"F","fill":"#8b5cf6"},
  {"type":"rectangle","x":290,"y":380,"width":85,"height":55,"label":"G","fill":"#ef4444"},
  {"type":"rectangle","x":450,"y":380,"width":85,"height":55,"label":"H","fill":"#14b8a6"},
  {"type":"rectangle","x":610,"y":380,"width":85,"height":55,"label":"I","fill":"#f97316"},
  {"type":"rectangle","x":770,"y":380,"width":85,"height":55,"label":"J","fill":"#84cc16"}
]}

Prompt: "6 nodes in a hexagon and 6 inside forming a smaller hexagon"
{"nodes":[
  {"type":"circle","x":450,"y":100,"radius":22,"label":"A","fill":"#6366f1"},
  {"type":"circle","x":623,"y":200,"radius":22,"label":"B","fill":"#ec4899"},
  {"type":"circle","x":623,"y":400,"radius":22,"label":"C","fill":"#f59e0b"},
  {"type":"circle","x":450,"y":500,"radius":22,"label":"D","fill":"#10b981"},
  {"type":"circle","x":277,"y":400,"radius":22,"label":"E","fill":"#3b82f6"},
  {"type":"circle","x":277,"y":200,"radius":22,"label":"F","fill":"#8b5cf6"},
  {"type":"circle","x":450,"y":193,"radius":18,"label":"G","fill":"#ef4444"},
  {"type":"circle","x":537,"y":246,"radius":18,"label":"H","fill":"#14b8a6"},
  {"type":"circle","x":537,"y":354,"radius":18,"label":"I","fill":"#f97316"},
  {"type":"circle","x":450,"y":407,"radius":18,"label":"J","fill":"#84cc16"},
  {"type":"circle","x":363,"y":354,"radius":18,"label":"K","fill":"#06b6d4"},
  {"type":"circle","x":363,"y":246,"radius":18,"label":"L","fill":"#a855f7"}
]}

Prompt: "3 rectangles in a row"
{"nodes":[
  {"type":"rectangle","x":200,"y":300,"width":90,"height":55,"label":"A","fill":"#6366f1"},
  {"type":"rectangle","x":450,"y":300,"width":90,"height":55,"label":"B","fill":"#ec4899"},
  {"type":"rectangle","x":700,"y":300,"width":90,"height":55,"label":"C","fill":"#f59e0b"}
]}

Prompt: "star layout with 1 center node and 6 surrounding"
{"nodes":[
  {"type":"circle","x":450,"y":300,"radius":28,"label":"C","fill":"#6366f1"},
  {"type":"circle","x":450,"y":110,"radius":22,"label":"A","fill":"#ec4899"},
  {"type":"circle","x":616,"y":205,"radius":22,"label":"B","fill":"#f59e0b"},
  {"type":"circle","x":616,"y":395,"radius":22,"label":"C","fill":"#10b981"},
  {"type":"circle","x":450,"y":490,"radius":22,"label":"D","fill":"#3b82f6"},
  {"type":"circle","x":284,"y":395,"radius":22,"label":"E","fill":"#8b5cf6"},
  {"type":"circle","x":284,"y":205,"radius":22,"label":"F","fill":"#ef4444"}
]}

Output JSON only, nothing else.`;

// ── Groq AI call ─────────────────────────────────────────────────────────────
async function callGroq(prompt: string): Promise<AIResponse> {
  if (!groq) throw new Error('No Groq key');
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1200,
  });
  const raw     = completion.choices[0]?.message?.content ?? '';
  const cleaned = raw.replace(/```json?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned) as AIResponse;
}

// ── Structured fallback ───────────────────────────────────────────────────────
function structuredFallback(prompt: string): AIResponse {
  const lower = prompt.toLowerCase();

  const wantsRect   = (s: string) =>
    s.includes('rect') || s.includes('square') || s.includes('box');
  const shapeType   = (s: string): ShapeType => wantsRect(s) ? 'rectangle' : 'circle';

  // ── PATTERN 0: GRID "3x4", "2x3" ─────────────────────────────────────────
  const gridMatch = lower.match(/(\d+)\s*(?:x|by|×)\s*(\d+)/);
  if (gridMatch) {
    const cols  = Math.min(parseInt(gridMatch[1]), 6);
    const rows  = Math.min(parseInt(gridMatch[2]), 4);
    const total = Math.min(cols * rows, 12);
    const gapX  = cols > 1 ? (CANVAS_W - 160) / (cols - 1) : 0;
    const gapY  = rows > 1 ? (CANVAS_H - 160) / (rows - 1) : 0;
    const sx    = cols > 1 ? 80 : CX;
    const sy    = rows > 1 ? 80 : CY;
    const type  = shapeType(lower);
    const nodes: AINode[] = [];
    let idx = 0;
    for (let r = 0; r < rows && idx < total; r++) {
      for (let c = 0; c < cols && idx < total; c++, idx++) {
        nodes.push({
          type, label: label(idx), fill: color(idx),
          x: clampX(sx + c * gapX),
          y: clampY(sy + r * gapY),
          ...(type === 'circle' ? { radius: 22 } : { width: 80, height: 50 }),
        });
      }
    }
    return { nodes };
  }

  // ── PATTERN 1: TWO GROUPS "N circles ... and M rectangles ..." ────────────
  // e.g. "5 circles in a row and 5 rectangles directly below"
  const twoGroupMatch = lower.match(
    /(\d+)\s*(circle|rect\w*)[^.]*?and\s+(\d+)\s*(circle|rect\w*)/
  );
  if (twoGroupMatch) {
    const count1 = Math.min(parseInt(twoGroupMatch[1]), 6);
    const type1: ShapeType = twoGroupMatch[2].startsWith('rect') ? 'rectangle' : 'circle';
    const count2 = Math.min(parseInt(twoGroupMatch[3]), 12 - count1);
    const type2: ShapeType = twoGroupMatch[4].startsWith('rect') ? 'rectangle' : 'circle';

    // Determine vertical positions
    const hasBelow = lower.includes('below') || lower.includes('under') || lower.includes('bottom');
    const hasAbove = lower.includes('above') || lower.includes('over') || lower.includes('top');
    const y1 = hasBelow ? 180 : hasAbove ? 420 : 180;
    const y2 = hasBelow ? 420 : hasAbove ? 180 : 420;

    return {
      nodes: [
        ...row(count1, y1, type1, 0),
        ...row(count2, y2, type2, count1),
      ],
    };
  }

  // ── PATTERN 2: DOUBLE-RING "6 in hexagon and 6 inside / smaller" ──────────
  // e.g. "12 nodes: 6 in a hexagon and 6 inside forming a smaller hexagon"
  const doubleRingMatch = lower.match(
    /(\d+)\s*(?:in\s*a?\s*\w+|outer|outside|around)[^.]*?and\s+(\d+)\s*(?:in|inside|inner|smaller)/
  );
  const hasDoubleRing =
    doubleRingMatch ||
    (lower.includes('inner') && lower.includes('outer')) ||
    (lower.includes('inside') && (lower.match(/(\d+)/g)?.length ?? 0) >= 2) ||
    (lower.includes('smaller') && lower.includes('hexagon'));

  if (hasDoubleRing) {
    // Parse outer and inner counts
    const allNums   = [...lower.matchAll(/(\d+)/g)].map(m => parseInt(m[1]));
    const outerCount = Math.min(allNums[1] ?? 6, 6);  // second number usually = outer
    const innerCount = Math.min(allNums[2] ?? 6, 12 - outerCount);
    const outerR     = 190;
    const innerR     = Math.round(outerR * 0.55);

    return {
      nodes: [
        ...ring(CX, CY, outerR, outerCount, 0, 'circle'),
        ...ring(CX, CY, innerR, innerCount, outerCount, 'circle'),
      ],
    };
  }

  // ── PATTERN 3: STAR / HUB-SPOKE ──────────────────────────────────────────
  const isStar =
    lower.includes('star')    || lower.includes('hub') ||
    lower.includes('surround') || lower.includes('spoke') ||
    (lower.includes('center') && lower.match(/\d+/));

  if (isStar) {
    const hasCenter   = lower.includes('center') || lower.includes('hub');
    const outerMatch  = lower.match(/(\d+)\s*(?:surrounding|outer|around|node|circle)/);
    const outerCount  = outerMatch ? Math.min(parseInt(outerMatch[1]), 11) : 6;
    const orbitR      = Math.min(195, Math.min(CX, CY) - 55);
    const nodes: AINode[] = [];

    if (hasCenter) {
      nodes.push({ type: 'circle', x: CX, y: CY, radius: 28, label: 'C', fill: color(0) });
    }
    nodes.push(...ring(CX, CY, orbitR, outerCount, hasCenter ? 1 : 0, 'circle'));
    return { nodes };
  }

  // ── PATTERN 4: POLYGON ring "pentagon", "hexagon", "N in a ring" ──────────
  const polyMap: Record<string, number> = {
    triangle: 3, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8,
  };
  const polyKey  = Object.keys(polyMap).find(k => lower.includes(k));
  const ringMatch = lower.match(/(\d+)\s*in\s*a\s*(?:circle|ring|loop)/);

  if (polyKey || ringMatch) {
    const count = ringMatch ? Math.min(parseInt(ringMatch[1]), 12) : polyMap[polyKey!];
    return { nodes: ring(CX, CY, Math.min(210, Math.min(CX, CY) - 55), count, 0, 'circle') };
  }

  // ── PATTERN 5: N ROWS OF M ────────────────────────────────────────────────
  const nRowsMatch = lower.match(/(\d+)\s*rows?\s*of\s*(\d+)/);
  if (nRowsMatch) {
    const rowCount = Math.min(parseInt(nRowsMatch[1]), 4);
    const colCount = Math.min(parseInt(nRowsMatch[2]), 6);
    const total    = Math.min(rowCount * colCount, 12);
    const type     = shapeType(lower);
    const gapX     = colCount > 1 ? (CANVAS_W - 160) / (colCount - 1) : 0;
    const gapY     = rowCount > 1 ? (CANVAS_H - 160) / (rowCount - 1) : 0;
    const sx       = colCount > 1 ? 80 : CX;
    const sy       = rowCount > 1 ? 80 : CY;
    const nodes: AINode[] = [];
    let idx = 0;
    for (let r = 0; r < rowCount && idx < total; r++) {
      for (let c = 0; c < colCount && idx < total; c++, idx++) {
        nodes.push({
          type, label: label(idx), fill: color(idx),
          x: clampX(sx + c * gapX),
          y: clampY(sy + r * gapY),
          ...(type === 'circle' ? { radius: 22 } : { width: 80, height: 50 }),
        });
      }
    }
    return { nodes };
  }

  // ── PATTERN 6: SINGLE ROW with optional extra shape above/below ───────────
  const countMatch = lower.match(/(\d+)\s*(?:rect|circle|node|shape)/);
  const mainCount  = countMatch ? Math.min(parseInt(countMatch[1]), 12) : 4;
  const hasAbove2  = lower.includes('above') || lower.includes('top') || lower.includes('over');
  const hasBelow2  = lower.includes('below') || lower.includes('bottom');
  const type       = shapeType(lower);
  const mainY      = hasAbove2 ? CY + 100 : hasBelow2 ? CY - 100 : CY;
  const nodes      = row(mainCount, mainY, type, 0);

  if ((hasAbove2 || hasBelow2) && nodes.length < 12) {
    nodes.push({
      type: 'circle',
      x: CX,
      y: hasAbove2 ? CY - 150 : CY + 150,
      radius: 25,
      label: label(nodes.length),
      fill: color(nodes.length),
    });
  }
  return { nodes };
}

// ── Sanitize & clamp ──────────────────────────────────────────────────────────
function sanitize(raw: AIResponse): AIResponse {
  const nodes = raw.nodes.slice(0, 12).map((n, i) => {
    const type: ShapeType =
      n.type === 'rectangle' ? 'rectangle' : 'circle';
    const fill =
      typeof n.fill === 'string' && n.fill.startsWith('#')
        ? n.fill
        : color(i);
    const lbl = String(n.label ?? label(i)).slice(0, 2);
    const x   = clampX(n.x);
    const y   = clampY(n.y);

    return type === 'circle'
      ? { type, x, y, radius: Math.min(35, Math.max(15, n.radius ?? 22)), label: lbl, fill }
      : {
          type, x, y,
          width:  Math.min(120, Math.max(60, n.width  ?? 80)),
          height: Math.min(70,  Math.max(40, n.height ?? 50)),
          label: lbl, fill,
        };
  });
  return { nodes };
}

// ── Public entry point ────────────────────────────────────────────────────────
export async function generateLayout(prompt: string): Promise<AIResponse> {
  if (groq) {
    try {
      const result = await callGroq(prompt);
      const sanitized = sanitize(result);
      if (sanitized.nodes.length > 0) return sanitized;
      throw new Error('AI returned 0 nodes');
    } catch (err) {
      console.warn('[AI] Groq failed, using fallback:', (err as Error).message);
    }
  }
  console.log('[Fallback] Structured logic for:', prompt);
  return sanitize(structuredFallback(prompt));
}