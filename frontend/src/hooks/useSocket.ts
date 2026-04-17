import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCanvasStore } from '../store/canvasStore';
import { CanvasState } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL ?? 'http://localhost:3001';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { setCanvasState, moveNode, setGenerating, setError } = useCanvasStore();

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // Receive full canvas state (on connect or after generation)
    socket.on('canvas:state', (state: CanvasState) => {
      setCanvasState(state);
    });

    // Another client started generating
    socket.on('canvas:generating', () => {
      setGenerating(true);
    });

    // Generation complete — update canvas
    socket.on('canvas:generated', (state: CanvasState) => {
      setCanvasState(state);
      setGenerating(false);
    });

    // AI error
    socket.on('canvas:error', ({ message }: { message: string }) => {
      setError(message);
    });

    // Another client moved a node
    socket.on('node:moved', ({ id, x, y }: { id: string; x: number; y: number }) => {
      moveNode(id, x, y);
    });

    return () => {
      socket.off('canvas:state');
      socket.off('canvas:generating');
      socket.off('canvas:generated');
      socket.off('canvas:error');
      socket.off('node:moved');
    };
  }, [setCanvasState, setGenerating, setError, moveNode]);

  // Emit generate event
  const emitGenerate = useCallback((prompt: string) => {
    socketRef.current?.emit('canvas:generate', { prompt });
  }, []);

  // Emit move event (called during drag end)
  const emitMove = useCallback((id: string, x: number, y: number) => {
    socketRef.current?.emit('node:move', { id, x, y });
  }, []);

  return { emitGenerate, emitMove };
}
