import React, { useMemo, useState, useRef } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Button, IconButton, Tooltip, Typography, Autocomplete, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { NumberInput } from './NumberInput';
import { NumberInputCell } from './NumberInputCell';
import { colors } from '../theme';

export interface DevelopmentUnitRow {
  id: string;
  unit_type: string;
  avg_sf: number | null;
  units: number | null;
  avg_rent: number | null; // average monthly rent per unit
}

interface DevelopmentRentalAssumptionsProps {
  rows: DevelopmentUnitRow[];
  setRows: React.Dispatch<React.SetStateAction<DevelopmentUnitRow[]>>;
  growthRates?: { name: string; value: number; type: string; }[];
  setGrowthRates?: React.Dispatch<React.SetStateAction<{ name: string; value: number; type: string; }[]>>;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const DevelopmentRentalAssumptions: React.FC<DevelopmentRentalAssumptionsProps> = ({ rows, setRows, growthRates, setGrowthRates }) => {
  const PREPOPULATED_UNIT_TYPES = ["Studio", "1 Bdrm", "2 Bdrm", "3 Bdrm", "4 Bdrm"];
  const [newUnitType, setNewUnitType] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Filter dropdown options to exclude unit types already present in the table (case-insensitive)
  const existingUnitTypesSet = useMemo(() => {
    return new Set(
      (rows || [])
        .map(r => (r.unit_type || '').trim().toLowerCase())
        .filter(Boolean)
    );
  }, [rows]);
  const availableUnitTypeOptions = useMemo(() => {
    return PREPOPULATED_UNIT_TYPES.filter(
      opt => !existingUnitTypesSet.has((opt || '').trim().toLowerCase())
    );
  }, [existingUnitTypesSet]);
  const duplicateExists = useMemo(() => {
    const trimmed = (newUnitType || '').trim().toLowerCase();
    return trimmed.length > 0 && existingUnitTypesSet.has(trimmed);
  }, [newUnitType, existingUnitTypesSet]);
  const shouldPulseAddButton = rows.length === 0;

  const addUnitType = (name: string) => {
    // Allow blank unit types; user can edit in-row later
    const trimmed = (name || '').trim();
    setRows(prev => [
      ...prev,
      { id: generateId(), unit_type: trimmed, avg_sf: 0, units: 0, avg_rent: 0 }
    ]);
    setNewUnitType('');
    // clear input if uncontrolled
    if (inputRef.current) inputRef.current.value = '';
  };

  const deleteRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleCellChange = (id: string, field: keyof DevelopmentUnitRow, value: any) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const computed = useMemo(() => {
    const withDerived = rows.map(r => {
      const avgSf = Number(r.avg_sf || 0);
      const units = Number(r.units || 0);
      const avgRent = Number(r.avg_rent || 0) / 12;
      const totalSf = Math.max(0, Math.round(avgSf * units));
      const monthlyRent = Math.max(0, Math.round(avgRent * units));
      const annualRent = monthlyRent * 12;
      // Rent PSF = Avg. Rent / Avg. SF (per sq ft)
      const rentPsf = avgSf > 0 ? avgRent / avgSf : 0;
      return { ...r, totalSf, rentPsf, monthlyRent, annualRent };
    });
    const totals = withDerived.reduce(
      (acc, r) => {
        acc.units += Number(r.units || 0);
        acc.totalSf += Number((r as any).totalSf || 0);
        acc.monthlyRent += Number((r as any).monthlyRent || 0);
        acc.annualRent += Number((r as any).annualRent || 0);
        return acc;
      },
      { units: 0, totalSf: 0, monthlyRent: 0, annualRent: 0 }
    );
    // Rent PSF total = total monthly rent / total SF
    const weightedRentPsf = totals.totalSf > 0 ? totals.monthlyRent / totals.totalSf : 0;
    // Avg Rent should be total annual rent divided by total units
    const avgRent = totals.units > 0 ? Math.round(totals.annualRent / totals.units) : 0;
    return { withDerived, totals, weightedRentPsf, avgRent };
  }, [rows]);

  const allColumns: Record<string, GridColDef> = {
    unit_type: {
      field: 'unit_type',
      headerName: 'Unit Type',
      editable: false,
      renderCell: (params: any) => {
        const isEditing = editingRowId === String(params.id);
        if (isEditing) {
          return (
            <TextField
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              variant="standard"
              size="small"
              fullWidth
              autoFocus
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  const trimmed = (editingValue || '').trim();
                  handleCellChange(String(params.id), 'unit_type', trimmed);
                  setEditingRowId(null);
                } else if (e.key === 'Escape') {
                  setEditingRowId(null);
                }
              }}
              onBlur={() => {
                const trimmed = (editingValue || '').trim();
                handleCellChange(String(params.id), 'unit_type', trimmed);
                setEditingRowId(null);
              }}
              sx={{
                minWidth: 0,
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: 0,
                  textAlign: 'left',
                  height: '100%',
                  fontSize: 14.5,
                  fontWeight: 600,
                  fontFamily: 'inherit'
                }
              }}
              InputProps={{
                disableUnderline: true,
                sx: { px: 0, py: 0, height: 36, display: 'flex', alignItems: 'center', background: 'transparent', fontFamily: 'inherit' }
              }}
              inputProps={{ maxLength: 100 }}
              placeholder="Untitled"
            />
          );
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
            <span style={{ color: '#1f2937', fontSize: 14.5, fontFamily: 'inherit', fontWeight: 400 }}>
              {params.value || <span style={{ color: '#aaa' }}>Untitled</span>}
            </span>
            <span className="u-row-action">
              <Tooltip title="Edit unit type" arrow>
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingRowId(String(params.id));
                    setEditingValue(String(params.value || ''));
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{ p: 0.25 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </span>
          </Box>
        );
      },
    },
    avg_sf: {
      field: 'avg_sf',
      headerName: 'Avg. SF',
      editable: false,
      type: 'number',
      renderCell: (params: any) => (
        <NumberInputCell
          params={params}
          handleCellChange={(id: string, _field: string, v: any) =>
            handleCellChange(id as string, 'avg_sf', v === '' ? 0 : Number(v))
          }
          field={'avg_sf'}
          suffix={'sf'}
          highlighted
        />
      ),
    },
    units: {
      field: 'units',
      headerName: 'Units',
      editable: false,
      type: 'number',
      renderCell: (params: any) => (
        <NumberInputCell
          params={params}
          handleCellChange={(id: string, _field: string, v: any) =>
            handleCellChange(id as string, 'units', v === '' ? 0 : Math.max(0, Math.round(Number(v))))
          }
          field={'units'}
          highlighted
        />
      ),
    },
    total_sf: {
      field: 'total_sf',
      headerName: 'Total SF',
      editable: false,
      type: 'number',
      valueGetter: (p: any) => ((p && p.row && p.row.totalSf) ?? 0),
      renderCell: (params: any) => (
        <span className="u-muted">{Number(params.row.totalSf ?? 0).toLocaleString()}</span>
      ),
    },
    rent_psf: {
      field: 'rent_psf',
      headerName: 'Rent PSF',
      editable: false,
      type: 'number',
      valueGetter: (p: any) => ((p && p.row && p.row.rentPsf) ?? 0),
      renderCell: (params: any) => (
        <span className="u-muted">
          ${Number(params.row.rentPsf ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    avg_rent: {
      field: 'avg_rent',
      headerName: 'Avg. Rent',
      editable: false,
      type: 'number',
      renderCell: (params: any) => (
        <NumberInputCell
          params={params}
          handleCellChange={(id: string, _field: string, v: any) =>
            handleCellChange(id as string, 'avg_rent', v === '' ? 0 : Math.max(0, Math.round(Number(v))))
          }
          field={'avg_rent'}
          prefix={'$'}
          highlighted
        />
      ),
    },
    monthly_rent: {
      field: 'monthly_rent',
      headerName: 'Monthly Rent',
      editable: false,
      type: 'number',
      valueGetter: (p: any) => ((p && p.row && p.row.monthlyRent) ?? 0),
      renderCell: (params: any) => (
        <span className="u-muted">
          ${Number(params.row.monthlyRent ?? 0).toLocaleString()}
        </span>
      ),
    },
    annual_rent: {
      field: 'annual_rent',
      headerName: 'Annual Rent',
      editable: false,
      type: 'number',
      valueGetter: (p: any) => ((p && p.row && p.row.annualRent) ?? 0),
      renderCell: (params: any) => (
        <span className="u-muted">
          ${Number(params.row.annualRent ?? 0).toLocaleString()}
        </span>
      ),
    },
    delete: {
      field: 'delete',
      headerName: '',
      renderCell: (params) => (
        <span className="u-row-action">
          <IconButton
            onClick={() => deleteRow(params.id as string)}
            color="error"
            size="small"
            sx={{ p: 0.25 }}
          >
            <DeleteIcon />
          </IconButton>
        </span>
      ),
    },
  };

  const columns: GridColDef[] = [
    { ...allColumns.unit_type, flex: 1.2, minWidth: 160 },
    { ...allColumns.avg_sf, flex: 0.8, minWidth: 110 },
    { ...allColumns.units, flex: 0.7, minWidth: 100 },
    { ...allColumns.total_sf, flex: 0.9, minWidth: 120 },
    { ...allColumns.rent_psf, flex: 0.8, minWidth: 110 },
    { ...allColumns.avg_rent, flex: 0.9, minWidth: 130 },
    { ...allColumns.monthly_rent, flex: 1.0, minWidth: 140 },
    { ...allColumns.annual_rent, flex: 1.0, minWidth: 140 },
    { ...allColumns.delete, flex: 0.2, minWidth: 60 },
  ];

  // Stable footer slot component (defined outside render identity via slots)
  const FooterSlot = useMemo(() => {
    return function DevelopmentAssumptionsFooter(props: {
      availableOptions: string[];
      newUnitType: string;
      setNewUnitType: (v: string) => void;
      addUnitType: (name: string) => void;
      inputRef: React.RefObject<HTMLInputElement>;
      duplicateExists: boolean;
      computed: any;
    }) {
      const {
        availableOptions,
        newUnitType,
        setNewUnitType,
        addUnitType,
        inputRef,
        duplicateExists,
        computed
      } = props;
      return (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 14.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Autocomplete
              freeSolo
              size="small"
              options={availableOptions}
              disablePortal
              selectOnFocus
              inputValue={newUnitType}
              onInputChange={(_e, v) => setNewUnitType(v)}
              onChange={(_e, v) => setNewUnitType(typeof v === 'string' ? v : (v as any) || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add or select Unit Type"
                  placeholder="e.g., Studio"
                  inputRef={inputRef}
                  onKeyDown={(e) => {
                    // Prevent parent DataGrid from hijacking keyboard navigation
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!duplicateExists) addUnitType(newUnitType);
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{
                    minWidth: 260,
                    '& .MuiInputBase-input': { fontSize: 14, fontFamily: 'inherit' },
                    '& .MuiInputLabel-root': { fontSize: 14, fontFamily: 'inherit' },
                    '& .MuiInputLabel-shrink': { fontSize: 14, fontFamily: 'inherit' }
                  }}
                  error={duplicateExists}
                  helperText={duplicateExists ? 'This unit type already exists' : undefined}
                />
              )}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => addUnitType(newUnitType)}
              disabled={duplicateExists}
              sx={{
                whiteSpace: 'nowrap',
                minWidth: 160,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: shouldPulseAddButton ? '0 0 0 0 rgba(25, 118, 210, 0.45)' : undefined,
                animation: shouldPulseAddButton ? 'add-unit-pulse 1.8s ease-in-out infinite' : 'none',
                '@keyframes add-unit-pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.45)',
                  },
                  '50%': {
                    transform: 'scale(1.03)',
                    boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)',
                  },
                },
              }}
            >
              Add Unit Type
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '18px', marginLeft: 'auto', justifyContent: 'flex-end', textAlign: 'right', color: '#1f2937' }}>
            <div><span style={{ fontWeight: 600 }}>Units:</span> {computed.totals.units.toLocaleString()}</div>
            <div><span style={{ fontWeight: 600 }}>Total SF:</span> {computed.totals.totalSf.toLocaleString()}</div>
            <div><span style={{ fontWeight: 600 }}>Rent PSF:</span> ${computed.weightedRentPsf.toFixed(2)}</div>
            <div><span style={{ fontWeight: 600 }}>Avg. Rent:</span> ${computed.avgRent.toLocaleString()}</div>
            <div><span style={{ fontWeight: 600 }}>Monthly Rent:</span> ${computed.totals.monthlyRent.toLocaleString()}</div>
            <div><span style={{ fontWeight: 600 }}>Annual Rent:</span> ${computed.totals.annualRent.toLocaleString()}</div>
          </div>
        </div>
      );
    };
  }, []);

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>

      <DataGrid
        rows={computed.withDerived}
        columns={columns.map((c) => ({ ...c, sortable: false }))}
        autoHeight
        disableRowSelectionOnClick
        hideFooterSelectedRowCount
        slots={{ footer: FooterSlot as any }}
        slotProps={{
          footer: {
            availableOptions: availableUnitTypeOptions,
            newUnitType,
            setNewUnitType,
            addUnitType,
            inputRef,
            duplicateExists,
            computed
          } as any
        }}
        rowHeight={52}
        sx={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 1,
          '& .MuiDataGrid-columnHeaders': {
            background: '#fff',
            minHeight: 52,
            maxHeight: 52,
            borderBottom: '1px solid #e5e7eb',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: 14.5,
            color: '#1f2937',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(15,23,42,0.08)',
            background: '#fff',
            fontSize: 14.5,
            color: '#1f2937',
          },
          // Non-editable derived values should NOT be bold
          '& .u-muted': { color: '#111827', fontWeight: 400 },
          // Make editable inputs bold, with underline on hover/focus consistent with other tables
          '& .u-editable-input': {
            border: 'none',
            borderBottom: '2px solid transparent',
            borderRadius: 0,
            background: 'transparent',
            fontWeight: 600
          },
          '& .u-editable-input input': { fontWeight: 600 },
          '& .MuiDataGrid-row:hover .u-editable-input, & .u-editable-input:focus': {
            borderBottom: '2px solid #4f8bd6 !important'
          },
          '& .u-row-action': { opacity: 0, transition: 'opacity 120ms ease' },
          '& .MuiDataGrid-row:hover .u-row-action, & .MuiDataGrid-cell:focus-within .u-row-action': { opacity: 1 },
        }}
      />

      {/* Rental Growth Rate control, similar to AmenityIncome growth UI */}
      {growthRates && setGrowthRates && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mt: 2 }}>
          <Typography sx={{ fontWeight: 600, color: '#1f2937' }}>
            Rental Growth Rate
          </Typography>
          <NumberInput
            value={
              (growthRates.find(r => r.type === 'rental' && r.name?.toLowerCase() === 'rental inflation')?.value) ??
              (growthRates.find(r => r.type === 'rental')?.value ?? 0)
            }
            onChange={(val) => {
              const parsed = val === '' ? 0 : Number(val);
              setGrowthRates(prev => {
                const idx = prev.findIndex(r => r.type === 'rental' && r.name?.toLowerCase() === 'rental inflation');
                if (idx >= 0) {
                  const copy = prev.slice();
                  copy[idx] = { ...copy[idx], value: parsed };
                  return copy;
                }
                // fallback: first rental entry
                const firstIdx = prev.findIndex(r => r.type === 'rental');
                if (firstIdx >= 0) {
                  const copy = prev.slice();
                  copy[firstIdx] = { ...copy[firstIdx], value: parsed };
                  return copy;
                }
                // if none exists, append one
                return [...prev, { name: 'Rental Inflation', value: parsed, type: 'rental' }];
              });
            }}
            size="small"
            variant="outlined"
            endAdornment={<span>%</span>}
            sx={{ width: 140, '& .MuiInputBase-root': { bgcolor: 'white' } }}
          />
        </Box>
      )}
    </Box>
  );
};

export default DevelopmentRentalAssumptions;