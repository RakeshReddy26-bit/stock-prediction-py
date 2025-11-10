import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Button, Input, VStack, HStack, IconButton, Badge, useToast } from '@chakra-ui/react';
import { CopyIcon, LinkIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const REFERRAL_CODE = 'RAKII@26'; // Hardcoded for this user

const Referral: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const toast = useToast();

  // Fetch friends who joined with this user's code and earned discount
  useEffect(() => {
    if (!user) return;
    const fetchReferralData = async () => {
      // Find users who have this user's code as their referrer
      const q = query(collection(db, 'users'), where('referredBy', '==', REFERRAL_CODE));
      const querySnapshot = await getDocs(q);
      const joined = querySnapshot.docs.map(doc => doc.data());
      setFriends(joined);
      // Get this user's discount balance
      const userDoc = await getDoc(doc(db, 'users', user.id));
      setDiscount(userDoc.exists() ? userDoc.data().discountBalance || 0 : 0);
    };
    fetchReferralData();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_CODE);
    toast({ title: 'Referral code copied!', status: 'success', duration: 2000 });
  };

  const referralLink = `${window.location.origin}/signup?ref=${REFERRAL_CODE}`;

  return (
    <Box maxW="md" mx="auto" py={10}>
      <Heading mb={4}>Referral Program</Heading>
      <Text mb={2}>Share your referral code and earn rewards!</Text>
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontWeight="bold">Your Referral Code:</Text>
          <HStack>
            <Input value={REFERRAL_CODE} isReadOnly w="auto" />
            <IconButton aria-label="Copy code" icon={<CopyIcon />} onClick={handleCopy} />
          </HStack>
        </Box>
        <Box>
          <Text fontWeight="bold">Share Link:</Text>
          <HStack>
            <Input value={referralLink} isReadOnly w="auto" />
            <IconButton aria-label="Copy link" icon={<LinkIcon />} onClick={() => {navigator.clipboard.writeText(referralLink); toast({ title: 'Referral link copied!', status: 'success', duration: 2000 });}} />
          </HStack>
        </Box>
        <Box>
          <Text fontWeight="bold">Friends Joined:</Text>
          <Text>{friends.length} friend(s) joined using your code.</Text>
          {friends.length > 0 && (
            <VStack align="start" spacing={1} mt={2}>
              {friends.map((f, i) => (
                <Badge key={i} colorScheme="green">{f.email}</Badge>
              ))}
            </VStack>
          )}
        </Box>
        <Box>
          <Text fontWeight="bold">Earned Discount:</Text>
          <Text fontSize="xl" color="blue.600">€{discount}</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default Referral;