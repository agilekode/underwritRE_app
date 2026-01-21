import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import MenuItem from '@mui/material/MenuItem';
import { BACKEND_URL } from '../utils/constants';
import { FIELD_TYPE_OPTIONS, modelTypePresets, NON_DELETABLE_FIELDS } from '../utils/modelTypeConstants';

interface Field {
  description?: string;
  field_key: string;
  field_title: string;
  field_type: string;
  default_value?: string;
  required: boolean;
  time_phased: boolean;
  order: number;
}

interface Section {
  name: string;
  order: number;
  fields: Field[];
}



const CreateModelType: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<Section[]>(modelTypePresets.sections);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
  const [editingFieldIdx, setEditingFieldIdx] = useState<{section: number, field: number | null} | null>(null);
  const [fieldData, setFieldData] = useState<Field>({
    description: '',
    field_key: '',
    field_title: '',
    field_type: '',
    default_value: '',
    required: true,
    time_phased: false,
    order: 0
  });
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  // Section handlers
  const handleAddSection = () => {
    setSectionName('');
    setEditingSectionIdx(null);
    setSectionDialogOpen(true);
  };
  const handleEditSection = (idx: number) => {
    setSectionName(sections[idx].name);
    setEditingSectionIdx(idx);
    setSectionDialogOpen(true);
  };
  const handleSaveSection = () => {
    if (editingSectionIdx !== null) {
      const updated = [...sections];
      updated[editingSectionIdx].name = sectionName;
      setSections(updated);
    } else {
      setSections([...sections, { name: sectionName, order: sections.length, fields: [] }]);
    }
    setSectionDialogOpen(false);
  };
  const handleDeleteSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
    
  };
  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const updated = [...sections];
    if (dir === 'up' && idx > 0) {
      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    } else if (dir === 'down' && idx < sections.length - 1) {
      [updated[idx + 1], updated[idx]] = [updated[idx], updated[idx + 1]];
    }

    setSections(updated.map((s, i) => ({ ...s, order: i })));
  };

  // Field handlers
  const handleAddField = (sectionIdx: number) => {
    setFieldData({
      description: '',
      field_key: '',
      field_title: '',
      field_type: '',
      default_value: '',
      required: true,
      time_phased: false,
      order: sections[sectionIdx].fields.length
    });
    setEditingFieldIdx({ section: sectionIdx, field: null });
    setFieldsDialogOpen(true);
  };
  const handleEditField = (sectionIdx: number, fieldIdx: number) => {
    setFieldData({ ...sections[sectionIdx].fields[fieldIdx] });
    setEditingFieldIdx({ section: sectionIdx, field: fieldIdx });
    setFieldsDialogOpen(true);
  };
  const handleSaveField = () => {
    if (editingFieldIdx) {
      const { section, field } = editingFieldIdx;
      const updatedSections = [...sections];
      if (field !== null) {
        updatedSections[section].fields[field] = { ...fieldData };
      } else {
        updatedSections[section].fields.push({ ...fieldData, order: updatedSections[section].fields.length });
      }
      setSections(updatedSections);
    }
    setFieldsDialogOpen(false);
  };
  const handleDeleteField = (sectionIdx: number, fieldIdx: number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIdx].fields = updatedSections[sectionIdx].fields.filter((_, i) => i !== fieldIdx).map((f, i) => ({ ...f, order: i }));
    setSections(updatedSections);
  };
  const moveField = (sectionIdx: number, fieldIdx: number, dir: 'up' | 'down') => {
    const updatedSections = [...sections];
    const fields = updatedSections[sectionIdx].fields;
    if (dir === 'up' && fieldIdx > 0) {
      [fields[fieldIdx - 1], fields[fieldIdx]] = [fields[fieldIdx], fields[fieldIdx - 1]];
    } else if (dir === 'down' && fieldIdx < fields.length - 1) {
      [fields[fieldIdx + 1], fields[fieldIdx]] = [fields[fieldIdx], fields[fieldIdx + 1]];
    }
    updatedSections[sectionIdx].fields = fields.map((f, i) => ({ ...f, order: i }));
    setSections(updatedSections);
  };

  const [showRetail, setShowRetail] = useState(true);
  const [showRentalUnits, setShowRentalUnits] = useState(true);
  // Save model type
  const handleSaveModelType = async () => {
    const payload = {
      name,
      description,
      show_retail: showRetail,
      show_rental_units: showRentalUnits,
      sections: sections.map(section => ({
        name: section.name,
        order: section.order,
        fields: section.fields.map(field => ({
          ...field
        }))
      }))
    };
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const res = await fetch(BACKEND_URL + '/api/model_types/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        navigate('/admin/model-types');
      }
    } catch (err) {
      // handle error
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, minWidth: "1200px" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Create New Model Type
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <TextField
          label="Model Type Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Show Retail
          </Typography>
          <Switch checked={showRetail} onChange={() => setShowRetail(!showRetail)} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Show Rental Units
          </Typography>
          <Switch checked={showRentalUnits} onChange={() => setShowRentalUnits(!showRentalUnits)} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Sections
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddSection}>
            Add Section
          </Button>
        </Box>
        <List>
          {sections.map((section, sIdx) => (
            <Box key={sIdx} sx={{ mb: 2, border: '1px solid #eee', borderRadius: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>{section.name}</Typography>
                <IconButton onClick={() => moveSection(sIdx, 'up')} disabled={sIdx === 0}><ArrowUpwardIcon /></IconButton>
                <IconButton onClick={() => moveSection(sIdx, 'down')} disabled={sIdx === sections.length - 1}><ArrowDownwardIcon /></IconButton>
                <IconButton disabled={sections[sIdx].name === "General Property Assumptions"} onClick={() => handleEditSection(sIdx)}><EditIcon /></IconButton>
                <IconButton disabled={sections[sIdx].name === "General Property Assumptions"} onClick={() => handleDeleteSection(sIdx)}><DeleteIcon /></IconButton>
                <Button size="small" onClick={() => handleAddField(sIdx)} startIcon={<AddIcon />}>Add Field</Button>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <List>
                {section.fields.map((field, fIdx) => (
                  <ListItem key={fIdx} sx={{ pl: 2 }}>
                    <ListItemText
                      primary={field.field_title}
                      secondary={`Field Key: ${field.field_key}, Type: ${field.field_type}, Required: ${field.required ? 'Yes' : 'No'}, Time Phased: ${field.time_phased ? 'Yes' : 'No'}`}
                    />
                    <IconButton onClick={() => moveField(sIdx, fIdx, 'up')} disabled={fIdx === 0}><ArrowUpwardIcon /></IconButton>
                    <IconButton onClick={() => moveField(sIdx, fIdx, 'down')} disabled={fIdx === section.fields.length - 1}><ArrowDownwardIcon /></IconButton>
                    <IconButton onClick={() => handleEditField(sIdx, fIdx)}><EditIcon /></IconButton>
                    {!NON_DELETABLE_FIELDS.includes(field.field_key) &&                
                                        <IconButton onClick={() => handleDeleteField(sIdx, fIdx)}><DeleteIcon /></IconButton>
}
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </List>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            sx={{ fontWeight: 700, borderRadius: 2 }}
            onClick={() => navigate('/admin/model-types')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ fontWeight: 700, borderRadius: 2 }}
            onClick={handleSaveModelType}
            disabled={!name.trim() || sections.length === 0}
          >
            Save New Model
          </Button>
        </Box>
      </Paper>
      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onClose={() => setSectionDialogOpen(false)}>
        <DialogTitle>{editingSectionIdx !== null ? 'Edit Section' : 'Add Section'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Section Name"
            value={sectionName}
            onChange={e => setSectionName(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSection} disabled={!sectionName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Field Dialog */}
      <Dialog open={fieldsDialogOpen} onClose={() => setFieldsDialogOpen(false)}>
        <DialogTitle>{editingFieldIdx && editingFieldIdx.field !== null ? 'Edit Field' : 'Add Field'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
              label="Field Title"
              value={fieldData.field_title}
              onChange={e => setFieldData({ ...fieldData, field_title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Field Key"
              value={fieldData.field_key}
              onChange={e => setFieldData({ ...fieldData, field_key: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={fieldData.description}
              onChange={e => setFieldData({ ...fieldData, description: e.target.value })}
              fullWidth
            />

            <TextField
              select
              label="Field Type"
              value={fieldData.field_type}
              onChange={e => setFieldData({ ...fieldData, field_type: e.target.value })}
              fullWidth
              required
            >
              {FIELD_TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Default Value"
              value={fieldData.default_value}
              onChange={e => setFieldData({ ...fieldData, default_value: e.target.value })}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={fieldData.required ? 'contained' : 'outlined'}
                onClick={() => setFieldData({ ...fieldData, required: !fieldData.required })}
              >
                Required: {fieldData.required ? 'Yes' : 'No'}
              </Button>
              <Button
                variant={fieldData.time_phased ? 'contained' : 'outlined'}
                onClick={() => setFieldData({ ...fieldData, time_phased: !fieldData.time_phased })}
              >
                Time Phased: {fieldData.time_phased ? 'Yes' : 'No'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFieldsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveField} disabled={!fieldData.field_key.trim() || !fieldData.field_type.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateModelType; 