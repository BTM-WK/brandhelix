/**
 * Lightweight Markdown → styled HTML converter for blog content rendering.
 *
 * No external dependencies — pure TypeScript.
 * Supports:
 *   - Headings: # H1, ## H2, ### H3
 *   - Bold: **bold**, Italic: *italic*
 *   - Links: [text](url)  — target="_blank" rel="noopener noreferrer"
 *   - Unordered lists: - item  /  * item
 *   - Ordered lists: 1. item
 *   - Blockquotes: > text
 *   - Inline code: `code`
 *   - Fenced code blocks: ``` ... ```
 *   - Horizontal rules: ---
 *   - Tables: | col1 | col2 |
 *   - Paragraphs (double-newline separated)
 *   - Hard line breaks within paragraphs (two trailing spaces or \\n)
 *
 * Output is wrapped in <div class="blog-content">…</div>.
 * Korean text: no special handling needed; regex doesn't break on Korean chars.
 */

// ── Public interface ──────────────────────────────────────────────────────────

export interface MarkdownOptions {
  /** Used for links and highlight accents. E.g. '#FF4444' */
  brandAccentColor?: string;
  /** Base font size scale for the rendered content */
  fontSize?: 'sm' | 'base' | 'lg';
}

// ── HTML entity escaping ──────────────────────────────────────────────────────

/**
 * Escape the five core HTML entities to prevent XSS.
 * Applied to all user-provided text before inserting into HTML.
 */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Inline Markdown rendering ─────────────────────────────────────────────────

/**
 * Convert inline Markdown syntax to HTML within a single line/paragraph.
 * Handles: bold, italic, inline code, links.
 * Input is assumed to be already HTML-entity-escaped EXCEPT for the known
 * Markdown tokens we are about to process.
 *
 * Order matters: code spans first (prevents processing inner * or _).
 */
function renderInline(text: string, accentColor?: string): string {
  // 1. Escape HTML entities first (so raw < > & in user text are safe)
  let result = escapeHtml(text);

  // 2. Inline code — replace BEFORE bold/italic to protect backtick content
  result = result.replace(/`([^`]+?)`/g, '<code>$1</code>');

  // 3. Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // 4. Italic: *text* or _text_ (but not ** or __)
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  result = result.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // 5. Links: [text](url)
  const linkColor = accentColor ?? 'inherit';
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, linkText: string, href: string) => {
      // href was already escaped via escapeHtml above; decode &amp; back for href attr
      const safeHref = href.replace(/&amp;/g, '&');
      return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer" style="color:${linkColor}">${linkText}</a>`;
    }
  );

  return result;
}

// ── Block-level Markdown parsing state machine ────────────────────────────────

type BlockState =
  | 'idle'
  | 'paragraph'
  | 'ul'
  | 'ol'
  | 'blockquote'
  | 'code_fence'
  | 'table';

/**
 * Convert a Markdown string to an HTML string.
 * Wrapped in <div class="blog-content">…</div>.
 */
export function markdownToHtml(markdown: string, options?: MarkdownOptions): string {
  const accentColor = options?.brandAccentColor;

  // Normalize line endings, strip trailing whitespace on each line
  const lines = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const outputParts: string[] = [];

  let state: BlockState = 'idle';
  // Buffers for multi-line constructs
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let blockquoteLines: string[] = [];
  let codeFenceLang = '';
  let codeFenceLines: string[] = [];
  let tableLines: string[] = [];

  // ── Flush helpers ──────────────────────────────────────────────────────────

  function flushParagraph() {
    if (paragraphLines.length === 0) return;
    // Join with <br> for hard line breaks, render inline markdown
    const html = paragraphLines
      .map((l) => renderInline(l, accentColor))
      .join('<br>');
    outputParts.push(`<p>${html}</p>`);
    paragraphLines = [];
  }

  function flushList() {
    if (listItems.length === 0) return;
    const tag = listOrdered ? 'ol' : 'ul';
    const itemsHtml = listItems
      .map((item) => `<li>${renderInline(item, accentColor)}</li>`)
      .join('\n');
    outputParts.push(`<${tag}>\n${itemsHtml}\n</${tag}>`);
    listItems = [];
  }

  function flushBlockquote() {
    if (blockquoteLines.length === 0) return;
    const inner = blockquoteLines
      .map((l) => renderInline(l, accentColor))
      .join('<br>');
    outputParts.push(`<blockquote>${inner}</blockquote>`);
    blockquoteLines = [];
  }

  function flushCodeFence() {
    if (codeFenceLines.length === 0 && codeFenceLang === '') {
      codeFenceLang = '';
      return;
    }
    // Escape HTML entities inside code blocks (no inline rendering)
    const codeContent = codeFenceLines.map(escapeHtml).join('\n');
    const langAttr = codeFenceLang
      ? ` class="language-${escapeHtml(codeFenceLang)}"`
      : '';
    outputParts.push(`<pre><code${langAttr}>${codeContent}</code></pre>`);
    codeFenceLines = [];
    codeFenceLang = '';
  }

  function flushTable() {
    if (tableLines.length < 2) {
      // Not enough lines for a valid table — fall back to paragraphs
      tableLines.forEach((l) => outputParts.push(`<p>${renderInline(l, accentColor)}</p>`));
      tableLines = [];
      return;
    }

    const rows = tableLines.map((line) =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())
    );

    // Row 0: headers. Row 1: separator (---|---). Row 2+: data.
    const headerCells = rows[0]!;
    // Row 1 is the separator — skip it
    const dataRows = rows.slice(2);

    const thead =
      '<thead><tr>' +
      headerCells
        .map((cell) => `<th>${renderInline(cell, accentColor)}</th>`)
        .join('') +
      '</tr></thead>';

    const tbody =
      '<tbody>' +
      dataRows
        .map(
          (row, idx) =>
            `<tr class="${idx % 2 === 0 ? 'even' : 'odd'}">` +
            row.map((cell) => `<td>${renderInline(cell, accentColor)}</td>`).join('') +
            '</tr>'
        )
        .join('\n') +
      '</tbody>';

    outputParts.push(`<table>\n${thead}\n${tbody}\n</table>`);
    tableLines = [];
  }

  function flushCurrent() {
    switch (state) {
      case 'paragraph':    flushParagraph();   break;
      case 'ul':
      case 'ol':           flushList();        break;
      case 'blockquote':   flushBlockquote();  break;
      case 'code_fence':   flushCodeFence();   break;
      case 'table':        flushTable();       break;
      default:             break;
    }
    state = 'idle';
  }

  // ── Line-by-line processing ────────────────────────────────────────────────

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const line = raw; // keep original for patterns that need leading whitespace

    // ── Code fence: open or inside ─────────────────────────────────────────
    if (state === 'code_fence') {
      if (/^```/.test(line)) {
        // Closing fence
        flushCodeFence();
        state = 'idle';
      } else {
        codeFenceLines.push(line);
      }
      continue;
    }

    // ── Opening code fence ─────────────────────────────────────────────────
    if (/^```/.test(line)) {
      flushCurrent();
      codeFenceLang = line.slice(3).trim();
      state = 'code_fence';
      continue;
    }

    // ── Horizontal rule ────────────────────────────────────────────────────
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      flushCurrent();
      outputParts.push('<hr>');
      state = 'idle';
      continue;
    }

    // ── Headings ───────────────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushCurrent();
      const level = headingMatch[1]!.length;
      const headingText = renderInline(headingMatch[2]!, accentColor);
      outputParts.push(`<h${level}>${headingText}</h${level}>`);
      state = 'idle';
      continue;
    }

    // ── Table row: line contains | ─────────────────────────────────────────
    // A table row must start with | or have | separators; we detect it broadly.
    if (/^\|.+\|/.test(line)) {
      if (state !== 'table') {
        flushCurrent();
        state = 'table';
      }
      tableLines.push(line);
      continue;
    } else if (state === 'table') {
      // Non-table line encountered while in table state — flush and reprocess
      flushTable();
      state = 'idle';
      // Fall through to reprocess this line
    }

    // ── Unordered list item ────────────────────────────────────────────────
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (state !== 'ul') {
        flushCurrent();
        state = 'ul';
        listOrdered = false;
      }
      listItems.push(ulMatch[1]!);
      continue;
    }

    // ── Ordered list item ──────────────────────────────────────────────────
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (state !== 'ol') {
        flushCurrent();
        state = 'ol';
        listOrdered = true;
      }
      listItems.push(olMatch[1]!);
      continue;
    }

    // ── Blockquote ─────────────────────────────────────────────────────────
    const bqMatch = line.match(/^>\s?(.*)$/);
    if (bqMatch) {
      if (state !== 'blockquote') {
        flushCurrent();
        state = 'blockquote';
      }
      blockquoteLines.push(bqMatch[1]!);
      continue;
    }

    // ── Empty line ─────────────────────────────────────────────────────────
    if (line.trim() === '') {
      flushCurrent();
      state = 'idle';
      continue;
    }

    // ── Regular paragraph text ─────────────────────────────────────────────
    if (state !== 'paragraph') {
      flushCurrent();
      state = 'paragraph';
    }
    paragraphLines.push(line);
  }

  // Flush whatever was in progress at EOF
  flushCurrent();

  return `<div class="blog-content">\n${outputParts.join('\n')}\n</div>`;
}

// ── CSS style block ───────────────────────────────────────────────────────────

/**
 * Returns a <style> tag string that styles .blog-content and its children.
 *
 * Includes:
 * - Clean typography (line-height 1.8, margin rhythm)
 * - Responsive heading sizes (clamp)
 * - Styled blockquotes (left accent border + tinted background)
 * - Table with borders, padding, zebra stripes
 * - Code block and inline code styling
 * - Optional accent color for links
 */
export function getBlogContentStyles(options?: MarkdownOptions): string {
  const accent = options?.brandAccentColor ?? '#0066CC';

  // Base font size map
  const fontSizeMap: Record<NonNullable<MarkdownOptions['fontSize']>, string> = {
    sm: '14px',
    base: '16px',
    lg: '18px',
  };
  const baseFontSize = fontSizeMap[options?.fontSize ?? 'base'];

  return `<style>
.blog-content {
  font-size: ${baseFontSize};
  line-height: 1.8;
  color: #1a1a1a;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* ── Paragraphs ── */
.blog-content p {
  margin-top: 0;
  margin-bottom: 1.25em;
}

/* ── Headings ── */
.blog-content h1,
.blog-content h2,
.blog-content h3 {
  font-weight: 700;
  line-height: 1.3;
  margin-top: 1.75em;
  margin-bottom: 0.6em;
  color: #111111;
}

.blog-content h1 {
  font-size: clamp(1.6rem, 4vw, 2.25rem);
  border-bottom: 2px solid ${accent};
  padding-bottom: 0.25em;
}

.blog-content h2 {
  font-size: clamp(1.3rem, 3vw, 1.75rem);
}

.blog-content h3 {
  font-size: clamp(1.1rem, 2.5vw, 1.35rem);
}

/* ── Links ── */
.blog-content a {
  color: ${accent};
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: opacity 0.15s ease;
}

.blog-content a:hover {
  opacity: 0.75;
}

/* ── Bold and italic ── */
.blog-content strong {
  font-weight: 700;
}

.blog-content em {
  font-style: italic;
}

/* ── Horizontal rule ── */
.blog-content hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2em 0;
}

/* ── Lists ── */
.blog-content ul,
.blog-content ol {
  margin-top: 0;
  margin-bottom: 1.25em;
  padding-left: 1.75em;
}

.blog-content li {
  margin-bottom: 0.35em;
}

.blog-content ul {
  list-style-type: disc;
}

.blog-content ol {
  list-style-type: decimal;
}

/* ── Blockquote ── */
.blog-content blockquote {
  margin: 1.5em 0;
  padding: 1em 1.25em;
  border-left: 4px solid ${accent};
  background-color: color-mix(in srgb, ${accent} 8%, #ffffff);
  color: #444444;
  font-style: italic;
  border-radius: 0 6px 6px 0;
}

/* Fallback for browsers without color-mix */
@supports not (background-color: color-mix(in srgb, red 10%, white)) {
  .blog-content blockquote {
    background-color: #f5f5f5;
  }
}

/* ── Inline code ── */
.blog-content code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875em;
  background-color: #f3f4f6;
  color: #374151;
  padding: 0.15em 0.4em;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

/* ── Fenced code blocks ── */
.blog-content pre {
  margin: 1.5em 0;
  padding: 1.25em 1.5em;
  background-color: #1e1e2e;
  border-radius: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.blog-content pre code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875em;
  line-height: 1.6;
  background-color: transparent;
  color: #cdd6f4;
  padding: 0;
  border: none;
  border-radius: 0;
}

/* ── Tables ── */
.blog-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.9375em;
  overflow-x: auto;
  display: block;
}

.blog-content thead {
  background-color: ${accent};
  color: #ffffff;
}

.blog-content th {
  padding: 0.65em 1em;
  text-align: left;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, ${accent} 70%, #000000);
  white-space: nowrap;
}

@supports not (border-color: color-mix(in srgb, red 70%, black)) {
  .blog-content th {
    border-color: #cccccc;
  }
}

.blog-content td {
  padding: 0.6em 1em;
  border: 1px solid #e5e7eb;
  vertical-align: top;
}

/* Zebra striping: rows with class .even get white, .odd get light gray */
.blog-content tbody tr.even {
  background-color: #ffffff;
}

.blog-content tbody tr.odd {
  background-color: #f9fafb;
}

.blog-content tbody tr:hover {
  background-color: color-mix(in srgb, ${accent} 6%, #ffffff);
}

@supports not (background-color: color-mix(in srgb, red 6%, white)) {
  .blog-content tbody tr:hover {
    background-color: #f0f0f0;
  }
}
</style>`;
}
