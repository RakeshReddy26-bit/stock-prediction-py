import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Box,
  Text,
} from '@chakra-ui/react';
import { LoyaltyPointsHistoryEntry } from '../types/task';

interface LoyaltyPointsHistoryProps {
  history: LoyaltyPointsHistoryEntry[];
}

const LoyaltyPointsHistory: React.FC<LoyaltyPointsHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <Box p={4}><Text>No loyalty points history yet.</Text></Box>;
  }

  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Action</Th>
            <Th>Points</Th>
            <Th>Order</Th>
            <Th>Description</Th>
          </Tr>
        </Thead>
        <Tbody>
          {history.map((entry, idx) => (
            <Tr key={idx}>
              <Td>{new Date(entry.date).toLocaleDateString()}</Td>
              <Td>
                <Badge colorScheme={entry.action === 'earned' ? 'green' : 'red'}>
                  {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                </Badge>
              </Td>
              <Td>{entry.action === 'earned' ? '+' : '-'}{entry.points}</Td>
              <Td>{entry.orderId || '-'}</Td>
              <Td>{entry.description || '-'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default LoyaltyPointsHistory; 