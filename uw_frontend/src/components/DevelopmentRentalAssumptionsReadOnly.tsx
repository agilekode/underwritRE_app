import React, { useMemo } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import { colors } from '../theme';
import type { DevelopmentUnitRow } from './DevelopmentRentalAssumptions';

interface Props {
  rows: DevelopmentUnitRow[];
}

export const DevelopmentRentalAssumptionsReadOnly: React.FC<Props> = ({ rows }) => {
  const computed = useMemo(() => {
    const withDerived = (rows || []).map((r) => {
      const avgSf = Number(r.avg_sf || 0);
      const units = Number(r.units || 0);
      const avgRent = Number(r.avg_rent || 0) / 12;
      const totalSf = Math.max(0, Math.round(avgSf * units));
      const monthlyRent = Math.max(0, Math.round(avgRent * units));
      const annualRent = monthlyRent * 12;
      // Rent PSF = Avg. Rent / Avg. SF
      const rentPsf = avgSf > 0 ? avgRent / avgSf : 0;
      return { ...r, totalSf, rentPsf, monthlyRent, annualRent };
    });
    const totals = withDerived.reduce(
      (acc, r: any) => {
        acc.units += Number(r.units || 0);
        acc.totalSf += Number(r.totalSf || 0);
        acc.monthlyRent += Number(r.monthlyRent || 0);
        acc.annualRent += Number(r.annualRent || 0);
        return acc;
      },
      { units: 0, totalSf: 0, monthlyRent: 0, annualRent: 0 }
    );
    // Rent PSF total = total monthly rent / total SF
    const weightedRentPsf = totals.totalSf > 0 ? totals.monthlyRent / totals.totalSf : 0;
    const avgRent = totals.units > 0 ? Math.round(totals.annualRent / totals.units) : 0;
    return { withDerived, totals, weightedRentPsf, avgRent };
  }, [rows]);

  const columns: GridColDef[] = [
    {
      field: 'unit_type',
      headerName: 'Unit Type',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <span style={{ color: '#1f2937', fontSize: 14.5, fontFamily: 'inherit', fontWeight: 400 }}>
          {params.value || ''}
        </span>
      ),
    },
    {
      field: 'avg_sf',
      headerName: 'Avg. SF',
      type: 'number',
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => (
        <span className="u-muted">{Number(params.value ?? 0).toLocaleString()}</span>
      ),
    },
    {
      field: 'units',
      headerName: 'Units',
      type: 'number',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <span className="u-muted">{Number(params.value ?? 0).toLocaleString()}</span>
      ),
    },
    {
      field: 'total_sf',
      headerName: 'Total SF',
      type: 'number',
      flex: 0.9,
      minWidth: 120,
      valueGetter: (p: any) => ((p && p.row && (p.row as any).totalSf) ?? 0),
      renderCell: (params) => (
        <span className="u-muted">{Number((params.row as any).totalSf ?? 0).toLocaleString()}</span>
      ),
    },
    {
      field: 'rent_psf',
      headerName: 'Rent PSF',
      type: 'number',
      flex: 0.8,
      minWidth: 110,
      valueGetter: (p: any) => ((p && p.row && (p.row as any).rentPsf) ?? 0),
      renderCell: (params) => (
        <span className="u-muted">
          ${Number((params.row as any).rentPsf ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      field: 'avg_rent',
      headerName: 'Avg. Rent',
      type: 'number',
      flex: 0.9,
      minWidth: 130,
      renderCell: (params) => (
        <span className="u-muted">
          ${Number(params.value ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      field: 'monthly_rent',
      headerName: 'Monthly Rent',
      type: 'number',
      flex: 1.0,
      minWidth: 140,
      valueGetter: (p: any) => ((p && p.row && (p.row as any).monthlyRent) ?? 0),
      renderCell: (params) => (
        <span className="u-muted">
          ${Number((params.row as any).monthlyRent ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      field: 'annual_rent',
      headerName: 'Annual Rent',
      type: 'number',
      flex: 1.0,
      minWidth: 140,
      valueGetter: (p: any) => ((p && p.row && (p.row as any).annualRent) ?? 0),
      renderCell: (params) => (
        <span className="u-muted">
          ${Number((params.row as any).annualRent ?? 0).toLocaleString()}
        </span>
      ),
    },
  ];

  // Match DataGrid column flex: Unit Type, Avg. SF, Units, Total SF, Rent PSF, Avg. Rent, Monthly Rent, Annual Rent
  const footerGridTemplateColumns = '1.2fr 0.8fr 0.7fr 0.9fr 0.8fr 0.9fr 1fr 1fr';

  const cellPadding = '0 12px';
  const Footer = () => {
    return (
      <div
        style={{
          padding: '8px 0',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0',
          display: 'grid',
          gridTemplateColumns: footerGridTemplateColumns,
          alignItems: 'center',
          fontSize: 14.5,
          minWidth: 0,
        }}
      >
        <div style={{ fontWeight: 600, padding: cellPadding }}>Total</div>
        <div style={{ padding: cellPadding }} />
        <div style={{ textAlign: 'right', padding: cellPadding }}>{computed.totals.units.toLocaleString()}</div>
        <div style={{ textAlign: 'right', padding: cellPadding }}>{computed.totals.totalSf.toLocaleString()}</div>
        <div style={{ textAlign: 'right', padding: cellPadding }}>${computed.weightedRentPsf.toFixed(2)}</div>
        <div style={{ textAlign: 'right', padding: cellPadding }}>${computed.avgRent.toLocaleString()}</div>
        <div style={{ textAlign: 'right', padding: cellPadding }}>${computed.totals.monthlyRent.toLocaleString()}</div>
        <div style={{ textAlign: 'right', padding: cellPadding }}>${computed.totals.annualRent.toLocaleString()}</div>
      </div>
    );
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <DataGrid
        rows={computed.withDerived}
        columns={columns.map((c) => ({ ...c, sortable: false }))}
        autoHeight
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableColumnSorting
        disableRowSelectionOnClick
        hideFooterSelectedRowCount
        slots={{ footer: Footer as any }}
        density="compact"
        columnHeaderHeight={52}
        rowHeight={52}
        sx={{
          border: `2px solid ${colors.navy}`,
          borderRadius: 1,
          background: '#fff',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: `${colors.navy} !important`,
            backgroundImage: 'none !important',
            color: '#fff',
            padding: 0,
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: `${colors.navy} !important`,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            color: '#fff',
            fontWeight: 600,
            fontSize: 14.5,
          },
          '& .MuiDataGrid-columnSeparator': { color: 'rgba(255,255,255,0.35)' },
          '& .MuiSvgIcon-root': { color: '#fff' },
          '& .MuiDataGrid-withBorderColor': { borderColor: colors.navy },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid rgba(15,23,42,0.08)',
            background: '#fff',
            fontSize: 14.5,
            color: '#1f2937',
          },
          '& .u-muted': { color: '#1f2937', fontWeight: 400 },
        }}
      />
    </Box>
  );
};

export default DevelopmentRentalAssumptionsReadOnly;

