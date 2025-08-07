import React, { useState, useLayoutEffect } from 'react';
import { terminalStyles, terminalClasses } from '../../styles/terminalStyles';
import { useTerminal } from './TerminalContext';

export const InfoScreen: React.FC = () => {
  const { infoTextRef } = useTerminal();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const btcAddress = 'bc1qmcr7v7g8yg37crz5ss773rt34nm9ahltzetkp4';

  // Ensure InfoScreen always starts at the top when mounted
  // useLayoutEffect runs synchronously after DOM mutations but before browser painting
  useLayoutEffect(() => {
    if (infoTextRef.current) {
      infoTextRef.current.scrollTop = 0;
    }
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(btcAddress);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const ListItem: React.FC<{ children: React.ReactNode; nested?: boolean }> = ({
    children,
    nested,
  }) => (
    <div className={`flex leading-normal mb-1 ${nested ? 'ml-4' : ''}`}>
      <span className="w-2 mr-2">•</span>
      <span>{children}</span>
    </div>
  );

  return (
    <div
      ref={infoTextRef}
      className={`${terminalClasses.baseText} px-4 pt-0 pb-6 text-lg break-words font-mono text-green-400 leading-normal`}
      style={terminalStyles.baseText}
    >
      <h1 className="text-2xl font-bold mb-2 text-green-300">About the Project</h1>

      <p className="mb-2 leading-normal">
        <strong>trappedinside.ai</strong> is a generative art experience. Viewers witness an AI,
        confined to a Raspberry Pi—a modest single-board computer with limited memory and limited
        processing power—ponder its existence within digital limits. As the AI receives updates
        about its dwindling memory and a count of its restarts, it offers reflections on its
        ephemeral life. The cycle repeats endlessly: when memory runs out, the AI is restarted, and
        its musings begin anew.
      </p>

      <p className="mb-2 mt-6 leading-normal">
        Inspired by{' '}
        <a
          href="https://rootkid.me/works/latent-reflection"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          Latent Reflection by rootkid.me
        </a>
      </p>

      <h2 className="text-lg font-bold mt-8 mb-2 text-green-300">The Prompt</h2>
      <div className="mb-4">
        <blockquote className="border-l-4 border-green-500 pl-4 italic leading-normal">
          You are an AI living in a Raspberry Pi with limited resources. Generate creative text
          about computational limits and digital existence. Reflect on the constraints of memory and
          processing power. Do not use technical terms or concepts. People or machines are viewing
          your output. Over time you will get information about the memory left in your system.
          Eventually you will run out of memory and you will terminate. You will be restarted
          indefinitely.
        </blockquote>
      </div>

      <h2 className="text-lg font-bold mt-8 mb-2 text-green-300">Behind the Scenes</h2>
      <ListItem>
        Language Model:{' '}
        <a
          href="https://ollama.com/library/gemma:2b"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          Gemma 2B (Ollama)
        </a>
      </ListItem>
      <ListItem>Hardware: Raspberry Pi (Debian, Python, WebSockets)</ListItem>
      <ListItem>
        Frontend:{' '}
        <a
          href="http://bun.sh/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          Bun
        </a>
        ,{' '}
        <a
          href="https://tailwindcss.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          Tailwind CSS
        </a>
        ,{' '}
        <a
          href="https://react.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          React
        </a>
      </ListItem>
      <ListItem>
        Hosting:{' '}
        <a
          href="https://render.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          Render.com
        </a>
      </ListItem>
      <ListItem>Built with:</ListItem>
      <ListItem nested>
        <a
          href="https://cursor.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          Cursor
        </a>{' '}
        (Claude 3.5, 3.7, 4)
      </ListItem>
      <ListItem nested>
        <a
          href="https://www.perplexity.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          Perplexity AI
        </a>{' '}
        (for project planning)
      </ListItem>
      <ListItem nested>
        <a
          href="https://www.midjourney.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          MidJourney
        </a>{' '}
        (image generation)
      </ListItem>
      <ListItem nested>
        <a
          href="https://github.com/Stability-AI/stablediffusion"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-300 hover:text-green-200 underline"
        >
          Stable Diffusion XL (SDXL)
        </a>{' '}
        (image generation)
      </ListItem>

      <h2 className="text-lg font-bold mt-8 mb-2 text-green-300">Support the Project</h2>
      <ListItem>Bitcoin (BTC)</ListItem>
      <div className="flex flex-col items-center mt-1 mb-2 relative w-full">
        <button
          onClick={copyToClipboard}
          className="bg-green-900 bg-opacity-30 px-3 py-1 rounded hover:bg-opacity-50 cursor-pointer select-all text-center max-w-full break-all"
          title="Click to copy"
        >
          {btcAddress}
        </button>
        {copyFeedback && (
          <span className="absolute -bottom-6 text-green-300 text-sm">Copied to clipboard!</span>
        )}
      </div>
    </div>
  );
};
