import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL } from '../utils/constants';

const UserIssues: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const run = async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(`${BACKEND_URL}/api/issues`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load issues', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [getAccessTokenSilently]);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        User Issues
      </Typography>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '14%' }}>Created</TableCell>
              <TableCell sx={{ width: '18%' }}>User</TableCell>
              <TableCell sx={{ width: '24%' }}>Page</TableCell>
              <TableCell sx={{ width: '14%' }}>Subsection</TableCell>
              <TableCell sx={{ width: '30%' }}>Issue</TableCell>
            </TableRow>
          </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell sx={{ wordBreak: 'break-word' }}>{r.created_at || ''}</TableCell>
              <TableCell sx={{ wordBreak: 'break-word' }}>{r.user_email || r.user_id}</TableCell>
              <TableCell sx={{ wordBreak: 'break-word' }}>{r.page}</TableCell>
              <TableCell sx={{ wordBreak: 'break-word' }}>{r.subsection}</TableCell>
              <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.issue}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default UserIssues;


