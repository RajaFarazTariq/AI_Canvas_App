import React, { useState, KeyboardEvent } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useSocket } from '../hooks/useSocket';

const EXAMPLES = [
  'Create a star layout with 1 center node and 6 surrounding nodes',
  'Create a 3x4 grid of circles labeled A–L',
  'Create 4 rectangles in a row and 1 circle above center',
  'Create 5 circles in a pentagon layout',
  'Create 2 rows of 4 rectangles each',
];

export const PromptBar: React.FC = () => {
  const [input, setInput]   = useState('');
  const [active, setActive] = useState<string | null>(null);
  const { isGenerating, error, prompt: lastPrompt, clearCanvas } = useCanvasStore();
  const { emitGenerate } = useSocket();

  const submit = (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isGenerating) return;
    emitGenerate(trimmed);
    setInput('');
    setActive(trimmed);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  const handleChip = (ex: string) => {
    setInput(ex);
    submit(ex);
  };

  return (
    <div className="prompt-bar">

      {/* ── Header row ── */}
      <div className="prompt-bar__header">
        <div className="prompt-bar__logo">
          {/* Logo mark */}
          <div className="prompt-bar__logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className="prompt-bar__logo-text">AI Canvas</span>
          <span className="prompt-bar__logo-badge">LIVE</span>
        </div>

        <div className="prompt-bar__meta">
          {lastPrompt && (
            <span className="prompt-bar__last">
              Last: <em>"{lastPrompt.slice(0, 38)}{lastPrompt.length > 38 ? '…' : ''}"</em>
            </span>
          )}
          <button className="prompt-bar__clear" onClick={clearCanvas} title="Clear canvas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* ── Input row ── */}
      <div className="prompt-bar__input-row">
        <div className="prompt-bar__input-wrap">
          <span className="prompt-bar__input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            className="prompt-bar__input"
            type="text"
            placeholder="Describe a layout…  e.g. '5 circles in a star pattern'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isGenerating}
            autoFocus
          />
        </div>
        <button
          className={`prompt-bar__btn${isGenerating ? ' prompt-bar__btn--loading' : ''}`}
          onClick={() => submit()}
          disabled={isGenerating || !input.trim()}
        >
          {isGenerating ? (
            <>
              <span className="spinner" />
              Generating…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="prompt-bar__error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Example chips ── */}
      <div className="prompt-bar__examples">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            className={`prompt-bar__chip${active === ex ? ' active' : ''}`}
            onClick={() => handleChip(ex)}
            disabled={isGenerating}
          >
            {ex}
          </button>
        ))}
      </div>

    </div>
  );
};
