import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Progress,
  Button,
  IconButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Task } from '../../types/task';
import { TaskForm } from '../TaskForm';
import { TimeTracking } from './TimeTracking';

interface TaskDetailProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  availableUsers?: Array<{ id: string; name: string }>;
  userId: string;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  onEdit,
  onDelete,
  availableUsers,
  userId,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'review':
        return 'yellow';
      case 'blocked':
        return 'red';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'gray';
      case 'medium':
        return 'blue';
      case 'high':
        return 'orange';
      case 'urgent':
        return 'red';
      default:
        return 'gray';
    }
  };

  const calculateProgress = () => {
    if (!task.subtasks.length) return 0;
    const completed = task.subtasks.filter((s) => s.completed).length;
    return (completed / task.subtasks.length) * 100;
  };

  const calculateTimeProgress = () => {
    if (!task.estimatedTime || !task.actualTime) return 0;
    return (task.actualTime / task.estimatedTime) * 100;
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">
              {task.title}
            </Text>
            <HStack>
              <Badge colorScheme={getStatusColor(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge colorScheme={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge colorScheme="blue">{task.type}</Badge>
            </HStack>
          </VStack>
          <HStack>
            <Button leftIcon={<EditIcon />} onClick={onOpen}>
              Edit
            </Button>
            <IconButton
              aria-label="Delete task"
              icon={<DeleteIcon />}
              colorScheme="red"
              onClick={() => onDelete(task.id)}
            />
          </HStack>
        </HStack>

        <Divider />

        <Tabs>
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Time Tracking</Tab>
            <Tab>Subtasks</Tab>
            <Tab>Comments</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Description
                  </Text>
                  <Text>{task.description}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Progress
                  </Text>
                  <VStack spacing={2}>
                    <Box width="100%">
                      <Text fontSize="sm" mb={1}>
                        Subtasks Progress
                      </Text>
                      <Progress value={calculateProgress()} colorScheme="blue" />
                      <Text fontSize="sm" mt={1}>
                        {calculateProgress().toFixed(1)}% Complete
                      </Text>
                    </Box>
                    <Box width="100%">
                      <Text fontSize="sm" mb={1}>
                        Time Progress
                      </Text>
                      <Progress value={calculateTimeProgress()} colorScheme="green" />
                      <Text fontSize="sm" mt={1}>
                        {calculateTimeProgress().toFixed(1)}% of Estimated Time
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Details
                  </Text>
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Text fontWeight="medium">Assigned To:</Text>
                      <Text>
                        {availableUsers?.find((user) => user.id === task.assignedTo)?.name || '-'}
                      </Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium">Due Date:</Text>
                      <Text>{task.dueDate || '-'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium">Story Points:</Text>
                      <Text>{task.storyPoints || '-'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium">Labels:</Text>
                      <HStack>
                        {task.labels.map((label) => (
                          <Badge key={label} colorScheme="blue">
                            {label}
                          </Badge>
                        ))}
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>

                {task.acceptanceCriteria.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Acceptance Criteria
                    </Text>
                    <VStack spacing={2} align="start">
                      {task.acceptanceCriteria.map((criterion, index) => (
                        <Text key={index}>• {criterion}</Text>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <TimeTracking
                estimatedTime={task.estimatedTime}
                setEstimatedTime={() => {}}
                actualTime={task.actualTime}
                setActualTime={() => {}}
                timeEntries={task.timeEntries}
                setTimeEntries={() => {}}
                userId={userId}
              />
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {task.subtasks.map((subtask) => (
                  <Box
                    key={subtask.id}
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    width="100%"
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{subtask.title}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {subtask.description}
                        </Text>
                        <HStack>
                          {subtask.assignedTo && (
                            <Badge colorScheme="purple">
                              {availableUsers?.find((u) => u.id === subtask.assignedTo)?.name}
                            </Badge>
                          )}
                          {subtask.dueDate && <Badge>{subtask.dueDate}</Badge>}
                        </HStack>
                      </VStack>
                      <Badge
                        colorScheme={subtask.completed ? 'green' : 'gray'}
                        fontSize="sm"
                      >
                        {subtask.completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {task.comments.map((comment) => (
                  <Box
                    key={comment.id}
                    p={4}
                    borderWidth={1}
                    borderRadius="md"
                    width="100%"
                  >
                    <HStack justify="space-between">
                      <Text fontWeight="bold">
                        {availableUsers?.find((u) => u.id === comment.userId)?.name}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </Text>
                    </HStack>
                    <Text mt={2}>{comment.content}</Text>
                  </Box>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      <TaskForm
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={async (taskData) => {
          onEdit({
            ...taskData,
            id: task.id,
            createdAt: task.createdAt,
            updatedAt: new Date().toISOString(),
          });
          onClose();
        }}
        initialData={task}
        userId={userId}
        availableUsers={availableUsers}
      />
    </Box>
  );
}; 