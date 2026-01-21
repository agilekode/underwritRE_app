import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, TextField, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL } from '../utils/constants';

interface UserRow {
  id: string;
  email: string;
  is_active: boolean;
  subscription_status?: string | null;
  current_period_end?: number | string | null;
  cancel_at_period_end?: boolean | null;
  created_at?: string | null;
  model_count?: number;
  version_count?: number;
  last_version_created_at?: string | null;
}

const UserMgmt: React.FC = () => {
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

  const filtered = users.filter(u => !q || u.email.toLowerCase().includes(q.toLowerCase()));

  const fmt = (iso?: string | null) => iso ? new Date(iso).toLocaleString('en-US') : '—';
  const effectiveSubStatus = (u: UserRow) => {
    const raw = u.subscription_status || null;
    // normalize current_period_end to ms epoch if present
    let cpeMs: number | null = null;
    if (typeof u.current_period_end === 'number') {
      // backend stores seconds; assume seconds if value is small
      cpeMs = u.current_period_end > 1e12 ? u.current_period_end : u.current_period_end * 1000;
    } else if (typeof u.current_period_end === 'string') {
      const t = Date.parse(u.current_period_end);
      cpeMs = isNaN(t) ? null : t;
    }
    const now = Date.now();
    const isCancelAtEnd = u.cancel_at_period_end === true;
    if (raw === 'active') return 'active';
    if (raw === 'trialing' && !isCancelAtEnd && cpeMs && cpeMs < now) {
      // trial period has ended and subscription wasn't set to cancel → effectively active next period
      return 'active';
    }
    return raw || '—';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 6, minWidth: "1200px" }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>User Information</Typography>
          <TextField size="small" placeholder="Search email" value={q} onChange={e => setQ(e.target.value)} />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Models</TableCell>
                <TableCell>Total Model Versions</TableCell>
                <TableCell>Account Created</TableCell>
                <TableCell>Most Recent Model Update</TableCell>
                <TableCell>Subscription</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.model_count ?? '—'}</TableCell>
                  <TableCell>{u.version_count ?? '—'}</TableCell>
                  <TableCell>{fmt(u.created_at)}</TableCell>
                  <TableCell>{fmt(u.last_version_created_at)}</TableCell>
                    <TableCell>{effectiveSubStatus(u)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default UserMgmt;
