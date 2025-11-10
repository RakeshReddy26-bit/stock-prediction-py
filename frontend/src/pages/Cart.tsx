import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  Button,
  Divider,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  InputGroup,
  InputRightElement,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import { useCartStore } from '../store/cartStore';
import { Link, useNavigate } from 'react-router-dom';

const Cart: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getDiscount,
    getTotal,
    getItemCount,
    applyDiscount,
    removeDiscount,
    discountCode,
  } = useCartStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [discountInput, setDiscountInput] = useState('');

  const handleQuantityChange = (id: string, service: string, quantity: number) => {
    updateQuantity(id, service, quantity);
  };

  const handleRemoveItem = (id: string, service: string) => {
    removeItem(id, service);
    toast({
      title: 'Item removed',
      description: 'Item has been removed from your cart.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleApplyDiscount = () => {
    if (discountInput.trim()) {
      applyDiscount(discountInput.trim());
      if (getDiscount() > 0) {
        toast({
          title: 'Discount applied!',
          description: `Discount code ${discountInput.toUpperCase()} applied successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Invalid discount code',
          description: 'Please check your discount code and try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      setDiscountInput('');
    }
  };

  const handleRemoveDiscount = () => {
    removeDiscount();
    toast({
      title: 'Discount removed',
      description: 'Discount code has been removed.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const discount = getDiscount();
  const total = getTotal();
  const itemCount = getItemCount();

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Your Cart
        </Heading>

        {items.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>Your cart is empty!</AlertTitle>
              <AlertDescription>
                Add some laundry services to get started.{' '}
                <Link to="/services" style={{ color: 'blue', textDecoration: 'underline' }}>
                  Browse Services
                </Link>
              </AlertDescription>
            </Box>
          </Alert>
        ) : (
          <>
            <Text fontSize="lg" textAlign="center">
              {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart
            </Text>

            <VStack spacing={4} align="stretch">
              {items.map((item) => (
                <Box
                  key={`${item.id}-${item.service}`}
                  borderWidth={1}
                  borderRadius="lg"
                  p={4}
                  shadow="md"
                >
                  <HStack spacing={4} align="start">
                    <Image
                      src={item.image}
                      alt={item.name}
                      boxSize="80px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                    <VStack align="start" flex={1} spacing={2}>
                      <Heading as="h3" size="md">
                        {item.name}
                      </Heading>
                      <Text color="gray.600">
                        {item.category}
                      </Text>
                      <Badge colorScheme="blue">{item.service}</Badge>
                      <Text fontWeight="bold">${item.price.toFixed(2)} each</Text>
                    </VStack>
                    <VStack spacing={2}>
                      <NumberInput
                        size="sm"
                        maxW={20}
                        value={item.quantity}
                        min={1}
                        onChange={(_, value) => handleQuantityChange(item.id, item.service, value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleRemoveItem(item.id, item.service)}
                      >
                        Remove
                      </Button>
                    </VStack>
                  </HStack>
                  <Text fontWeight="bold" mt={2}>
                    Subtotal: ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </Box>
              ))}
            </VStack>

            <Divider />

            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Discount Code</FormLabel>
                <InputGroup size="md">
                  <Input
                    pr="4.5rem"
                    placeholder="Enter discount code"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                  />
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleApplyDiscount}>
                      Apply
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {discountCode && (
                <HStack justify="space-between">
                  <Text>Discount ({discountCode}):</Text>
                  <HStack>
                    <Text color="green.600">-${discount.toFixed(2)}</Text>
                    <Button size="xs" colorScheme="red" variant="outline" onClick={handleRemoveDiscount}>
                      Remove
                    </Button>
                  </HStack>
                </HStack>
              )}
            </VStack>

            <Divider />

            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text>Subtotal:</Text>
                <Text>${subtotal.toFixed(2)}</Text>
              </HStack>
              {discount > 0 && (
                <HStack justify="space-between">
                  <Text>Discount:</Text>
                  <Text color="green.600">-${discount.toFixed(2)}</Text>
                </HStack>
              )}
              <HStack justify="space-between">
                <Text>Tax (8%):</Text>
                <Text>${tax.toFixed(2)}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontSize="xl" fontWeight="bold">Total:</Text>
                <Text fontSize="xl" fontWeight="bold">${total.toFixed(2)}</Text>
              </HStack>
            </VStack>

            <HStack spacing={4} justify="center">
              <Button as={Link} to="/services" variant="outline">
                Continue Shopping
              </Button>
              <Button colorScheme="blue" size="lg" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default Cart;
