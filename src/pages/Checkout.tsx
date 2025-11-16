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
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useCartStore } from '../store/cartStore';
import { Link, useNavigate } from 'react-router-dom';

const Checkout: React.FC = () => {
  const {
    items,
    getSubtotal,
    getTax,
    getDiscount,
    getTotal,
    clearCart,
    discountCode,
  } = useCartStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentInfoChange = (field: string, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    // Validate form
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'zipCode'];
    const missingFields = requiredFields.filter(field => !customerInfo[field as keyof typeof customerInfo].trim());

    if (missingFields.length > 0) {
      toast({
        title: 'Missing information',
        description: `Please fill in: ${missingFields.join(', ')}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: 'Order placed successfully!',
        description: 'Thank you for your order. You will receive a confirmation email shortly.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      clearCart();
      navigate('/order-confirmation');
    }, 2000);
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const discount = getDiscount();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <AlertTitle>No items in cart</AlertTitle>
            <AlertDescription>
              Please add items to your cart before checking out.{' '}
              <Link to="/services" style={{ color: 'blue', textDecoration: 'underline' }}>
                Browse Services
              </Link>
            </AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Checkout
        </Heading>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Customer Information */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>Customer Information</Heading>
                  <VStack spacing={4}>
                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          value={customerInfo.name}
                          onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                          placeholder="Enter your email"
                        />
                      </FormControl>
                    </HStack>
                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          value={customerInfo.phone}
                          onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </FormControl>
                    </HStack>
                    <FormControl isRequired>
                      <FormLabel>Address</FormLabel>
                      <Textarea
                        value={customerInfo.address}
                        onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                        placeholder="Enter your street address"
                      />
                    </FormControl>
                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>City</FormLabel>
                        <Input
                          value={customerInfo.city}
                          onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                          placeholder="Enter your city"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>ZIP Code</FormLabel>
                        <Input
                          value={customerInfo.zipCode}
                          onChange={(e) => handleCustomerInfoChange('zipCode', e.target.value)}
                          placeholder="Enter your ZIP code"
                        />
                      </FormControl>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>Payment Information</Heading>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Name on Card</FormLabel>
                      <Input
                        value={paymentInfo.nameOnCard}
                        onChange={(e) => handlePaymentInfoChange('nameOnCard', e.target.value)}
                        placeholder="Enter name on card"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Card Number</FormLabel>
                      <Input
                        value={paymentInfo.cardNumber}
                        onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                      />
                    </FormControl>
                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>Expiry Date</FormLabel>
                        <Input
                          value={paymentInfo.expiryDate}
                          onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
                          placeholder="MM/YY"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>CVV</FormLabel>
                        <Input
                          value={paymentInfo.cvv}
                          onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
                          placeholder="123"
                        />
                      </FormControl>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>

          <GridItem>
            {/* Order Summary */}
            <Card position="sticky" top={4}>
              <CardBody>
                <Heading size="md" mb={4}>Order Summary</Heading>

                <VStack spacing={3} align="stretch" mb={4}>
                  {items.map((item) => (
                    <HStack key={`${item.id}-${item.service}`} justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{item.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {item.service} × {item.quantity}
                        </Text>
                      </VStack>
                      <Text>${(item.price * item.quantity).toFixed(2)}</Text>
                    </HStack>
                  ))}
                </VStack>

                <Divider my={4} />

                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text>Subtotal:</Text>
                    <Text>${subtotal.toFixed(2)}</Text>
                  </HStack>
                  {discount > 0 && (
                    <HStack justify="space-between">
                      <Text>Discount ({discountCode}):</Text>
                      <Text color="green.600">-${discount.toFixed(2)}</Text>
                    </HStack>
                  )}
                  <HStack justify="space-between">
                    <Text>Tax (8%):</Text>
                    <Text>${tax.toFixed(2)}</Text>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">Total:</Text>
                    <Text fontSize="lg" fontWeight="bold">${total.toFixed(2)}</Text>
                  </HStack>
                </VStack>

                <Button
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  mt={6}
                  onClick={handlePlaceOrder}
                  isLoading={isProcessing}
                  loadingText="Processing order..."
                >
                  Place Order
                </Button>

                <Text fontSize="sm" color="gray.600" textAlign="center" mt={2}>
                  Your payment information is secure and encrypted.
                </Text>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  );
};

export default Checkout;
