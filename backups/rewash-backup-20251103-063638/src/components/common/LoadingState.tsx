import { Box, Spinner, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface LoadingStateProps {
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

const MotionBox = motion(Box);

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading = false,
  error = null,
  children,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (isLoading) {
    return (
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        p={8}
        borderRadius="lg"
        bg={bgColor}
        borderWidth={1}
        borderColor={borderColor}
        boxShadow="sm"
      >
        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
          <Text color="gray.500">Loading...</Text>
        </VStack>
      </MotionBox>
    );
  }

  if (error) {
    return (
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        p={8}
        borderRadius="lg"
        bg="red.50"
        borderWidth={1}
        borderColor="red.200"
        boxShadow="sm"
      >
        <VStack spacing={4}>
          <Text color="red.500" fontWeight="medium">
            {error}
          </Text>
        </VStack>
      </MotionBox>
    );
  }

  return <>{children}</>;
}; 