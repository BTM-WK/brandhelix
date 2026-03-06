// Site Section HTML Generators — Engine 3, site-builder
// 10개 섹션 타입별 HTML 렌더링 함수.
// CSS custom properties (design tokens)를 사용하여 테마에 독립적인 HTML을 생성한다.

// ── Types ────────────────────────────────────────────────────────────────────

/** 섹션 카피 데이터. 키-값 쌍으로 섹션별 카피를 전달한다. */
export interface SectionCopy {
  [key: string]: string | string[] | undefined;
}

/** 섹션 렌더링 옵션 */
export interface SectionRenderOptions {
  brandName?: string;
  designTone?: string;
}

// ── HTML escape helper ───────────────────────────────────────────────────────

/** XSS 방지를 위한 HTML 이스케이프 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** 배열 또는 단일 문자열을 안전한 문자열로 변환 */
function safeString(value: string | string[] | undefined, fallback = ''): string {
  if (value === undefined) return fallback;
  if (Array.isArray(value)) return value.join(', ');
  return value;
}

/** 배열 값을 안전하게 추출 (문자열이면 쉼표 분리) */
function safeArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

// ── 1. Hero Section ──────────────────────────────────────────────────────────

/** 히어로 섹션 — 메인 비주얼 + 헤드라인 + CTA */
export function renderHeroSection(
  copy: SectionCopy,
  _options?: SectionRenderOptions
): string {
  const headline = escapeHtml(safeString(copy.headline, '당신의 브랜드, 새로운 시작'));
  const subheadline = escapeHtml(safeString(copy.subheadline, ''));
  const ctaText = escapeHtml(safeString(copy.ctaText, '자세히 보기'));

  return `<section class="bh-hero" style="background: var(--color-bg); padding: var(--spacing-section) 0; text-align: center;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    <h1 style="font-family: var(--font-heading); font-size: var(--font-size-hero); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 16px; line-height: 1.3;">
      ${headline}
    </h1>
    <p style="font-family: var(--font-body); font-size: var(--font-size-h3); color: var(--color-text-muted); margin: 0 0 40px; line-height: 1.6; max-width: 720px; margin-left: auto; margin-right: auto;">
      ${subheadline}
    </p>
    <a href="#cta" style="display: inline-block; padding: 16px 48px; background: var(--color-accent); color: #fff; font-family: var(--font-body); font-size: var(--font-size-body); font-weight: 600; border-radius: var(--border-radius); text-decoration: none; transition: var(--transition);">
      ${ctaText}
    </a>
  </div>
</section>`;
}

// ── 2. Features Section ──────────────────────────────────────────────────────

/** 특징/기능 소개 섹션 — 3~4개 피처 카드 그리드 */
export function renderFeaturesSection(
  copy: SectionCopy,
  _options?: SectionRenderOptions
): string {
  const sectionTitle = escapeHtml(safeString(copy.sectionTitle, '핵심 특장점'));
  const sectionSubtitle = escapeHtml(safeString(copy.sectionSubtitle, ''));

  // 개별 피처 렌더링 (최대 4개)
  const features: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const title = safeString(copy[`feature${i}Title`]);
    const desc = safeString(copy[`feature${i}Description`]);
    const icon = safeString(copy[`feature${i}Icon`], '✦');
    if (!title) continue;
    features.push(`
      <div style="flex: 1 1 240px; min-width: 240px; padding: 32px 24px; background: var(--color-bg); border-radius: var(--border-radius); box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <div style="font-size: 2rem; margin-bottom: 16px;">${escapeHtml(icon)}</div>
        <h3 style="font-family: var(--font-heading); font-size: var(--font-size-h3); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 12px; line-height: 1.4;">
          ${escapeHtml(title)}
        </h3>
        <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text-muted); margin: 0; line-height: 1.7;">
          ${escapeHtml(desc)}
        </p>
      </div>`);
  }

  return `<section class="bh-features" style="background: var(--color-bg-secondary); padding: var(--spacing-section) 0;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    <div style="text-align: center; margin-bottom: 48px;">
      <h2 style="font-family: var(--font-heading); font-size: var(--font-size-h2); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 12px; line-height: 1.3;">
        ${sectionTitle}
      </h2>
      <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text-muted); margin: 0; line-height: 1.6;">
        ${sectionSubtitle}
      </p>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center;">
      ${features.join('\n')}
    </div>
  </div>
</section>`;
}

// ── 3. Product Detail Section ────────────────────────────────────────────────

/** 제품 상세 소개 섹션 — 이미지 + 텍스트 레이아웃 */
export function renderProductDetailSection(
  copy: SectionCopy,
  _options?: SectionRenderOptions
): string {
  const sectionTitle = escapeHtml(safeString(copy.sectionTitle, '제품 소개'));
  const productName = escapeHtml(safeString(copy.productName, ''));
  const description = escapeHtml(safeString(copy.description, ''));
  const highlights = safeArray(copy.highlights);
  const imageAlt = escapeHtml(safeString(copy.imageAlt, '제품 이미지'));

  const highlightItems = highlights
    .map(
      (h) =>
        `<li style="padding: 8px 0; border-bottom: 1px solid var(--color-border); font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text); line-height: 1.6;">
          ${escapeHtml(h)}
        </li>`
    )
    .join('\n');

  return `<section class="bh-product-detail" style="background: var(--color-bg); padding: var(--spacing-section) 0;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; flex-wrap: wrap; gap: 48px; align-items: center;">
    <div style="flex: 1 1 400px; min-width: 300px;">
      <div style="background: var(--color-bg-secondary); border-radius: var(--border-radius); aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-family: var(--font-body);">
        ${imageAlt}
      </div>
    </div>
    <div style="flex: 1 1 400px; min-width: 300px;">
      <p style="font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-accent); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">
        ${sectionTitle}
      </p>
      <h2 style="font-family: var(--font-heading); font-size: var(--font-size-h2); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 16px; line-height: 1.3;">
        ${productName}
      </h2>
      <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text-muted); margin: 0 0 24px; line-height: 1.7;">
        ${description}
      </p>
      ${
        highlightItems
          ? `<ul style="list-style: none; padding: 0; margin: 0;">\n${highlightItems}\n</ul>`
          : ''
      }
    </div>
  </div>
</section>`;
}

// ── 4. Testimonials Section ──────────────────────────────────────────────────

/** 고객 후기/추천사 섹션 — 카드 형태의 리뷰 목록 */
export function renderTestimonialsSection(
  copy: SectionCopy,
  _options?: SectionRenderOptions
): string {
  const sectionTitle = escapeHtml(safeString(copy.sectionTitle, '고객 후기'));
  const sectionSubtitle = escapeHtml(safeString(copy.sectionSubtitle, ''));

  // 개별 후기 렌더링 (최대 3개)
  const testimonials: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const quote = safeString(copy[`testimonial${i}Quote`]);
    const author = safeString(copy[`testimonial${i}Author`]);
    const role = safeString(copy[`testimonial${i}Role`]);
    if (!quote) continue;
    testimonials.push(`
      <div style="flex: 1 1 320px; min-width: 280px; padding: 32px; background: var(--color-bg); border-radius: var(--border-radius); box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text); line-height: 1.7; margin: 0 0 20px; font-style: italic;">
          &ldquo;${escapeHtml(quote)}&rdquo;
        </p>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-accent); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 14px;">
            ${escapeHtml(author.charAt(0) || '?')}
          </div>
          <div>
            <p style="font-family: var(--font-body); font-size: var(--font-size-small); font-weight: 600; color: var(--color-text); margin: 0;">
              ${escapeHtml(author)}
            </p>
            <p style="font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-text-muted); margin: 0;">
              ${escapeHtml(role)}
            </p>
          </div>
        </div>
      </div>`);
  }

  return `<section class="bh-testimonials" style="background: var(--color-bg-secondary); padding: var(--spacing-section) 0;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    <div style="text-align: center; margin-bottom: 48px;">
      <h2 style="font-family: var(--font-heading); font-size: var(--font-size-h2); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 12px; line-height: 1.3;">
        ${sectionTitle}
      </h2>
      <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text-muted); margin: 0; line-height: 1.6;">
        ${sectionSubtitle}
      </p>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center;">
      ${testimonials.join('\n')}
    </div>
  </div>
</section>`;
}

// ── 5. FAQ Section ───────────────────────────────────────────────────────────

/** FAQ 섹션 — 질문/답변 아코디언 형태 */
export function renderFaqSection(
  copy: SectionCopy,
  _options?: SectionRenderOptions
): string {
  const sectionTitle = escapeHtml(safeString(copy.sectionTitle, '자주 묻는 질문'));
  const sectionSubtitle = escapeHtml(safeString(copy.sectionSubtitle, ''));

  // 개별 FAQ 렌더링 (최대 6개)
  const faqItems: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const question = safeString(copy[`faq${i}Question`]);
    const answer = safeString(copy[`faq${i}Answer`]);
    if (!question) continue;
    faqItems.push(`
      <details style="border-bottom: 1px solid var(--color-border); padding: 0;">
        <summary style="padding: 20px 0; cursor: pointer; font-family: var(--font-heading); font-size: var(--font-size-body); font-weight: 600; color: var(--color-text); line-height: 1.5; list-style: none; display: flex; justify-content: space-between; align-items: center;">
          ${escapeHtml(question)}
          <span style="font-size: 1.2rem; color: var(--color-text-muted); transition: var(--transition);">+</span>
        </summary>
        <div style="padding: 0 0 20px; font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text-muted); line-height: 1.7;">
          ${escapeHtml(answer)}
        </div>
      </details>`);
  }

  return `<section class="bh-faq" style="background: var(--color-bg); padding: var(--spacing-section) 0;">
  <div style="max-width: 800px; margin: 0 auto; padding: 0 24px;">
    <div style="text-align: center; margin-bottom: 48px;">
      <h2 style="font-family: var(--font-heading); font-size: var(--font-size-h2); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 12px; line-height: 1.3;">
        ${sectionTitle}
      </h2>
      <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text-muted); margin: 0; line-height: 1.6;">
        ${sectionSubtitle}
      </p>
    </div>
    <div style="border-top: 1px solid var(--color-border);">
      ${faqItems.join('\n')}
    </div>
  </div>
</section>`;
}

// ── 6. CTA Section ───────────────────────────────────────────────────────────

/** CTA(행동 유도) 섹션 — 강조 배경 + 큰 제목 + 버튼 */
export function renderCtaSection(
  copy: SectionCopy,
  _options?: SectionRenderOptions
): string {
  const headline = escapeHtml(safeString(copy.headline, '지금 시작하세요'));
  const description = escapeHtml(safeString(copy.description, ''));
  const ctaText = escapeHtml(safeString(copy.ctaText, '무료로 시작하기'));
  const secondaryCtaText = safeString(copy.secondaryCtaText);

  const secondaryButton = secondaryCtaText
    ? `<a href="#contact" style="display: inline-block; padding: 16px 40px; background: transparent; color: #fff; font-family: var(--font-body); font-size: var(--font-size-body); font-weight: 600; border: 2px solid rgba(255,255,255,0.6); border-radius: var(--border-radius); text-decoration: none; transition: var(--transition);">
        ${escapeHtml(secondaryCtaText)}
      </a>`
    : '';

  return `<section class="bh-cta" style="background: var(--color-accent); padding: var(--spacing-section) 0; text-align: center;">
  <div style="max-width: 800px; margin: 0 auto; padding: 0 24px;">
    <h2 style="font-family: var(--font-heading); font-size: var(--font-size-h1); font-weight: var(--font-weight-heading); color: #fff; margin: 0 0 16px; line-height: 1.3;">
      ${headline}
    </h2>
    <p style="font-family: var(--font-body); font-size: var(--font-size-h3); color: rgba(255,255,255,0.85); margin: 0 0 40px; line-height: 1.6;">
      ${description}
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;">
      <a href="#signup" style="display: inline-block; padding: 16px 48px; background: #fff; color: var(--color-accent); font-family: var(--font-body); font-size: var(--font-size-body); font-weight: 700; border-radius: var(--border-radius); text-decoration: none; transition: var(--transition);">
        ${ctaText}
      </a>
      ${secondaryButton}
    </div>
  </div>
</section>`;
}

// ── 7. Brand Story Section ───────────────────────────────────────────────────

/** 브랜드 스토리 섹션 — 내러티브 + 핵심 가치 */
export function renderBrandStorySection(
  copy: SectionCopy,
  options?: SectionRenderOptions
): string {
  const sectionTitle = escapeHtml(safeString(copy.sectionTitle, '브랜드 스토리'));
  const story = escapeHtml(safeString(copy.story, ''));
  const quote = safeString(copy.quote);
  const brandName = escapeHtml(options?.brandName ?? safeString(copy.brandName, ''));
  const values = safeArray(copy.values);

  const quoteBlock = quote
    ? `<blockquote style="margin: 32px 0; padding: 24px 32px; border-left: 4px solid var(--color-accent); background: var(--color-bg-secondary); border-radius: 0 var(--border-radius) var(--border-radius) 0;">
        <p style="font-family: var(--font-heading); font-size: var(--font-size-h3); font-style: italic; color: var(--color-text); margin: 0; line-height: 1.6;">
          &ldquo;${escapeHtml(quote)}&rdquo;
        </p>
        ${brandName ? `<cite style="display: block; margin-top: 12px; font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-text-muted); font-style: normal;">— ${brandName}</cite>` : ''}
      </blockquote>`
    : '';

  const valueItems = values
    .map(
      (v) =>
        `<span style="display: inline-block; padding: 8px 20px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 999px; font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-text); white-space: nowrap;">
          ${escapeHtml(v)}
        </span>`
    )
    .join('\n');

  return `<section class="bh-brand-story" style="background: var(--color-bg); padding: var(--spacing-section) 0;">
  <div style="max-width: 800px; margin: 0 auto; padding: 0 24px;">
    <h2 style="font-family: var(--font-heading); font-size: var(--font-size-h2); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 24px; text-align: center; line-height: 1.3;">
      ${sectionTitle}
    </h2>
    <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text); margin: 0 0 24px; line-height: 1.8; white-space: pre-line;">
      ${story}
    </p>
    ${quoteBlock}
    ${
      valueItems
        ? `<div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 32px;">\n${valueItems}\n</div>`
        : ''
    }
  </div>
</section>`;
}

// ── 8. Gallery Section ───────────────────────────────────────────────────────

/** 갤러리/이미지 그리드 섹션 — 이미지 placeholder 그리드 */
export function renderGallerySection(
  copy: SectionCopy,
  _options?: SectionRenderOptions
): string {
  const sectionTitle = escapeHtml(safeString(copy.sectionTitle, '갤러리'));
  const sectionSubtitle = escapeHtml(safeString(copy.sectionSubtitle, ''));
  const captions = safeArray(copy.captions);
  const count = Math.max(captions.length, 4); // 최소 4개 슬롯

  const galleryItems: string[] = [];
  for (let i = 0; i < count && i < 6; i++) {
    const caption = captions[i] ?? '';
    galleryItems.push(`
      <div style="flex: 1 1 280px; min-width: 240px;">
        <div style="background: var(--color-bg-secondary); border-radius: var(--border-radius); aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-family: var(--font-body); font-size: var(--font-size-small);">
          이미지 ${i + 1}
        </div>
        ${caption ? `<p style="font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-text-muted); margin: 8px 0 0; text-align: center; line-height: 1.5;">${escapeHtml(caption)}</p>` : ''}
      </div>`);
  }

  return `<section class="bh-gallery" style="background: var(--color-bg-secondary); padding: var(--spacing-section) 0;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    <div style="text-align: center; margin-bottom: 48px;">
      <h2 style="font-family: var(--font-heading); font-size: var(--font-size-h2); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 12px; line-height: 1.3;">
        ${sectionTitle}
      </h2>
      <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text-muted); margin: 0; line-height: 1.6;">
        ${sectionSubtitle}
      </p>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;">
      ${galleryItems.join('\n')}
    </div>
  </div>
</section>`;
}

// ── 9. Pricing Section ───────────────────────────────────────────────────────

/** 가격/요금제 섹션 — 플랜 카드 (최대 3개) */
export function renderPricingSection(
  copy: SectionCopy,
  _options?: SectionRenderOptions
): string {
  const sectionTitle = escapeHtml(safeString(copy.sectionTitle, '요금제'));
  const sectionSubtitle = escapeHtml(safeString(copy.sectionSubtitle, ''));

  // 개별 플랜 렌더링 (최대 3개)
  const plans: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const name = safeString(copy[`plan${i}Name`]);
    const price = safeString(copy[`plan${i}Price`]);
    const period = safeString(copy[`plan${i}Period`], '/월');
    const description = safeString(copy[`plan${i}Description`]);
    const features = safeArray(copy[`plan${i}Features`]);
    const ctaText = safeString(copy[`plan${i}CtaText`], '선택하기');
    const isPopular = safeString(copy[`plan${i}Popular`]) === 'true';

    if (!name) continue;

    const featureItems = features
      .map(
        (f) =>
          `<li style="padding: 8px 0; font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-text); line-height: 1.5; display: flex; align-items: baseline; gap: 8px;">
            <span style="color: var(--color-accent);">&#10003;</span> ${escapeHtml(f)}
          </li>`
      )
      .join('\n');

    const popularBadge = isPopular
      ? `<div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--color-accent); color: #fff; font-family: var(--font-body); font-size: 12px; font-weight: 600; padding: 4px 16px; border-radius: 999px;">인기</div>`
      : '';

    const borderStyle = isPopular
      ? 'border: 2px solid var(--color-accent);'
      : 'border: 1px solid var(--color-border);';

    plans.push(`
      <div style="flex: 1 1 300px; min-width: 260px; max-width: 380px; position: relative; padding: 40px 32px; background: var(--color-bg); ${borderStyle} border-radius: var(--border-radius); text-align: center;">
        ${popularBadge}
        <h3 style="font-family: var(--font-heading); font-size: var(--font-size-h3); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 8px;">
          ${escapeHtml(name)}
        </h3>
        <p style="font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-text-muted); margin: 0 0 16px; line-height: 1.5;">
          ${escapeHtml(description)}
        </p>
        <div style="margin: 0 0 24px;">
          <span style="font-family: var(--font-heading); font-size: var(--font-size-h1); font-weight: var(--font-weight-heading); color: var(--color-text);">
            ${escapeHtml(price)}
          </span>
          <span style="font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-text-muted);">
            ${escapeHtml(period)}
          </span>
        </div>
        <ul style="list-style: none; padding: 0; margin: 0 0 24px; text-align: left;">
          ${featureItems}
        </ul>
        <a href="#signup" style="display: block; padding: 14px 24px; background: ${isPopular ? 'var(--color-accent)' : 'transparent'}; color: ${isPopular ? '#fff' : 'var(--color-accent)'}; border: 2px solid var(--color-accent); font-family: var(--font-body); font-size: var(--font-size-body); font-weight: 600; border-radius: var(--border-radius); text-decoration: none; transition: var(--transition); text-align: center;">
          ${escapeHtml(ctaText)}
        </a>
      </div>`);
  }

  return `<section class="bh-pricing" style="background: var(--color-bg-secondary); padding: var(--spacing-section) 0;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    <div style="text-align: center; margin-bottom: 48px;">
      <h2 style="font-family: var(--font-heading); font-size: var(--font-size-h2); font-weight: var(--font-weight-heading); color: var(--color-text); margin: 0 0 12px; line-height: 1.3;">
        ${sectionTitle}
      </h2>
      <p style="font-family: var(--font-body); font-size: var(--font-size-body); color: var(--color-text-muted); margin: 0; line-height: 1.6;">
        ${sectionSubtitle}
      </p>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; align-items: stretch;">
      ${plans.join('\n')}
    </div>
  </div>
</section>`;
}

// ── 10. Footer Section ───────────────────────────────────────────────────────

/** 푸터 섹션 — 브랜드 정보 + 링크 + 소셜 + 저작권 */
export function renderFooterSection(
  copy: SectionCopy,
  options?: SectionRenderOptions
): string {
  const brandName = escapeHtml(options?.brandName ?? safeString(copy.brandName, 'BrandHelix'));
  const description = escapeHtml(safeString(copy.description, ''));
  const email = escapeHtml(safeString(copy.email, ''));
  const phone = escapeHtml(safeString(copy.phone, ''));
  const address = escapeHtml(safeString(copy.address, ''));
  const copyright = escapeHtml(
    safeString(copy.copyright, `\u00A9 ${new Date().getFullYear()} ${options?.brandName ?? safeString(copy.brandName, 'BrandHelix')}. All rights reserved.`)
  );

  // 네비게이션 링크
  const navLinks = safeArray(copy.navLinks);
  const navHtml = navLinks
    .map(
      (link) =>
        `<li style="margin-bottom: 8px;">
          <a href="#" style="font-family: var(--font-body); font-size: var(--font-size-small); color: var(--color-text-muted); text-decoration: none; transition: var(--transition);">
            ${escapeHtml(link)}
          </a>
        </li>`
    )
    .join('\n');

  // 소셜 미디어 링크
  const socialLinks = safeArray(copy.socialLinks);
  const socialHtml = socialLinks
    .map(
      (s) =>
        `<a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: var(--color-bg-secondary); color: var(--color-text-muted); font-size: 14px; text-decoration: none; transition: var(--transition);">
          ${escapeHtml(s.charAt(0).toUpperCase())}
        </a>`
    )
    .join('\n');

  return `<footer class="bh-footer" style="background: var(--color-text); padding: 64px 0 32px;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    <div style="display: flex; flex-wrap: wrap; gap: 48px; margin-bottom: 48px;">
      <div style="flex: 1 1 300px; min-width: 240px;">
        <h3 style="font-family: var(--font-heading); font-size: var(--font-size-h3); font-weight: var(--font-weight-heading); color: var(--color-bg); margin: 0 0 12px;">
          ${brandName}
        </h3>
        <p style="font-family: var(--font-body); font-size: var(--font-size-small); color: rgba(255,255,255,0.6); margin: 0 0 16px; line-height: 1.6;">
          ${description}
        </p>
        ${socialHtml ? `<div style="display: flex; gap: 8px;">${socialHtml}</div>` : ''}
      </div>
      ${
        navHtml
          ? `<div style="flex: 1 1 200px; min-width: 160px;">
              <h4 style="font-family: var(--font-heading); font-size: var(--font-size-small); font-weight: 600; color: var(--color-bg); margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">
                바로가기
              </h4>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${navHtml}
              </ul>
            </div>`
          : ''
      }
      <div style="flex: 1 1 200px; min-width: 160px;">
        <h4 style="font-family: var(--font-heading); font-size: var(--font-size-small); font-weight: 600; color: var(--color-bg); margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">
          연락처
        </h4>
        <div style="font-family: var(--font-body); font-size: var(--font-size-small); color: rgba(255,255,255,0.6); line-height: 1.8;">
          ${email ? `<p style="margin: 0;">${email}</p>` : ''}
          ${phone ? `<p style="margin: 0;">${phone}</p>` : ''}
          ${address ? `<p style="margin: 0;">${address}</p>` : ''}
        </div>
      </div>
    </div>
    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; text-align: center;">
      <p style="font-family: var(--font-body); font-size: var(--font-size-small); color: rgba(255,255,255,0.4); margin: 0;">
        ${copyright}
      </p>
    </div>
  </div>
</footer>`;
}

// ── Section dispatcher ───────────────────────────────────────────────────────

/** 섹션 타입에 따라 적절한 렌더 함수를 호출하여 HTML을 반환한다. */
export function renderSection(
  type: string,
  copy: SectionCopy,
  options?: SectionRenderOptions
): string {
  switch (type) {
    case 'hero':
      return renderHeroSection(copy, options);
    case 'features':
      return renderFeaturesSection(copy, options);
    case 'product_detail':
      return renderProductDetailSection(copy, options);
    case 'testimonials':
      return renderTestimonialsSection(copy, options);
    case 'faq':
      return renderFaqSection(copy, options);
    case 'cta':
      return renderCtaSection(copy, options);
    case 'brand_story':
      return renderBrandStorySection(copy, options);
    case 'gallery':
      return renderGallerySection(copy, options);
    case 'pricing':
      return renderPricingSection(copy, options);
    case 'footer':
      return renderFooterSection(copy, options);
    default:
      return '';
  }
}

// ── Supported section types ──────────────────────────────────────────────────

/** 지원하는 섹션 타입 목록 */
export const SECTION_TYPES = [
  'hero',
  'features',
  'product_detail',
  'testimonials',
  'faq',
  'cta',
  'brand_story',
  'gallery',
  'pricing',
  'footer',
] as const;

export type SectionType = typeof SECTION_TYPES[number];
