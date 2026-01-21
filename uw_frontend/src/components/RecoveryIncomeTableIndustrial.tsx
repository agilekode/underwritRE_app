import React from 'react';
import { DataGrid, GridColDef, GridRowId } from '@mui/x-data-grid';
import { NumberInputCell } from './NumberInputCell';

type RecoveryRow = {
  id: string;
  suite: string;
  tenant_name: string;
  recovery_start_month: number;
  square_feet: number;
  rent_type?: string;
};

export default function RecoveryIncomeTableIndustrial({ retailIncome, setRetailIncome, expenses }: { retailIncome: RecoveryRow[]; setRetailIncome: React.Dispatch<React.SetStateAction<any[]>>; expenses?: any[] }) {
  const rows = (retailIncome || []).map((r: any) => ({ id: r.id, suite: r.suite, tenant_name: r.tenant_name, recovery_start_month: r.recovery_start_month, square_feet: Number(r.square_feet || 0), rent_type: r.rent_type || 'Gross' }));
  const totalSquareFeet = (retailIncome || []).reduce((sum: number, r: any) => sum + Number(r.square_feet || 0), 0);
  const baseRentAnnual = (retailIncome || []).reduce((sum: number, r: any) => {
    const psf = Number(r?.rent_per_square_foot_per_year || 0);
    const sf = Number(r?.square_feet || 0);
    return sum + psf * sf;
  }, 0);
  const retailExpenses = (expenses || []).filter((e: any) => (e?.type || '').toLowerCase() === 'retail');
  const computeAnnual = (e: any) => {
    const factor = String(e?.factor || '').toLowerCase();
    const cost = Number(e?.cost_per || 0);
    if (factor === 'annual') return cost;
    if (factor === 'per sf / yr.' || factor === 'per sf') return cost * Number(totalSquareFeet || 0);
    if (factor === 'percent of base rent') return (cost / 100) * Number(baseRentAnnual || 0);
    return cost;
  };
  const totalAnnualGrossIncluded = retailExpenses
    .filter((e: any) => ['both', 'gross'].includes(String(e?.rent_type_included || '').toLowerCase()))
    .reduce((sum: number, e: any) => sum + computeAnnual(e), 0);
  const totalAnnualNNNIncluded = retailExpenses
    .filter((e: any) => ['both', 'nnn'].includes(String(e?.rent_type_included || '').toLowerCase()))
    .reduce((sum: number, e: any) => sum + computeAnnual(e), 0);
  const perSfGross = totalSquareFeet ? totalAnnualGrossIncluded / totalSquareFeet : 0;
  const perSfNNN = totalSquareFeet ? totalAnnualNNNIncluded / totalSquareFeet : 0;

  const handleCellChange = (id: GridRowId, field: string, value: any) => {
    setRetailIncome((prev) =>
      prev.map((row: any) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'suite',
      headerName: 'Suite',
      flex: 0.8,
      minWidth: 140,
      sortable: false,
      cellClassName: 'greyed-out-cell',
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: 'tenant_name',
      headerName: 'Tenant Name',
      flex: 1.2,
      minWidth: 220,
      sortable: false,
      cellClassName: 'greyed-out-cell',
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: 'rent_type',
      headerName: 'Rent Type',
      flex: 0.8,
      minWidth: 110,
      sortable: false,
      cellClassName: 'greyed-out-cell',
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: 'recovery_start_month',
      headerName: 'Recovery Start Month',
      flex: 1,
      minWidth: 170,
      sortable: false,
      type: 'number',
      renderCell: (params) => (
        <NumberInputCell
          params={params}
          handleCellChange={handleCellChange}
          field="recovery_start_month"
        />
      )
    },
    {
      field: 'pro_rata_share',
      headerName: 'Pro Rata Share',
      flex: 1,
      minWidth: 160,
      sortable: false,
      cellClassName: 'greyed-out-cell',
      renderCell: (params) => {
        const sf = Number(params?.row?.square_feet ?? 0);
        const share = totalSquareFeet ? sf / totalSquareFeet : 0;
        const formatted = share.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return <span>{formatted}</span>;
      }
    },
    {
      field: 'rec_per_sf_year',
      headerName: 'Rec. / SF / Yr.',
      flex: 1,
      minWidth: 150,
      sortable: false,
      cellClassName: 'greyed-out-cell',
      renderCell: (params) => {
        const tenantType = String(params?.row?.rent_type || 'Gross').toLowerCase();
        const perSf = tenantType === 'nnn' ? perSfNNN : perSfGross;
        const formatted = `$${Number(perSf).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return <span>{formatted}</span>;
      }
    },
    {
      field: 'annual_recovery',
      headerName: 'Annual Recovery',
      flex: 1,
      minWidth: 170,
      sortable: false,
      cellClassName: 'greyed-out-cell',
      renderCell: (params) => {
        const sf = Number(params?.row?.square_feet ?? 0);
        const share = totalSquareFeet ? sf / totalSquareFeet : 0;
        const tenantType = String(params?.row?.rent_type || 'Gross').toLowerCase();
        const allowedTotal = tenantType === 'nnn' ? totalAnnualNNNIncluded : totalAnnualGrossIncluded;
        const annual = share * Number(allowedTotal || 0);

        const formatted = `$${Number(annual).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        return <span>{formatted}</span>;
      }
    },
  ];

  const getRowClassName = (params: any) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'u-row-odd' : 'u-row-even';

  const Footer = () => {
    // Average Rec. / SF / Yr. and Total Annual Recovery
    const totals = rows.reduce(
      (acc: any, r: any) => {
        const sf = Number(r.square_feet || 0);
        const share = totalSquareFeet ? sf / totalSquareFeet : 0;
        const tenantType = String(r?.rent_type || 'Gross').toLowerCase();
        const allowedTotal = tenantType === 'nnn' ? totalAnnualNNNIncluded : totalAnnualGrossIncluded;
        const annual = share * Number(allowedTotal || 0);
        acc.totalAnnual += annual;
        acc.totalSF += sf;
        return acc;
      },
      { totalAnnual: 0, totalSF: 0 }
    );
    const avgPerSf = totals.totalSF ? totals.totalAnnual / totals.totalSF : 0;
    return (
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'transparent',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 24
      }}>
        <div style={{ fontWeight: 700, textAlign: 'right' }}>Average Rec. / SF / Yr.: ${Math.round(avgPerSf).toLocaleString()}</div>
        <div style={{ fontWeight: 700, textAlign: 'right' }}>Total Annual Recovery: ${Math.round(totals.totalAnnual).toLocaleString()}</div>
      </div>
    );
  };

  return (
    <DataGrid
      disableColumnMenu
      disableColumnFilter
      disableColumnSelector
      disableColumnSorting
      rows={rows}
      columns={columns}
      disableRowSelectionOnClick
      sortingOrder={[]}
      rowHeight={52}
      getRowClassName={getRowClassName}
      hideFooterSelectedRowCount
      slots={{ footer: Footer }}
      sx={{
        minWidth: '900px',
        background: '#f9fbfe',
        '& .MuiDataGrid-main': { background: '#f9fbfe' },
        '& .MuiDataGrid-columnHeaders': { background: '#f9fbfe', minHeight: 52, maxHeight: 52 },
        '& .MuiDataGrid-columnHeader': { background: '#f9fbfe', minHeight: 52, maxHeight: 52 },
        '& .MuiDataGrid-columnHeaderTitleContainer': { background: '#f9fbfe' },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 700,
          fontSize: 15,
          fontFamily: 'inherit',
          textTransform: 'none',
          lineHeight: '52px'
        },
        '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#f9fbfe' },
        '& .greyed-out-cell': { color: '#888' },
        '& .u-editable-input': { border: 'none', borderBottom: '2px solid transparent', borderRadius: 0, background: 'transparent' },
        '& .MuiDataGrid-row:hover .u-editable-input, & .u-editable-input:focus': { borderBottom: '2px solid #1976d2 !important' },
        '& .MuiDataGrid-row': { background: '#f9fbfe' },
        '& .u-row-even': { background: '#fafafa' },
        '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' },
        '& .MuiDataGrid-virtualScroller': { background: '#f9fbfe' },
        '& .MuiDataGrid-footerContainer': { background: '#f9fbfe' }
      }}
    />
  );
}


