import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tag,
  TagLabel,
  HStack,
  Progress,
  Collapse,
  VStack,
  Badge,
  Stack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FiMoreVertical, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiPaperclip } from 'react-icons/fi';
import { Task, TaskStatus, TaskPriority } from '../types/task';
import { useTaskStore } from '../store/taskStore';
import TaskForm from './TaskForm';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const TaskList = ({ tasks, onEdit, onDelete }: TaskListProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const toast = useToast();

  const handleEdit = async (task: Task) => {
    try {
      const { id, createdAt, updatedAt, ...taskData } = task;
      await onEdit(taskData);
      setSelectedTask(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to edit task',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await onDelete(taskId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStatusToggle = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    await handleEdit({ ...task, status: newStatus });
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpandedTasks = new Set(expandedTasks);
    if (newExpandedTasks.has(taskId)) {
      newExpandedTasks.delete(taskId);
    } else {
      newExpandedTasks.add(taskId);
    }
    setExpandedTasks(newExpandedTasks);
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

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
      default:
        return 'gray';
    }
  };

  const calculateSubtaskProgress = (subtasks: Task['subtasks'] = []) => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(subtask => subtask.completed).length;
    return (completed / subtasks.length) * 100;
  };

  if (tasks.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No tasks found</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      {tasks.map((task) => (
        <Card key={task.id} variant="outline">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={4}>
                <Checkbox
                  isChecked={task.status === 'completed'}
                  onChange={() => handleStatusToggle(task)}
                  colorScheme="green"
                  size="lg"
                />
                <VStack align="start" spacing={1}>
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    textDecoration={task.status === 'completed' ? 'line-through' : 'none'}
                    color={task.status === 'completed' ? 'gray.500' : 'inherit'}
                  >
                    {task.title}
                  </Text>
                  {task.tags && task.tags.length > 0 && (
                    <HStack spacing={2}>
                      {task.tags.map((tag) => (
                        <Tag key={tag} size="sm" colorScheme="blue" variant="subtle">
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      ))}
                    </HStack>
                  )}
                </VStack>
              </Flex>
              <HStack spacing={2}>
                {task.isRecurring && (
                  <Badge colorScheme="purple" variant="subtle">
                    Recurring
                  </Badge>
                )}
                <IconButton
                  aria-label="Toggle task details"
                  icon={expandedTasks.has(task.id) ? <FiChevronUp /> : <FiChevronDown />}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTaskExpansion(task.id)}
                />
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
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Text
                textDecoration={task.status === 'completed' ? 'line-through' : 'none'}
                color={task.status === 'completed' ? 'gray.500' : 'inherit'}
              >
                {task.description}
              </Text>

              <Flex gap={4} wrap="wrap">
                <Button
                  size="sm"
                  colorScheme={getStatusColor(task.status)}
                  variant="outline"
                >
                  {task.status}
                </Button>
                <Button
                  size="sm"
                  colorScheme={getPriorityColor(task.priority)}
                  variant="outline"
                >
                  {task.priority}
                </Button>
                <Text fontSize="sm" color="gray.500">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Text>
                {task.estimatedTime && (
                  <Text fontSize="sm" color="gray.500">
                    Est. Time: {task.estimatedTime} min
                  </Text>
                )}
              </Flex>

              <Collapse in={expandedTasks.has(task.id)}>
                <VStack align="stretch" spacing={4} pt={4}>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Subtasks
                      </Text>
                      <Progress
                        value={calculateSubtaskProgress(task.subtasks)}
                        colorScheme="blue"
                        size="sm"
                        mb={2}
                      />
                      <VStack align="stretch" spacing={2}>
                        {task.subtasks.map((subtask) => (
                          <Checkbox
                            key={subtask.id}
                            isChecked={subtask.completed}
                            onChange={() => {
                              const updatedSubtasks = task.subtasks.map((s) =>
                                s.id === subtask.id ? { ...s, completed: !s.completed } : s
                              );
                              handleEdit({ ...task, subtasks: updatedSubtasks });
                            }}
                          >
                            {subtask.title}
                          </Checkbox>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {task.attachments && task.attachments.length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Attachments
                      </Text>
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
                    </Box>
                  )}
                </VStack>
              </Collapse>
            </VStack>
          </CardBody>
        </Card>
      ))}

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
          userId={selectedTask.assignedTo}
          availableUsers={[]}
          initialData={selectedTask}
        />
      )}
    </Stack>
  );
};

export default TaskList;