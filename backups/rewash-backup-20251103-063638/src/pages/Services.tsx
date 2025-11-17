import { useState } from 'react';
import {
  Container,
  Heading,
  Grid,
  Card,
  CardBody,
  Text,
  Button,
  Badge,
  HStack,
  VStack,
  useToast,
  Image,
} from '@chakra-ui/react';
import { CLOTHING_CATALOG, ClothingItem } from '../data/clothingCatalog';
import PageTransition from '../components/PageTransition';
import { useCartStore } from '../store/cartStore';

interface ServicesProps {
  category?: 'washing' | 'iron' | 'leather' | 'alterations';
}

export default function Services({ category }: ServicesProps) {
  const toast = useToast();
  const { addItem } = useCartStore();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filteredItems = category
    ? CLOTHING_CATALOG.filter(item => item.serviceCategory === category)
    : CLOTHING_CATALOG;

  const handleAddToCart = (item: ClothingItem, service: 'wash' | 'dryClean' | 'iron' | 'express') => {
    const key = `${item.id}-${service}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    let price = 0;
    switch (service) {
      case 'wash':
        price = item.prices.wash || 0;
        break;
      case 'dryClean':
        price = item.prices.dryClean || 0;
        break;
      case 'iron':
        price = item.prices.iron || 0;
        break;
      case 'express':
        price = item.prices.express || 0;
        break;
    }

    addItem({
      id: item.id,
      name: item.name,
      image: item.image,
      service,
      price,
      category: item.category,
    });

    setTimeout(() => {
      toast({
        title: 'Added to cart!',
        description: `${item.name} (${service}) has been added to your cart`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      setLoading(prev => ({ ...prev, [key]: false }));
    }, 500);
  };

  const getServiceLabel = (service: string) => {
    switch (service) {
      case 'wash':
        return 'Wash & Fold';
      case 'dryClean':
        return 'Dry Clean';
      case 'iron':
        return 'Iron Only';
      case 'express':
        return 'Express (24h)';
      default:
        return service;
    }
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'wash':
        return 'blue';
      case 'dryClean':
        return 'purple';
      case 'iron':
        return 'green';
      case 'express':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <PageTransition>
      <Container maxW="7xl" py={16} role="main" aria-labelledby="services-heading">
        <VStack spacing={12} align="stretch">
          <VStack spacing={4}>
            <Heading id="services-heading" size="2xl">Select Your Clothing Items</Heading>
            <Text fontSize="lg" color="gray.600" id="services-description">
              Choose from our comprehensive catalog of clothing care services
            </Text>
          </VStack>

          <Grid
            templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
            gap={8}
            role="grid"
            aria-label="Clothing catalog grid"
          >
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                shadow="lg"
                transition="all 0.3s ease"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: '2xl',
                }}
                borderRadius="xl"
                overflow="hidden"
                role="article"
                aria-labelledby={`item-${item.id}-title`}
                aria-describedby={`item-${item.id}-description`}
              >
                <Image
                  src={item.image}
                  alt={`Professional image of ${item.name} for laundry service`}
                  height="250px"
                  objectFit="cover"
                  borderRadius="xl 0 0 0"
                />
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <VStack align="start" spacing={2}>
                      <Heading id={`item-${item.id}-title`} size="md">{item.name}</Heading>
                      <Badge colorScheme="blue" fontSize="sm" aria-label={`Category: ${item.category === 'mens' ? "Men's" : item.category === 'womens' ? "Women's" : 'Specialty'}`}>
                        {item.category === 'mens' ? "Men's" : item.category === 'womens' ? "Women's" : 'Specialty'}
                      </Badge>
                      <Text id={`item-${item.id}-description`} fontSize="sm" color="gray.600">{item.description}</Text>
                    </VStack>

                    <VStack align="start" w="full" spacing={2} role="list" aria-label="Available services and prices">
                      {item.prices.wash && item.prices.wash > 0 && (
                        <HStack justify="space-between" w="full" role="listitem">
                          <Text fontSize="sm">Wash & Fold:</Text>
                          <Text fontWeight="bold" color="blue.600" aria-label={`Wash and fold price: $${item.prices.wash.toFixed(2)}`}>
                            ${item.prices.wash.toFixed(2)}
                          </Text>
                        </HStack>
                      )}
                      {item.prices.dryClean && item.prices.dryClean > 0 && (
                        <HStack justify="space-between" w="full" role="listitem">
                          <Text fontSize="sm">Dry Clean:</Text>
                          <Text fontWeight="bold" color="blue.600" aria-label={`Dry clean price: $${item.prices.dryClean.toFixed(2)}`}>
                            ${item.prices.dryClean.toFixed(2)}
                          </Text>
                        </HStack>
                      )}
                      {item.prices.iron && item.prices.iron > 0 && (
                        <HStack justify="space-between" w="full" role="listitem">
                          <Text fontSize="sm">Iron Only:</Text>
                          <Text fontWeight="bold" color="blue.600" aria-label={`Iron only price: $${item.prices.iron.toFixed(2)}`}>
                            ${item.prices.iron.toFixed(2)}
                          </Text>
                        </HStack>
                      )}
                      {item.prices.express && item.prices.express > 0 && (
                        <HStack justify="space-between" w="full" role="listitem">
                          <Text fontSize="sm" color="orange.600">Express (24h):</Text>
                          <Text fontWeight="bold" color="orange.600" aria-label={`Express 24 hour service price: $${item.prices.express.toFixed(2)}`}>
                            ${item.prices.express.toFixed(2)}
                          </Text>
                        </HStack>
                      )}
                    </VStack>

                    <VStack w="full" spacing={2} role="group" aria-label={`Service selection buttons for ${item.name}`}>
                      {item.prices.wash && item.prices.wash > 0 && (
                        <Button
                          colorScheme={getServiceColor('wash')}
                          width="full"
                          size="sm"
                          onClick={() => handleAddToCart(item, 'wash')}
                          isLoading={loading[`${item.id}-wash`]}
                          loadingText="Adding..."
                          aria-label={`Add ${item.name} to cart for wash and fold service costing $${item.prices.wash.toFixed(2)}`}
                          _hover={{
                            transform: 'scale(1.02)',
                          }}
                          transition="all 0.2s"
                        >
                          Add Wash & Fold - ${item.prices.wash.toFixed(2)}
                        </Button>
                      )}
                      {item.prices.dryClean && item.prices.dryClean > 0 && (
                        <Button
                          colorScheme={getServiceColor('dryClean')}
                          width="full"
                          size="sm"
                          onClick={() => handleAddToCart(item, 'dryClean')}
                          isLoading={loading[`${item.id}-dryClean`]}
                          loadingText="Adding..."
                          aria-label={`Add ${item.name} to cart for dry cleaning service costing $${item.prices.dryClean.toFixed(2)}`}
                          _hover={{
                            transform: 'scale(1.02)',
                          }}
                          transition="all 0.2s"
                        >
                          Add Dry Clean - ${item.prices.dryClean.toFixed(2)}
                        </Button>
                      )}
                      {item.prices.iron && item.prices.iron > 0 && (
                        <Button
                          colorScheme={getServiceColor('iron')}
                          width="full"
                          size="sm"
                          onClick={() => handleAddToCart(item, 'iron')}
                          isLoading={loading[`${item.id}-iron`]}
                          loadingText="Adding..."
                          aria-label={`Add ${item.name} to cart for iron only service costing $${item.prices.iron.toFixed(2)}`}
                          _hover={{
                            transform: 'scale(1.02)',
                          }}
                          transition="all 0.2s"
                        >
                          Add Iron Only - ${item.prices.iron.toFixed(2)}
                        </Button>
                      )}
                      {item.prices.express && item.prices.express > 0 && (
                        <Button
                          colorScheme={getServiceColor('express')}
                          width="full"
                          size="sm"
                          onClick={() => handleAddToCart(item, 'express')}
                          isLoading={loading[`${item.id}-express`]}
                          loadingText="Adding..."
                          aria-label={`Add ${item.name} to cart for express 24 hour service costing $${item.prices.express.toFixed(2)}`}
                          _hover={{
                            transform: 'scale(1.02)',
                          }}
                          transition="all 0.2s"
                        >
                          Add Express - ${item.prices.express.toFixed(2)}
                        </Button>
                      )}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Container>
    </PageTransition>
  );
}
