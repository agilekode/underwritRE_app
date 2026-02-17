import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Paper, Typography, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableSortLabel, TableContainer, CircularProgress } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL } from '../utils/constants';
import { useTheme } from '@mui/material/styles';
import { colors } from '../theme';

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

type SortKey = 'email' | 'model_count' | 'version_count' | 'created_at' | 'last_version_created_at' | 'subscription';

const UserMgmt: React.FC = () => {
  const theme = useTheme();
  const { getAccessTokenSilently } = useAuth0();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState('');
  const [orderBy, setOrderBy] = useState<SortKey>('email');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

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

  const fmt = (iso?: string | null) => iso ? new Date(iso).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : '—';

  const effectiveSubStatus = (u: UserRow) => {
    const raw = u.subscription_status || null;
    let cpeMs: number | null = null;
    if (typeof u.current_period_end === 'number') {
      cpeMs = u.current_period_end > 1e12 ? u.current_period_end : u.current_period_end * 1000;
    } else if (typeof u.current_period_end === 'string') {
      const t = Date.parse(u.current_period_end);
      cpeMs = isNaN(t) ? null : t;
    }
    const now = Date.now();
    const isCancelAtEnd = u.cancel_at_period_end === true;
    if (raw === 'active') return 'active';
    if (raw === 'trialing' && !isCancelAtEnd && cpeMs && cpeMs < now) {
      return 'active';
    }
    return raw || '—';
  };

  const handleRequestSort = (property: SortKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filtered = users.filter(u => !q || u.email.toLowerCase().includes(q.toLowerCase()));

  const sortedUsers = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (orderBy) {
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'model_count':
          aVal = a.model_count ?? -1;
          bVal = b.model_count ?? -1;
          break;
        case 'version_count':
          aVal = a.version_count ?? -1;
          bVal = b.version_count ?? -1;
          break;
        case 'created_at':
          aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
          bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'last_version_created_at':
          aVal = a.last_version_created_at ? new Date(a.last_version_created_at).getTime() : 0;
          bVal = b.last_version_created_at ? new Date(b.last_version_created_at).getTime() : 0;
          break;
        case 'subscription':
          aVal = effectiveSubStatus(a);
          bVal = effectiveSubStatus(b);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, orderBy, order]);

  const columns: { key: SortKey; label: string }[] = [
    { key: 'email', label: 'Email' },
    { key: 'model_count', label: 'Models' },
    { key: 'version_count', label: 'Total Model Versions' },
    { key: 'created_at', label: 'Account Created' },
    { key: 'last_version_created_at', label: 'Most Recent Model Update' },
    { key: 'subscription', label: 'Subscription' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 6 }, maxWidth: '1200px', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>User Information</Typography>
          <TextField size="small" placeholder="Search email" value={q} onChange={e => setQ(e.target.value)} />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <TableContainer
            sx={{
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${colors.grey[300]}`,
              boxShadow: theme.shadows[1],
              overflowX: 'auto',
              width: '100%'
            }}
          >
            <Table
              sx={{
                minWidth: 900,
                '& thead th': {
                  fontWeight: 700,
                  backgroundColor: 'rgba(255,255,255,0.22)'
                },
                '& tbody td': {
                  borderBottom: '1px solid rgba(0,0,0,0.06)'
                },
                '& tbody tr:hover': {
                  backgroundColor: 'rgba(255,255,255,0.35)'
                }
              }}
            >
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <TableSortLabel
                        active={orderBy === col.key}
                        direction={orderBy === col.key ? order : 'asc'}
                        onClick={() => handleRequestSort(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.model_count ?? 0}</TableCell>
                    <TableCell>{u.version_count ?? 0}</TableCell>
                    <TableCell>{fmt(u.created_at)}</TableCell>
                    <TableCell>{fmt(u.last_version_created_at)}</TableCell>
                    <TableCell>{effectiveSubStatus(u)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default UserMgmt;
