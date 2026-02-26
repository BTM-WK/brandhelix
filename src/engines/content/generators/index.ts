// Content Generators - Per-channel content generation

// Blog generator (Phase 2 Session 1)
export { generateBlogContent } from './blog-generator';
export type {
  BlogBrandContext,
  BlogGenerationContext,
  GenerateBlogParams,
} from './blog-generator';

// Instagram generator (Phase 2 Session 3)
export { generateInstagramCaption } from './instagram-generator';
export type {
  InstagramCaptionContext,
  InstagramCaptionResult,
} from './instagram-generator';

// TODO: Shortform generator (future phase)
export async function generateShortformContent(brandDNA: unknown, options: unknown) {
  throw new Error('Not implemented');
}
