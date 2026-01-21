import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, TextField, Table, TableHead, TableRow, TableCell, TableBody, Switch, CircularProgress } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL } from '../utils/constants';

interface UserRow {
  id: string;
  email: string;
  is_active: boolean;
  subscription_status?: string | null;
}

const AdminUsers: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
        });
        const r = await fetch(`${BACKEND_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        const data = await r.json();
        if (Array.isArray(data)) setUsers(data as UserRow[]);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getAccessTokenSilently]);

  const toggleActive = async (id: string, next: boolean) => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
      });
      const r = await fetch(`${BACKEND_URL}/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: next })
      });
      if (r.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: next } : u));
      }
    } catch {}
  };

  const filtered = users.filter(u => !q || u.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>User Management</Typography>
          <TextField size="small" placeholder="Search email" value={q} onChange={e => setQ(e.target.value)} />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subscription</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Switch checked={u.is_active} onChange={(e) => toggleActive(u.id, e.target.checked)} />
                  </TableCell>
                  <TableCell>{u.subscription_status || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default AdminUsers;
