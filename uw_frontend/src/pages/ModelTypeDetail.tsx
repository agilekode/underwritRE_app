import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Typography, Switch, CircularProgress, List, ListItem, ListItemText, Divider, Button, TextField, Box, Alert, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, IconButton } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BackButton from '../components/BackButton';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BACKEND_URL } from '../utils/constants';
import { FIELD_TYPE_OPTIONS, NON_DELETABLE_FIELDS } from '../utils/modelTypeConstants';

interface ModelType {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  show_retail?: boolean;
  show_rental_units?: boolean;
  google_sheet_url?: string;
  sections: Section[];
}

interface Section {
  id: string;
  name: string;
  fields: Field[];
  order?: number;
}

interface Field {
  id: string;
  description: string;
  field_key: string;
  field_title: string;
  field_type: string;
  required: boolean;
  time_phased: boolean;
  default_value: string;
  section_id?: string;
  order?: number;
  active?: boolean;
}

const ModelTypeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [modelType, setModelType] = useState<ModelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { getAccessTokenSilently } = useAuth0();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState<Field | null>(null);
  const [newField, setNewField] = useState<Field>({
    id: '',
    description: '',
    field_key: '',
    field_title: '',
    field_type: '',
    default_value: '',
    required: false,
    time_phased: false,
    order: 0,
    active: true
  });
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({
    name: '',
    order: 0
  });
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [descSuccessMessage, setDescSuccessMessage] = useState<string | null>(null);

  const fetchModelType = async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_types/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });
      const data = await res.json();
      // console.log("data", data);
      setModelType(data);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelType();
  }, [id, getAccessTokenSilently]);

  const handleToggleActive = async () => {
    if (!modelType) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_types/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: !modelType.is_active })
      });
      if (res.ok) {
        setModelType({ ...modelType, is_active: !modelType.is_active });
      }
    } catch (err) {
      // handle error
    }
  };

  const handleToggleRetail = async () => {
    if (!modelType) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_types/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ show_retail: !modelType.show_retail })
      });
      if (res.ok) {
        setModelType({ ...modelType, show_retail: !modelType.show_retail });
      }
    } catch (err) {
      // handle error
    }
  };

  const handleToggleRentalUnits = async () => {
    if (!modelType) return;
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_types/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ show_rental_units: !modelType.show_rental_units })
      });
      if (res.ok) {
        setModelType({ ...modelType, show_rental_units: !modelType.show_rental_units });
      }
    } catch (err) {
      // handle error
    }
  };

  const handleDownloadExcel = () => {
    if (!modelType) return;

    // 1. Model Variable Mapping sheet
    const modelVariableData = modelType.sections.flatMap(section => 
      section.fields.map(field => ({
        section: section.name,
        field_key: field.field_key,
        location: '',
        start_month_location: '',
        end_month_location: ''
      }))
    );

    modelVariableData.push(
      { section: 'Other Reference', field_key: 'Estimated Pro Forma Rent Roll', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Net Rentable SF', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Growth Rates Header', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Re-Stabilization Occurs', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Lease-up Time', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Rehab Time', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Address', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Sensitivity Purchase Price 1', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Sensitivity Purchase Price 2', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Sensitivity Exit Cap Rate 1', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Sensitivity Exit Cap Rate 2', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Levered IRR', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Levered MOIC', location: '', start_month_location: '', end_month_location: '' },
      { section: 'Other Reference', field_key: 'Max Loan Size', location: '', start_month_location: '', end_month_location: '' }
    );
    const modelVariableWs = XLSX.utils.json_to_sheet(modelVariableData);

    // 2. Variable Mapping sheet
    const variableMappingData = [
      { variable_name: 'Levered IRR', variable_location: '' },
      { variable_name: 'Levered MOIC', variable_location: '' },
      { variable_name: 'Refi: LTV calculation', variable_location: '' },
      { variable_name: 'Refi: DSCR calculation', variable_location: '' },
      { variable_name: 'Refi: Debt Yield calculation', variable_location: '' },
      { variable_name: 'Acquisition Loan Balance Outstanding', variable_location: '' },
      { variable_name: 'AQ: Interest Reserve', variable_location: '' },
      { variable_name: 'Refi: Fixed Interest Rate', variable_location: '' },
      { variable_name: 'Refi: Annualized NOI in Month', variable_location: '' },
      { variable_name: 'Refi: Loan Factor', variable_location: '' },
      { variable_name: 'Refi: Loan Proceeds net of fees', variable_location: '' },
      { variable_name: 'Refi: Proceeds from Cashout', variable_location: '' },
      { variable_name: 'Refi: Annual Debt Service', variable_location: '' },
      { variable_name: 'Refi: Monthly Debt Service', variable_location: '' },
      { variable_name: 'AQ: Exact Loan Amount', variable_location: '' },
      { variable_name: 'Refi: Max Perm Loan', variable_location: '' },
      { variable_name: 'AQ: Max Loan Size Based on DSCR', variable_location: '' },
      { variable_name: 'AQ: Max Loan Size Based on LTC', variable_location: '' },
      { variable_name: 'AQ: Max Acquisition Loan at Closing', variable_location: '' },
      { variable_name: 'AQ: Annualized NOI in Month', variable_location: '' },
      { variable_name: 'AQ: Annual Debt Service', variable_location: '' },
      { variable_name: 'AQ: Monthly Debt Service', variable_location: '' },
      { variable_name: 'AQ: DSCR', variable_location: '' },
      { variable_name: 'AQ: LTV', variable_location: '' },
      { variable_name: 'Going-in Cap Rate', variable_location: '' }
    ];
    const variableMappingWs = XLSX.utils.json_to_sheet(variableMappingData, { header: ['variable_name', 'variable_location'] });

    // 3. Table Mapping sheet (headers only, no rows)
    const tableMappingHeaders = ['table_name', 'table_order', 'table_location'];
    // Create an empty worksheet with just headers
    const tableMappingWs = XLSX.utils.aoa_to_sheet([tableMappingHeaders]);

    // Create workbook and append all sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, modelVariableWs, 'Model Variable Mapping');
    XLSX.utils.book_append_sheet(wb, variableMappingWs, 'Variable Mapping');
    XLSX.utils.book_append_sheet(wb, tableMappingWs, 'Table Mapping');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Save file
    saveAs(data, `${modelType.name}_details.xlsx`);
  };

  const handleSaveGoogleSheetUrl = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsLoading(true);
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_types/${id}/google_sheet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ google_sheet_url: googleSheetUrl })
      });
      
      const data = await res.json();
      
      if (res.ok) {

        setModelType(prev => prev ? { ...prev, google_sheet_url: googleSheetUrl } : null);
        setIsEditing(false);
        const foundSheets = data.found_sheets && data.found_sheets.length > 0 ? data.found_sheets.join(', ') : 'None';
        const missingSheets = data.missing_sheets && data.missing_sheets.length > 0 ? data.missing_sheets.join(', ') : 'None';

        setSuccessMessage(`Google Sheet URL saved successfully. Found sheets: ${foundSheets}. Missing sheets: ${missingSheets}`);
      } else {
        setError(data.error || 'Failed to save Google Sheet URL');
      }
    } catch (err) {
      console.error('Error details:', err);
      setError('An error occurred while saving the Google Sheet URL');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (field: Field | null, sectionId?: string) => {
    setCurrentField(field);
    if (field) {
      // For editing existing field, find its current section
      const currentSection = modelType?.sections.find(section => 
        section.fields.some(f => f.id === field.id)
      );
      setNewField({
        ...field,
        section_id: currentSection?.id || '',
        order: field.order || 0
      });
    } else {
      // For adding new field, calculate the next order number
      const targetSection = modelType?.sections.find(section => section.id === sectionId);
      const nextOrder = targetSection ? Math.max(...targetSection.fields.map(f => f.order || 0), 0) + 1 : 1;
      setNewField({
        id: '',
        description: '',
        field_key: '',
        field_title: '',
        field_type: '',
        required: false,
        time_phased: false,
        default_value: '',
        section_id: sectionId || '',
        order: nextOrder
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentField(null);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    // If section is being changed, automatically assign the next order number
    if (name === 'section_id' && value !== newField.section_id) {
      const targetSection = modelType?.sections.find(section => section.id === value);
      const nextOrder = targetSection ? Math.max(...targetSection.fields.map(f => f.order || 0), 0) + 1 : 1;
      
      setNewField(prev => ({
        ...prev,
        [name]: value,
        order: nextOrder
      }));
    } else {
      setNewField(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const saveField = async () => {
    try {
      const token = await getAccessTokenSilently();
      const method = currentField ? 'PATCH' : 'POST';
      const url = currentField ? `${BACKEND_URL}/api/model_type_section_fields/${currentField.id}` : `${BACKEND_URL}/api/model_type_section_fields`;
      const payload = {
        section_id: newField.section_id, // Ensure this is set correctly
        field_key: newField.field_key,
        field_title: newField.field_title,
        field_type: newField.field_type,
        description: newField.description,
        default_value: newField.default_value,
        required: newField.required,
        time_phased: newField.time_phased,
        order: newField.order
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh the model type data
        fetchModelType();
        closeModal();
      } else {
        console.error('Error updating field:', data.error);
        setError(data.error || 'Failed to update field');
      }
    } catch (err) {
      console.error('Error during field update:', err);
      setError('An error occurred while updating the field');
    }
  };

  const moveField = async (fieldId: string, direction: 'up' | 'down') => {
    try {
      // Find the current field and its section
      const currentSection = modelType?.sections.find(section => 
        section.fields.some(f => f.id === fieldId)
      );
      
      if (!currentSection) return;
      // Use a copy so we don't mutate React state in-place
      const sortedFields = [...currentSection.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const currentIndex = sortedFields.findIndex(f => f.id === fieldId);
      
      if (currentIndex === -1) return;
      
      let targetIndex: number;
      if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < sortedFields.length - 1) {
        targetIndex = currentIndex + 1;
      } else {
        return; // Can't move further
      }
      
      const currentField = sortedFields[currentIndex];
      const targetField = sortedFields[targetIndex];
      
      // Build sequential orders so swaps persist even if existing orders are undefined/duplicated
      const baseOrders = sortedFields.map((_f, i) => i + 1);
      const newOrderForCurrent = baseOrders[targetIndex];
      const newOrderForTarget = baseOrders[currentIndex];
      
      // Update both fields
      const token = await getAccessTokenSilently();
      
      // Update current field
      await fetch(`${BACKEND_URL}/api/model_type_section_fields/${currentField.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          section_id: currentField.section_id,
          field_key: currentField.field_key,
          field_title: currentField.field_title,
          field_type: currentField.field_type,
          description: currentField.description,
          default_value: currentField.default_value,
          required: currentField.required,
          time_phased: currentField.time_phased,
          order: newOrderForCurrent
        })
      });
      
      // Update target field
      await fetch(`${BACKEND_URL}/api/model_type_section_fields/${targetField.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          section_id: targetField.section_id,
          field_key: targetField.field_key,
          field_title: targetField.field_title,
          field_type: targetField.field_type,
          description: targetField.description,
          default_value: targetField.default_value,
          required: targetField.required,
          time_phased: targetField.time_phased,
          order: newOrderForTarget
        })
      });
      
      // Refresh the model type data
      fetchModelType();
    } catch (err) {
      console.error('Error moving field:', err);
      setError('An error occurred while moving the field');
    }
  };

  const deleteField = async (fieldId: string) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_type_section_fields/${fieldId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (res.ok) {
        // Refresh the model type data
        fetchModelType();
      } else {
        const data = await res.json();
        console.error('Error deleting field:', data.error);
        setError(data.error || 'Failed to delete field');
      }
    } catch (err) {
      console.error('Error during field deletion:', err);
      setError('An error occurred while deleting the field');
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      const section = modelType?.sections.find(s => s.id === sectionId);
      if (!section) return;

      // Check if section has fields
      if (section.fields.length > 0) {
        setError('Cannot delete section that contains fields. Please delete all fields first.');
        return;
      }

      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_type_sections/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (res.ok) {
        // Refresh the model type data
        fetchModelType();
        setSuccessMessage('Section deleted successfully');
      } else {
        const data = await res.json();
        console.error('Error deleting section:', data.error);
        setError(data.error || 'Failed to delete section');
      }
    } catch (err) {
      console.error('Error during section deletion:', err);
      setError('An error occurred while deleting the section');
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    try {
      if (!modelType) return;
      
      // Use a copy so we don't mutate React state in-place
      const sortedSections = [...modelType.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const currentIndex = sortedSections.findIndex(s => s.id === sectionId);
      
      if (currentIndex === -1) return;
      
      let targetIndex: number;
      if (direction === 'up' && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < sortedSections.length - 1) {
        targetIndex = currentIndex + 1;
      } else {
        return; // Can't move further
      }
      
      const currentSection = sortedSections[currentIndex];
      const targetSection = sortedSections[targetIndex];
      
      // Build sequential orders so swaps persist even if existing orders are undefined/duplicated
      const baseOrders = sortedSections.map((_s, i) => i + 1);
      const newOrderForCurrent = baseOrders[targetIndex];
      const newOrderForTarget = baseOrders[currentIndex];
      
      // Update both sections
      const token = await getAccessTokenSilently();
      
      // Update current section
      await fetch(`${BACKEND_URL}/api/model_type_sections/${currentSection.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: currentSection.name,
          order: newOrderForCurrent
        })
      });
      
      // Update target section
      await fetch(`${BACKEND_URL}/api/model_type_sections/${targetSection.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: targetSection.name,
          order: newOrderForTarget
        })
      });
      
      // Refresh the model type data
      fetchModelType();
    } catch (err) {
      console.error('Error moving section:', err);
      setError('An error occurred while moving the section');
    }
  };

  const openSectionModal = () => {
    // Calculate the next order number
    const nextOrder = modelType ? Math.max(...modelType.sections.map(s => s.order || 0), 0) + 1 : 1;
    setNewSection({
      name: '',
      order: nextOrder
    });
    setIsSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    setNewSection({ name: '', order: 0 });
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSection(prev => ({
      ...prev,
      [name]: name === 'order' ? Number(value) : value
    }));
  };

  const saveSection = async () => {
    try {
      if (!newSection.name.trim()) {
        setError('Section name is required');
        return;
      }

      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_type_sections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          model_type_id: id,
          name: newSection.name,
          order: newSection.order
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Refresh the model type data
        fetchModelType();
        closeSectionModal();
        setSuccessMessage('Section created successfully');
      } else {
        console.error('Error creating section:', data.error);
        setError(data.error || 'Failed to create section');
      }
    } catch (err) {
      console.error('Error during section creation:', err);
      setError('An error occurred while creating the section');
    }
  };

  const openDescriptionModal = () => {
    setDescriptionDraft(modelType?.description || '');
    setIsDescModalOpen(true);
  };

  const closeDescriptionModal = () => {
    setIsDescModalOpen(false);
  };

  const saveDescription = async () => {
    if (!modelType) return;
    try {
      setIsSavingDescription(true);
      setError(null);
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/model_types/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ description: descriptionDraft })
      });
      const data = await res.json();
      if (res.ok) {
        setModelType(prev => prev ? { ...prev, description: descriptionDraft } : null);
        setDescSuccessMessage('Description updated successfully');
        setIsDescModalOpen(false);
        setTimeout(() => setDescSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Failed to update description');
      }
    } catch (err) {
      setError('An error occurred while updating the description');
    } finally {
      setIsSavingDescription(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, maxWidth: '1000px', mx: 'auto' }}>
      <BackButton to="/admin/model-types" />
      <Box sx={{ width: '100%' }}>
        {/* Header: Name and Download Button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            p: 2,
            borderRadius: 2,
            background: '#f8f9fa',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {modelType?.name}
          </Typography>
          
        </Box>
        {/* ModelType Description & Dates */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 3,
            p: 3,
            background: '#f8f9fa',
            borderRadius: 2,
            alignItems: 'center',
          }}
        >
          <Box sx={{ gridColumn: '1/-1', mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              <strong>Description:</strong>{' '}
              {modelType?.description ? modelType.description : <i>none added</i>}
            </Typography>
            <Button variant="outlined" size="small" onClick={openDescriptionModal} sx={{ flexShrink: 0 }}>Edit Description</Button>
          </Box>
          {descSuccessMessage && (
            <Box sx={{ gridColumn: '1/-1', mb: 1 }}>
              <Alert severity="success">{descSuccessMessage}</Alert>
            </Box>
          )}
          <Typography variant="body2" sx={{ mb: { xs: 1, sm: 0 } }}>
            <strong>Created At:</strong>{' '}
            {modelType?.created_at ? new Date(modelType.created_at).toLocaleDateString() : 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>Last Updated:</strong>{' '}
            {modelType?.updated_at ? new Date(modelType.updated_at).toLocaleDateString() : 'N/A'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              <strong>Active:</strong>
            </Typography>
            <Switch checked={modelType?.is_active} onChange={handleToggleActive} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              <strong>Show Retail:</strong>
            </Typography>
            <Switch checked={modelType?.show_retail} onChange={handleToggleRetail} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              <strong>Show Rental Units:</strong>
            </Typography>
            <Switch checked={!!modelType?.show_rental_units} onChange={handleToggleRentalUnits} />
          </Box>
        </Box>

        {/* Google Sheet Template Section */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 2,
            background: '#fff',
            boxShadow: !modelType?.google_sheet_url
              ? '0 0 0 2px #f44336, 0 1px 6px rgba(0,0,0,0.06)'
              : '0 1px 6px rgba(0,0,0,0.06)',
            border: !modelType?.google_sheet_url ? '1.5px solid #f44336' : undefined,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mr: 2 }}>
              Google Sheet Template
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleDownloadExcel}
                sx={{ minWidth: 220, fontWeight: 600, boxShadow: 'none', py: 1 }}
              >
                Download Template Mapping Excel
              </Button>
            </Box>
          </Box>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 1 }}>{successMessage}</Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>
          )}

          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mt: 1 }}>
              <TextField
                fullWidth
                label="Google Sheet URL"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                error={!!error}
                helperText={error}
                sx={{ minWidth: 320, flex: 1 }}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleSaveGoogleSheetUrl}
                disabled={!googleSheetUrl || isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{ minWidth: 110, fontWeight: 500, py: 1 }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsEditing(false);
                  setGoogleSheetUrl(modelType?.google_sheet_url || '');
                  setError(null);
                }}
                sx={{ minWidth: 110, py: 1 }}
              >
                Cancel
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
              <Typography variant="body1" sx={{ flexGrow: 1, minWidth: 220 }}>
                {modelType?.google_sheet_url ? (
                  <a
                    href={modelType.google_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: 'underline',
                      color: '#1976d2',
                      wordBreak: 'break-all',
                      fontWeight: 500,
                    }}
                  >
                    {modelType.google_sheet_url}
                  </a>
                ) : (
                  <span style={{ color: '#888' }}>No Google Sheet template set</span>
                )}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsEditing(true);
                  setGoogleSheetUrl(modelType?.google_sheet_url || '');
                }}
                sx={{ minWidth: 110, py: 1 }}
              >
                {modelType?.google_sheet_url ? 'Edit' : 'Add'}
              </Button>
            </Box>
          )}
        </Box>

       
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bolder' }}>
            Sections
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={openSectionModal}
            sx={{ minWidth: 'auto', px: 2, py: 0.5 }}
          >
            Add Section
          </Button>
        </Box>
        <List>
          {modelType?.sections
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((section, index) => (
            <div key={section.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {section.name !== 'General Property Assumptions' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1 }}>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 1}
                      sx={{ p: 0.5 }}
                    >
                      <KeyboardArrowUpIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === modelType.sections.length - 1}
                      sx={{ p: 0.5 }}
                    >
                      <KeyboardArrowDownIcon fontSize="small" />
                    </IconButton>
                
                  </Box>
                      )}
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {index + 1}. {section.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => openModal(null, section.id)}>
                    Add Field
                  </Button>
                  {section.fields.length === 0 && section.name !== 'General Property Assumptions' && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={() => deleteSection(section.id)}
                      size="small"
                    >
                      Delete Section
                    </Button>
                  )}
                </Box>
              </Box>
              <List>
                {section.fields.filter(field => field.active === true)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((field, index) => (
                  <ListItem key={field.id} sx={{ pl: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', mr: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => moveField(field.id, 'up')}
                        disabled={index === 0}
                        sx={{ p: 0.5 }}
                      >
                        <KeyboardArrowUpIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => moveField(field.id, 'down')}
                        disabled={index === section.fields.length - 1}
                        sx={{ p: 0.5 }}
                      >
                        <KeyboardArrowDownIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <ListItemText
                      primary={`${index + 1}. ${field.field_title}`}
                      secondary={`Field Key: ${field.field_key}, Type: ${field.field_type}, Required: ${field.required ? 'Yes' : 'No'}, Time Phased: ${field.time_phased ? 'Yes' : 'No'}, Description: ${field.description || 'N/A'}, Default Value: ${field.default_value || 'N/A'}`}
                    />
                    <Button variant="outlined" color="primary" onClick={() => openModal(field)} sx={{ mr: 1 }}>
                      Edit
                    </Button>
                    {!NON_DELETABLE_FIELDS.includes(field.field_key) && 
                    <Button variant="outlined" color="secondary" onClick={() => deleteField(field.id)}>
                      Delete
                    </Button>
                    }
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
            </div>
          ))}
        </List>

        <Dialog
          open={isModalOpen}
          onClose={closeModal}
          PaperProps={{
            sx: {
              minHeight: 420,
              maxHeight: '90vh',
              minWidth: 400,
              maxWidth: '95vw',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle>{currentField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
          <DialogContent
            dividers
            sx={{
              flex: 1,
              overflowY: 'auto',
              pb: 2,
              pt: 1,
              minHeight: 320,
            }}
          >
            <TextField
              fullWidth
              select
              label="Section"
              name="section_id"
              value={newField.section_id}
              onChange={handleFieldChange}
              sx={{ mb: 2, mt: 2 }}
            >
              {modelType?.sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Field Title"
              name="field_title"
              value={newField.field_title}
              onChange={handleFieldChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Field Key"
              // disabled={true}
              name="field_key"
              value={newField.field_key}
              onChange={handleFieldChange}
              sx={{ mb: 2 }}
            />
            {/* <TextField
              fullWidth
              type="number"
              label="Order"
              name="order"
              value={newField.order}
              onChange={handleFieldChange}
              sx={{ mb: 2 }}
            /> */}
            <TextField
              fullWidth
              select
              label="Field Type"
              name="field_type"
              value={newField.field_type}
              onChange={handleFieldChange}
              sx={{ mb: 2 }}
            >
              {FIELD_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={newField.description}
              onChange={handleFieldChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Default Value"
              name="default_value"
              value={newField.default_value}
              onChange={handleFieldChange}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>Required</Typography>
              <Switch
                checked={newField.required}
                onChange={handleFieldChange}
                name="required"
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>Time Phased</Typography>
              <Switch
                checked={newField.time_phased}
                onChange={handleFieldChange}
                name="time_phased"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal} color="primary">Cancel</Button>
            <Button onClick={saveField} color="primary">Save</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Description Modal */}
        <Dialog
          open={isDescModalOpen}
          onClose={closeDescriptionModal}
          PaperProps={{
            sx: { minWidth: 420, maxWidth: '95vw' }
          }}
        >
          <DialogTitle>Edit Description</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder="Enter a description for this model type"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDescriptionModal}>Cancel</Button>
            <Button onClick={saveDescription} variant="contained" disabled={isSavingDescription}>
              {isSavingDescription ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Section Modal */}
        <Dialog
          open={isSectionModalOpen}
          onClose={closeSectionModal}
          PaperProps={{
            sx: {
              minHeight: 300,
              maxHeight: '90vh',
              minWidth: 400,
              maxWidth: '95vw',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <DialogTitle>Add New Section</DialogTitle>
          <DialogContent
            dividers
            sx={{
              flex: 1,
              overflowY: 'auto',
              pb: 2,
              pt: 1,
              minHeight: 200,
            }}
          >
            <TextField
              fullWidth
              label="Section Name"
              name="name"
              value={newSection.name}
              onChange={handleSectionChange}
              sx={{ mb: 2, mt: 2 }}
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Order"
              name="order"
              value={newSection.order}
              onChange={handleSectionChange}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeSectionModal} color="primary">Cancel</Button>
            <Button onClick={saveSection} color="primary">Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ModelTypeDetail; 