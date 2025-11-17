import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from '@chakra-ui/react';
import { Task } from '../types/task';
import { BasicTaskInfo } from './task/BasicTaskInfo';
import { TaskOrganization } from './task/TaskOrganization';
import { TimeTracking } from './task/TimeTracking';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Task;
  userId: string;
  availableUsers?: Array<{ id: string; name: string }>;
  availableTasks?: Array<{ id: string; title: string }>;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  userId,
  availableUsers,
  availableTasks,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Basic Information
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || 'todo');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [type, setType] = useState(initialData?.type || 'feature');
  const [labels, setLabels] = useState(initialData?.labels || []);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [assignedTo, setAssignedTo] = useState(initialData?.assignedTo || '');
  const [archived] = useState(initialData?.archived || false);

  // Organization
  const [sprintId, setSprintId] = useState(initialData?.sprintId);
  const [epicId, setEpicId] = useState(initialData?.epicId);
  const [storyPoints, setStoryPoints] = useState(initialData?.storyPoints);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(
    initialData?.acceptanceCriteria || ['']
  );

  // Time Tracking
  const [estimatedTime, setEstimatedTime] = useState(initialData?.estimatedTime);
  const [actualTime, setActualTime] = useState(initialData?.actualTime);
  const [timeEntries, setTimeEntries] = useState(initialData?.timeEntries || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        description,
        status,
        priority,
        type,
        labels: labels || [],
        dueDate: dueDate || '',
        assignedTo,
        archived: archived || false,
        sprintId: sprintId || '',
        epicId: epicId || '',
        storyPoints: storyPoints || 0,
        acceptanceCriteria,
        estimatedTime: estimatedTime || 0,
        actualTime: actualTime || 0,
        timeEntries,
        dependencies: initialData?.dependencies || [],
        environment: initialData?.environment || '',
        browsers: initialData?.browsers || [],
        devices: initialData?.devices || [],
        operatingSystems: initialData?.operatingSystems || [],
        tags: initialData?.tags || [],
        subtasks: initialData?.subtasks || [],
        notes: initialData?.notes || '',
        isRecurring: initialData?.isRecurring || false,
        comments: initialData?.comments || [],
        attachments: initialData?.attachments || [],
        customFields: initialData?.customFields || {},
        isTemplate: initialData?.isTemplate || false,
        workflowRules: initialData?.workflowRules || [],
        pricing: initialData?.pricing,
        transportDetails: initialData?.transportDetails,
      };

      await onSubmit(taskData);
      toast({
        title: 'Task saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error saving task',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Create Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList>
                <Tab>Basic Info</Tab>
                <Tab>Organization</Tab>
                <Tab>Time Tracking</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <BasicTaskInfo
                    title={title}
                    setTitle={setTitle}
                    description={description}
                    setDescription={setDescription}
                    status={status}
                    setStatus={(value: string) => setStatus(value as Task['status'])}
                    priority={priority}
                    setPriority={(value: string) => setPriority(value as Task['priority'])}
                    type={type}
                    setType={(value: string) => setType(value as Task['type'])}
                    labels={labels}
                    setLabels={setLabels}
                    dueDate={dueDate}
                    setDueDate={setDueDate}
                    assignedTo={assignedTo}
                    setAssignedTo={(value?: string) => setAssignedTo(value || '')}
                    availableUsers={availableUsers}
                  />
                </TabPanel>

                <TabPanel>
                  <TaskOrganization
                    sprintId={sprintId}
                    setSprintId={setSprintId}
                    epicId={epicId}
                    setEpicId={setEpicId}
                    storyPoints={storyPoints}
                    setStoryPoints={setStoryPoints}
                    acceptanceCriteria={acceptanceCriteria}
                    setAcceptanceCriteria={setAcceptanceCriteria}
                  />
                </TabPanel>

                <TabPanel>
                  <TimeTracking
                    estimatedTime={estimatedTime}
                    setEstimatedTime={setEstimatedTime}
                    actualTime={actualTime}
                    setActualTime={setActualTime}
                    timeEntries={timeEntries}
                    setTimeEntries={setTimeEntries}
                    userId={userId}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={isSubmitting}
              loadingText="Saving..."
            >
              Save Task
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default TaskForm;