import React, { useEffect, useRef, useState } from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { Button, IconButton, Tooltip, Typography, TextField, Box, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { TextInputCell } from './TextInputCell';
import { NumberInputCell } from './NumberInputCell';
import { HEADER_FOOTER_HEIGHT, ROW_HEIGHT } from '../utils/constants';
import { calculateEGI } from "../utils/egi";
import { NumberDecimalInputCell } from './NumberDecimalInputCell';
import { OperatingExpensesSuggested, OperatingExpensesBasic } from '../utils/newModelConstants';
import { colors } from '../theme';

interface OperatingExpense {
  id: string;
  name: string;
  factor: number;
  cost_per: string;
  broker: number;
}

const getRetailIncome = (unitsArr: any[]) => {
  return unitsArr.reduce((sum, u) => sum + (u.square_feet * u.rent_per_square_foot_per_year || 0), 0);
};

const OperatingExpensesTable: React.FC<{
  operatingExpenses: OperatingExpense[];
  setOperatingExpenses: React.Dispatch<React.SetStateAction<OperatingExpense[]>>;
  units: any[];
  amenityIncome: any[];
  modelDetails: any;
  retailIncome: any;
  retailExpenses: any;
}> = ({ operatingExpenses, setOperatingExpenses, units, amenityIncome, modelDetails, retailIncome, retailExpenses }) =>  {

  const [editingNameRowId, setEditingNameRowId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [newExpenseName, setNewExpenseName] = useState<string>(''); // kept for compatibility (not controlling input)
  const newExpenseInputRef = React.useRef<HTMLInputElement | null>(null);
  const suggestedOptions = React.useMemo(() => {
    const existing = new Set(operatingExpenses.map(e => (e.name || '').trim().toLowerCase()));
    const merged: string[] = [];
    const seen = new Set<string>();
    const source = [...OperatingExpensesSuggested, ...OperatingExpensesBasic];
    for (const item of source) {
      const name = (item?.name || '').trim();
      const key = name.toLowerCase();
      if (name && !seen.has(key)) {
        seen.add(key);
        merged.push(name);
      }
    }
    return merged.filter(n => !existing.has(n.trim().toLowerCase()));
  }, [operatingExpenses]);

  const handleCellChange = (id: string, field: string, value: string | number) => {

      if (field === 'utilization' && typeof value === 'number') {
        if (value > 100) {
          value = 100;
        }
        if (value < 0) {
          value = 0;
        }
      }
    setOperatingExpenses(prev => 
      prev.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  // Flex weights to fill 100% width
  const flexByField: Record<string, number> = {
    name: 1.4,
    cost_per: 1,
    factor: 1,
    statistic: 1,
    monthly: 1,
    annual: 1,
    delete: 0.4,
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', editable: false, flex: flexByField.name, minWidth: 140,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 14.5, color: '#1f2937' }}>Name</Typography>
          <Tooltip title="Add Operating Expense" arrow>
            <IconButton size="small" onClick={addRow} sx={{ p: 0.25 }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
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
                handleCellChange(String(params.id), 'name', trimmed);
                setEditingNameRowId(null);
              }}
              onKeyDown={(e) => {
                // Allow typing spaces in the DataGrid by stopping grid-level key handling
                if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                  e.stopPropagation();
                }
                if (e.key === 'Enter') {
                  const trimmed = editingNameValue.trim();
                  handleCellChange(String(params.id), 'name', trimmed);
                  setEditingNameRowId(null);
                } else if (e.key === 'Escape') {
                  setEditingNameRowId(null);
                }
              }}
              sx={{ minWidth: 0, width: '100%', '& .MuiInputBase-input': { padding: 0, textAlign: 'left', height: '100%' } }}
              InputProps={{ disableUnderline: true, sx: { px: 0, py: 0, height: 36, display: 'flex', alignItems: 'center', background: 'transparent' } }}
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
    },
    { 
      field: 'cost_per', 
      headerName: 'Cost per', 
      flex: flexByField.cost_per,
      minWidth: 130,
      editable: false, 
      type: 'singleSelect',
      valueOptions: [
        'Per unit',
        'Total',
        'Percent of EGI',
        'Per CA Square Foot',
        'Per Total Square Feet'
      ],
      renderCell: (params) => {
        // Canonical options with proper casing
        const options = [
          'Per unit',
          'Total',
          'Percent of EGI',
          'Per CA Square Foot',
          'Per Total Square Feet'
        ];
        // Find current value case-insensitively, default to first option
        const currentValue = typeof params.value === 'string'
          ? (options.find(opt => opt.toLowerCase() === params.value.toLowerCase()) || options[0])
          : options[0];
        return (
          <div className="u-select-wrap" style={{ position: 'relative', width: '100%' }}>
            <select
              value={currentValue}
              onChange={(e) => handleCellChange(String(params.id), 'cost_per', e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '10px 28px 10px 8px',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                color: 'inherit',
                fontSize: 14.5,
                fontWeight: 500,
                fontFamily: 'inherit'
              }}
              className="u-select"
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="u-caret" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>▾</span>
          </div>
        );
      }
    },
    { 
      field: 'factor', 
      headerName: 'Expense', 
      flex: flexByField.factor,
      minWidth: 130,
      editable: false, 
      type: 'number',
      renderCell: (params) => {
        const byUnit = params.row.cost_per.toLowerCase();
        let prefix = '';
        let suffix = '';
        let max = undefined;
        if (byUnit === 'per unit' || byUnit === 'total') {
          prefix = '$';
        } else if (byUnit === 'percent of egi') {
          suffix = '%';
          max = 100;
        } else if (byUnit === 'per ca square foot') {
          prefix = '$';
          suffix = '/ sf';
        } else if (byUnit === 'per total square feet') {
          prefix = '$';
          suffix = '/ sf';
        }
        return (
          <NumberDecimalInputCell
            params={params}
            handleCellChange={handleCellChange}
            field="factor"
            prefix={prefix}
            suffix={suffix}
            max={max}
          />
        );
      },
      renderEditCell: (params) => {
        const byUnit = params.row.cost_per.toLowerCase();
        let prefix = null;
        let suffix = null;
        if (byUnit === 'per unit' || byUnit === 'total') {
          prefix = <span style={{ color: '#888', marginRight: 2 }}>$</span>;
        } else if (byUnit === 'percent of egi') {
          suffix = <span style={{ color: '#888', marginLeft: 2 }}>%</span>;
        } else if (byUnit === 'per ca square foot') {
          prefix = <span style={{ color: '#888', marginRight: 2 }}>$</span>;
          suffix = <span style={{ color: '#888', marginLeft: 2 }}>/sf</span>;
        } else if (byUnit === 'per total square feet') {
          prefix = <span style={{ color: '#888', marginRight: 2 }}>$</span>;
          suffix = <span style={{ color: '#888', marginLeft: 2 }}>/sf</span>;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {prefix}
            <input
              type="number"
              value={params.value ?? ''}
              onChange={e => params.api.setEditCellValue({ id: params.id, field: params.field, value: Number(e.target.value) }, e)}
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
            />
            {suffix}
          </div>
        );
      }
    },
    
    { 
      field: 'statistic', 
      headerName: 'Statistic', 
      flex: flexByField.statistic,
      minWidth: 120,
      editable: false, 
      type: 'number',
      cellClassName: 'u-noneditable-cell',
      renderCell: (params) => {
        const row = params.row;
        let value = null;
        let adornment = '';

        if (row.cost_per.toLowerCase() === 'per unit') {
          value = units.length;
          adornment = ' units';
        } else if (row.cost_per.toLowerCase() === 'total') {
          value = null;
          adornment = '';
        } else if (row.cost_per.toLowerCase() === 'per ca square foot') {
          let totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
          value = (totalSf - units.reduce((sum: number, u: any) => sum + (u.square_feet || 0), 0));
          adornment = ' sf';
        } else if (row.cost_per.toLowerCase() === 'per total square feet') {
          let totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
          value = totalSf;
          adornment = ' sf';
        } else if (row.cost_per.toLowerCase() === 'percent of egi') {
          // Refactored EGI calculation for clarity and reuse
          const getTotalAnnualAmenityIncome = (amenityIncomeArr: any[]) => {
            return amenityIncomeArr.reduce((sum, row) => {
              const usage = Math.round((row.utilization || 0) / 100 * (row.unit_count || 0));
              const monthly = usage * (row.monthly_fee || 0);
              const annual = monthly * 12;
              return sum + annual;
            }, 0);
          };

          const getRentalIncome = (unitsArr: any[]) => {
            return unitsArr.reduce((sum, u) => sum + (u.current_rent || 0), 0) * 12;
          };

   

          const vacancyField = modelDetails?.user_model_field_values?.find(
            (field: any) => field.field_key && field.field_key.trim() === "Vacancy"
          );
          const vacancy = Number(vacancyField?.value ?? 5) / 100;
          const annualTurnoverField = modelDetails?.user_model_field_values?.find(
            (field: any) => field.field_key && field.field_key.trim() === "Annual Turnover"
          );
          const annualTurnover = Number(annualTurnoverField?.value ?? 20) / 100;
          const rentalIncome = getRentalIncome(units);
          const totalAnnualAmenityIncome = getTotalAnnualAmenityIncome(amenityIncome);
          const totalRetailIncome = getRetailIncome(retailIncome);
          const rawValue = calculateEGI({
            modelDetails,
            units,
            amenityIncome,
            retailIncome,
            retailExpenses,
            totalRetailIncome,
          });
          value = rawValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          
          adornment = '$ ';
        }

        value = value?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // format with commas

        if (row.statistic !== value) {
          row.statistic = value;
        }


        return (
          <span className="u-muted">
            {value !== null && value !== undefined
              ? (row.cost_per === 'Percent of EGI'
                  ? `${adornment}${value}`
                  : `${value}${adornment}`)
              : ''}
          </span>
        );
      },
    },
    { 
      field: 'monthly', 
      headerName: 'Monthly', 
      flex: flexByField.monthly,
      minWidth: 110, 
      editable: false, 
      type: 'number',
      cellClassName: 'u-noneditable-cell',
      renderCell: (params) => {
        const row = params.row;
        let value: number | string = 0;
        let factor = Number(row.factor);
        let statistic = 0;
        if (row.statistic) {
          statistic = Number(row.statistic.replace(/,/g, ''));
        }
        
        if (row.cost_per.toLowerCase() === 'per unit') {
          value = Math.round((row.factor * (units ? units.length : 0) / 12) * 100) / 100;
        } else if (row.cost_per.toLowerCase() === 'total') {
          value = Math.round((row.factor / 12) * 100) / 100;
        } else if (row.cost_per.toLowerCase() === 'per ca square foot') {
          value = Math.round((Number(row.factor) * Number(statistic) / 12) * 100) / 100;
        } else if (row.cost_per.toLowerCase() === 'per total square feet') {
          value = Math.round((row.factor * statistic / 12) * 100) / 100;
        } else if (row.cost_per.toLowerCase() === 'percent of egi') {
          const statisticValue = Number(String(statistic).replace(/,/g, ''));
          value = ((row.factor * statisticValue / 100) / 12 || 0);
        }
        value = value?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // format with commas
        return (
          <span className="u-muted">${value}</span>
        );
      },
    },
    { 
      field: 'annual', 
      headerName: 'Annual', 
      flex: flexByField.annual,
      minWidth: 110, 
      editable: false, 
      type: 'number',
      cellClassName: 'u-noneditable-cell',
      renderCell: (params) => {
        const row = params.row;
        let value: number | string = 0;
        let statistic = 0;
        if (row.statistic) {
          statistic = Number(row.statistic.replace(/,/g, ''));
        }
        
        
        if (row.cost_per.toLowerCase() === 'per unit') {
          value = row.factor * (units ? units.length : 0);
        } else if (row.cost_per.toLowerCase() === 'total') {
          value = row.factor;
        } else if (row.cost_per.toLowerCase() === 'per ca square foot') {
          value = Math.round((row.factor * statistic));
        } else if (row.cost_per.toLowerCase() === 'per total square feet') {
          value = Math.round((row.factor * statistic));
        } else if (row.cost_per.toLowerCase() === 'percent of egi') {
          // const statisticValue = Number(String(statistic).replace(/,/g, ''));
          value = ((row.factor * statistic / 100) || 0);
          value = value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // format with commas
        }
        value = value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // format with commas

        return (
          <span className="u-muted">${value}</span>
        );
      },
    },
    // { 
    //   field: 'broker', 
    //   headerName: 'Broker', 
    //   width: columnWidths.broker, 
    //   editable: false, 
    //   type: 'number',
    //   renderCell: (params) => (
    //     <NumberInputCell
    //       params={params}
    //       handleCellChange={handleCellChange}
    //       field="broker"
    //       prefix="$"
    //     />
    //   )
    // },
    {
      field: 'delete',
      headerName: '',
      flex: flexByField.delete,
      minWidth: 70,
      sortable: false,
      renderHeader: () => <span />,
      renderCell: (params) => (
        <span className="u-row-action">
          <Tooltip title="Delete">
            <span>
              <IconButton
                onClick={() => deleteRow(params.id)}
                color="error"
                size="small"
                disabled={params.row.name === 'Property Taxes' || params.row.name === 'Insurance'}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </span>
      ),
    },
  ];

  const processRowUpdate = (newRow: OperatingExpense) => {

    setOperatingExpenses((prev) =>
      prev.map((row) => (row.id === newRow.id ? newRow : row))
    );
    return newRow;
  };

  const addRow = () => {
    const newRow: OperatingExpense = {
      id: String(Date.now()),
      name: '',
      factor: 0,
      broker: 0,
      cost_per: 'Per unit',
    };
    setOperatingExpenses((prev) => [...prev, newRow]);
  };
  const addRowWithName = (name: string) => {
    const trimmed = (name || '').trim();
    const newRow: OperatingExpense = {
      id: String(Date.now()),
      name: trimmed,
      factor: 0,
      broker: 0,
      cost_per: 'Per unit',
    };
    setOperatingExpenses((prev) => [...prev, newRow]);
  };

  const deleteRow = (id: GridRowId) => {
    try {
      if (typeof window !== 'undefined' && (document as any)?.activeElement) {
        (document as any).activeElement?.blur?.();
      }
    } catch {}
    requestAnimationFrame(() => {
    setOperatingExpenses((prev) => prev.filter((row) => row.id !== id));
    });
  };

  const CustomFooter = () => {
    // Calculate total monthly and annual income from rows
    const computedRows = operatingExpenses.map(row => {
      let monthly = 0;
      let annual = 0;
      
      if (row.cost_per.toLowerCase() === 'per unit') {
        monthly = Math.round((row.factor * (units ? units.length : 0) / 12) * 100) / 100;
        annual = row.factor * (units ? units.length : 0);
      } else if (row.cost_per.toLowerCase() === 'total') {
        monthly = Math.round((row.factor / 12) * 100) / 100;
        annual = row.factor;
      } else if (row.cost_per.toLowerCase() === 'per ca square foot') {
        let totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
        let commonAreaSf = (totalSf - units.reduce((sum: number, u: any) => sum + (u.square_feet || 0), 0));
        monthly = Math.round((row.factor * commonAreaSf / 12) * 100) / 100;
        annual = Math.round((row.factor * commonAreaSf));
      } else if (row.cost_per.toLowerCase() === 'percent of egi') {
        // Refactored EGI calculation for clarity and reuse
        const getTotalAnnualAmenityIncome = (amenityIncomeArr: any[]) => {
          return amenityIncomeArr.reduce((sum, row) => {
            const usage = Math.round((row.utilization || 0) / 100 * (row.unit_count || 0));
            const monthly = usage * (row.monthly_fee || 0);
            const annual = monthly * 12;
            return sum + annual;
          }, 0);
        };

        const getRentalIncome = (unitsArr: any[]) => {
          return unitsArr.reduce((sum, u) => sum + (u.current_rent || 0), 0) * 12;
        };

        // Replace inline EGI logic with utility
        const retailSF = retailIncome.reduce((sum: number, income: any) => sum + (income.square_feet || 0), 0);
        const totalRetailIncome = getRetailIncome(retailIncome);
        const egi = calculateEGI({
          modelDetails,
          units,
          amenityIncome,
          retailIncome,
          retailExpenses,
          totalRetailIncome,
        });

        annual = row.factor * egi / 100;
        monthly = annual / 12;

      }
      
      return { ...row, monthly, annual };
    });
    
    const totalMonthlyExpenses = computedRows.reduce((sum, row) => sum + (row.monthly || 0), 0);
    const totalAnnualExpenses = computedRows.reduce((sum, row) => sum + (row.annual || 0), 0);
    // const totalBroker = computedRows.reduce((sum, row) => sum + (row.broker || 0), 0);


    return (
      <div style={{ 
        padding: '14px 16px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 14.5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Autocomplete
            freeSolo
            size="small"
            options={suggestedOptions}
            // leave input uncontrolled to avoid focus loss on rerenders
            onChange={(_e, v) => {
              const name = typeof v === 'string' ? v : (v as any) || '';
              const trimmed = String(name).trim();
              if (trimmed) {
                addRowWithName(trimmed);
                if (newExpenseInputRef.current) newExpenseInputRef.current.value = '';
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add or select expense"
                placeholder="e.g., Pest Control"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const currentVal = (e.target as HTMLInputElement)?.value ?? '';
                    const trimmed = currentVal.trim();
                    if (trimmed) {
                      e.preventDefault();
                      addRowWithName(trimmed);
                      if (newExpenseInputRef.current) newExpenseInputRef.current.value = '';
                    }
                  }
                }}
                inputRef={newExpenseInputRef}
                sx={{ minWidth: 260 }}
              />
            )}
          />
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              const currentVal = newExpenseInputRef.current?.value ?? '';
              const trimmed = currentVal.trim();
              if (trimmed) {
                addRowWithName(trimmed);
                if (newExpenseInputRef.current) newExpenseInputRef.current.value = '';
              } else {
                addRow();
              }
            }}
            sx={{ whiteSpace: 'nowrap', minWidth: 260 }}
          >
            Add Operating Expense
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end', width: '100%', color: '#1f2937' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600 }}>Total Monthly Expenses:</span> ${totalMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600 }}>Total Annual Expenses:</span> ${totalAnnualExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          {/* <div style={{ textAlign: 'right' }}>
            <strong>Total Broker:</strong> ${totalBroker.toLocaleString()}
          </div> */}
        </div>
      </div>
    );
  };

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
          Add Operating Expense
        </Button>
      </div> */}
     
        <DataGrid
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          disableColumnSorting
          rows={operatingExpenses}
          columns={columns.map(col => ({ ...col, sortable: false }))}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
          slots={{ footer: CustomFooter }}
          rowHeight={52}
          getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'u-row-odd' : 'u-row-even'}
          hideFooterSelectedRowCount
          sx={{
            minWidth: "900px",
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
            // Hover-only caret for custom selects
            '& .u-caret': { opacity: 0, transition: 'opacity 120ms ease', color: colors.blue, fontSize: '1.25rem' },
            '& .u-select:focus + .u-caret': { opacity: 1 },
            '& .MuiDataGrid-row:hover .u-caret': { opacity: 1 },
            '& .MuiDataGrid-virtualScroller': { background: '#ffffff' },
            '& .MuiDataGrid-footerContainer': { background: '#ffffff', borderTop: '1px solid #e5e7eb' },
            '& .u-muted': { color: '#9aa3b2', fontWeight: 400 },
          }}
        />
      </div>
    
  );
};

export default OperatingExpensesTable;
