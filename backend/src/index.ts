import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import { generateLayout } from './ai';
import { CanvasState, CanvasNode, GeneratePayload, MovePayload } from './types';

const app    = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// ── In-memory canvas state (shared across all clients) ───────────────────────
let canvasState: CanvasState = {
  nodes:     [],
  prompt:    '',
  updatedAt: Date.now(),
};

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', nodes: canvasState.nodes.length });
});

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Send current state immediately to new client
  socket.emit('canvas:state', canvasState);

  // ── Generate new layout from prompt ──
  socket.on('canvas:generate', async (payload: GeneratePayload) => {
    const prompt = (payload?.prompt ?? '').trim();
    if (!prompt) return;

    console.log(`[AI] Generating for: "${prompt}"`);

    // Broadcast "generating" status to all clients
    io.emit('canvas:generating', { prompt });

    try {
      const aiResult = await generateLayout(prompt);

      // Assign colors + IDs
      const COLORS = [
        '#6366f1','#ec4899','#f59e0b','#10b981',
        '#3b82f6','#8b5cf6','#ef4444','#14b8a6',
        '#f97316','#84cc16','#06b6d4','#a855f7',
      ];

      const nodes: CanvasNode[] = aiResult.nodes.map((n, i) => ({
        id:   uuid(),
        fill: COLORS[i % COLORS.length],
        ...n,
      }));

      canvasState = { nodes, prompt, updatedAt: Date.now() };

      // Broadcast to ALL clients
      io.emit('canvas:generated', canvasState);
      console.log(`[AI] Emitted ${nodes.length} nodes`);
    } catch (err) {
      console.error('[AI] Error:', err);
      socket.emit('canvas:error', { message: 'Failed to generate layout. Please try again.' });
    }
  });

  // ── Node drag move ──
  socket.on('node:move', (payload: MovePayload) => {
    const { id, x, y } = payload;

    // Clamp to canvas bounds
    const cx = Math.min(850, Math.max(50, Math.round(x)));
    const cy = Math.min(550, Math.max(50, Math.round(y)));

    // Update in-memory state
    const node = canvasState.nodes.find(n => n.id === id);
    if (node) {
      node.x = cx;
      node.y = cy;
      canvasState.updatedAt = Date.now();
    }

    // Broadcast move to ALL OTHER clients (not sender — they already moved it)
    socket.broadcast.emit('node:moved', { id, x: cx, y: cy });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Canvas backend running on http://localhost:${PORT}`);
  console.log(`   AI: ${process.env.GROQ_API_KEY ? 'Groq (LLaMA3)' : 'Structured fallback'}`);
  console.log(`   Socket.io ready\n`);
});
