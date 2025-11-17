import { Box, Image } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionImage = motion(Image);

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const sizes = {
    sm: { width: '60px', height: '30px' },
    md: { width: '80px', height: '40px' },
    lg: { width: '120px', height: '60px' },
  };

  return (
    <MotionImage
      src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/7986ccd2-e769-40ba-99ac-5e248a7d8bdb.png"
      alt="REWASH Logo"
      width={sizes[size].width}
      height={sizes[size].height}
      objectFit="contain"
      cursor="pointer"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.1 }}
    />
  );
}
