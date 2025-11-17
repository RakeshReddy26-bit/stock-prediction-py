import React, { useState, useCallback } from 'react';
import { Box, Skeleton, useColorModeValue } from '@chakra-ui/react';
import { ImageCategory, getImage, placeholder, IMAGE_SIZES } from '../../utils/images';
import { MEDIA_CONFIG, MediaSize } from '../../config/media';

interface PhotoProps {
  category: ImageCategory;
  alt: string;
  size?: MediaSize;
  rounded?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Photo component with lazy loading, responsive images, and fallback providers.
 * Uses placeholder images from free APIs with consistent seeding.
 */
const Photo: React.FC<PhotoProps> = ({
  category,
  alt,
  size = 'md',
  rounded = false,
  className = '',
  aspectRatio = 'auto',
  objectFit = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const imageSize = IMAGE_SIZES[size];
  const providers = [
    // Primary: Seeded picsum
    placeholder({
      width: imageSize.width,
      height: imageSize.height,
      category,
      seed: `${category}-${size}`,
      text: `${category} image`
    }),
    // Fallback 1: Placehold.co
    placeholder({
      width: imageSize.width,
      height: imageSize.height,
      text: `${category} image`
    }),
    // Fallback 2: Unsplash
    `https://source.unsplash.com/random/${imageSize.width}x${imageSize.height}?${category}`,
    // Fallback 3: Dummy image
    `https://dummyimage.com/${imageSize.width}x${imageSize.height}/e2e8f0/64748b.webp&text=${encodeURIComponent(`${category} image`)}`
  ];

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    if (fallbackIndex < providers.length - 1) {
      setFallbackIndex(prev => prev + 1);
      setCurrentSrc(providers[fallbackIndex + 1]);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [fallbackIndex, providers]);

  // Initialize with first provider
  React.useEffect(() => {
    setCurrentSrc(providers[0]);
  }, [category, size]);

  // Generate srcSet for responsive images (1x and 2x)
  const srcSet = React.useMemo(() => {
    const baseUrl = currentSrc.replace(`/${imageSize.width}/${imageSize.height}`, '');
    return `${baseUrl}/${imageSize.width}/${imageSize.height} 1x, ${baseUrl}/${imageSize.width * 2}/${imageSize.height * 2} 2x`;
  }, [currentSrc, imageSize]);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: ''
  };

  if (hasError) {
    return (
      <Box
        className={`${aspectClasses[aspectRatio]} ${className}`}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius={rounded ? 'full' : 'md'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="sm"
        color="gray.500"
      >
        Image unavailable
      </Box>
    );
  }

  return (
    <Box
      className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}
      borderRadius={rounded ? 'full' : 'md'}
      bg={bgColor}
    >
      {isLoading && (
        <Skeleton
          className="absolute inset-0"
          borderRadius={rounded ? 'full' : 'md'}
          fadeDuration={0.3}
        />
      )}
      <img
        src={currentSrc}
        srcSet={srcSet}
        sizes={`${imageSize.width}px`}
        alt={alt}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-${objectFit} transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          borderRadius: rounded ? '50%' : undefined
        }}
      />
    </Box>
  );
};

export default Photo;
