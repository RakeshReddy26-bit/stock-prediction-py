import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Button,
  VStack,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { useLoyaltySettings } from '../../context/LoyaltySettingsContext';
import { LoyaltyTier } from '../../types/task';

const LoyaltySettingsAdmin: React.FC = () => {
  const { settings, updateSettings } = useLoyaltySettings();
  const [pointsPerDollar, setPointsPerDollar] = useState(settings.pointsPerDollar);
  const [pointsToDollarRate, setPointsToDollarRate] = useState(settings.pointsToDollarRate);
  const [tierEarningMultipliers, setTierEarningMultipliers] = useState(settings.tierEarningMultipliers || {
    silver: 1,
    gold: 1.2,
    platinum: 1.5,
  });
  const [promoEarningMultiplier, setPromoEarningMultiplier] = useState(settings.promoEarningMultiplier || 2);
  const toast = useToast();

  const handleSave = () => {
    updateSettings({
      pointsPerDollar,
      pointsToDollarRate,
      tierEarningMultipliers,
      promoEarningMultiplier,
    });
    toast({ title: 'Loyalty settings updated!', status: 'success', duration: 2000 });
  };

  return (
    <Box maxW="lg" mx="auto" p={6} borderWidth={1} borderRadius="md" boxShadow="md">
      <Heading size="md" mb={4}>Loyalty Program Settings</Heading>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Points Earned per $1 Spent</FormLabel>
          <NumberInput value={pointsPerDollar} min={0} step={0.1} onChange={(_, v) => setPointsPerDollar(v)}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <FormControl>
          <FormLabel>Points Needed for $1 Discount</FormLabel>
          <NumberInput value={pointsToDollarRate} min={1} step={1} onChange={(_, v) => setPointsToDollarRate(v)}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <Divider />
        <Heading size="sm">Tier Earning Multipliers</Heading>
        {(['silver', 'gold', 'platinum'] as LoyaltyTier[]).map(tier => (
          <FormControl key={tier}>
            <FormLabel>{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Multiplier</FormLabel>
            <NumberInput
              value={tierEarningMultipliers[tier]}
              min={0.1}
              step={0.1}
              onChange={(_, v) => setTierEarningMultipliers({ ...tierEarningMultipliers, [tier]: v })}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        ))}
        <Divider />
        <FormControl>
          <FormLabel>Promo Earning Multiplier</FormLabel>
          <NumberInput value={promoEarningMultiplier} min={1} step={0.1} onChange={(_, v) => setPromoEarningMultiplier(v)}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <HStack justify="flex-end" pt={4}>
          <Button colorScheme="blue" onClick={handleSave}>Save Settings</Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default LoyaltySettingsAdmin;