import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Typography } from '@mui/material';
import { calculateEGI } from "../utils/egi";
import { MID_DARK_THEME_COLOR } from '../utils/constants';

interface OperatingExpense {
  id: string;
  name: string;
  factor: number;
  cost_per: string;
  broker?: number;
  statistic?: number | string | null;
}

const getRetailIncome = (unitsArr: any[]) => {
  return unitsArr.reduce((sum: number, u: any) => sum + (u.square_feet * u.rent_per_square_foot_per_year || 0), 0);
};

const OperatingExpensesReadOnly: React.FC<{
  operatingExpenses: OperatingExpense[];
  units: any[];
  amenityIncome: any[];
  modelDetails: any;
  retailIncome?: any[];
  retailExpenses?: any[];
}> = ({ operatingExpenses, units, amenityIncome, modelDetails, retailIncome = [], retailExpenses = [] }) => {

  const flexByField: Record<string, number> = {
    name: 1.4,
    cost_per: 1,
    factor: 1,
    statistic: 1,
    monthly: 1,
    annual: 1,
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', editable: false, flex: flexByField.name, minWidth: 150, align: 'left', headerAlign: 'left' },
    {
      field: 'cost_per',
      headerName: 'Cost per',
      flex: flexByField.cost_per,
      minWidth: 130,
      editable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const value = String(params.value || '');
        return (
          <span style={{ color: '#888' }}>{value}</span>
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
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const byUnit = String(params.row.cost_per || '').toLowerCase();
        let prefix = '';
        let suffix = '';
        if (byUnit === 'per unit' || byUnit === 'total') {
          prefix = '$';
        } else if (byUnit === 'percent of egi') {
          suffix = '%';
        } else if (byUnit === 'per ca square foot' || byUnit === 'per total square feet') {
          prefix = '$';
          suffix = '/sf';
        }
        // Ensure value is rounded to nearest integer and comma separated
        let value = params.value;
        if (typeof value === 'number') {
          value = Math.round(value).toLocaleString();
        } else if (typeof value === 'string' && !isNaN(Number(value))) {
          value = Math.round(Number(value)).toLocaleString();
        }
        return (
          <span style={{ color: '#888' }}>
            {prefix}{value}{suffix}
          </span>
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
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const row = params.row as OperatingExpense;
        let value: number | string | null = null;
        let adornment = '';

        const byUnit = String(row.cost_per || '').toLowerCase();
        if (byUnit === 'per unit') {
          value = units.length;
          adornment = ' units';
        } else if (byUnit === 'total') {
          value = null;
          adornment = '';
        } else if (byUnit === 'per ca square foot') {
          let totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
          value = (totalSf - units.reduce((sum: number, u: any) => sum + (u.square_feet || 0), 0));
          value = totalSf.toLocaleString();
          adornment = ' sf';
        } else if (byUnit === 'per total square feet') {
          let totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
          value = totalSf.toLocaleString();
          adornment = ' sf';
        } else if (byUnit === 'percent of egi') {
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

        return (
          <span style={{ color: '#888' }}>
            {value !== null && value !== undefined
              ? (byUnit === 'percent of egi' ? `${adornment}${value}` : `${value}${adornment}`)
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
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const row = params.row as any;
        let value: number | string = 0;
        const byUnit = String(row.cost_per || '').toLowerCase();
        if (byUnit === 'per unit') {
          value = Math.round((row.factor * (units ? units.length : 0) / 12) * 100) / 100;
        } else if (byUnit === 'total') {
          value = Math.round((row.factor / 12) * 100) / 100;
        } else if (byUnit === 'per ca square foot') {
          const totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
          const commonAreaSf = (totalSf - units.reduce((sum: number, u: any) => sum + (u.square_feet || 0), 0));
          value = Math.round((row.factor * commonAreaSf / 12) * 100) / 100;
        } else if (byUnit === 'per total square feet') {
          const totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
          value = Math.round((row.factor * totalSf / 12) * 100) / 100;
        } else if (byUnit === 'percent of egi') {
          const totalRetailIncome = getRetailIncome(retailIncome);
          const egi = calculateEGI({
            modelDetails,
            units,
            amenityIncome,
            retailIncome,
            retailExpenses,
            totalRetailIncome,
          });
          value = ((row.factor * egi / 100) / 12 || 0);
        }
        value = (value as number).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        return (
          <span style={{ color: '#888' }}>${value}</span>
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
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const row = params.row as any;
        let value: number | string = 0;
        const byUnit = String(row.cost_per || '').toLowerCase();
        if (byUnit === 'per unit') {
          value = row.factor * (units ? units.length : 0);
        } else if (byUnit === 'total') {
          value = row.factor;
        } else if (byUnit === 'per ca square foot') {
          const totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
          const commonAreaSf = (totalSf - units.reduce((sum: number, u: any) => sum + (u.square_feet || 0), 0));
          value = Math.round((row.factor * commonAreaSf));
        } else if (byUnit === 'per total square feet') {
          const totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
          value = Math.round((row.factor * totalSf));
        } else if (byUnit === 'percent of egi') {
          const totalRetailIncome = getRetailIncome(retailIncome);
          const egi = calculateEGI({
            modelDetails,
            units,
            amenityIncome,
            retailIncome,
            retailExpenses,
            totalRetailIncome,
          });
          value = ((row.factor * egi / 100) || 0);
        }
        value = (value as number).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        return (
          <span style={{ color: '#888' }}>${value}</span>
        );
      },
    },
  ];

  const CustomFooter = () => {
    const computedRows = operatingExpenses.map((row) => {
      let monthly = 0;
      let annual = 0;
      const byUnit = String(row.cost_per || '').toLowerCase();
      if (byUnit === 'per unit') {
        monthly = Math.round((row.factor * (units ? units.length : 0) / 12) * 100) / 100;
        annual = row.factor * (units ? units.length : 0);
      } else if (byUnit === 'total') {
        monthly = Math.round((row.factor / 12) * 100) / 100;
        annual = row.factor;
      } else if (byUnit === 'per ca square foot') {
        let totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
        let commonAreaSf = (totalSf - units.reduce((sum: number, u: any) => sum + (u.square_feet || 0), 0));
        monthly = Math.round((row.factor * commonAreaSf / 12) * 100) / 100;
        annual = Math.round((row.factor * commonAreaSf));
      } else if (byUnit === 'percent of egi') {
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
      } else if (byUnit === 'per total square feet') {
        let totalSf = Number(modelDetails?.user_model_field_values?.find((field: any) => field.field_key === "Gross Square Feet")?.value ?? 0);
        monthly = Math.round((row.factor * totalSf / 12) * 100) / 100;
        annual = Math.round((row.factor * totalSf));
      }
      return { ...row, monthly, annual };
    });

    const totalMonthly = computedRows.reduce((sum, row: any) => sum + (row.monthly || 0), 0);
    const totalAnnual = computedRows.reduce((sum, row: any) => sum + (row.annual || 0), 0);

    return (
      <div style={{ 
        padding: '8px 16px', 
        backgroundColor: '#f5f5f5', 
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end', width: '100%' }}>
          <div style={{ textAlign: 'right' }}>
            <strong>Total Monthly Expenses:</strong> ${totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Total Annual Expenses:</strong> ${totalAnnual.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
    
      <DataGrid
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableColumnSorting
        rows={operatingExpenses}
        columns={columns}
        disableRowSelectionOnClick
        slots={{ footer: CustomFooter }}
        getRowId={(row) => row.id}
        density="compact"
        sx={{
          border: `2px solid ${MID_DARK_THEME_COLOR}`,
          borderRadius: 1,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: `${MID_DARK_THEME_COLOR} !important`,
            backgroundImage: 'none !important',
            color: '#fff',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: `${MID_DARK_THEME_COLOR} !important`,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            color: '#fff',
            fontWeight: 600,
          },
          '& .MuiDataGrid-columnSeparator': { color: 'rgba(255,255,255,0.35)' },
          '& .MuiSvgIcon-root': { color: '#fff' },
          '& .MuiDataGrid-withBorderColor': { borderColor: `${MID_DARK_THEME_COLOR}` },
        }}
      />
    </div>
  );
};

export default OperatingExpensesReadOnly; 