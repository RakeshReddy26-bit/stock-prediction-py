import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  Input,
  Text,
} from '@chakra-ui/react';
import { TimeEntry } from '../../types/task';

interface TimeTrackingProps {
  estimatedTime?: number;
  setEstimatedTime: (time: number) => void;
  actualTime?: number;
  setActualTime: (time: number) => void;
  timeEntries: TimeEntry[];
  setTimeEntries: (entries: TimeEntry[]) => void;
  userId: string;
}

export const TimeTracking: React.FC<TimeTrackingProps> = ({
  estimatedTime,
  setEstimatedTime,
  actualTime,
  setActualTime,
  timeEntries,
  setTimeEntries,
  userId,
}) => {
  const [newTimeEntry, setNewTimeEntry] = React.useState({
    duration: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleAddTimeEntry = () => {
    if (newTimeEntry.duration <= 0 || !newTimeEntry.description) return;

    const entry: TimeEntry = {
      id: Date.now().toString(),
      userId,
      duration: newTimeEntry.duration,
      description: newTimeEntry.description,
      date: newTimeEntry.date,
      createdAt: new Date().toISOString(),
    };

    setTimeEntries([...timeEntries, entry]);
    setNewTimeEntry({
      duration: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleRemoveTimeEntry = (entryId: string) => {
    setTimeEntries(timeEntries.filter((entry) => entry.id !== entryId));
  };

  const calculateTotalTime = () => {
    return timeEntries.reduce((total, entry) => total + entry.duration, 0);
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack spacing={4}>
        <FormControl>
          <FormLabel>Estimated Time (hours)</FormLabel>
          <NumberInput
            value={estimatedTime}
            onChange={(_, value) => setEstimatedTime(value)}
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

        <FormControl>
          <FormLabel>Actual Time (hours)</FormLabel>
          <NumberInput
            value={actualTime}
            onChange={(_, value) => setActualTime(value)}
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
      </HStack>

      <FormControl>
        <FormLabel>Time Entries</FormLabel>
        <VStack spacing={4} align="stretch">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Duration (hours)</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {timeEntries.map((entry) => (
                <Tr key={entry.id}>
                  <Td>{entry.date}</Td>
                  <Td>{entry.duration}</Td>
                  <Td>{entry.description}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleRemoveTimeEntry(entry.id)}
                    >
                      Remove
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <HStack spacing={2}>
            <Input
              type="date"
              value={newTimeEntry.date}
              onChange={(e) =>
                setNewTimeEntry({ ...newTimeEntry, date: e.target.value })
              }
            />
            <NumberInput
              value={newTimeEntry.duration}
              onChange={(_, value) =>
                setNewTimeEntry({ ...newTimeEntry, duration: value })
              }
              min={0}
              precision={1}
              w="150px"
            >
              <NumberInputField placeholder="Hours" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Input
              value={newTimeEntry.description}
              onChange={(e) =>
                setNewTimeEntry({ ...newTimeEntry, description: e.target.value })
              }
              placeholder="Description"
            />
            <Button onClick={handleAddTimeEntry}>Add Entry</Button>
          </HStack>

          <Text>Total Time: {calculateTotalTime()} hours</Text>
        </VStack>
      </FormControl>
    </VStack>
  );
}; 