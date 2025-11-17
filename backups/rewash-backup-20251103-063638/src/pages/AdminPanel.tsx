import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Select, Spinner, Button } from '@chakra-ui/react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'staff';
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<{ [userId: string]: UserRow['role'] | undefined }>({});

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      const userList: UserRow[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        email: docSnap.data().email || '',
        name: docSnap.data().name || '',
        role: ['user', 'admin', 'staff'].includes(docSnap.data().role) ? docSnap.data().role : 'user',
      }));
      setUsers(userList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleRoleSelect = (userId: string, newRole: UserRow['role']) => {
    setPendingRole(prev => ({ ...prev, [userId]: newRole }));
  };

  const handleRoleChange = async (userId: string) => {
    const newRole = pendingRole[userId];
    if (!newRole) return;
    const user = users.find(u => u.id === userId);
    if (!user || user.role === newRole) return;
    const confirmed = window.confirm(`Are you sure you want to change ${user.email}'s role to '${newRole}'?`);
    if (!confirmed) return;
    setSaving(userId);
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: newRole });
    setUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setSaving(null);
    setPendingRole(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  return (
    <Box maxW="container.lg" mx="auto" py={10}>
      <Heading mb={4}>Admin Panel</Heading>
      <Text mb={6}>Manage user roles below. Only admins can access this page.</Text>
      {loading ? (
        <Spinner size="xl" />
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map(user => (
              <Tr key={user.id}>
                <Td>{user.email}</Td>
                <Td>{user.name}</Td>
                <Td>
                  <Select
                    value={pendingRole[user.id] ?? user.role}
                    onChange={e => handleRoleSelect(user.id, e.target.value as UserRow['role'])}
                    isDisabled={saving === user.id}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </Select>
                </Td>
                <Td>
                  {saving === user.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRoleChange(user.id)}
                      isDisabled={pendingRole[user.id] === undefined || pendingRole[user.id] === user.role}
                    >
                      Save
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default AdminPanel; 