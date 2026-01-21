import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { BACKEND_URL } from '../utils/constants';


interface ModelType {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const AdminModelTypes: React.FC = () => {
  const [modelTypes, setModelTypes] = useState<ModelType[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const fetchModelTypes = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const res = await fetch(BACKEND_URL + '/api/model_types', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });
      const data = await res.json();

      setModelTypes(data);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelTypes();
  }, []);

  const handleRowClick = (id: string) => {
    navigate(`/admin/model-types/${id}`);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewName('');
    setNewDescription('');
  };

  const handleCreate = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const res = await fetch(BACKEND_URL + '/api/model_types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ name: newName, description: newDescription })
      });
      if (res.ok) {
        handleClose();
        fetchModelTypes();
      }
    } catch (err) {
      // handle error
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, minWidth: "1200px" }}>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Model Types
        </Typography>
        <Button
          variant="contained"
          sx={{ fontWeight: 700, borderRadius: 2 }}
          onClick={() => navigate('/admin/model-types/create-new-model')}
        >
          New Model Type
        </Button>
      </Box>
      <Paper sx={{ mt: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modelTypes.map((mt) => (
                <TableRow
                  key={mt.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(mt.id)}
                >
                  <TableCell>
                    <Link to={`/admin/model-types/${mt.id}`}>{mt.name}</Link>
                  </TableCell>
                  <TableCell>{mt.description}</TableCell>
                  <TableCell>{mt.is_active ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{mt.created_at ? new Date(mt.created_at).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{mt.updated_at ? new Date(mt.updated_at).toLocaleDateString() : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>New Model Type</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminModelTypes; 