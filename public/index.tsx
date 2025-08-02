import React from 'react';
import { createRoot } from 'react-dom/client';
import { TerminalProvider } from './components/terminal/TerminalContext';
import { Terminal } from './components/terminal/Terminal';

function App() {
  return (
    <TerminalProvider>
      <Terminal />
    </TerminalProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
