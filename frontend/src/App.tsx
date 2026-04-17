import React from 'react';
import { PromptBar } from './components/PromptBar';
import { Canvas }    from './components/Canvas';
import './App.css';

function App() {
  return (
    <div className="app">
      <PromptBar />
      <main className="app__main">
        <Canvas />
      </main>
      <footer className="app__footer">
        AI Canvas · Real-time sync via WebSockets · Drag shapes to reposition
      </footer>
    </div>
  );
}

export default App;
