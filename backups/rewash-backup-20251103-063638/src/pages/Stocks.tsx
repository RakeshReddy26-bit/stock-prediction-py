import { useState } from 'react';
import { Box, Button, Heading, HStack, Input, Stack, Text, useToast, Stat, StatLabel, StatNumber, SimpleGrid } from '@chakra-ui/react';
import StockModelsBadgeList from '../components/StockModelsBadgeList';

export default function Stocks() {
  const [ticker, setTicker] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const toast = useToast();

  const onPredict = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/stocks/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Prediction failed');
      setResult(data.data);
    } catch (e: any) {
      toast({ status: 'error', title: 'Prediction error', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="3xl" mx="auto" py={8} px={4}>
      <Heading size="md" mb={3}>Available Models</Heading>
      <StockModelsBadgeList />
      <Box h={6} />
      <Heading size="lg" mb={4}>Stock Prediction</Heading>
      <HStack>
        <Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="Ticker (e.g., AAPL)" maxW="200px" />
        <Button colorScheme="brand" onClick={onPredict} isLoading={loading}>Predict</Button>
      </HStack>

      {result && (
        <Stack mt={8} spacing={4}>
          <Text color="gray.600">As of {result.as_of} for {result.ticker}</Text>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel>Last Close</StatLabel>
              <StatNumber>${result.last_close?.toFixed?.(2) ?? result.last_close}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>SMA 5</StatLabel>
              <StatNumber>${result.sma5 ? result.sma5.toFixed(2) : '-'}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>SMA 20</StatLabel>
              <StatNumber>${result.sma20 ? result.sma20.toFixed(2) : '-'}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Predicted Next</StatLabel>
              <StatNumber>${result.prediction_next?.toFixed?.(2) ?? result.prediction_next}</StatNumber>
            </Stat>
          </SimpleGrid>
        </Stack>
      )}
    </Box>
  );
}
