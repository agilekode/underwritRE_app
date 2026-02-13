import React, { useState, useEffect, useRef } from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { Button, IconButton, Tooltip, Typography, TextField, Box, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { NumberInputCell } from './NumberInputCell';
import { TextInputCell } from './TextInputCell';
import { HEADER_FOOTER_HEIGHT, ROW_HEIGHT } from '../utils/constants';
import { AmenityIncomeSuggested, AmenityIncomeBasic } from '../utils/newModelConstants';

interface AmenityIncome {
  id: string;
  name: string;
  start_month: number;
  utilization: number;
  unit_count: number;
  monthly_fee: number;
}



const columnHeaderTooltips = {
  "Name": "The name of the amenity",
  "Start Month": "When the amenity income begins (month 0 and month 1 both start at month 1)",
  "Utilization": "The equivalent of occupancy for the amenity being underwritten.",
  "Usage": "Total available units or spaces of the amenity x the utilization = Usage",
  "Unit Count": "The number of units or spaces available at the Property. For example, if there are 6 parking spaces, inputting a 6 here would reflect that.",
  "Monthly Fee": "The fee per month per “unit” or space of the amenity.",
  "Delete": "Delete the amenity",
  "Monthly": "The monthly income from the amenity",
  "Annual": "The annual income from the amenity"
}


const AmenityIncomeTable: React.FC<{ amenityIncome: AmenityIncome[]; setAmenityIncome: React.Dispatch<React.SetStateAction<AmenityIncome[]>>; }> = ({ amenityIncome, setAmenityIncome }) => {
  const [rows, setRows] = useState<AmenityIncome[]>([]);
  useEffect(() => {
    setRows(getRows(amenityIncome));
  }, [amenityIncome]);

  const [editingNameRowId, setEditingNameRowId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const newAmenityInputRef = useRef<HTMLInputElement | null>(null);
  const suggestedOptions = React.useMemo(() => {
    const existing = new Set(amenityIncome.map(a => (a.name || '').trim().toLowerCase()));
    const merged: string[] = [];
    const seen = new Set<string>();
    const source = [...AmenityIncomeSuggested, ...AmenityIncomeBasic];
    for (const item of source) {
      const name = (item?.name || '').trim();
      const key = name.toLowerCase();
      if (name && !seen.has(key)) {
        seen.add(key);
        merged.push(name);
      }
    }
    return merged.filter(n => !existing.has(n.trim().toLowerCase()));
  }, [amenityIncome]);

  const withHeaderTooltip = (header: keyof typeof columnHeaderTooltips | string, def: Partial<GridColDef> = {}): GridColDef => ({
    headerName: header,
    renderHeader: () => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={(columnHeaderTooltips as any)[header] || header} arrow>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary' }}>
            {header}
          </Typography>
        </Tooltip>
        {header === 'Name' && (
          <Tooltip title="Add Amenity" arrow>
            <IconButton size="small" onClick={addRow} sx={{ p: 0.25 }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    ),
    ...def,
  } as GridColDef);

  const columns: GridColDef[] = [
    withHeaderTooltip('Name', { field: 'name', editable: false, flex: 1.2,
      renderCell: (params) => (
        editingNameRowId === String(params.id) ? (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%' }}>
            <TextField
              value={editingNameValue}
              onChange={(e) => setEditingNameValue(e.target.value)}
              variant="standard"
              size="small"
              autoFocus
              fullWidth
              onBlur={() => {
                const trimmed = editingNameValue.trim();
                setAmenityIncome(prev => prev.map(r => r.id === String(params.id) ? { ...r, name: trimmed } : r));
                setEditingNameRowId(null);
              }}
              onKeyDown={(e) => {
                // Prevent DataGrid from hijacking typing/navigation (space, arrows, etc.)
                e.stopPropagation();
                if (e.key === 'Enter') {
                  const trimmed = editingNameValue.trim();
                  setAmenityIncome(prev => prev.map(r => r.id === String(params.id) ? { ...r, name: trimmed } : r));
                  setEditingNameRowId(null);
                } else if (e.key === 'Escape') {
                  setEditingNameRowId(null);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              sx={{
    
                width: '100%',
                '& .MuiInputBase-input': { padding: 0, textAlign: 'left', height: '100%' }
              }}
              InputProps={{
                disableUnderline: true,
                sx: { px: 0, py: 0, height: 36, display: 'flex', alignItems: 'center', background: 'transparent' }
              }}
              inputProps={{ maxLength: 100 }}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
            <span style={{ color: '#222' }}>{params.value || <span style={{ color: '#aaa' }}>Untitled</span>}</span>
            <span className="u-row-action">
              <Tooltip title="Edit name" arrow>
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingNameRowId(String(params.id));
                    setEditingNameValue(String(params.value || ''));
                  }}
                  sx={{ p: 0.25 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </span>
          </Box>
        )
      )
    }),
    withHeaderTooltip('Start Month', { field: 'start_month', editable: false, type: 'number', flex: 1,
      renderCell: (params) => (
        <NumberInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="start_month" 
        />
      )
    }),
    withHeaderTooltip('Unit Count', { field: 'unit_count', editable: false, type: 'number', flex: 1,
      renderCell: (params) => (
        <NumberInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="unit_count" 
        />
      )
    }),
    withHeaderTooltip('Utilization', { field: 'utilization', headerName: 'Utilization %', editable: false, type: 'number', flex: 1,
      renderCell: (params) => (
        <NumberInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="utilization" 
          suffix="%"
          max={100}
        />
      )
    }),
    withHeaderTooltip('Usage', {
      field: 'usage',
      headerName: 'Usage',
      flex: 1,
     
      editable: false,
      type: 'number',
      cellClassName: 'u-noneditable-cell',
      renderCell: (params) => (
        <span className="u-muted">{params.value} Units</span>
      ),
      headerClassName: 'non-editable-header'
    }),
    withHeaderTooltip('Monthly Fee', { field: 'monthly_fee', editable: false, type: 'number', flex: 1,
      renderCell: (params) => (
        <NumberInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="monthly_fee" 
          prefix="$"
        />
      )
    }),
    withHeaderTooltip('Monthly', {
      field: 'monthly',
      headerName: 'Monthly',
      flex: 1,
     
      editable: false,
      type: 'number',
      cellClassName: 'u-noneditable-cell',
      renderCell: (params) => {
        const raw = params.value;
        const num = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/,/g, '').trim()) || 0;
        return (
          <span className="u-muted">
            ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        );
      },
      headerClassName: 'non-editable-header'
    }),
    withHeaderTooltip('Annual', {
      field: 'annual',
      headerName: 'Annual',
      flex: 1,
     
      editable: false,
      type: 'number',
      cellClassName: 'u-noneditable-cell',
      renderCell: (params) => {
        const raw = params.value;
        const num = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/,/g, '').trim()) || 0;
        return (
          <span className="u-muted">
            ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        );
      },
      headerClassName: 'non-editable-header'
    }),
    {
      field: 'delete',
      headerName: '',
      flex: 0.4,
      sortable: false,
      minWidth: 50,
      renderHeader: () => <span />,
      renderCell: (params) => (
        <span className="u-row-action">
          <Tooltip title="Delete">
            <span>
              <IconButton
                onClick={() => deleteRow(params.id)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </span>
      ),
    },
  ];

  const handleCellChange = (id: string, field: string, value: string | number) => {

      
    setAmenityIncome(prev => 
      prev.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };


  const processRowUpdate = (newRow: AmenityIncome) => {
    if (newRow.utilization > 100) {
      newRow.utilization = 100;
    }
    if (newRow.utilization < 0) {
      newRow.utilization = 0;
    }
    setAmenityIncome((prev) =>
      prev.map((row) => (row.id === newRow.id ? newRow : row))
    );
    return newRow;
  };

  const addRow = () => {
    const newRow: AmenityIncome = {
      id: String(Date.now()),
      name: '',
      start_month: 0,
      utilization: 0,
      unit_count: 0,
      monthly_fee: 0,
    };
    setAmenityIncome((prev) => [...prev, newRow]);
  };
  const addRowWithName = (name: string) => {
    const trimmed = (name || '').trim();
    const newRow: AmenityIncome = {
      id: String(Date.now()),
      name: trimmed,
      start_month: 0,
      utilization: 0,
      unit_count: 0,
      monthly_fee: 0,
    };
    setAmenityIncome((prev) => [...prev, newRow]);
  };

  const deleteRow = (id: GridRowId) => {
    try {
      if (typeof window !== 'undefined' && (document as any)?.activeElement) {
        (document as any).activeElement?.blur?.();
      }
    } catch {}
    requestAnimationFrame(() => {
    setAmenityIncome((prev) => prev.filter((row) => row.id !== id));
    });
  };

  const getRows = (amenityIncome: AmenityIncome[]) => {
    return amenityIncome.map((row) => {
      const usage = Math.round(row.utilization / 100 * row.unit_count);
      const monthly = usage * row.monthly_fee;
      const annual = monthly * 12;
      return {
        ...row,
        usage,
        monthly,
        annual,
      };
    });
  };

  const CustomFooter = () => {
    // Calculate total monthly and annual income from rows
    // Use getRows to ensure 'monthly' and 'annual' are present on each row
    const computedRows = getRows(amenityIncome);
    const totalMonthlyIncome = computedRows.reduce((sum, row) => sum + (row.monthly || 0), 0);
    const totalAnnualIncome = computedRows.reduce((sum, row) => sum + (row.annual || 0), 0);

    return (
      <div style={{ 
        padding: '16px 16px',
        backgroundColor: 'transparent',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 15
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Autocomplete
            freeSolo
            size="small"
            options={suggestedOptions}
            // keep input uncontrolled to avoid focus loss on rerenders
            onChange={(_e, v) => {
              const name = typeof v === 'string' ? v : (v as any) || '';
              const trimmed = String(name).trim();
              if (trimmed) {
                addRowWithName(trimmed);
                if (newAmenityInputRef.current) newAmenityInputRef.current.value = '';
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add or select amenity"
                placeholder="e.g., Storage"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const currentVal = (e.target as HTMLInputElement)?.value ?? '';
                    const trimmed = currentVal.trim();
                    if (trimmed) {
                      e.preventDefault();
                      addRowWithName(trimmed);
                      if (newAmenityInputRef.current) newAmenityInputRef.current.value = '';
                    }
                  }
                }}
                inputRef={newAmenityInputRef}
                sx={{ minWidth: 220 }}
              />
            )}
          />
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              const currentVal = newAmenityInputRef.current?.value ?? '';
              const trimmed = currentVal.trim();
              if (trimmed) {
                addRowWithName(trimmed);
                if (newAmenityInputRef.current) newAmenityInputRef.current.value = '';
              } else {
                addRow();
              }
            }}
            sx={{ whiteSpace: 'nowrap', minWidth: 180 }}
          >
            Add Amenity
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end', width: '100%' }}>
          <div style={{ textAlign: 'right' }}>
            <strong>Total Monthly Income:</strong> ${totalMonthlyIncome.toLocaleString()}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Total Annual Income:</strong> ${totalAnnualIncome.toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  const getRowClassName = (params: any) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'u-row-odd' : 'u-row-even';

  return (
    <div>
        {/* <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={addRow}
          sx={{ minWidth: 'auto', px: 2, py: 0.5 }}
        >
          Add Amenity
        </Button>
      </div> */}

      <DataGrid
        rows={rows}
        columns={columns.map(col => ({ ...col, sortable: false }))}
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableColumnSorting
        sortingOrder={[]}
        processRowUpdate={processRowUpdate}
        slots={{ footer: CustomFooter }}
        disableRowSelectionOnClick
        rowHeight={52}
        getRowClassName={getRowClassName}
        hideFooterSelectedRowCount
        sx={{
          minWidth: "1000px",
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          '& .MuiDataGrid-main': { background: '#ffffff' },
          '& .MuiDataGrid-columnHeaders': { background: '#ffffff', minHeight: 52, maxHeight: 52, borderBottom: '1px solid #e5e7eb' },
          '& .MuiDataGrid-columnHeader': { background: '#ffffff', minHeight: 52, maxHeight: 52 },
          '& .MuiDataGrid-columnHeaderTitleContainer': { background: '#ffffff' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: 14.5,
            fontFamily: 'inherit',
            textTransform: 'none',
            lineHeight: '52px',
            color: '#1f2937',
            letterSpacing: '0.2px',
          },
          '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(15, 23, 42, 0.08)', background: '#ffffff', fontSize: 14.5, color: '#1f2937' },
          '& .MuiDataGrid-cell.u-noneditable-cell': { color: '#9aa3b2' },
          '& .u-editable-input': { border: 'none', borderBottom: '1px solid transparent', borderRadius: 0, background: 'transparent', fontWeight: 600, color: '#111827' },
          '& .MuiDataGrid-row:hover .u-editable-input, & .u-editable-input:focus': { borderBottom: '2px solid #4f8bd6 !important' },
          '& .MuiDataGrid-row': { background: '#ffffff' },
          '& .u-row-odd': { background: '#ffffff' },
          '& .u-row-even': { background: '#f9fafb' },
          '& .MuiDataGrid-row:hover': { backgroundColor: '#f3f6fb' },
          '& .u-row-action': {
            opacity: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
            transition: 'opacity 120ms ease'
          },
          '& .MuiDataGrid-row:hover .u-row-action, & .MuiDataGrid-cell:focus-within .u-row-action': {
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto'
          },
          '& .MuiDataGrid-virtualScroller': { background: '#ffffff' },
          '& .MuiDataGrid-footerContainer': { background: '#ffffff', borderTop: '1px solid #e5e7eb' },
          '& .u-muted': { color: '#9aa3b2', fontWeight: 400 },
        }}
      />
    </div>
  );
};

export default AmenityIncomeTable;
