import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  Image,
  Badge,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Stack,
  Divider,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaShoppingCart } from 'react-icons/fa';
import { LAUNDRY_IMAGES } from '../../utils/images';

const MotionBox = motion(Box);

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  description: string;
}

const clothingItems: ClothingItem[] = [
  // Shirts
  { id: 'shirt1', name: 'Cotton T-Shirt', category: 'shirts', image: LAUNDRY_IMAGES.shirts, price: 5, description: 'Basic cotton t-shirt' },
  { id: 'shirt2', name: 'Button-Up Shirt', category: 'shirts', image: LAUNDRY_IMAGES.shirts, price: 8, description: 'Formal button-up shirt' },
  { id: 'shirt3', name: 'Polo Shirt', category: 'shirts', image: LAUNDRY_IMAGES.shirts, price: 7, description: 'Casual polo shirt' },

  // Pants
  { id: 'pants1', name: 'Jeans', category: 'pants', image: LAUNDRY_IMAGES.pants, price: 10, description: 'Denim jeans' },
  { id: 'pants2', name: 'Chinos', category: 'pants', image: LAUNDRY_IMAGES.pants, price: 9, description: 'Cotton chinos' },
  { id: 'pants3', name: 'Dress Pants', category: 'pants', image: LAUNDRY_IMAGES.pants, price: 12, description: 'Formal dress pants' },

  // Dresses
  { id: 'dress1', name: 'Summer Dress', category: 'dresses', image: LAUNDRY_IMAGES.dresses, price: 15, description: 'Light summer dress' },
  { id: 'dress2', name: 'Evening Gown', category: 'dresses', image: LAUNDRY_IMAGES.dresses, price: 25, description: 'Formal evening gown' },

  // Jackets
  { id: 'jacket1', name: 'Leather Jacket', category: 'jackets', image: LAUNDRY_IMAGES.jackets, price: 20, description: 'Genuine leather jacket' },
  { id: 'jacket2', name: 'Blazer', category: 'jackets', image: LAUNDRY_IMAGES.jackets, price: 18, description: 'Business blazer' },

  // Suits
  { id: 'suit1', name: 'Business Suit', category: 'suits', image: LAUNDRY_IMAGES.suits, price: 35, description: 'Complete business suit' },

  // Sweaters
  { id: 'sweater1', name: 'Wool Sweater', category: 'sweaters', image: LAUNDRY_IMAGES.sweaters, price: 12, description: 'Warm wool sweater' },
  { id: 'sweater2', name: 'Cardigan', category: 'sweaters', image: LAUNDRY_IMAGES.sweaters, price: 10, description: 'Cotton cardigan' },

  // Jeans
  { id: 'jeans1', name: 'Slim Fit Jeans', category: 'jeans', image: LAUNDRY_IMAGES.jeans, price: 10, description: 'Modern slim fit jeans' },
  { id: 'jeans2', name: 'Bootcut Jeans', category: 'jeans', image: LAUNDRY_IMAGES.jeans, price: 11, description: 'Classic bootcut jeans' },

  // Shorts
  { id: 'shorts1', name: 'Denim Shorts', category: 'shorts', image: LAUNDRY_IMAGES.shorts, price: 6, description: 'Casual denim shorts' },

  // Skirts
  { id: 'skirt1', name: 'Pencil Skirt', category: 'skirts', image: LAUNDRY_IMAGES.skirts, price: 9, description: 'Professional pencil skirt' },

  // Blouses
  { id: 'blouse1', name: 'Silk Blouse', category: 'blouses', image: LAUNDRY_IMAGES.blouses, price: 12, description: 'Elegant silk blouse' },

  // Hoodies
  { id: 'hoodie1', name: 'Cotton Hoodie', category: 'hoodies', image: LAUNDRY_IMAGES.hoodies, price: 8, description: 'Comfortable cotton hoodie' },

  // Coats
  { id: 'coat1', name: 'Winter Coat', category: 'coats', image: LAUNDRY_IMAGES.coats, price: 25, description: 'Heavy winter coat' },

  // Underwear
  { id: 'underwear1', name: 'Cotton Underwear', category: 'underwear', image: LAUNDRY_IMAGES.underwear, price: 3, description: 'Basic cotton underwear' },

  // Socks
  { id: 'socks1', name: 'Cotton Socks', category: 'socks', image: LAUNDRY_IMAGES.socks, price: 2, description: 'Everyday cotton socks' },

  // Bedding
  { id: 'bedding1', name: 'Sheet Set', category: 'bedding', image: LAUNDRY_IMAGES.bedding, price: 15, description: 'Complete bed sheet set' },
  { id: 'bedding2', name: 'Pillowcases', category: 'bedding', image: LAUNDRY_IMAGES.bedding, price: 5, description: 'Set of pillowcases' },

  // Towels
  { id: 'towels1', name: 'Bath Towel', category: 'towels', image: LAUNDRY_IMAGES.towels, price: 4, description: 'Large bath towel' },
  { id: 'towels2', name: 'Hand Towel', category: 'towels', image: LAUNDRY_IMAGES.towels, price: 2, description: 'Small hand towel' },

  // Curtains
  { id: 'curtains1', name: 'Sheer Curtains', category: 'curtains', image: LAUNDRY_IMAGES.curtains, price: 8, description: 'Light sheer curtains' },
];

const categories = [
  'shirts', 'pants', 'dresses', 'jackets', 'suits', 'sweaters', 'jeans',
  'shorts', 'skirts', 'blouses', 'hoodies', 'coats', 'underwear', 'socks',
  'bedding', 'towels', 'curtains'
];

interface ClothingSelectorProps {
  onSelectionChange?: (selectedItems: ClothingItem[]) => void;
}

const ClothingSelector: React.FC<ClothingSelectorProps> = ({ onSelectionChange }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const filteredItems = selectedCategory === 'all'
    ? clothingItems
    : clothingItems.filter(item => item.category === selectedCategory);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelected = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];

      const selectedClothingItems = clothingItems.filter(item => newSelected.includes(item.id));
      onSelectionChange?.(selectedClothingItems);

      return newSelected;
    });
  };

  const selectedClothingItems = clothingItems.filter(item => selectedItems.includes(item.id));
  const totalPrice = selectedClothingItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="2xl" mb={4} color="gray.900">
            Select Your Items
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
            Choose the clothing and household items you want to have cleaned.
            We offer professional care for all types of fabrics.
          </Text>
        </Box>

        {/* Category Filter */}
        <Box>
          <HStack spacing={2} wrap="wrap" justify="center">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setSelectedCategory('all')}
            >
              All Items
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => setSelectedCategory(category)}
                textTransform="capitalize"
              >
                {category}
              </Button>
            ))}
          </HStack>
        </Box>

        {/* Items Grid */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {filteredItems.map((item) => (
            <MotionBox
              key={item.id}
              bg={bgColor}
              border="1px"
              borderColor={borderColor}
              rounded="lg"
              overflow="hidden"
              shadow="md"
              _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
              cursor="pointer"
              onClick={() => handleItemToggle(item.id)}
              position="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              {selectedItems.includes(item.id) && (
                <Box
                  position="absolute"
                  top={2}
                  right={2}
                  bg="blue.500"
                  rounded="full"
                  p={1}
                  zIndex={1}
                >
                  <Icon as={FaCheck} color="white" boxSize={3} />
                </Box>
              )}

              <Image
                src={item.image}
                alt={item.name}
                w="full"
                h="150px"
                objectFit="cover"
              />

              <VStack p={4} spacing={2} align="start">
                <Heading size="sm" color="gray.900">
                  {item.name}
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  {item.description}
                </Text>
                <HStack justify="space-between" w="full">
                  <Badge colorScheme="green" fontSize="sm">
                    ${item.price}
                  </Badge>
                  <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                    {item.category}
                  </Text>
                </HStack>
              </VStack>
            </MotionBox>
          ))}
        </SimpleGrid>

        {/* Selection Summary */}
        {selectedItems.length > 0 && (
          <MotionBox
            bg="blue.50"
            p={6}
            rounded="lg"
            border="1px"
            borderColor="blue.200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" color="gray.900">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </Text>
                <Text color="gray.600">
                  Total: ${totalPrice.toFixed(2)}
                </Text>
              </VStack>
              <HStack spacing={3}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => setSelectedItems([])}
                  leftIcon={<Icon as={FaTimes} />}
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={onOpen}
                  leftIcon={<Icon as={FaShoppingCart} />}
                >
                  Review Order
                </Button>
              </HStack>
            </HStack>
          </MotionBox>
        )}
      </VStack>

      {/* Order Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Order Review</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {selectedClothingItems.map((item) => (
                <HStack key={item.id} justify="space-between" p={3} bg="gray.50" rounded="md">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{item.name}</Text>
                    <Text fontSize="sm" color="gray.600">{item.description}</Text>
                  </VStack>
                  <Text fontWeight="bold" color="green.600">${item.price}</Text>
                </HStack>
              ))}

              <Divider />

              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Total:</Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                  ${totalPrice.toFixed(2)}
                </Text>
              </HStack>

              <Button colorScheme="blue" size="lg" w="full">
                Proceed to Checkout
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ClothingSelector;
