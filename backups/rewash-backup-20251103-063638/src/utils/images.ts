export type ImageCategory = 'clothes' | 'laundry' | 'people' | 'delivery' | 'facility';

export interface ImageSize {
  width: number;
  height: number;
}

export interface PlaceholderOptions {
  width: number;
  height: number;
  category?: ImageCategory;
  text?: string;
  seed?: string;
}

/**
 * Generates a stable random seed for consistent image generation per session.
 * Uses crypto.randomUUID() if available, otherwise falls back to Date.now().
 */
export function getRandomSeed(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString();
}

/**
 * Builds a placeholder image URL with fallback providers.
 * Order: picsum.photos (seeded), placehold.co, source.unsplash.com, dummyimage.com
 */
export function placeholder(options: PlaceholderOptions): string {
  const { width, height, category, text, seed } = options;
  const providers = [
    // Picsum Photos with seed for consistency
    seed ? `https://picsum.photos/seed/${seed}/${width}/${height}.webp` : `https://picsum.photos/${width}/${height}.webp`,
    // Placehold.co with text
    text ? `https://placehold.co/${width}x${height}/e2e8f0/64748b.webp?text=${encodeURIComponent(text)}` : `https://placehold.co/${width}x${height}/e2e8f0/64748b.webp`,
    // Source Unsplash with category
    category ? `https://source.unsplash.com/random/${width}x${height}?${category}` : `https://source.unsplash.com/random/${width}x${height}`,
    // Dummy Image as final fallback
    `https://dummyimage.com/${width}x${height}/e2e8f0/64748b.webp&text=${encodeURIComponent(text || 'Image')}`
  ];

  // Return the first provider (will handle fallbacks in component)
  return providers[0];
}

/**
 * Gets an image URL for a specific category and size.
 * Uses predefined sizes and category-specific seeds for consistency.
 */
export function getImage(category: ImageCategory, size: keyof typeof IMAGE_SIZES = 'md'): string {
  const imageSize = IMAGE_SIZES[size];
  const categorySeed = CATEGORY_SEEDS[category];

  return placeholder({
    width: imageSize.width,
    height: imageSize.height,
    category,
    seed: categorySeed,
    text: `${category} image`
  });
}

export const LAUNDRY_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=1600&h=900&fit=crop&crop=center',
  washFold: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center',
  dryCleaning: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop&crop=center',
  alterations: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=600&fit=crop&crop=center',
  pickupDelivery: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=600&fit=crop&crop=center',
  facility: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop&crop=center',
  // Clothing categories
  shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop&crop=center',
  pants: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center',
  dresses: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop&crop=center',
  jackets: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&crop=center',
  suits: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
  sweaters: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop&crop=center',
  jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center',
  shorts: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop&crop=center',
  skirts: 'https://images.unsplash.com/photo-1583496661160-fb5886a6aaaa?w=400&h=400&fit=crop&crop=center',
  blouses: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&crop=center',
  hoodies: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&crop=center',
  coats: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop&crop=center',
  underwear: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop&crop=center', // Placeholder for laundry facility
  socks: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop&crop=center', // Placeholder
  bedding: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
  towels: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
  curtains: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center'
} as const;

/**
 * Optimizes image URLs by appending width, quality, and format parameters
 * Supports Unsplash and our custom image generator
 */
export interface ImageConfig {
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}

export function getOptimized(
  url: string,
  config: ImageConfig = {}
): string {
  const { width = 600, quality = 80, format = 'webp' } = config;

  if (!url) return '';

  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname;

    // Handle Unsplash URLs
    if (host.includes('unsplash.com')) {
      const params = new URLSearchParams({
        w: width.toString(),
        q: quality.toString(),
        fm: format,
        fit: 'crop',
        auto: 'format',
      });
      return `${url}?${params.toString()}`;
    }

    // Handle our S3 image generator
    if (host.includes('amazonaws.com') || host.includes('user-gen-media-assets')) {
      const params = new URLSearchParams({
        w: width.toString(),
        q: quality.toString(),
        fm: format,
        fit: 'crop',
        auto: 'format',
      });
      return `${url}?${params.toString()}`;
    }

    // For other sources, return as-is
    return url;
  } catch (error) {
    console.warn('Invalid image URL:', url, error);
    return url;
  }
}

/**
 * Validates that an image URL is from an approved source
 */
export function isValidImageSource(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname;

    // Approved sources
    const approvedSources = [
      'unsplash.com',
      'user-gen-media-assets.s3.amazonaws.com',
      'amazonaws.com',
      'images.unsplash.com',
    ];

    return approvedSources.some(source => host.includes(source));
  } catch (error) {
    return false;
  }
}

/**
 * Logs a warning if an image URL is from an unapproved source (dev only)
 */
export function validateImageSource(url: string, itemName: string): void {
  if (process.env.NODE_ENV === 'development') {
    if (!isValidImageSource(url)) {
      console.warn(
        `[Image Validator] Unapproved image source for "${itemName}": ${url}`
      );
    }
  }
}

// Predefined image sizes
export const IMAGE_SIZES = {
  sm: { width: 320, height: 240 },
  md: { width: 640, height: 480 },
  lg: { width: 1024, height: 768 },
  hero: { width: 1600, height: 900 },
  avatar: { width: 96, height: 96 }
} as const;

// Category-specific seeds for consistent images per category
const CATEGORY_SEEDS = {
  clothes: 'rewash-clothes-2024',
  laundry: 'rewash-laundry-2024',
  people: 'rewash-people-2024',
  delivery: 'rewash-delivery-2024',
  facility: 'rewash-facility-2024'
} as const;

/**
 * Content Policy Note:
 * All images in this application are placeholders from free public APIs.
 * In production, replace with a proper CDN or image hosting service.
 * Current providers: Picsum Photos, Placehold.co, Unsplash Source, DummyImage.com
 */

/**
 * Public Routes:
 * / → Home page
 * /services → Clothing catalog with photos & cart
 * /cart → Shopping cart (add/remove items)
 * /login → Login page
 * /signup → Sign up page
 * /contact → Contact placeholder
 *
 * Protected Routes:
 * /dashboard → User dashboard
 * /profile → User profile
 * /orders/history → Order history
 * /my-orders → Order history (alias)
 * /my-clothes → Clothes management placeholder
 * /referral → Referral program placeholder
 * /admin → Admin panel
 * /tasks → Tasks management (admin/staff)
 *
 * Catch-all: * → Redirects to /
 */
