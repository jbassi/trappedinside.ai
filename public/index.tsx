import React from 'react';
import { createRoot } from 'react-dom/client';
import { TerminalProvider } from './components/terminal/TerminalContext';
import { Terminal } from './components/terminal/Terminal';

// Force a true reload when returning from BFCache (back/forward cache)
// This ensures a completely fresh state identical to a hard refresh
window.addEventListener('pageshow', (event: PageTransitionEvent) => {
  if (event.persisted) {
    window.location.reload();
  }
});

function App() {
  return (
    <TerminalProvider>
      <Terminal />
    </TerminalProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
