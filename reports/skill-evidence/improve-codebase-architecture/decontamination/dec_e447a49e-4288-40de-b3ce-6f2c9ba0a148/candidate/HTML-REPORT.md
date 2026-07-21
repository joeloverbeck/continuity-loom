# HTML Report Format

Render the architecture review as one self-contained HTML file in the OS temp
directory. Tailwind and Mermaid come from CDNs; the report is otherwise static.
Use Mermaid for graph-shaped dependencies and sequences, and hand-built HTML/CSS
or inline SVG for editorial visuals such as mass diagrams and cross-sections.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review — {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

The only scripts are the Tailwind CDN and Mermaid ESM import. Add no app code or
interactivity beyond Mermaid rendering.

## Header

Show repository name, date, and a compact legend: solid box = module, dashed line
= seam, red arrow = leakage, thick dark box = deep module. Start with the
candidates; omit an introduction paragraph.

## Candidate cards

Each candidate is one `<article>` containing:

- **Title** — short and names the deepening.
- **Badge row** — `Strong`, `Worth exploring`, or `Speculative`, plus the
  `/codebase-design` dependency category.
- **Files** — a monospaced list.
- **Evidence** — compact method/count facts, deletion-test result, call-site
  checks, and exact line references.
- **Before / After** — a side-by-side visual that carries the explanation.
- **Problem** and **Solution** — one sentence each.
- **Wins** — bullets of at most six words, naming locality, leverage, interface,
  or test-surface gains.
- **Principle / ADR callout** — when applicable, amber for a conflict worth
  reopening or emerald for an authority that already endorses the candidate.

Keep prose sparse. If a diagram needs a paragraph to make sense, redraw it.

## Diagram patterns

Choose the pattern that fits each candidate and vary the report.

### Mermaid flow or sequence

Use for dependency, call-flow, or round-trip changes. Wrap it in the report's
visual style and mark leakage in red.

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### Hand-built boxes and arrows

Use positioned HTML boxes plus inline SVG paths when the after view should show
one thick deep module with muted internals and Mermaid's layout would fight it.

### Cross-section

Use stacked horizontal bands for layered shallowness: many thin layers before,
one thick responsibility-owning module after.

### Mass diagram

Compare interface surface with implementation depth: nearly equal rectangles
before, then a small interface over a deep implementation.

### Call-graph collapse

Show a function tree before and one module after, with the former calls faded as
internal implementation.

## Style and vocabulary

Load `/codebase-design` and use its glossary and rejected framings exactly; do
not restate or rename them in the report. Use the relevant domain glossary for
domain nouns.

Aim for an editorial, not dashboard-like, page: generous whitespace, sparse
colour, varied diagrams, and diagrams about 320px tall so before/after views fit
side by side. Use one accent plus red leakage, amber conflicts, and emerald
endorsements. Schematic labels may use `text-xs uppercase tracking-wider`.

Wins name the architectural gain, for example `Tests hit one interface` or
`Locality: rules stay together`; avoid generic claims such as “cleaner code.”

## Top recommendation

End with one larger card containing the candidate name, one sentence explaining
why it wins, and an anchor link to its candidate card.
