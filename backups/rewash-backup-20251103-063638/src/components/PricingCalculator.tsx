import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Input,
  Button,
  Divider,
  Badge,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Grid,
  GridItem,
  Checkbox,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { UrgencyLevel, Pricing, TransportDetails, ServiceType, ServicePricing, LoyaltyProgram, PaymentMethod, PromoCode, Referral, CorporateDiscount, TieredPrice, LoyaltyProfile, LoyaltyTier, LoyaltyRedemption } from '../types/task';
import { useLoyaltySettings } from '../context/LoyaltySettingsContext';
import { saveAs } from 'file-saver';
import { useAuth } from '../contexts/AuthContext';
import { sendLoyaltyEmail } from '../utils/email';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { Icon } from '@chakra-ui/react';

interface PricingCalculatorProps {
  onPriceUpdate: (pricing: Pricing, transportDetails: TransportDetails) => void;
  initialPricing?: Pricing;
  initialTransportDetails?: TransportDetails;
  loyaltyMonths?: number;
}

const BASE_PRICE_PER_KG = 5; // Base price per kilogram
const TRANSPORT_BASE_FEE = 50; // Base transport fee
const TRANSPORT_PER_KM = 2; // Additional fee per kilometer

const URGENCY_MULTIPLIERS: Record<UrgencyLevel, number> = {
  'same-day': 2.5, // 150% extra for same day
  'next-day': 1.8, // 80% extra for next day
  'three-days': 1.4, // 40% extra for three days
  'one-week': 1.0, // No extra for one week
};

const SERVICE_TYPES: Record<ServiceType, { price: number; description: string }> = {
  'regular': { price: 1, description: 'Regular washing and drying' },
  'dry-cleaning': { price: 2.5, description: 'Professional dry cleaning' },
  'ironing': { price: 1.5, description: 'Professional ironing service' },
  'stain-removal': { price: 2, description: 'Special stain removal treatment' },
  'express': { price: 2, description: 'Express processing' },
};

const LOYALTY_DISCOUNTS: Record<number, LoyaltyProgram> = {
  3: { monthsEnrolled: 3, discountPercentage: 30, freePickup: true },
  6: { monthsEnrolled: 6, discountPercentage: 35, freePickup: true },
  12: { monthsEnrolled: 12, discountPercentage: 40, freePickup: true },
};

const BULK_DISCOUNTS = [
  { threshold: 10, discount: 0.05 }, // 5% off for 10+ kg
  { threshold: 20, discount: 0.10 }, // 10% off for 20+ kg
  { threshold: 30, discount: 0.15 }, // 15% off for 30+ kg
];

const TAX_RATE = 0.08; // 8% tax rate

const SEASONAL_ADJUSTMENTS: Record<string, number> = {
  'holiday': 0.15, // 15% increase during holidays
  'peak': 0.10,    // 10% increase during peak season
  'off': -0.05,    // 5% discount during off-season
};

const WEEKEND_ADJUSTMENT = 0.10; // 10% increase on weekends
const EVENT_ADJUSTMENT = 0.20;   // 20% increase for special events
const FIRST_TIME_DISCOUNT = 0.20; // 20% off for first-time customers
const REFERRAL_DISCOUNT = 0.10;   // 10% off for referrals
const CORPORATE_DISCOUNT = 0.15;  // 15% off for corporate clients
const CARD_SURCHARGE = 0.02;      // 2% surcharge for card payments
const ONLINE_DISCOUNT = 0.01;     // 1% discount for online payments

const PROMO_CODES: PromoCode[] = [
  { code: 'WELCOME30', discountPercentage: 30, description: '30% off for new users' },
  { code: 'FESTIVE20', discountPercentage: 20, description: '20% off during festivals' },
  { code: 'GROUP15', discountPercentage: 15, description: '15% off for group orders' },
];

const CORPORATE_CLIENTS: CorporateDiscount[] = [
  { companyName: 'Acme Corp', discountPercentage: 15 },
  { companyName: 'Globex', discountPercentage: 12 },
];

const TIERED_PRICING: TieredPrice[] = [
  { minKg: 1, maxKg: 5, pricePerKg: 5 },
  { minKg: 6, maxKg: 15, pricePerKg: 4.5 },
  { minKg: 16, maxKg: 1000, pricePerKg: 4 },
];

const LOYALTY_TIERS: Record<LoyaltyTier, { minPoints: number; discount: number; nextTier: LoyaltyTier | null }> = {
  silver: { minPoints: 0, discount: 0.05, nextTier: 'gold' },
  gold: { minPoints: 500, discount: 0.10, nextTier: 'platinum' },
  platinum: { minPoints: 1500, discount: 0.15, nextTier: null },
};

const POINTS_TO_DOLLAR_RATE = 100; // 100 points = $1 off

const REFERRAL_BONUS_POINTS = 100; // or any value you want

const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  onPriceUpdate,
  initialPricing,
  initialTransportDetails,
  loyaltyMonths = 0,
}) => {
  const { settings: loyaltySettings } = useLoyaltySettings();
  const toast = useToast();
  const { user } = useAuth();
  const [weight, setWeight] = useState<number>(initialPricing?.basePrice ? initialPricing.basePrice / BASE_PRICE_PER_KG : 0);
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('next-day');
  const [pickupAddress, setPickupAddress] = useState<string>(initialTransportDetails?.pickupAddress || '');
  const [dropoffAddress, setDropoffAddress] = useState<string>(initialTransportDetails?.dropoffAddress || '');
  const [distance, setDistance] = useState<number>(initialTransportDetails?.distance || 0);
  const [estimatedTime, setEstimatedTime] = useState<number>(initialTransportDetails?.estimatedTime || 0);
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(['regular']);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<LoyaltyProgram | null>(
    loyaltyMonths >= 3 ? LOYALTY_DISCOUNTS[3] : null
  );
  const [season, setSeason] = useState<string>('');
  const [isWeekend, setIsWeekend] = useState<boolean>(false);
  const [isEvent, setIsEvent] = useState<boolean>(false);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [referral, setReferral] = useState<Referral | undefined>(undefined);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [corporate, setCorporate] = useState<CorporateDiscount | null>(null);
  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile>({ points: 0, tier: 'silver', nextTierPoints: 500 });
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // --- CALCULATIONS AT TOP LEVEL ---
  // Tiered price and base price
  const tiered = getTieredPrice(weight);
  const basePrice = weight * tiered.pricePerKg;

  // Service pricing
  const servicePricing: ServicePricing[] = selectedServices.map(service => ({
    type: service,
    price: SERVICE_TYPES[service].price * weight,
    description: SERVICE_TYPES[service].description,
  }));
  const serviceTotal = servicePricing.reduce((sum: number, service: ServicePricing) => sum + service.price, 0);

  // Loyalty discount
  const tier = getLoyaltyTier(loyaltyProfile.points);
  const loyaltyDiscountRate = LOYALTY_TIERS[tier].discount;
  const loyaltyDiscountAmount = basePrice * loyaltyDiscountRate;

  // Bulk discount
  let bulkDiscount = 0;
  for (const discount of BULK_DISCOUNTS) {
    if (weight >= discount.threshold) {
      bulkDiscount = discount.discount;
      break;
    }
  }

  // Transport fee
  let transportFee = TRANSPORT_BASE_FEE + (distance * TRANSPORT_PER_KM);
  if (loyaltyDiscount?.freePickup) {
    transportFee = 0;
  }

  // Urgency multiplier
  const urgencyMultiplier = URGENCY_MULTIPLIERS[urgencyLevel];
  const priceWithUrgency = (basePrice + serviceTotal) * urgencyMultiplier;

  // Tax
  const taxAmount = priceWithUrgency * TAX_RATE;

  // Final price
  const finalPrice = priceWithUrgency + transportFee + taxAmount - loyaltyDiscountAmount - (bulkDiscount * priceWithUrgency);

  // Points earned
  const tierMultiplier = loyaltySettings.tierEarningMultipliers[tier] || 1;
  const promoMultiplier = isEvent ? (loyaltySettings.promoEarningMultiplier || 1) : 1;
  const pointsEarned = Math.floor((finalPrice || 0) * loyaltySettings.pointsPerDollar * tierMultiplier * promoMultiplier);

  // Loyalty redemption
  let loyaltyRedemptionDiscount = 0;
  const redemptionRate = loyaltySettings.pointsToDollarRate;
  if (pointsToRedeem > 0 && loyaltyProfile.points >= pointsToRedeem) {
    loyaltyRedemptionDiscount = pointsToRedeem / redemptionRate;
  }

  // --- END CALCULATIONS ---

  function getTieredPrice(weight: number): TieredPrice {
    return TIERED_PRICING.find(tier => weight >= tier.minKg && weight <= tier.maxKg) || TIERED_PRICING[0];
  }

  function getLoyaltyTier(points: number): LoyaltyTier {
    if (points >= LOYALTY_TIERS.platinum.minPoints) return 'platinum';
    if (points >= LOYALTY_TIERS.gold.minPoints) return 'gold';
    return 'silver';
  }

  const calculatePricing = (): Pricing => {
    // Calculate tiered price and base price
    const tiered = getTieredPrice(weight);
    const basePrice = weight * tiered.pricePerKg;

    // Calculate service pricing
    const servicePricing: ServicePricing[] = selectedServices.map(service => ({
      type: service,
      price: SERVICE_TYPES[service].price * weight,
      description: SERVICE_TYPES[service].description,
    }));
    const serviceTotal = servicePricing.reduce((sum: number, service: ServicePricing) => sum + service.price, 0);

    // Loyalty discount
    const tier = getLoyaltyTier(loyaltyProfile.points);
    const loyaltyDiscountRate = LOYALTY_TIERS[tier].discount;
    const loyaltyDiscountAmount = basePrice * loyaltyDiscountRate;

    // Bulk discount
    let bulkDiscount = 0;
    for (const discount of BULK_DISCOUNTS) {
      if (weight >= discount.threshold) {
        bulkDiscount = discount.discount;
        break;
      }
    }

    // Transport fee
    let transportFee = TRANSPORT_BASE_FEE + (distance * TRANSPORT_PER_KM);
    if (loyaltyDiscount?.freePickup) {
      transportFee = 0;
    }

    // Tax
    const taxAmount = (basePrice + serviceTotal) * TAX_RATE;

    // Apply urgency multiplier
    const urgencyMultiplier = URGENCY_MULTIPLIERS[urgencyLevel];
    const priceWithUrgency = (basePrice + serviceTotal) * urgencyMultiplier;
    
    // Calculate final price
    const finalPrice = priceWithUrgency + taxAmount;

    // Calculate loyalty points
    const pointsEarned = Math.floor(finalPrice * loyaltySettings.pointsPerDollar);
    const tierMultiplier = loyaltySettings.tierEarningMultipliers[loyaltyProfile.tier];
    const promoMultiplier = loyaltySettings.promoEarningMultiplier;
    const totalPointsEarned = pointsEarned * tierMultiplier * promoMultiplier;

    return {
      basePrice,
      currency: 'USD',
      discounts: [
        { type: 'loyalty', value: loyaltyDiscountAmount },
        { type: 'bulk', value: bulkDiscount * priceWithUrgency },
        { type: 'first-time', value: 0 },
        { type: 'referral', value: 0 },
        { type: 'corporate', value: 0 },
        { type: 'promo', value: 0 },
      ],
      taxes: [
        { type: 'sales', rate: TAX_RATE },
      ],
      urgencyMultiplier,
      tieredPrice: [tiered],
      finalPrice,
      loyaltyProfile: {
        points: loyaltyProfile.points + totalPointsEarned,
        tier: loyaltyProfile.tier,
        nextTierPoints: loyaltyProfile.nextTierPoints,
      },
    };
  };

  const handleCalculate = async () => {
    const pricing = calculatePricing();
    const transportDetails: TransportDetails = {
      pickupAddress,
      dropoffAddress,
      pickupTime: new Date().toISOString(),
      dropoffTime: new Date().toISOString(),
      vehicleType: 'standard',
      distance,
      estimatedTime,
    };

    onPriceUpdate(pricing, transportDetails);

    if (user?.email && pricing.finalPrice) {
      await sendLoyaltyEmail(user.email, pricing.finalPrice);
    }
  };

  const handleApplyPromo = () => {
    const found = PROMO_CODES.find(p => p.code.toLowerCase() === promoCodeInput.trim().toLowerCase());
    if (found) {
      setAppliedPromo(found);
      toast({ title: 'Promo Applied', description: found.description, status: 'success', duration: 3000 });
    } else {
      setAppliedPromo(null);
      toast({ title: 'Invalid Promo', description: 'Promo code not found', status: 'error', duration: 3000 });
    }
  };

  const handleCorporateSelect = (company: string) => {
    const corp = CORPORATE_CLIENTS.find(c => c.companyName === company);
    setCorporate(corp || null);
  };

  const pricing = calculatePricing();

  // Tier upgrade notification logic:
  useEffect(() => {
    const prevTier = loyaltyProfile.tier;
    const newTier = getLoyaltyTier(loyaltyProfile.points + pointsEarned);
    if (newTier !== prevTier) {
      toast({
        title: `Congratulations! You've reached ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} Tier!`,
        status: 'success',
        duration: 4000,
      });
    }
    // eslint-disable-next-line
  }, [pointsEarned]);

  const exportToCSV = (data: Record<string, any>) => {
    // Helper to escape CSV values
    function escapeCsvValue(val: unknown): string {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    // Replace xlsx with manual CSV creation
    const headers = Object.keys(data);
    const headerRow = headers.map(escapeCsvValue).join(',');
    const valueRow = headers.map((h) => escapeCsvValue((data as any)[h])).join(',');
    const csv = headerRow + '\n' + valueRow + '\n';
    const buf = new TextEncoder().encode(csv);
    saveAs(new Blob([buf], { type: 'text/csv;charset=utf-8;' }), 'loyalty_data.csv');
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Service Pricing Calculator</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            <GridItem>
              <FormControl isRequired>
                <FormLabel>Weight (kg)</FormLabel>
                <NumberInput
                  value={weight}
                  onChange={(_, value) => setWeight(value)}
                  min={0}
                  precision={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl isRequired>
                <FormLabel>Urgency Level</FormLabel>
                <Select
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value as UrgencyLevel)}
                >
                  <option value="same-day">Same Day (150% extra)</option>
                  <option value="next-day">Next Day (80% extra)</option>
                  <option value="three-days">Three Days (40% extra)</option>
                  <option value="one-week">One Week (Standard)</option>
                </Select>
              </FormControl>
            </GridItem>
          </Grid>

          <Divider />

          <FormControl>
            <FormLabel>Services</FormLabel>
            <VStack spacing={2} align="stretch">
              {Object.entries(SERVICE_TYPES).map(([type, { description }]) => (
                <Checkbox
                  key={type}
                  isChecked={selectedServices.includes(type as ServiceType)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedServices([...selectedServices, type as ServiceType]);
                    } else {
                      setSelectedServices(selectedServices.filter(s => s !== type));
                    }
                  }}
                >
                  {description} (${SERVICE_TYPES[type as ServiceType].price}/kg)
                </Checkbox>
              ))}
            </VStack>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Pickup Address</FormLabel>
            <Input
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Enter pickup address"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Dropoff Address</FormLabel>
            <Input
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="Enter dropoff address"
            />
          </FormControl>

          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            <GridItem>
              <FormControl>
                <FormLabel>Distance (km)</FormLabel>
                <NumberInput
                  value={distance}
                  onChange={(_, value) => setDistance(value)}
                  min={0}
                  precision={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </GridItem>

            <GridItem>
              <FormControl>
                <FormLabel>Estimated Time (minutes)</FormLabel>
                <NumberInput
                  value={estimatedTime}
                  onChange={(_, value) => setEstimatedTime(value)}
                  min={0}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </GridItem>
          </Grid>

          <Divider />

          <FormControl>
            <FormLabel>Season</FormLabel>
            <Select value={season} onChange={e => setSeason(e.target.value)} placeholder="Select season">
              <option value="holiday">Holiday</option>
              <option value="peak">Peak Season</option>
              <option value="off">Off Season</option>
            </Select>
          </FormControl>
          <FormControl>
            <Checkbox isChecked={isWeekend} onChange={e => setIsWeekend(e.target.checked)}>Weekend/Holiday</Checkbox>
            <Checkbox isChecked={isEvent} onChange={e => setIsEvent(e.target.checked)}>Special Event</Checkbox>
          </FormControl>
          <FormControl>
            <Checkbox isChecked={isFirstTime} onChange={e => setIsFirstTime(e.target.checked)}>First-Time Customer</Checkbox>
          </FormControl>
          <FormControl>
            <FormLabel>Referral</FormLabel>
            <Input placeholder="Referred by (name/code)" value={referral?.referredBy || ''} onChange={e => setReferral({ referredBy: e.target.value, discountPercentage: REFERRAL_DISCOUNT * 100 })} />
          </FormControl>
          <FormControl>
            <FormLabel>Corporate Client</FormLabel>
            <Select placeholder="Select company" onChange={e => handleCorporateSelect(e.target.value)}>
              <option value="">None</option>
              {CORPORATE_CLIENTS.map(corp => (
                <option key={corp.companyName} value={corp.companyName}>{corp.companyName}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Promo Code</FormLabel>
            <HStack>
              <Input value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value)} placeholder="Enter promo code" />
              <Button onClick={handleApplyPromo}>Apply</Button>
            </HStack>
            {appliedPromo && <Badge colorScheme="green">{appliedPromo.code}: {appliedPromo.discountPercentage}% off</Badge>}
          </FormControl>
          <FormControl>
            <FormLabel>Payment Method</FormLabel>
            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
              <option value="cash">Cash</option>
              <option value="card">Card (+2% surcharge)</option>
              <option value="online">Online (-1% discount)</option>
            </Select>
          </FormControl>

          <StatGroup>
            <Stat>
              <StatLabel>Tiered Price</StatLabel>
              <StatNumber>{pricing.tieredPrice?.[0].pricePerKg.toFixed(2) || '0.00'}/kg</StatNumber>
            </Stat>

            <Stat>
              <StatLabel>Loyalty Tier</StatLabel>
              <StatNumber>{pricing.loyaltyProfile?.tier ? pricing.loyaltyProfile.tier.charAt(0).toUpperCase() + pricing.loyaltyProfile.tier.slice(1) : 'Silver'}</StatNumber>
            </Stat>

            <Stat>
              <StatLabel>Loyalty Points</StatLabel>
              <StatNumber>{pricing.loyaltyProfile?.points ?? 0}</StatNumber>
            </Stat>

            <Stat>
              <StatLabel>Next Tier Points</StatLabel>
              <StatNumber>{pricing.loyaltyProfile?.nextTierPoints ?? 0}</StatNumber>
            </Stat>

            <Stat>
              <StatLabel>Services</StatLabel>
              <StatNumber>${pricing.tieredPrice?.[0].pricePerKg.toFixed(2) || '0.00'}</StatNumber>
              <StatHelpText>
                {selectedServices.length} services selected
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Loyalty Discount</StatLabel>
              <StatNumber>-${pricing.discounts.find(d => d.type === 'loyalty')?.value.toFixed(2) || '0.00'}</StatNumber>
              <StatHelpText>
                {loyaltyDiscountRate ? `${(loyaltyDiscountRate*100).toFixed(0)}% off` : 'No discount'}
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Bulk Discount</StatLabel>
              <StatNumber>-${(bulkDiscount * (pricing.tieredPrice?.[0].pricePerKg || 0)).toFixed(2) || '0.00'}</StatNumber>
              <StatHelpText>
                {bulkDiscount ? 'Bulk order discount' : 'No bulk discount'}
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Transport Fee</StatLabel>
              <StatNumber>${transportFee.toFixed(2)}</StatNumber>
              <StatHelpText>
                {loyaltyDiscount?.freePickup ? 'Free pickup' : `Base: $${TRANSPORT_BASE_FEE} + $${TRANSPORT_PER_KM}/km`}
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Tax (8%)</StatLabel>
              <StatNumber>${taxAmount.toFixed(2)}</StatNumber>
            </Stat>

            <Stat>
              <StatLabel>Final Price</StatLabel>
              <StatNumber>${finalPrice.toFixed(2)}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Total Amount
              </StatHelpText>
            </Stat>
          </StatGroup>

          {pricing.discounts.find(d => d.type === 'loyalty') && (
            <Alert status="success">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <AlertTitle>Loyalty Benefits Applied!</AlertTitle>
                <AlertDescription>
                  {`$${pricing.discounts.find(d => d.type === 'loyalty')?.value.toFixed(2)} loyalty discount applied!`}
                </AlertDescription>
              </VStack>
            </Alert>
          )}

          <FormControl>
            <FormLabel>Applied Discounts</FormLabel>
            <Text>{Array.isArray(pricing.discounts) && pricing.discounts.length > 0 ? pricing.discounts.map(d => `${d.type.charAt(0).toUpperCase() + d.type.slice(1)}: $${d.value.toFixed(2)}`).join(', ') : 'None'}</Text>
          </FormControl>

          {pricing.loyaltyProfile && (
            <FormControl>
              <FormLabel>Redeem Loyalty Points</FormLabel>
              <HStack>
                <NumberInput
                  value={pointsToRedeem}
                  onChange={(_, value) => setPointsToRedeem(value)}
                  min={0}
                  max={pricing.loyaltyProfile.points}
                  step={POINTS_TO_DOLLAR_RATE}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text>of {pricing.loyaltyProfile.points} points</Text>
                <Text color="green.600">${((pointsToRedeem / POINTS_TO_DOLLAR_RATE) || 0).toFixed(2)} off</Text>
              </HStack>
            </FormControl>
          )}

          {/* Show points earned for this order */}
          {finalPrice && (
            <Text color="blue.600" fontWeight="bold" mt={2}>
              You will earn {pointsEarned} points with this order!
            </Text>
          )}

          <Button
            colorScheme="blue"
            onClick={handleCalculate}
            isDisabled={!weight || !pickupAddress || !dropoffAddress}
          >
            Calculate Price
          </Button>

          <Box>
            <Text>Your Referral Code: <b>{user?.referralCode}</b></Text>
            <Button onClick={() => navigator.clipboard.writeText(user?.referralCode || '')}>Copy Code</Button>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PricingCalculator;