import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Checkbox,
  HStack,
  Badge,
} from '@chakra-ui/react';

interface BasicTaskInfoProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  status: string;
  setStatus: (status: string) => void;
  priority: string;
  setPriority: (priority: string) => void;
  type: string;
  setType: (type: string) => void;
  labels: string[];
  setLabels: (labels: string[]) => void;
  dueDate: string;
  setDueDate: (dueDate: string) => void;
  assignedTo?: string;
  setAssignedTo: (assignedTo?: string) => void;
  availableUsers?: Array<{ id: string; name: string }>;
}

const TASK_LABELS = ['frontend', 'backend', 'devops', 'design', 'testing', 'security', 'performance'];

export const BasicTaskInfo: React.FC<BasicTaskInfoProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  priority,
  setPriority,
  type,
  setType,
  labels,
  setLabels,
  dueDate,
  setDueDate,
  assignedTo,
  setAssignedTo,
  availableUsers,
}) => {
  return (
    <VStack spacing={4}>
      <FormControl isRequired>
        <FormLabel>Title</FormLabel>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
        />
      </FormControl>

      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description"
          rows={4}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Status</FormLabel>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Priority</FormLabel>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Type</FormLabel>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="feature">Feature</option>
          <option value="bug">Bug</option>
          <option value="enhancement">Enhancement</option>
          <option value="documentation">Documentation</option>
          <option value="maintenance">Maintenance</option>
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Labels</FormLabel>
        <HStack wrap="wrap" spacing={2}>
          {TASK_LABELS.map((label) => (
            <Checkbox
              key={label}
              isChecked={labels.includes(label)}
              onChange={(e) => {
                if (e.target.checked) {
                  setLabels([...labels, label]);
                } else {
                  setLabels(labels.filter((l) => l !== label));
                }
              }}
            >
              <Badge colorScheme="blue">{label}</Badge>
            </Checkbox>
          ))}
        </HStack>
      </FormControl>

      <FormControl>
        <FormLabel>Due Date</FormLabel>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </FormControl>

      {availableUsers && (
        <FormControl>
          <FormLabel>Assigned To</FormLabel>
          <Select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Select assignee"
          >
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
    </VStack>
  );
}; 