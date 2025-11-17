import { ImageSize } from '../utils/images';

export const MEDIA_CONFIG = {
  imageQuality: 'webp' as const, // Preferred format with jpeg fallback
  sizes: {
    sm: { width: 320, height: 240 },
    md: { width: 640, height: 480 },
    lg: { width: 1024, height: 768 },
    hero: { width: 1600, height: 900 },
    avatar: { width: 96, height: 96 }
  } as const,
  enableBlurhash: false // For future blur placeholder implementation
} as const;

export type MediaSize = keyof typeof MEDIA_CONFIG.sizes;
export type ImageQuality = typeof MEDIA_CONFIG.imageQuality;
