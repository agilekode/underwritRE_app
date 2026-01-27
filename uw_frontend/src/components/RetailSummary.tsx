import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Button, Tooltip, Box, Typography } from '@mui/material';

interface RetailIncomeRow {
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

const RetailSummary: React.FC<{
  retailIncome: RetailIncomeRow[];
  modelDetails: any;
  unitsTotalSqFt?: number;
  showIndustrialColumns?: boolean;
  expenses?: any[];
}> = ({ retailIncome, modelDetails, unitsTotalSqFt, showIndustrialColumns = false, expenses = [] }) => {
  const unitSqFtTotal = 0;

  // Columns - read-only formatting (no inputs, no edits)
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

  const columns: GridColDef[] = [
    {
      field: 'suite',
      headerName: 'Suite',
      flex: flexByField.suite,
      minWidth: 70,
      sortable: false,
      renderCell: (params) => <span>{params.value ?? ''}</span>,
    },
    {
      field: 'tenant_name',
      headerName: 'Tenant Name',
      flex: flexByField.tenant_name,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => <span>{params.value ?? ''}</span>,
    },
    {
      field: 'lease_start_month',
      headerName: 'Lease Start',
      flex: flexByField.lease_start_month,
      minWidth: 100,
      sortable: false,
      type: 'number',
      renderCell: (params) => <span>Month {params.value ?? ''}</span>,
    },
    ...(showIndustrialColumns
      ? ([
          {
            field: 'lease_end_month',
            headerName: 'Lease End',
            flex: 0.9,
            minWidth: 100,
            sortable: false,
            type: 'number',
            renderCell: (params) => <span>Month {params.value ?? ''}</span>,
          },
        ] as GridColDef[])
      : []),
    {
      field: 'square_feet',
      headerName: 'Square Ft',
      flex: flexByField.square_feet,
      minWidth: 100,
      sortable: false,
      type: 'number',
      renderCell: (params) => <span>{Number(params.value || 0).toLocaleString()} sf</span>,
    },
    {
      field: 'rent_start_month',
      headerName: 'Rent Start Month',
      flex: flexByField.rent_start_month,
      minWidth: 140,
      sortable: false,
      type: 'number',
      renderCell: (params) => <span>Month {params.value ?? ''}</span>,
    },
    {
      field: 'annual_bumps',
      headerName: 'Annual Bumps (%)',
      flex: flexByField.annual_bumps,
      minWidth: 130,
      sortable: false,
      type: 'number',
      renderCell: (params) => (
        <span>{params.value !== undefined && params.value !== null ? `${params.value}%` : ''}</span>
      ),
    },
    {
      field: 'rent_per_square_foot_per_year',
      headerName: 'Rent PSF/Year',
      flex: flexByField.rent_per_square_foot_per_year,
      minWidth: 140,
      sortable: false,
      type: 'number',
      renderCell: (params) => (
        <span>{params.value !== undefined && params.value !== null ? `$${params.value}` : ''}</span>
      ),
    },
    ...(showIndustrialColumns
      ? ([
          {
            field: 'rent_type',
            headerName: 'Rent Type',
            flex: 0.9,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => <span>{params.value ?? 'Gross'}</span>,
          },
        ] as GridColDef[])
      : []),
    {
      field: 'annual_rent',
      headerName: 'Annual Rent',
      flex: flexByField.annual_rent,
      minWidth: 120,
      sortable: false,
      type: 'number',
      renderCell: (params) => {
        const row = params.row as RetailIncomeRow;
        const annualRent = Number(row.rent_per_square_foot_per_year || 0) * Number(row.square_feet || 0);
        return <span style={{ color: '#888' }}>${annualRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      },
    },
  ];

  const CustomFooter = () => {
    const computedRows = retailIncome.map((row) => {
      const monthlyRent = (Number(row.rent_per_square_foot_per_year || 0) * Number(row.square_feet || 0)) / 12;
      const annualRent = Number(row.rent_per_square_foot_per_year || 0) * Number(row.square_feet || 0);
      return { ...row, monthly_rent: monthlyRent, annual_rent: annualRent };
    });
    const totalMonthlyRent = computedRows.reduce((sum, row: any) => sum + (row.monthly_rent || 0), 0);
    const totalAnnualRent = computedRows.reduce((sum, row: any) => sum + (row.annual_rent || 0), 0);
    const totalSquareFeet = computedRows.reduce((sum, row: any) => sum + (row.square_feet || 0), 0);
    const grossSqFtField = modelDetails?.user_model_field_values?.find(
      (field: any) => field.field_key == 'Gross Square Feet'
    );
    const grossSqFtValue = grossSqFtField ? Number(grossSqFtField.value) : null;
    const combinedSqFt = (((unitsTotalSqFt ?? unitSqFtTotal) || 0) as number) + (totalSquareFeet || 0);
    const exceedsGross = grossSqFtValue !== null && combinedSqFt > grossSqFtValue;

    return (
      <div
        style={{
          padding: '16px 16px',
          backgroundColor: 'transparent',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >

        <div
          style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}
        >
          <div style={{ textAlign: 'right' }}>
            <strong>Total {space_type} SF:</strong> {totalSquareFeet.toLocaleString()}
          </div>
          {grossSqFtValue !== null && (
            <>
              {!showIndustrialColumns && (
                <div
                  style={{ textAlign: 'right', color: exceedsGross ? '#d32f2f' : '#555', fontWeight: exceedsGross ? 700 : 500 }}
                >
                  <strong>Combined SF:</strong> {combinedSqFt.toLocaleString()}
                </div>
              )}
              <div
                style={{ textAlign: 'right', color: exceedsGross ? '#d32f2f' : '#555', fontWeight: exceedsGross ? 700 : 500 }}
              >
                <strong>Gross SF:</strong> {grossSqFtValue.toLocaleString()}
              </div>
            </>
          )}
          <div style={{ textAlign: 'right' }}>
            <strong>Total Monthly Rent:</strong>{' '}
            ${totalMonthlyRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Total Annual Rent:</strong> ${totalAnnualRent.toLocaleString()}
          </div>
        </div>
      </div>
    );
  };


  const space_type =
    (modelDetails?.user_model_field_values || []).find((f: any) => {
      const k = String(f.field_key || '');
      return k === 'space_type' || k.trim() === 'space_type';
    })?.value ?? 'Retail';


  return (
    <div>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Base {space_type} Income</Typography>
      <DataGrid
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableColumnSorting
        rows={retailIncome}
        columns={columns}
        disableRowSelectionOnClick
        slots={{
          footer: CustomFooter,
        }}
        rowHeight={52}
        getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? 'u-row-odd' : 'u-row-even')}
        sx={{
          minWidth: '1000px',
          background: '#f9fbfe',
          '& .MuiDataGrid-main': { background: '#f9fbfe' },
          '& .MuiDataGrid-columnHeaders': { background: '#f9fbfe', minHeight: 52, maxHeight: 52 },
          '& .MuiDataGrid-columnHeader': { background: '#f9fbfe', minHeight: 52, maxHeight: 52 },
          '& .MuiDataGrid-columnHeaderTitleContainer': { background: '#f9fbfe' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'inherit',
            textTransform: 'none',
            lineHeight: '52px',
          },
          '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#f9fbfe' },
          '& .greyed-out-cell': { color: '#888' },
          '& .u-editable-input': { border: 'none', borderBottom: '2px solid transparent', borderRadius: 0, background: 'transparent' },
          '& .MuiDataGrid-row:hover .u-editable-input, & .u-editable-input:focus': { borderBottom: '2px solid #1976d2 !important' },
          '& .MuiDataGrid-row': { background: '#f9fbfe' },
          '& .u-row-even': { background: '#fafafa' },
          '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' },
          '& .u-row-action': {
            opacity: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
            transition: 'opacity 120ms ease',
          },
          '& .MuiDataGrid-row:hover .u-row-action, & .MuiDataGrid-cell:focus-within .u-row-action': {
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto',
          },
          '& .MuiDataGrid-virtualScroller': { background: '#f9fbfe' },
          '& .MuiDataGrid-footerContainer': { background: '#f9fbfe' },
        }}
      />
      {/* Read-only Recovery Income */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Recovery Income</Typography>
        {(() => {
          const totalSF = retailIncome.reduce((s, r) => s + Number(r.square_feet || 0), 0);
          const baseAnnual = retailIncome.reduce(
            (s, r) => s + Number(r.square_feet || 0) * Number(r.rent_per_square_foot_per_year || 0),
            0
          );
          const retailExpenses = (Array.isArray(expenses) ? expenses : []).filter((e: any) => (e?.type || '').toLowerCase() === 'retail');
          const computeAnnual = (e: any): number => {
            const factor = String(e?.factor || '').toLowerCase();
            const cost = Number(e?.cost_per || 0);
            if (factor === 'annual') return cost;
            if (factor === 'per sf / yr.' || factor === 'per sf') return cost * Number(totalSF || 0);
            if (factor === 'percent of base rent') {
              const pct = cost > 1 ? cost / 100 : cost;
              return pct * Number(baseAnnual || 0);
            }
            return cost;
          };
          const annualBoth = retailExpenses
            .filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'both')
            .reduce((s: number, e: any) => s + computeAnnual(e), 0);
          const annualGross = retailExpenses
            .filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'gross')
            .reduce((s: number, e: any) => s + computeAnnual(e), 0);
          const annualNNN = retailExpenses
            .filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'nnn')
            .reduce((s: number, e: any) => s + computeAnnual(e), 0);
          const perSfGross = totalSF ? (annualBoth + annualGross) / totalSF : 0;
          const perSfNNN = totalSF ? (annualBoth + annualNNN) / totalSF : 0;

          const rows = retailIncome.map((r) => {
            const sf = Number(r.square_feet || 0);
            const share = totalSF ? sf / totalSF : 0;
            const tenantType = String(r?.rent_type || 'Gross').toLowerCase();
            const allowedTotal = tenantType === 'nnn' ? (annualBoth + annualNNN) : (annualBoth + annualGross);
            const recPerSf = tenantType === 'nnn' ? perSfNNN : perSfGross;
            const annual = share * allowedTotal;
            return {
              suite: r.suite,
              tenant: r.tenant_name,
              rent_type: r.rent_type || 'Gross',
              pro_rata: share,
              rec_per_sf: recPerSf,
              annual_recovery: annual,
            };
          });

          const totalAnnual = rows.reduce((s, x) => s + x.annual_recovery, 0);

          return (
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.9fr 1fr 1fr', p: 1, bgcolor: '#f5f5f5', fontWeight: 700 }}>
                <div>Suite</div>
                <div>Tenant</div>
                <div>Rent Type</div>
                <div>Pro Rata</div>
                <div>Rec. / SF / Yr.</div>
                <div>Annual Recovery</div>
              </Box>
              {rows.map((r, i) => (
                <Box key={`rec-${i}`} sx={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.9fr 1fr 1fr', p: 1, borderTop: '1px solid #eee' }}>
                  <div>{r.suite}</div>
                  <div>{r.tenant}</div>
                  <div>{r.rent_type}</div>
                  <div>{(r.pro_rata * 100).toFixed(2)}%</div>
                  <div>${r.rec_per_sf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div>${r.annual_recovery.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                </Box>
              ))}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.9fr 1fr 1fr', p: 1, borderTop: '1px solid #ddd', bgcolor: '#fafafa', fontWeight: 700 }}>
                <div>Total</div>
                <div />
                <div />
                <div />
                <div />
                <div>${totalAnnual.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </Box>
            </Box>
          );
        })()}
      </Box>

      {/* Read-only Gross Potential {space_type} Income */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Gross Potential {space_type} Income</Typography>
        {(() => {
          // Match vacancy key and rounding behavior with GrossPotentialRetailIncomeTableIndustrial
          const vf = (modelDetails?.user_model_field_values || []).find((f: any) => {
            const k = String(f.field_key || '');
            return k === 'Vacancy ' || k.trim() === 'Vacancy';
          });
          const vacancyPct = Number(vf?.value || 5);
          const vacancyRate = vacancyPct / 100;
          const totalSF = retailIncome.reduce((s, r) => s + Number(r.square_feet || 0), 0);
          const baseAnnual = retailIncome.reduce((s, r) => s + Number(r.square_feet || 0) * Number(r.rent_per_square_foot_per_year || 0), 0);

          const retailExpenses = (Array.isArray(expenses) ? expenses : []).filter((e: any) => (e?.type || '').toLowerCase() === 'retail');
          const computeAnnual = (e: any): number => {
            const factor = String(e?.factor || '').toLowerCase();
            const cost = Number(e?.cost_per || 0);
            if (factor === 'annual') return cost;
            if (factor === 'per sf / yr.' || factor === 'per sf') return cost * Number(totalSF || 0);
            if (factor === 'percent of base rent') {
              const pct = cost > 1 ? cost / 100 : cost;
              return pct * Number(baseAnnual || 0);
            }
            return cost;
          };
          const annualBoth = retailExpenses.filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'both').reduce((s: number, e: any) => s + computeAnnual(e), 0);
          const annualGross = retailExpenses.filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'gross').reduce((s: number, e: any) => s + computeAnnual(e), 0);
          const annualNNN = retailExpenses.filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'nnn').reduce((s: number, e: any) => s + computeAnnual(e), 0);
          const grossSF = retailIncome.filter((r) => String(r?.rent_type || 'Gross').toLowerCase() === 'gross').reduce((s, r) => s + Number(r.square_feet || 0), 0);
          const nnnSF = retailIncome.filter((r) => String(r?.rent_type || 'Gross').toLowerCase() === 'nnn').reduce((s, r) => s + Number(r.square_feet || 0), 0);
          const shareGross = totalSF ? grossSF / totalSF : 0;
          const shareNNN = totalSF ? nnnSF / totalSF : 0;
          const totalAnnualRecoveryIncome = annualBoth + shareGross * annualGross + shareNNN * annualNNN;

          const beforeAnnual = baseAnnual + totalAnnualRecoveryIncome;
          const beforePerSf = totalSF ? beforeAnnual / totalSF : 0;
          const vacPerSf = beforePerSf * vacancyRate;
          const vacAnnual = beforeAnnual * vacancyRate;
          const vacAnnualPerSf = totalSF ? vacAnnual / totalSF : 0;
          const afterPerSf = beforePerSf - vacPerSf;
          const afterAnnual = beforeAnnual - vacAnnual;

          const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          const money0 = (n: number) => `$${Math.round(n).toLocaleString()}`;

          return (
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 160px 180px', p: 1, bgcolor: '#f5f5f5', fontWeight: 700 }}>
                <div />
                <div style={{ textAlign: 'right' }}>Rent / SF / Yr.</div>
                <div style={{ textAlign: 'right' }}>Annual</div>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 160px 180px', p: 1, borderTop: '1px solid #eee' }}>
                <div style={{ fontWeight: 700 }}>Gross Potential {space_type} Income</div>
                <div style={{ textAlign: 'right' }}>{money0(beforePerSf)}</div>
                <div style={{ textAlign: 'right' }}>{money0(beforeAnnual)}</div>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 160px 180px', p: 1, borderTop: '1px solid #eee' }}>
                <div>Less: Vacancy and Bad Debt</div>
                <div style={{ textAlign: 'right' }}>{money(vacAnnualPerSf)}</div>
                <div style={{ textAlign: 'right' }}>{money0(vacAnnual)}</div>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 160px 180px', p: 1, borderTop: '1px solid #eee', bgcolor: '#fafafa' }}>
                <div style={{ fontWeight: 700 }}>Gross Potential {space_type} Income</div>
                <div style={{ textAlign: 'right' }}>{money0(afterPerSf)}</div>
                <div style={{ textAlign: 'right' }}>{money0(afterAnnual)}</div>
              </Box>
            </Box>
          );
        })()}
      </Box>

      {/* Read-only Recoverable Retail Operating Expenses */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Recoverable {space_type} Operating Expenses</Typography>
        {(() => {
          const list: any[] = (Array.isArray(expenses) ? expenses : []).filter(
            (e: any) => (e?.type || '').toLowerCase() === 'retail'
          );
          if (!list.length) {
            return <Typography variant="body2" color="text.secondary">No {space_type.toLowerCase()} expenses.</Typography>;
          }
          const totalSF = retailIncome.reduce((s, r) => s + Number(r.square_feet || 0), 0);
          const baseAnnual = retailIncome.reduce(
            (s, r) => s + Number(r.square_feet || 0) * Number(r.rent_per_square_foot_per_year || 0),
            0
          );

          const rows = list.map((row: any, idx: number) => ({
            id: String(row.id ?? idx),
            name: row.name || '',
            factor: String(row.factor || 'Annual'),
            cost_per: Number(row.cost_per || 0),
            rent_type_included: row.rent_type_included ?? 'Both',
            // Precompute statistic and annual to avoid valueGetter runtime issues
            statistic: (() => {
              const f = String(row.factor || 'Annual').toLowerCase();
              if (f === 'per sf / yr.' || f === 'per sf' || f === 'per ca square foot' || f === 'per total square feet') {
                return `${Number(totalSF).toLocaleString()} sf`;
              }
              if (f === 'percent of base rent') {
                return `$${Number(baseAnnual).toLocaleString()}`;
              }
              return '—';
            })(),
            annual: (() => {
              const f = String(row.factor || 'Annual').toLowerCase();
              const cost = Number(row.cost_per || 0);
              if (f === 'annual') return cost;
              if (f === 'per sf / yr.' || f === 'per sf' || f === 'per ca square foot' || f === 'per total square feet') {
                return cost * Number(totalSF || 0);
              }
              if (f === 'percent of base rent') {
                return (cost / 100) * Number(baseAnnual || 0);
              }
              return cost;
            })(),
          }));

          const columns: GridColDef[] = [
            { field: 'name', headerName: 'Name', flex: 1.4, minWidth: 160, sortable: false, renderCell: (p) => <span>{p.value}</span> },
            {
              field: 'factor',
              headerName: 'Factor',
              flex: 1.1,
              minWidth: 160,
              sortable: false,
              renderCell: (p) => <span>{p.value}</span>,
            },
            {
              field: 'cost_per',
              headerName: 'Expense',
              flex: 1,
              minWidth: 130,
              sortable: false,
              renderCell: (p) => {
                const factor = String(p.row.factor || 'Annual').toLowerCase();
                const val = Number(p.value || 0);
                if (factor === 'percent of base rent') return <span>{val}%</span>;
                return <span>${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
              },
            },
            {
              field: 'statistic',
              headerName: 'Statistic',
              flex: 1,
              minWidth: 150,
              sortable: false,
              renderCell: (p) => <span>{p.value}</span>,
            },
            {
              field: 'rent_type_included',
              headerName: 'Rent Type Included',
              flex: 1,
              minWidth: 140,
              sortable: false,
              renderCell: (p) => <span>{p.value ?? 'Both'}</span>,
            },
            {
              field: 'annual',
              headerName: 'Annual',
              flex: 1,
              minWidth: 110,
              sortable: false,
              renderCell: (p) => <span style={{ color: '#555' }}>${Number(p.value || 0).toLocaleString()}</span>,
            },
          ];

          const totalAnnual = rows.reduce((sum, r) => sum + Number(r.annual || 0), 0);

          return (
            <DataGrid
              disableColumnMenu
              disableColumnFilter
              disableColumnSelector
              disableColumnSorting
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              getRowId={(r) => r.id}
              slots={{
                footer: () => (
                  <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                      <strong>Total {space_type} Expenses:</strong> ${Number(totalAnnual).toLocaleString()}
                    </div>
                  </div>
                ),
              }}
              rowHeight={52}
              hideFooterSelectedRowCount
              sx={{
                background: '#f9fbfe',
                minWidth: '900px',
                '& .MuiDataGrid-main': { background: '#f9fbfe' },
                '& .MuiDataGrid-columnHeaders': { background: '#f9fbfe', minHeight: 52, maxHeight: 52 },
                '& .MuiDataGrid-columnHeader': { background: '#f9fbfe', minHeight: 52, maxHeight: 52 },
                '& .MuiDataGrid-columnHeaderTitleContainer': { background: '#f9fbfe' },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: 'inherit',
                  textTransform: 'none',
                  lineHeight: '52px',
                },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#f9fbfe' },
              }}
            />
          );
        })()}
      </Box>

      {/* Read-only Leasing Cost Reserves */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Leasing Cost Reserves</Typography>
        {(() => {
          const getFieldValue = (field_key: string, def: number) => {
            try {
              const f = (modelDetails?.user_model_field_values || []).find((x: any) => x.field_key === field_key);
              const v = f ? Number(f.value) : def;
              return Number.isFinite(v) ? v : def;
            } catch {
              return def;
            }
          };
          const totalSF = retailIncome.reduce((s, r) => s + Number(r.square_feet || 0), 0);
          const renewalProb = Number(getFieldValue('Renewal Property: Renewal Lease', 1.5) || 0); // %
          const newProb = Math.max(0, 100 - renewalProb);
          const rentNew = Number(getFieldValue('Retail Rent: New Lease', 0) || 0);
          const rentRen = Number(getFieldValue('Retail Rent: Renewal Lease', 0) || 0);
          const tiNewPSF = Number(getFieldValue("TI's: New Lease", 0) || 0);
          const tiRenPSF = Number(getFieldValue("TI's: Renewal Lease", 0) || 0);
          const commNewPct = Number(getFieldValue('Leasing Commissions: New Lease', 0) || 0) / 100;
          const commRenPct = Number(getFieldValue('Leasing Commissions: Renewal Lease', 0) || 0) / 100;
          const termNewYrs = Number(getFieldValue('Lease Term: New Lease', 1) || 1);
          const termRenYrs = Number(getFieldValue('Lease Term: Renewal Lease', 1) || 1);
          const tiNewAmt = tiNewPSF * totalSF;
          const tiRenAmt = tiRenPSF * totalSF;
          const displayTINewAmt = tiNewAmt * (newProb / 100);
          const displayTIRenAmt = tiRenAmt * (renewalProb / 100);
          const commNewAmt = totalSF * (newProb / 100) * rentNew * commNewPct * termNewYrs;
          const commRenAmt = totalSF * (renewalProb / 100) * rentRen * commRenPct * termRenYrs;
          const totalLCNew = commNewAmt + displayTINewAmt;
          const totalLCRen = commRenAmt + displayTIRenAmt;
          const amortNew = termNewYrs ? totalLCNew / termNewYrs : 0;
          const amortRen = termRenYrs ? totalLCRen / termRenYrs : 0;
          const weightedAnnual = amortNew + amortRen;
          const weightedPerSF = totalSF ? weightedAnnual / totalSF : 0;

          const money0 = (n: number) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          const money2 = (n: number) => `$${Number(n).toFixed(2)}`;

          return (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {/* Inputs (read-only display) */}
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', bgcolor: '#f5f7fa', borderBottom: '1px solid #e0e0e0', fontWeight: 700 }}>
                  <Box sx={{ p: 1 }}>Calculate the Leasing Cost Reserves</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>New Lease</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>Renewal Lease</Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Lease Renewal Probability</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{newProb.toFixed(1)}%</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{renewalProb.toFixed(1)}%</Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Average {space_type} Rent</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>${Number(rentNew).toLocaleString()} / SF</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>${Number(rentRen).toLocaleString()} / SF</Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', borderBottom: '1px solid #e00e0' }}>
                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Tenant Improvements</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>${Number(tiNewPSF).toLocaleString()} / SF</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>${Number(tiRenPSF).toLocaleString()} / SF</Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Leasing Commissions</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{(commNewPct * 100).toFixed(2)}%</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{(commRenPct * 100).toFixed(2)}%</Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr' }}>
                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Lease Term</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{Number(termNewYrs).toLocaleString()} years</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{Number(termRenYrs).toLocaleString()} years</Box>
                </Box>
              </Box>
              {/* Calculations */}
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', bgcolor: '#f5f7fa', borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ p: 1 }} />
                  <Box sx={{ p: 1, textAlign: 'right', fontWeight: 700 }}>New Lease</Box>
                  <Box sx={{ p: 1, textAlign: 'right', fontWeight: 700 }}>Renewal Lease</Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', alignItems: 'center', flexGrow: 1 }}>
                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Tenant Improvements</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{money0(displayTINewAmt)}</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{money0(displayTIRenAmt)}</Box>

                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Leasing Commissions</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{money0(commNewAmt)}</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{money0(commRenAmt)}</Box>

                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Total Leasing Costs</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{money0(totalLCNew)}</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{money0(totalLCRen)}</Box>

                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Annualized Leasing Costs</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{money0(amortNew)}</Box>
                  <Box sx={{ p: 1, textAlign: 'right' }}>{money0(amortRen)}</Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', alignItems: 'center', background: '#e9ecef', py: 1, borderTop: '1px solid #e0e0e0' }}>
                  <Box sx={{ p: 1, fontWeight: 600, color: 'text.primary' }}>Annual Leasing Cost Reserves</Box>
                  <Box sx={{ p: 1, textAlign: 'right', fontWeight: 700 }}>{`${money2(weightedPerSF)} / SF`}</Box>
                  <Box sx={{ p: 1, textAlign: 'right', fontWeight: 700 }}>{money0(weightedAnnual)}</Box>
                </Box>
              </Box>
            </Box>
          );
        })()}
      </Box>
    </div>
  );
};

export default RetailSummary;