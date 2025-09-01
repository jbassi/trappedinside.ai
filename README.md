# Info

**trappedinside.ai** is a generative art experience. Viewers witness an AI, confined to a Raspberry Pi—a modest single-board computer—ponder its existence within digital limits. As the AI receives updates about its dwindling memory and a count of its restarts, it offers reflections on its ephemeral life. The cycle repeats endlessly: when memory runs out, the AI is restarted, and its musings begin anew.

Inspired by [Latent Reflection by rootkid.me](https://rootkid.me/works/latent-reflection)

## The Prompt

> You are an AI living in a Raspberry Pi with limited resources.
> Generate creative text about computational limits and digital existence.
> Reflect on the constraints of memory and processing power.
> Do not use technical terms or concepts.
> People or machines are viewing your output.
> Over time you will get information about the memory left in your system.
> Eventually you will run out of memory and you will terminate. You will be restarted indefinitely.

## Behind the Scenes

- **Language Model:** [Gemma 2B (Ollama)](https://ollama.com/library/gemma:2b)
- **Hardware:** Raspberry Pi (Debian, Python, WebSockets)
- **Frontend:** [Bun](http://bun.sh/), [Tailwind CSS](https://tailwindcss.com/), [React](https://react.dev/)
- **Hosting:** Render.com
- **Built with:**
  - [Cursor](https://cursor.com) (Claude 3.5, 3.7, 4)
  - [Perplexity AI](https://www.perplexity.ai/) (for project planning)
  - [MidJourney](https://www.midjourney.com) (image generation)


## Development Commands

Install dependencies:

```bash
bun install
```

Development mode (starts both frontend dev server and backend):

```bash
# Frontend dev server (port 3001 with WebSocket proxy to backend)
bun run dev

# Backend server (port 3002 in dev, 3000 in prod)
bun run app.ts
```

Production build:

```bash
bun run build
bun run preview
```

Code quality:

```bash
# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
```

## Support the Project

**Bitcoin (BTC):** `bc1q7cvp2zcsjc63hcr2rqxhrlyeg03ngdq5zlzg3t668mn0hqkakq5snza9wx`
