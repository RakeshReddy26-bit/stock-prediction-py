import { Image, Skeleton } from '@chakra-ui/react';
import { useState } from 'react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  quality?: number;
  [key: string]: any; // For other Image props
}

export default function OptimizedImage({
  src,
  alt,
  width = 400,
  quality = 80,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = getOptimizedImageUrl(src, width, quality);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setLoaded(true); // Show placeholder instead of skeleton
  };

  const placeholderSrc = 'data:image/svg+xml;base64,' + btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">Image not available</text>
    </svg>
  `);

  return (
    <>
      {!loaded && (
        <Skeleton
          height={props.height || '300px'}
          width="100%"
          borderRadius={props.borderRadius || 'md'}
        />
      )}
      <Image
        src={error ? placeholderSrc : optimizedSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
        style={{
          display: loaded ? 'block' : 'none',
          ...props.style
        }}
        {...props}
      />
    </>
  );
}
