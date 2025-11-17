import { Box, Container, Heading, Text, Button, Grid, Card, CardBody, Image, Stack, VStack, HStack, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaShippingFast, FaClock, FaLeaf } from 'react-icons/fa';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section with Full Background Image */}
      <Box
        position="relative"
        height="600px"
        backgroundImage="url('https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=1920&h=1080&fit=crop')"
        backgroundSize="cover"
        backgroundPosition="center"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.6)"
        />
        <Container maxW="7xl" height="100%" position="relative" zIndex={1}>
          <VStack justify="center" height="100%" spacing={6} color="white" textAlign="center">
            <Heading as="h1" size="3xl" fontWeight="bold">
              Premium Laundry Delivered
            </Heading>
            <Text fontSize="2xl" maxW="3xl">
              Experience the convenience of professional laundry service with free pickup and delivery.
              Eco-friendly, fast, and affordable.
            </Text>
            <HStack spacing={6} pt={4}>
              <Button
                size="lg"
                colorScheme="blue"
                fontSize="xl"
                px={12}
                py={7}
                onClick={() => navigate('/services')}
              >
                Browse Services
              </Button>
              {/* Stocks CTA removed */}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxW="7xl" py={20}>
        <Grid templateColumns="repeat(3, 1fr)" gap={12} textAlign="center">
          <VStack>
            <Heading size="2xl" color="blue.500">5000+</Heading>
            <Text fontSize="xl" color="gray.600">Happy Customers</Text>
          </VStack>
          <VStack>
            <Heading size="2xl" color="blue.500">24hr</Heading>
            <Text fontSize="xl" color="gray.600">Express Service</Text>
          </VStack>
          <VStack>
            <Heading size="2xl" color="blue.500">100%</Heading>
            <Text fontSize="xl" color="gray.600">Satisfaction Guarantee</Text>
          </VStack>
        </Grid>
      </Container>

      {/* Services Section with Photos */}
      <Box bg="gray.50" py={20}>
        <Container maxW="7xl">
          <VStack spacing={16}>
            <VStack spacing={4}>
              <Heading size="2xl">Our Premium Services</Heading>
              <Text fontSize="lg" color="gray.600" maxW="3xl" textAlign="center">
                Choose from our range of professional laundry services designed to meet all your needs
              </Text>
            </VStack>

            <Grid templateColumns="repeat(4, 1fr)" gap={10} w="full">
              {/* Washing */}
              <Card shadow="lg" _hover={{ transform: 'translateY(-8px)', transition: '0.3s' }}>
                <Image
                  src="https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&h=400&fit=crop"
                  alt="Washing"
                  height="300px"
                  objectFit="cover"
                />
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Icon as={FaLeaf} boxSize={8} color="green.500" />
                    <Heading size="md">Washing</Heading>
                    <Text color="gray.600">
                      Professional washing and folding service with eco-friendly detergents
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      From $2/item
                    </Text>
                    <Button colorScheme="blue" width="full" onClick={() => navigate('/washing')}>
                      Book Service
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Ironing */}
              <Card shadow="lg" _hover={{ transform: 'translateY(-8px)', transition: '0.3s' }}>
                <Image
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop"
                  alt="Ironing"
                  height="300px"
                  objectFit="cover"
                />
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Icon as={FaClock} boxSize={8} color="purple.500" />
                    <Heading size="md">Ironing</Heading>
                    <Text color="gray.600">
                      Expert ironing and pressing for crisp, professional results
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      From $1.50/item
                    </Text>
                    <Button colorScheme="blue" width="full" onClick={() => navigate('/iron')}>
                      Book Service
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Leather Care */}
              <Card shadow="lg" _hover={{ transform: 'translateY(-8px)', transition: '0.3s' }}>
                <Image
                  src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&h=400&fit=crop"
                  alt="Leather Care"
                  height="300px"
                  objectFit="cover"
                />
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Icon as={FaShippingFast} boxSize={8} color="orange.500" />
                    <Heading size="md">Leather Care</Heading>
                    <Text color="gray.600">
                      Specialized cleaning and conditioning for leather garments
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      From $18/item
                    </Text>
                    <Button colorScheme="blue" width="full" onClick={() => navigate('/leather')}>
                      Book Service
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Alterations */}
              <Card shadow="lg" _hover={{ transform: 'translateY(-8px)', transition: '0.3s' }}>
                <Image
                  src="https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=600&h=400&fit=crop"
                  alt="Alterations"
                  height="300px"
                  objectFit="cover"
                />
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Icon as={FaLeaf} boxSize={8} color="red.500" />
                    <Heading size="md">Alterations</Heading>
                    <Text color="gray.600">
                      Professional tailoring and clothing alterations
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      Custom Pricing
                    </Text>
                    <Button colorScheme="blue" width="full" onClick={() => navigate('/alterations')}>
                      Book Service
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Stocks card removed */}
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* Why Choose Section */}
      <Container maxW="7xl" py={20}>
        <VStack spacing={16}>
          <Heading size="2xl">Why Choose ReWash?</Heading>
          <Grid templateColumns="repeat(3, 1fr)" gap={12}>
            <VStack spacing={6}>
              <Image
                src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop"
                alt="Free Delivery"
                borderRadius="lg"
                boxSize="300px"
                objectFit="cover"
              />
              <Heading size="md">Free Pickup & Delivery</Heading>
              <Text textAlign="center" color="gray.600">
                We come to you, saving your valuable time
              </Text>
            </VStack>
            <VStack spacing={6}>
              <Image
                src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&h=300&fit=crop"
                alt="Professional"
                borderRadius="lg"
                boxSize="300px"
                objectFit="cover"
              />
              <Heading size="md">Real-time Tracking</Heading>
              <Text textAlign="center" color="gray.600">
                Know exactly where your clothes are at all times
              </Text>
            </VStack>
            <VStack spacing={6}>
              <Image
                src="https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=300&fit=crop"
                alt="Quality Care"
                borderRadius="lg"
                boxSize="300px"
                objectFit="cover"
              />
              <Heading size="md">Premium Care</Heading>
              <Text textAlign="center" color="gray.600">
                Expert handling of all fabric types with care
              </Text>
            </VStack>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
}