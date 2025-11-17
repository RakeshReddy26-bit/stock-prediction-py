import {
  Box,
  Container,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

interface PageLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showNavbar = true,
}) => {
  const bgColor = useColorModeValue('black', 'gray.900');
  const contentBgColor = useColorModeValue('gray.50', 'blue.900');
  const padding = useBreakpointValue({ base: 4, md: 8 });

  return (
    <Box minH="100vh" bg={bgColor}>
      {showNavbar && <Navbar />}
      <Container maxW="container.xl" py={padding}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            bg={contentBgColor}
            borderRadius="lg"
            boxShadow="xl"
            p={padding}
          >
            {children}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PageLayout; 