import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Button,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';

interface TaskOrganizationProps {
  sprintId?: string;
  setSprintId: (sprintId?: string) => void;
  epicId?: string;
  setEpicId: (epicId?: string) => void;
  storyPoints?: number;
  setStoryPoints: (storyPoints?: number) => void;
  acceptanceCriteria: string[];
  setAcceptanceCriteria: (criteria: string[]) => void;
}

export const TaskOrganization: React.FC<TaskOrganizationProps> = ({
  sprintId,
  setSprintId,
  epicId,
  setEpicId,
  storyPoints,
  setStoryPoints,
  acceptanceCriteria,
  setAcceptanceCriteria,
}) => {
  return (
    <VStack spacing={4}>
      <FormControl>
        <FormLabel>Sprint</FormLabel>
        <Input
          value={sprintId}
          onChange={(e) => setSprintId(e.target.value)}
          placeholder="Enter sprint ID"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Epic</FormLabel>
        <Input
          value={epicId}
          onChange={(e) => setEpicId(e.target.value)}
          placeholder="Enter epic ID"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Story Points</FormLabel>
        <NumberInput
          value={storyPoints}
          onChange={(_, value) => setStoryPoints(value)}
          min={0}
          max={21}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </FormControl>

      <FormControl>
        <FormLabel>Acceptance Criteria</FormLabel>
        <VStack spacing={2}>
          {acceptanceCriteria.map((criterion, index) => (
            <HStack key={index} width="100%">
              <Input
                value={criterion}
                onChange={(e) => {
                  const newCriteria = [...acceptanceCriteria];
                  newCriteria[index] = e.target.value;
                  setAcceptanceCriteria(newCriteria);
                }}
                placeholder={`Criterion ${index + 1}`}
              />
              <IconButton
                aria-label="Remove criterion"
                icon={<DeleteIcon />}
                onClick={() => {
                  setAcceptanceCriteria(
                    acceptanceCriteria.filter((_, i) => i !== index)
                  );
                }}
              />
            </HStack>
          ))}
          <Button
            leftIcon={<AddIcon />}
            onClick={() => setAcceptanceCriteria([...acceptanceCriteria, ''])}
          >
            Add Criterion
          </Button>
        </VStack>
      </FormControl>
    </VStack>
  );
}; 