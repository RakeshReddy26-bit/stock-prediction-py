import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  HStack,
  Button,
  VStack,
  Text,
  useDisclosure,
  Icon,
} from '@chakra-ui/react';
import { FiChevronUp, FiChevronDown, FiMoreVertical, FiEdit2, FiTrash2, FiPaperclip } from 'react-icons/fi';
import { Task, TaskStatus, TaskPriority } from '../../types/task';
import { TaskForm } from '../TaskForm';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView: (taskId: string) => void;
  availableUsers: { id: string; name: string }[];
  userId: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onView,
  availableUsers,
  userId,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    onOpen();
  };

  const handleDelete = (taskId: string) => {
    onDelete(taskId);
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'todo':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'completed':
        return 'green';
      case 'blocked':
        return 'red';
      case 'review':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Priority</Th>
            <Th>Type</Th>
            <Th>Assigned To</Th>
            <Th>Due Date</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tasks.map((task) => (
            <React.Fragment key={task.id}>
              <Tr>
                <Td>{task.title}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </Td>
                <Td>{task.type}</Td>
                <Td>{task.assignedTo}</Td>
                <Td>{new Date(task.dueDate).toLocaleDateString()}</Td>
                <Td>
                  <Flex justify="flex-end">
                    <HStack spacing={2}>
                      {task.isRecurring && (
                        <Badge colorScheme="purple" variant="subtle">
                          Recurring
                        </Badge>
                      )}
                      {expandedTasks.has(task.id) ? (
                        <IconButton
                          aria-label="Toggle task details"
                          icon={<Icon as={FiChevronUp} />}
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskExpansion(task.id)}
                        />
                      ) : (
                        <IconButton
                          aria-label="Toggle task details"
                          icon={<Icon as={FiChevronDown} />}
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskExpansion(task.id)}
                        />
                      )}
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<FiEdit2 />}
                            onClick={() => handleEdit(task)}
                          >
                            Edit
                          </MenuItem>
                          <MenuItem
                            icon={<FiTrash2 />}
                            onClick={() => handleDelete(task.id)}
                            color="red.500"
                          >
                            Delete
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Flex>
                </Td>
              </Tr>
              {expandedTasks.has(task.id) && (
                <Tr>
                  <Td colSpan={7}>
                    <VStack align="stretch" spacing={4} p={4}>
                      <Text>{task.description}</Text>
                      {task.attachments && task.attachments.length > 0 && (
                        <HStack spacing={2}>
                          {task.attachments.map((attachment) => (
                            <Button
                              key={attachment.id}
                              size="sm"
                              variant="outline"
                              leftIcon={<FiPaperclip />}
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              {attachment.name}
                            </Button>
                          ))}
                        </HStack>
                      )}
                    </VStack>
                  </Td>
                </Tr>
              )}
            </React.Fragment>
          ))}
        </Tbody>
      </Table>

      {selectedTask && (
        <TaskForm
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedTask(null);
          }}
          onSubmit={async (taskData) => {
            await onEdit({ ...selectedTask, ...taskData });
          }}
          userId={userId}
          availableUsers={availableUsers}
          initialData={selectedTask}
        />
      )}
    </Box>
  );
}; 