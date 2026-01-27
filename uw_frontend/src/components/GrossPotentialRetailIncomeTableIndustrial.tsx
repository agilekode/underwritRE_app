import React from 'react';
import { Box, Typography } from '@mui/material';
import { PercentageInput } from './NumberInput';

type RetailIncome = {
  id: string;
  suite: string;
  tenant_name: string;
  square_feet: number;
  rent_per_square_foot_per_year: number;
};

export default function GrossPotentialRetailIncomeTableIndustrial({
  retailIncome,
  expenses,
  modelDetails,
  handleFieldChange,
}: {
  retailIncome: RetailIncome[];
  expenses?: any[];
  modelDetails: any;
  handleFieldChange: (fieldId: string, field_key: string, value: number | string) => void;
}) {
  const getFieldValue = (field_key: string, def: any) => {
    const f = modelDetails?.user_model_field_values?.find((x: any) => x.field_key === field_key);
    return f ? f.value : def;
  };
  const getFieldId = (field_key: string) => {
    const f = modelDetails?.user_model_field_values?.find((x: any) => x.field_key === field_key);
    return f ? f.field_id : '';
  };
  const vacancyPct = Number(getFieldValue('Vacancy ', 5) || 0);
  const vacancyRate = vacancyPct / 100;
  const totalSF = (retailIncome || []).reduce((sum, r: any) => sum + Number(r.square_feet || 0), 0);
  const baseAnnual = (retailIncome || []).reduce(
    (sum, r: any) => sum + Number(r.square_feet || 0) * Number(r.rent_per_square_foot_per_year || 0),
    0
  );
  // Shares by tenant rent type
  const grossSF = (retailIncome || []).filter((r: any) => String(r?.rent_type || 'Gross').toLowerCase() === 'gross')
    .reduce((s: number, r: any) => s + Number(r?.square_feet || 0), 0);
  const nnnSF = (retailIncome || []).filter((r: any) => String(r?.rent_type || 'Gross').toLowerCase() === 'nnn')
    .reduce((s: number, r: any) => s + Number(r?.square_feet || 0), 0);
  const shareGross = totalSF ? grossSF / totalSF : 0;
  const shareNNN = totalSF ? nnnSF / totalSF : 0;

  // Compute annual amount per expense respecting factor and base rent
  const computeAnnual = (e: any): number => {
    const factor = String(e?.factor || '').toLowerCase();
    const cost = Number(e?.cost_per || 0);
    if (factor === 'annual') return cost;
    if (factor === 'per sf / yr.' || factor === 'per sf') return cost * Number(totalSF || 0);
    if (factor === 'percent of base rent') return (cost / 100) * Number(baseAnnual || 0);
    return cost;
  };
  const retailExpenses = (expenses || []).filter((e: any) => (e?.type || '').toLowerCase() === 'retail');
  const annualBoth = retailExpenses
    .filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'both')
    .reduce((s: number, e: any) => s + computeAnnual(e), 0);
  const annualGross = retailExpenses
    .filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'gross')
    .reduce((s: number, e: any) => s + computeAnnual(e), 0);
  const annualNNN = retailExpenses
    .filter((e: any) => String(e?.rent_type_included || '').toLowerCase() === 'nnn')
    .reduce((s: number, e: any) => s + computeAnnual(e), 0);
  // Total Annual Recovery Income based on spreadsheet logic:
  // (SUMIFS(Annual, RentTypeIncluded, tenantType) + SUMIFS(Annual, RentTypeIncluded, "Both")) * Share
  // Summed across tenants => annualBoth + shareGross*annualGross + shareNNN*annualNNN
  const totalAnnualRecoveryIncome = annualBoth + shareGross * annualGross + shareNNN * annualNNN;

  const gpriAnnualBeforeVac = baseAnnual + totalAnnualRecoveryIncome;
  const gpriPerSfBeforeVac = totalSF ? gpriAnnualBeforeVac / totalSF : 0;

  const vacPerSf = gpriPerSfBeforeVac * vacancyRate;
  // As requested: show $7,210.993 / square feet style for the second column: Annual/ SF
  const vacAnnual = gpriAnnualBeforeVac * vacancyRate;
  const vacAnnualPerSf = totalSF ? vacAnnual / totalSF : 0;

  const gpriPerSfAfterVac = gpriPerSfBeforeVac - vacPerSf;
  const gpriAnnualAfterVac = gpriAnnualBeforeVac - vacAnnual;

  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const money0 = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;


  const space_type =
  (modelDetails?.user_model_field_values || []).find((f: any) => {
    const k = String(f.field_key || '');
    return k === 'space_type' || k.trim() === 'space_type';
  })?.value ?? 'Retail';



  return (
    <Box sx={{ width: '100%', mt: 0 }}>
      {/* Column headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', alignItems: 'center', mb: 0.5 }}>
        <span />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>Rent / SF / Yr.</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'right' }}>Annual</Typography>
      </Box>
      {/* Header row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', alignItems: 'center', borderBottom: '2px solid #212121', pb: 0.5 }}>
        <Typography sx={{ fontWeight: 700 }}>Gross Potential {space_type} Income</Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{money0(gpriPerSfBeforeVac)}</Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{money0(gpriAnnualBeforeVac)}</Typography>
      </Box>

      {/* Vacancy row with editable input */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', alignItems: 'center', borderBottom: '2px solid #212121', py: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ color: 'text.primary' }}>Less: Vacancy and Bad Debt</Typography>
          <PercentageInput
            value={vacancyPct}
            onChange={(val: number | string) => {
              const id = getFieldId('Vacancy ');
              handleFieldChange(id, 'Vacancy ', val === '' ? '' : Number(val));
            }}
            variant="standard"
            size="small"
            sx={{ minWidth: 80, '& .MuiInputBase-input': { textAlign: 'right' } }}
          />
        </Box>
        <Typography sx={{ color: 'text.primary', textAlign: 'right' }}>{money(vacAnnualPerSf)}</Typography>
        <Typography sx={{ color: 'text.primary', textAlign: 'right' }}>{money0(vacAnnual)}</Typography>
      </Box>

      {/* Total row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', alignItems: 'center', background: '#eee', py: 0.75, }}>
        <Typography sx={{ fontWeight: 700 }}>Gross Potential {space_type} Income</Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{money0(gpriPerSfAfterVac)}</Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{money0(gpriAnnualAfterVac)}</Typography>
      </Box>
    </Box>
  );
}


