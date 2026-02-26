/**
 * Cross-channel link utilities for BrandHelix.
 *
 * 채널 간 링크 연결 유틸리티:
 * - UTM 파라미터 URL 생성
 * - 블로그 → 사이트 CTA 링크
 * - 인스타그램 링크인바이오 텍스트
 * - 블로그 마크다운 내 크로스 링크 삽입
 * - 블로그 푸터 관련 링크 섹션 생성
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UTMParams {
  /** 트래픽 출처 e.g. 'blog', 'instagram' */
  source: string;
  /** 마케팅 채널 e.g. 'organic', 'social' */
  medium: string;
  /** 캠페인명 e.g. 프로젝트 이름 */
  campaign?: string;
  /** 콘텐츠 식별자 e.g. 콘텐츠 id */
  content?: string;
}

// ── UTM Builder ────────────────────────────────────────────────────────────────

/**
 * UTM 파라미터가 추가된 URL을 생성한다.
 * - 빈 문자열 파라미터는 포함하지 않는다.
 * - 이미 쿼리스트링이 있는 URL에는 &로 연결한다.
 *
 * @example
 * buildUTMUrl('https://example.com/product', { source: 'blog', medium: 'organic' })
 * // 'https://example.com/product?utm_source=blog&utm_medium=organic'
 */
export function buildUTMUrl(baseUrl: string, params: UTMParams): string {
  const url = new URL(baseUrl);

  if (params.source) url.searchParams.set('utm_source', params.source);
  if (params.medium) url.searchParams.set('utm_medium', params.medium);
  if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
  if (params.content) url.searchParams.set('utm_content', params.content);

  return url.toString();
}

// ── Blog → Site CTA ────────────────────────────────────────────────────────────

/**
 * 블로그 글 하단 → 판매 사이트 CTA 링크를 생성한다.
 * UTM: source=blog, medium=organic
 */
export function getBlogToSiteCTA(
  siteUrl: string,
  blogId: string,
  projectName?: string,
): { url: string; ctaText: string } {
  const utmParams: UTMParams = {
    source: 'blog',
    medium: 'organic',
    ...(projectName ? { campaign: projectName } : {}),
    content: blogId,
  };

  return {
    url: buildUTMUrl(siteUrl, utmParams),
    ctaText: '지금 바로 확인하기 →',
  };
}

// ── Instagram Bio Link ─────────────────────────────────────────────────────────

/**
 * 인스타그램 캡션에 사용할 링크인바이오 안내 텍스트와 UTM URL을 반환한다.
 * UTM: source=instagram, medium=social
 */
export function getInstagramBioLink(
  siteUrl: string,
  projectName?: string,
): { bioLinkText: string; url: string } {
  const utmParams: UTMParams = {
    source: 'instagram',
    medium: 'social',
    ...(projectName ? { campaign: projectName } : {}),
  };

  return {
    bioLinkText: '👆 링크인바이오에서 자세히 보기',
    url: buildUTMUrl(siteUrl, utmParams),
  };
}

// ── Blog Cross-Link Insertion ──────────────────────────────────────────────────

/**
 * 블로그 마크다운에 크로스 채널 링크를 삽입한다.
 *
 * 동작:
 * 1. 결론 섹션(## 결론 | ## 마무리 | ## 정리) 직전에 "관련 글 더 보기" 섹션 삽입
 * 2. 문서 맨 끝에 사이트 CTA 링크 삽입
 *
 * 결론 섹션이 없으면 두 섹션 모두 문서 맨 끝에 추가된다.
 */
export function insertBlogCrossLinks(
  markdown: string,
  options: {
    siteUrl?: string;
    relatedBlogUrls?: Array<{ url: string; title: string }>;
    projectName?: string;
    blogId: string;
  },
): string {
  const { siteUrl, relatedBlogUrls = [], projectName, blogId } = options;

  // 관련 글 섹션 구성
  let relatedSection = '';
  if (relatedBlogUrls.length > 0) {
    const links = relatedBlogUrls
      .map((item) => `- [${item.title}](${item.url})`)
      .join('\n');
    relatedSection = `\n\n---\n\n## 관련 글 더 보기\n\n${links}\n`;
  }

  // 사이트 CTA 섹션 구성
  let ctaSection = '';
  if (siteUrl) {
    const { url, ctaText } = getBlogToSiteCTA(siteUrl, blogId, projectName);
    ctaSection = `\n\n---\n\n**[${ctaText}](${url})**\n`;
  }

  if (!relatedSection && !ctaSection) {
    return markdown;
  }

  // 결론 섹션 헤딩 패턴 (## 결론 | ## 마무리 | ## 정리)
  const conclusionPattern = /^(#{1,3}\s*(결론|마무리|정리))/m;
  const match = conclusionPattern.exec(markdown);

  if (match && match.index !== undefined) {
    // 결론 섹션 직전에 관련 글 삽입, 문서 끝에 CTA 삽입
    const before = markdown.slice(0, match.index);
    const after = markdown.slice(match.index);
    return `${before}${relatedSection}\n${after}${ctaSection}`;
  }

  // 결론 섹션이 없으면 문서 끝에 두 섹션 모두 추가
  return `${markdown}${relatedSection}${ctaSection}`;
}

// ── Blog Footer Links ──────────────────────────────────────────────────────────

/**
 * 블로그 푸터에 삽입할 관련 콘텐츠 링크 마크다운을 생성한다.
 *
 * 채널별로 그룹화하여 출력한다.
 * siteUrl이 제공되면 'site' 채널 항목은 UTM URL로 변환된다.
 */
export function generateBlogFooterLinks(
  relatedContents: Array<{ id: string; title: string; channel: string }>,
  siteUrl?: string,
): string {
  if (relatedContents.length === 0) return '';

  // 채널명 한글 레이블
  const channelLabels: Record<string, string> = {
    blog: '블로그',
    instagram: '인스타그램',
    site: '제품 페이지',
    shortform: '숏폼',
  };

  // 채널별로 그룹화
  const grouped = relatedContents.reduce<
    Record<string, Array<{ id: string; title: string; channel: string }>>
  >((acc, item) => {
    const key = item.channel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sections: string[] = [];

  for (const [channel, items] of Object.entries(grouped)) {
    const label = channelLabels[channel] ?? channel;
    const links = items
      .map((item) => {
        // 'site' 채널이고 siteUrl이 있으면 UTM URL 생성
        if (channel === 'site' && siteUrl) {
          const utmUrl = buildUTMUrl(siteUrl, {
            source: 'blog',
            medium: 'organic',
            content: item.id,
          });
          return `- [${item.title}](${utmUrl})`;
        }
        return `- ${item.title}`;
      })
      .join('\n');

    sections.push(`**${label}**\n\n${links}`);
  }

  return `\n\n---\n\n## 함께 보면 좋은 콘텐츠\n\n${sections.join('\n\n')}`;
}
