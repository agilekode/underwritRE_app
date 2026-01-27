import React, { useEffect, useMemo } from 'react';
import { Box, Typography, InputAdornment, TextField } from '@mui/material';

type RetailIncome = { square_feet: number };

// Hoisted stable wrappers to prevent remounts that steal input focus
const Cell = React.memo(({ children, right = false, bold = false }: any) => (
  <Box sx={{ p: 1, textAlign: right ? 'right' : 'left', fontWeight: bold ? 700 : 500 }}>{children}</Box>
));

const Label = React.memo(({ children }: any) => (
  <Box sx={{ p: 1, color: 'text.primary', fontWeight: 600 }}>{children}</Box>
));

function LeasingCostReserves({
  modelDetails,
  handleFieldChange,
  retailIncome,
}: {
  modelDetails: any;
  handleFieldChange: (fieldId: string, field_key: string, value: number | string) => void;
  retailIncome: RetailIncome[];
}) {

  
  const getFieldValue = (field_key: string, def: any) => {
    const f = modelDetails?.user_model_field_values?.find((x: any) => x.field_key === field_key);
    return f ? f.value : def;
  };
  const getFieldId = (field_key: string) => {
    const f = modelDetails?.user_model_field_values?.find((x: any) => x.field_key === field_key);
    return f ? f.field_id : '';
  };

  const totalSF = useMemo(() => (retailIncome || []).reduce((s, r) => s + Number(r.square_feet || 0), 0), [retailIncome]);

  const renewalProb = Number(getFieldValue('Renewal Property: Renewal Lease', 1.5) || 0); // %
  const newProb = Math.max(0, 100 - renewalProb);

  const rentNew = Number(getFieldValue('Retail Rent: New Lease', 0) || 0); // $/SF/yr
  const rentRen = Number(getFieldValue('Retail Rent: Renewal Lease', 0) || 0);

  const tiNewPSF = Number(getFieldValue("TI's: New Lease", 0) || 0);
  const tiRenPSF = Number(getFieldValue("TI's: Renewal Lease", 0) || 0);

  const commNewPct = Number(getFieldValue('Leasing Commissions: New Lease', 0) || 0) / 100;
  const commRenPct = Number(getFieldValue('Leasing Commissions: Renewal Lease', 0) || 0) / 100;

  const termNewYrs = Number(getFieldValue('Lease Term: New Lease', 1) || 1);
  const termRenYrs = Number(getFieldValue('Lease Term: Renewal Lease', 1) || 1);

  const annualRentNew = rentNew * totalSF;
  const annualRentRen = rentRen * totalSF;

  const tiNewAmt = tiNewPSF * totalSF;
  const tiRenAmt = tiRenPSF * totalSF;

  // Display expected TI amounts weighted by lease type probabilities
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

  const money0 = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const money2 = (n: number) => `$${n.toFixed(2)}`;

  const space_type =
  (modelDetails?.user_model_field_values || []).find((f: any) => {
    const k = String(f.field_key || '');
    return k === 'space_type' || k.trim() === 'space_type';
  })?.value ?? 'Retail';


  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {/* Column 1 - Inputs */}
      <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', bgcolor: '#f5f7fa', borderBottom: '1px solid #e0e0e0' }}>
          <Cell bold>Calculate the Leasing Cost Reserves</Cell>
          <Cell right bold>New Lease</Cell>
          <Cell right bold>Renewal Lease</Cell>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
          <Label>Lease Renewal Probability</Label>
          <Cell right>
            <Typography component="span" color="text.secondary">{`${newProb.toFixed(1)}%`}</Typography>
          </Cell>
          <Cell right>
            <TextField
              value={String(getFieldValue('Renewal Property: Renewal Lease', 0) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId('Renewal Property: Renewal Lease'),
                  'Renewal Property: Renewal Lease',
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
              }}
            />
          </Cell>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
          <Label>Average {space_type} Rent</Label>
          <Cell right>
            <TextField
              value={String(getFieldValue('Retail Rent: New Lease', 0) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId('Retail Rent: New Lease'),
                  'Retail Rent: New Lease',
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: <InputAdornment position="end">/ SF</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
              }}
            />
          </Cell>
          <Cell right>
            <TextField
              value={String(getFieldValue('Retail Rent: Renewal Lease', 0) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId('Retail Rent: Renewal Lease'),
                  'Retail Rent: Renewal Lease',
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: <InputAdornment position="end">/ SF</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
              }}
            />
          </Cell>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
          <Label>Tenant Improvements</Label>
          <Cell right>
            <TextField
              value={String(getFieldValue("TI's: New Lease", 0) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId("TI's: New Lease"),
                  "TI's: New Lease",
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: <InputAdornment position="end">/ SF</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
              }}
            />
          </Cell>
          <Cell right>
            <TextField
              value={String(getFieldValue("TI's: Renewal Lease", 0) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId("TI's: Renewal Lease"),
                  "TI's: Renewal Lease",
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: <InputAdornment position="end">/ SF</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
              }}
            />
          </Cell>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
          <Label>Leasing Commissions</Label>
          <Cell right>
            <TextField
              value={String(getFieldValue('Leasing Commissions: New Lease', 0) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId('Leasing Commissions: New Lease'),
                  'Leasing Commissions: New Lease',
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
              }}
            />
          </Cell>
          <Cell right>
            <TextField
              value={String(getFieldValue('Leasing Commissions: Renewal Lease', 0) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId('Leasing Commissions: Renewal Lease'),
                  'Leasing Commissions: Renewal Lease',
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' },
              }}
            />
          </Cell>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center' }}>
          <Label>New Lease Term</Label>
          <Cell right>
            <TextField
              value={String(getFieldValue('Lease Term: New Lease', 1) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId('Lease Term: New Lease'),
                  'Lease Term: New Lease',
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                endAdornment: <InputAdornment position="end">years</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'numeric', pattern: '[0-9]*' },
              }}
            />
          </Cell>
          <Cell right>
            <TextField
              value={String(getFieldValue('Lease Term: Renewal Lease', 1) ?? '')}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                handleFieldChange(
                  getFieldId('Lease Term: Renewal Lease'),
                  'Lease Term: Renewal Lease',
                  raw === '' ? '' : raw
                );
              }}
              variant="standard"
              size="small"
              sx={{ width: { xs: '100%', sm: 160 }, '& .MuiInputBase-input': { textAlign: 'right' } }}
              InputProps={{
                disableUnderline: true,
                endAdornment: <InputAdornment position="end">years</InputAdornment>,
                inputProps: { style: { textAlign: 'right' }, inputMode: 'numeric', pattern: '[0-9]*' },
              }}
            />
          </Cell>
        </Box>
      </Box>

      {/* Column 2 - Calculations */}
      <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', bgcolor: '#f5f7fa', borderBottom: '1px solid #e0e0e0' }}>
          <Cell bold></Cell>
          <Cell right bold>New Lease</Cell>
          <Cell right bold>Renewal Lease</Cell>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', alignItems: 'center', flexGrow: 1 }}>
          <Label>Tenant Improvements</Label>
          <Cell right>{money0(displayTINewAmt)}</Cell>
          <Cell right>{money0(displayTIRenAmt)}</Cell>

          <Label>Leasing Commissions</Label>
          <Cell right>{money0(commNewAmt)}</Cell>
          <Cell right>{money0(commRenAmt)}</Cell>

          <Label>Total Leasing Costs</Label>
          <Cell right>{money0(totalLCNew)}</Cell>
          <Cell right>{money0(totalLCRen)}</Cell>

          <Label>Annualized Leasing Costs</Label>
          <Cell right>{money0(amortNew)}</Cell>
          <Cell right>{money0(amortRen)}</Cell>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', alignItems: 'center', background: '#e9ecef', py: 1, borderTop: '1px solid #e0e0e0' }}>
          <Label>Annual Leasing Cost Reserves</Label>
          <Cell right bold>{`${money2(weightedPerSF)} / SF`}</Cell>
          <Cell right bold>{money0(weightedAnnual)}</Cell>
        </Box>
      </Box>
    </Box>
  );
}

export default React.memo(LeasingCostReserves);

