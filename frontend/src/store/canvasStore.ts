import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CanvasNode, CanvasState } from '../types';

interface CanvasStore extends CanvasState {
  isGenerating: boolean;
  error: string | null;

  // Actions
  setNodes: (nodes: CanvasNode[]) => void;
  setCanvasState: (state: CanvasState) => void;
  moveNode: (id: string, x: number, y: number) => void;
  setGenerating: (v: boolean) => void;
  setError: (msg: string | null) => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set) => ({
      nodes:       [],
      prompt:      '',
      updatedAt:   0,
      isGenerating: false,
      error:       null,

      setNodes: (nodes) => set({ nodes }),

      setCanvasState: (state) =>
        set({ nodes: state.nodes, prompt: state.prompt, updatedAt: state.updatedAt }),

      moveNode: (id, x, y) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
          updatedAt: Date.now(),
        })),

      setGenerating: (v) => set({ isGenerating: v, error: null }),

      setError: (msg) => set({ error: msg, isGenerating: false }),

      clearCanvas: () => set({ nodes: [], prompt: '', updatedAt: Date.now() }),
    }),
    {
      name: 'canvas-state',   // localStorage key — bonus: persists across refresh
      partialize: (s) => ({ nodes: s.nodes, prompt: s.prompt, updatedAt: s.updatedAt }),
    }
  )
);
