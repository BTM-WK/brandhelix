// Content Generators - Per-channel content generation

// Blog generator (Phase 2 Session 1)
export { generateBlogContent } from './blog-generator';
export type {
  BlogBrandContext,
  BlogGenerationContext,
  GenerateBlogParams,
} from './blog-generator';

// TODO: Instagram generator (Phase 2 Session 3)
export async function generateInstagramContent(brandDNA: unknown, options: unknown) {
  throw new Error('Not implemented');
}

// TODO: Shortform generator (future phase)
export async function generateShortformContent(brandDNA: unknown, options: unknown) {
  throw new Error('Not implemented');
}
