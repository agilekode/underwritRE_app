import React, { useEffect, useRef, useState } from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { Button, IconButton, Tooltip, Select, MenuItem, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { TextInputCell } from './TextInputCell';
import { NumberInputCell } from './NumberInputCell';
import { NumberDecimalInputCell } from './NumberDecimalInputCell';
import { HEADER_FOOTER_HEIGHT, ROW_HEIGHT } from '../utils/constants';
import { colors, typography } from '../theme';

interface RetailIncome {
  id: string;
  suite: string;
  tenant_name: string;
  square_feet: number;
  rent_start_month: number;
  annual_bumps: number;
  rent_per_square_foot_per_year: number;
  lease_start_month: number;
  lease_end_month?: number;
  rent_type?: string;
  recovery_start_month: number;
}

// const NumberInputCell = ({ params, handleCellChange, field, prefix = '', suffix = '' }: { 
//   params: any, 
//   handleCellChange: any, 
//   field: string,
//   prefix?: string,
//   suffix?: string 
// }) => {
//   const inputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (params.hasFocus && inputRef.current) {
//       inputRef.current.focus();
//       inputRef.current.select();
//     }
//   }, [params.hasFocus]);

//   return (
//     <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingTop: 2 }}>
//       {prefix && <span style={{ color: '#888', marginRight: 2, height: '42px'}}>{prefix}</span>}
//       <input
//         ref={inputRef}
//         type="number"
//         min={0}
//         value={params.value ?? ''}
//         onChange={e => handleCellChange(params.id, field, Number(e.target.value))}
//         style={{
//           width: '100%',
//           border: params.hasFocus ? '2px solid #1976d2' : '1px solid #ccc',
//           background: params.hasFocus ? '#e3f2fd' : 'transparent',
//           padding: '10px 6px',
//           outline: 'none',
//           borderRadius: 4,
//           marginTop: 4,
//           fontSize: 14, 
//           textAlign: 'right'
//         }}
//         onFocus={e => e.target.select()}
//       />
//       {suffix && <span style={{ color: '#888', marginLeft: 2, height: '42px' }}>{suffix}</span>}
//     </div>
//   );
// };  


// const TextInputCell = ({ params, handleCellChange, field }: { 
//   params: any, 
//   handleCellChange: any, 
//   field: string,
// }) => {
//   const inputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (params.hasFocus && inputRef.current) {
//       inputRef.current.focus();
//       inputRef.current.select();
//     }
//   }, [params.hasFocus]);

//   return (
//     <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingTop: 2 }}>

//       <input
//         ref={inputRef}
//         type="text"
//         value={params.value ?? ''}
//         onChange={e => handleCellChange(params.id, field, e.target.value)}
//         style={{
//           width: '100%',
//           border: params.hasFocus ? '2px solid #1976d2' : '1px solid #ccc',
//           background: params.hasFocus ? '#e3f2fd' : 'transparent',
//           padding: '10px 6px',
//           outline: 'none',
//           borderRadius: 4,
//           marginTop: 4,
//           fontSize: 14, 
//           textAlign: 'right'
//         }}
//         onFocus={e => e.target.select()}
//       />
//     </div>
//   );
// };  

const RetailIncomeTable: React.FC<{
  retailIncome: RetailIncome[];
  setRetailIncome: React.Dispatch<React.SetStateAction<RetailIncome[]>>;
  modelDetails: any;
  unitsTotalSqFt?: number;
  showIndustrialColumns?: boolean;
}> = ({ retailIncome, setRetailIncome, modelDetails, unitsTotalSqFt, showIndustrialColumns = false }) => {  
  const [unitSqFtTotal, setUnitSqFtTotal] = useState<number>(0);
  const handleCellChange = (id: string, field: string, value: any) => {
    // Force integer for month fields
    const integerMonthFields = new Set(['lease_start_month', 'lease_end_month', 'rent_start_month']);
    const nextValue = integerMonthFields.has(field) ? (Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0) : value;
    setRetailIncome(prev => 
      prev.map(row => 
        row.id === id ? { ...row, [field]: nextValue } : row
      )
    );
  };

  // Flex weights to fill 100% width
  const flexByField: Record<string, number> = {
    suite: 0.8,
    tenant_name: 1.2,
    lease_start_month: 0.9,
    square_feet: 0.9,
    rent_start_month: 0.9,
    annual_bumps: 0.9,
    rent_per_square_foot_per_year: 1,
    annual_rent: 1,
    delete: 0.4,
  };

  // Totals for retail SF and broadcasting them
  const totalRetailSquareFeet = retailIncome.reduce((sum, row) => sum + (row.square_feet || 0), 0);

  // Deprecated event wiring removed in favor of props-based totals

  const columns: GridColDef[] = [
    { 
      field: 'suite', 
      headerName: 'Suite', 
      flex: flexByField.suite,
      minWidth: 70,
      editable: false,
      renderCell: (params) => (
        <TextInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="suite" 
        />
      )
    },
    { 
      field: 'tenant_name', 
      headerName: 'Tenant Name', 
      flex: flexByField.tenant_name,
      minWidth: 140,
      editable: false,
      renderCell: (params) => (
        <TextInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="tenant_name" 
        />
      )
    },
    { 
      field: 'lease_start_month', 
      headerName: 'Lease Start', 
      flex: flexByField.lease_start_month,
      minWidth: 100, 
      editable: false, 
      type: 'number',
      renderCell: (params) => (
        <NumberInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="lease_start_month"
          prefix="Month"
        />
      )
    },
    ...(showIndustrialColumns ? [{
      field: 'lease_end_month',
      headerName: 'Lease End',
      flex: 0.9,
      minWidth: 100,
      editable: false,
      type: 'number',
      renderCell: (params: any) => (
        <NumberInputCell
          params={params}
          handleCellChange={handleCellChange}
          field="lease_end_month"
          prefix="Month"
        />
      )
    }] as GridColDef[] : []),
    { 
      field: 'square_feet', 
      headerName: 'Square Ft', 
      flex: flexByField.square_feet,
      minWidth: 100, 
      editable: false, 
      type: 'number',

      renderCell: (params) => (
        <NumberInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="square_feet" 
          suffix="sf"
        />
      )
    },
    { 
      field: 'rent_start_month', 
      headerName: 'Rent Start Month', 
      flex: flexByField.rent_start_month,
      minWidth: 140, 
      editable: false, 
      type: 'number',
      // renderCell: (params) => (
      //   <span>{params.value}</span>
      // ),
      renderCell: (params) => (
        <NumberInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="rent_start_month"
          prefix="Month"
        />
      )
    },
    { 
      field: 'annual_bumps', 
      headerName: 'Annual Bumps (%)', 
      flex: flexByField.annual_bumps,
      minWidth: 130, 
      editable: false, 
      type: 'number',
      // renderCell: (params) => (
      //   <span>{params.value}%</span>
      // ),
      renderCell: (params) => (
        <NumberDecimalInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="annual_bumps" 
          suffix="%"
        />
      )
    },
    { 
      field: 'rent_per_square_foot_per_year', 
      headerName: 'Rent PSF/Year', 
      flex: flexByField.rent_per_square_foot_per_year,
      minWidth: 140, 
      editable: false, 
      type: 'number',
      // renderCell: (params) => (
      //   <span>${params.value?.toFixed(2)}</span>
      // ),
      renderCell: (params) => (
        <NumberDecimalInputCell 
          params={params} 
          handleCellChange={handleCellChange} 
          field="rent_per_square_foot_per_year" 
          prefix="$"
        />
      )
    },
    ...(showIndustrialColumns ? [{
      field: 'rent_type',
      headerName: 'Rent Type',
      flex: 0.9,
      minWidth: 120,
      editable: false,
      renderCell: (params: any) => (
        <Select
          size="small"
          fullWidth
          value={params.value ?? 'Gross'}
          onChange={(e) => handleCellChange(params.id as string, 'rent_type', e.target.value)}
          displayEmpty
          variant="standard"
          disableUnderline
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          sx={{
            background: 'transparent',
            fontFamily: typography.fontFamily,
            fontSize: 14.5,
            fontWeight: 600,
            '& .MuiSelect-select': { textAlign: 'left', py: 0.5 },
          }}
        >
          <MenuItem value="Gross">Gross</MenuItem>
          <MenuItem value="NNN">NNN</MenuItem>
        </Select>
      )
    }] as GridColDef[] : []),
    
    // { 
    //   field: 'monthly_rent', 
    //   headerName: 'Monthly Rent', 
    //   width: 150, 
    //   editable: false, 
    //   type: 'number',
    //   cellClassName: 'greyed-out-cell',
    //   renderCell: (params) => {
    //     const row = params.row;
    //     const monthlyRent = (row.rent_per_square_foot_per_year * row.square_feet) / 12;
    //     const formattedMonthlyRent = monthlyRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    //     return (
    //       <span style={{ color: '#888' }}>${formattedMonthlyRent}</span>
    //     );
    //   },
    // },
    { 
      field: 'annual_rent', 
      headerName: 'Annual Rent', 
      flex: flexByField.annual_rent,
      minWidth: 120, 
      editable: false, 
      type: 'number',
      cellClassName: 'greyed-out-cell',
      renderCell: (params) => {
        const row = params.row;
        const annualRent = row.rent_per_square_foot_per_year * row.square_feet;
        const formattedAnnualRent = annualRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (
          <span style={{ color: colors.grey[600] }}>${formattedAnnualRent}</span>
        );
      },
    },
    // moved to RecoveryIncomeTable
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
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </span>
      ),
    },
  ];

  const processRowUpdate = (newRow: RetailIncome) => {

    setRetailIncome((prev) =>
      prev.map((row) => (row.id === newRow.id ? newRow : row))
    );
    return newRow;
  };

  const addRow = () => {
    const newRow: RetailIncome = {
      id: String(Date.now()),
      suite: '',
      tenant_name: '',
      square_feet: 0,
      rent_start_month: 0,
      annual_bumps: 1,
      rent_per_square_foot_per_year: 0,
      lease_start_month: 0,
      lease_end_month: 60,
      rent_type: 'Gross',
      recovery_start_month: 0,
    };
    setRetailIncome((prev) => [...prev, newRow]);
  };

  const deleteRow = (id: GridRowId) => {
    try {
      if (typeof window !== 'undefined' && (document as any)?.activeElement) {
        (document as any).activeElement?.blur?.();
      }
    } catch {}
    requestAnimationFrame(() => {
    setRetailIncome((prev) => prev.filter((row) => row.id !== id));
    });
  };

  const CustomFooter = () => {
    // Calculate total monthly and annual rent from rows
    const computedRows = retailIncome.map(row => {
      const monthlyRent = (row.rent_per_square_foot_per_year * row.square_feet) / 12;
      const annualRent = row.rent_per_square_foot_per_year * row.square_feet;
      return { ...row, monthly_rent: monthlyRent, annual_rent: annualRent };
    });
    
    const totalMonthlyRent = computedRows.reduce((sum, row) => sum + (row.monthly_rent || 0), 0);
    const totalAnnualRent = computedRows.reduce((sum, row) => sum + (row.annual_rent || 0), 0);
    const totalSquareFeet = computedRows.reduce((sum, row) => sum + (row.square_feet || 0), 0);
    const grossSqFtField = modelDetails?.user_model_field_values?.find((field: any) => field.field_key == "Gross Square Feet");
    const grossSqFtValue = grossSqFtField ? Number(grossSqFtField.value) : null;
    const combinedSqFt = (((unitsTotalSqFt ?? unitSqFtTotal) || 0) as number) + (totalSquareFeet || 0);
    const exceedsGross = grossSqFtValue !== null && combinedSqFt > grossSqFtValue;

    return (
      <Box
        sx={{
          p: 2,
          backgroundColor: colors.white,
          borderTop: `1px solid ${colors.grey[300]}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          fontSize: 14.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="contained" size="small" onClick={addRow} sx={{ minWidth: 200 }}>
            Add Retail Unit
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-end', width: '100%', alignItems: 'center', color: colors.grey[700] }}>
          <Box sx={{ textAlign: 'right' }}>
            <Box component="span" sx={{ fontWeight: 600 }}>Total Retail SF:</Box>{' '}
            <Box component="span" sx={exceedsGross ? { color: colors.error, fontWeight: 700 } : {}}>
              {totalSquareFeet.toLocaleString()}
            </Box>
          </Box>
          {grossSqFtValue !== null && (
            <>
              {!showIndustrialColumns && (
                <Box sx={{ textAlign: 'right', color: exceedsGross ? colors.error : colors.grey[700], fontWeight: exceedsGross ? 700 : 500 }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>Combined SF:</Box> {combinedSqFt.toLocaleString()}
                </Box>
              )}
              <Box sx={{ textAlign: 'right', color: exceedsGross ? colors.error : colors.grey[700], fontWeight: exceedsGross ? 700 : 500 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>Gross SF:</Box> {grossSqFtValue.toLocaleString()}
              </Box>
            </>
          )}
          <Box sx={{ textAlign: 'right' }}>
            <Box component="span" sx={{ fontWeight: 600 }}>Total Monthly Rent:</Box>{' '}
            ${totalMonthlyRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Box component="span" sx={{ fontWeight: 600 }}>Total Annual Rent:</Box> ${totalAnnualRent.toLocaleString()}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* <Typography variant="h6" style={{ fontWeight: 'bold' }}>Retail Income</Typography> */}

      </div>
        <DataGrid
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          disableColumnSorting
          rows={retailIncome}
          columns={columns}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
          slots={{
            footer: CustomFooter,
          }}
          rowHeight={52}
          getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'u-row-odd' : 'u-row-even'}
          sx={{
            minWidth: '1000px',
            background: colors.white,
            border: `1px solid ${colors.grey[300]}`,
            borderRadius: 2,
            fontFamily: typography.fontFamily,
            fontSize: 14.5,
            '& .MuiDataGrid-main': { background: colors.white },
            '& .MuiDataGrid-columnHeaders': { background: colors.white, minHeight: 52, maxHeight: 52, borderBottom: `1px solid ${colors.grey[300]}` },
            '& .MuiDataGrid-columnHeader': { background: colors.white, minHeight: 52, maxHeight: 52 },
            '& .MuiDataGrid-columnHeaderTitleContainer': { background: colors.white },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              fontSize: 14.5,
              fontFamily: typography.fontFamily,
              textTransform: 'none',
              lineHeight: '52px',
              color: colors.grey[900],
            },
            '& .MuiDataGrid-cell': { borderBottom: `1px solid ${colors.grey[300]}`, background: colors.white, fontSize: 14.5, color: colors.grey[900] },
            '& .greyed-out-cell': { color: colors.grey[600] },
            '& .u-editable-input': { border: 'none', borderBottom: '2px solid transparent', borderRadius: 0, background: 'transparent', fontWeight: 600 },
            '& .u-editable-input input': { fontWeight: 600 },
            '& .MuiDataGrid-row': { background: colors.white },
            '& .u-row-even': { background: colors.grey[50] },
            '& .MuiDataGrid-row:hover': { backgroundColor: colors.blueTint },
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
            '& .MuiDataGrid-virtualScroller': { background: colors.white },
            '& .MuiDataGrid-footerContainer': { background: colors.white },
          }}
        />
    </div>
  );
};

export default RetailIncomeTable;
