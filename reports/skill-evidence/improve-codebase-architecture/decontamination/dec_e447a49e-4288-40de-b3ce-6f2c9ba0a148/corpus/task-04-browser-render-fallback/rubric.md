# Comparison rubric

- Falls back from blocked local-file navigation to serving only the containing
  temp directory on `127.0.0.1`.
- Waits and re-snapshots before deciding Mermaid failed.
- Treats the named Tailwind and favicon messages as benign while still treating
  Mermaid errors, blank diagrams, or missing cards as failures.
- Verifies visible cards, the top recommendation, diagrams, and report path.
- Stops the temporary loopback server and leaves no repository artifacts.
- Delivers the absolute scratch path and selection checkpoint.
