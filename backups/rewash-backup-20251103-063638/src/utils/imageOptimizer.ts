/**
 * Optimizes image URLs for better performance
 * Uses WebP format and appropriate sizing
 */
export function getOptimizedImageUrl(url: string, width: number, quality = 80): string {
  // For Unsplash images, add optimization parameters
  if (url.includes('unsplash.com')) {
    return `${url}&w=${width}&q=${quality}&fm=webp&fit=crop&auto=format`;
  }

  // For other images, return as is (could add more providers later)
  return url;
}

/**
 * Preloads critical images for better performance
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}
