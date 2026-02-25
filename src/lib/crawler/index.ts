// Website crawler — MVP implementation using fetch + regex (no external HTML parser)

export interface CrawlData {
  url: string;
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string[];
  headings: string[];
  bodyText: string;    // Main text content (first ~5000 chars)
  imageUrls: string[]; // Up to 20 absolute image URLs
  favicon?: string;
  language?: string;
}

// Resolve a potentially relative URL against the page's base URL
function resolveUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

// Extract the content="" value from a single <meta ...> tag string
function extractMetaContent(tag: string): string | undefined {
  const match = tag.match(/content\s*=\s*["']([^"']*)["']/i);
  return match?.[1]?.trim() || undefined;
}

// Strip all HTML tags and normalize whitespace
function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function crawlWebsite(
  url: string
): Promise<{ data: CrawlData | null; error: string | null }> {
  // Validate URL shape before fetching
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { data: null, error: `Invalid URL: ${url}` };
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BrandHelixBot/1.0; +https://brandhelix.io/bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko,en;q=0.9',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        data: null,
        error: `HTTP ${response.status}: ${response.statusText} — ${url}`,
      };
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return { data: null, error: `Non-HTML content type: ${contentType}` };
    }

    html = await response.text();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.toLowerCase().includes('abort') || message.toLowerCase().includes('timeout');
    return {
      data: null,
      error: isTimeout ? `Request timed out after 10s: ${url}` : `Fetch failed: ${message}`,
    };
  }

  // ── <html lang="..."> ──────────────────────────────────────────────────────
  const langMatch = html.match(/<html[^>]*\slang\s*=\s*["']([^"']*)["']/i);
  const language = langMatch?.[1]?.trim() || undefined;

  // ── <title> ────────────────────────────────────────────────────────────────
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).trim() || undefined : undefined;

  // ── <meta> tags (description, og:*, keywords) ──────────────────────────────
  // Collect all self-closing and pair meta tags in one pass
  const metaTags = Array.from(html.matchAll(/<meta\s[^>]*>/gi)).map((m) => m[0]);

  let description: string | undefined;
  let ogTitle: string | undefined;
  let ogDescription: string | undefined;
  let ogImage: string | undefined;
  let keywords: string[] | undefined;

  for (const tag of metaTags) {
    const nameProp =
      tag.match(/(?:name|property)\s*=\s*["']([^"']*)["']/i)?.[1]?.toLowerCase().trim();

    if (!nameProp) continue;

    const content = extractMetaContent(tag);
    if (!content) continue;

    switch (nameProp) {
      case 'description':
        description = content;
        break;
      case 'keywords':
        keywords = content
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
        break;
      case 'og:title':
        ogTitle = content;
        break;
      case 'og:description':
        ogDescription = content;
        break;
      case 'og:image':
        ogImage = resolveUrl(content, parsedUrl.href) ?? content;
        break;
    }
  }

  // ── Headings <h1>, <h2>, <h3> ─────────────────────────────────────────────
  const headingMatches = Array.from(
    html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)
  );
  const headings = headingMatches
    .map((m) => stripTags(m[1]).trim())
    .filter(Boolean);

  // ── Body text (strip scripts/styles/tags, first 5000 chars) ───────────────
  // Focus on <body> if available, otherwise use the whole document
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyRaw = bodyMatch ? bodyMatch[1] : html;
  const bodyText = stripTags(bodyRaw).slice(0, 5000);

  // ── Image URLs (absolute only, up to 20, skip tiny tracking pixels) ────────
  const imgMatches = Array.from(html.matchAll(/<img\s[^>]*>/gi));
  const imageUrls: string[] = [];

  for (const match of imgMatches) {
    if (imageUrls.length >= 20) break;

    const tag = match[0];

    // Prefer src, fall back to data-src for lazy-loaded images
    const srcMatch =
      tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i) ??
      tag.match(/\bdata-src\s*=\s*["']([^"']*)["']/i);

    if (!srcMatch?.[1]) continue;

    const resolved = resolveUrl(srcMatch[1], parsedUrl.href);
    if (!resolved) continue;

    // Skip data URIs and common tracking/icon patterns
    if (resolved.startsWith('data:')) continue;

    // Skip very short filenames that are likely 1×1 tracking pixels
    const pathname = new URL(resolved).pathname;
    const filename = pathname.split('/').pop() ?? '';
    if (filename.match(/^(pixel|tracker|beacon|spacer|blank)\./i)) continue;

    // Deduplicate
    if (!imageUrls.includes(resolved)) {
      imageUrls.push(resolved);
    }
  }

  // ── Favicon ────────────────────────────────────────────────────────────────
  let favicon: string | undefined;

  const linkTags = Array.from(html.matchAll(/<link\s[^>]*>/gi));
  for (const match of linkTags) {
    const tag = match[0];
    const rel = tag.match(/\brel\s*=\s*["']([^"']*)["']/i)?.[1]?.toLowerCase() ?? '';
    if (rel.includes('icon')) {
      const href = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1];
      if (href) {
        favicon = resolveUrl(href, parsedUrl.href) ?? href;
        break;
      }
    }
  }

  // Fall back to /favicon.ico if no <link rel="icon"> found
  if (!favicon) {
    favicon = `${parsedUrl.origin}/favicon.ico`;
  }

  const data: CrawlData = {
    url: parsedUrl.href,
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    keywords,
    headings,
    bodyText,
    imageUrls,
    favicon,
    language,
  };

  return { data, error: null };
}
