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

export default function GrossPotentialRetailIncomeTable({
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
  const totalAnnualRetailExpenses = (expenses || [])
    .filter((e: any) => (e?.type || '').toLowerCase() === 'retail')
    .reduce((sum: number, e: any) => sum + Number(e?.cost_per || 0) * Number(totalSF || 0), 0);

  const gpriAnnualBeforeVac = baseAnnual + totalAnnualRetailExpenses;
  const gpriPerSfBeforeVac = totalSF ? gpriAnnualBeforeVac / totalSF : 0;

  const vacPerSf = gpriPerSfBeforeVac * vacancyRate;
  // As requested: show $7,210.993 / square feet style for the second column: Annual/ SF
  const vacAnnual = gpriAnnualBeforeVac * vacancyRate;
  const vacAnnualPerSf = totalSF ? vacAnnual / totalSF : 0;

  const gpriPerSfAfterVac = gpriPerSfBeforeVac - vacPerSf;
  const gpriAnnualAfterVac = gpriAnnualBeforeVac - vacAnnual;

  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const money0 = (n: number) => `$${n.toLocaleString()}`;
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

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
        <Typography sx={{ fontWeight: 700 }}>Gross Potential Retail Income</Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{money(gpriPerSfBeforeVac)}</Typography>
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
        <Typography sx={{ color: 'text.primary', textAlign: 'right' }}>{money0(vacAnnualPerSf)}</Typography>
        <Typography sx={{ color: 'text.primary', textAlign: 'right' }}>{money0(vacAnnual)}</Typography>
      </Box>

      {/* Total row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 160px', alignItems: 'center', background: '#eee', py: 0.75, }}>
        <Typography sx={{ fontWeight: 700 }}>Gross Potential Retail Income</Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{money0(gpriPerSfAfterVac)}</Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{money0(gpriAnnualAfterVac)}</Typography>
      </Box>
    </Box>
  );
}


