import React from 'react';
import { Box, Typography } from '@mui/material';
import { PercentInput } from './StandardInput';
import { colors, typography } from '../theme';

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
  const vacAnnual = gpriAnnualBeforeVac * vacancyRate;
  const vacAnnualPerSf = totalSF ? vacAnnual / totalSF : 0;

  const gpriPerSfAfterVac = gpriPerSfBeforeVac - vacPerSf;
  const gpriAnnualAfterVac = gpriAnnualBeforeVac - vacAnnual;

  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const money0 = (n: number) => `$${n.toLocaleString()}`;

  const columns = { xs: '1fr 110px 130px', md: '1fr 140px 160px' };
  const rowBase = {
    display: 'grid',
    gridTemplateColumns: columns,
    alignItems: 'center',
    gap: 2,
    px: 2,
    py: 1,
  } as const;

  return (
    <Box
      sx={{
        width: '100%',
        border: `1px solid ${colors.grey[300]}`,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: colors.white,
        fontFamily: typography.fontFamily,
        fontSize: 14.5,
      }}
    >
      <Box
        sx={{
          ...rowBase,
          backgroundColor: colors.grey[50],
          borderBottom: `1px solid ${colors.grey[300]}`,
        }}
      >
        <Box />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: colors.grey[600],
            textAlign: 'right',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Rent / SF / Yr.
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: colors.grey[600],
            textAlign: 'right',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Annual
        </Typography>
      </Box>

      <Box sx={{ ...rowBase, borderBottom: `1px solid ${colors.grey[300]}` }}>
        <Typography sx={{ fontWeight: 600, color: colors.grey[900] }}>
          Gross Potential Retail Income
        </Typography>
        <Typography sx={{ fontWeight: 600, textAlign: 'right', color: colors.grey[900] }}>
          {money(gpriPerSfBeforeVac)}
        </Typography>
        <Typography sx={{ fontWeight: 600, textAlign: 'right', color: colors.grey[900] }}>
          {money0(gpriAnnualBeforeVac)}
        </Typography>
      </Box>

      <Box sx={{ ...rowBase, borderBottom: `1px solid ${colors.grey[300]}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ color: colors.grey[900] }}>Less: Vacancy and Bad Debt</Typography>
          <PercentInput
            value={vacancyPct}
            onChange={(e) => {
              const raw = e.target.value;
              const id = getFieldId('Vacancy ');
              handleFieldChange(id, 'Vacancy ', raw === '' ? '' : Number(raw));
            }}
            size="small"
            sx={{ maxWidth: 140 }}
          />
        </Box>
        <Typography sx={{ color: colors.grey[700], textAlign: 'right' }}>{money(vacAnnualPerSf)}</Typography>
        <Typography sx={{ color: colors.grey[700], textAlign: 'right' }}>{money0(vacAnnual)}</Typography>
      </Box>

      <Box
        sx={{
          ...rowBase,
          backgroundColor: colors.blueTint,
        }}
      >
        <Typography sx={{ fontWeight: 700, color: colors.grey[900] }}>
          Gross Potential Retail Income
        </Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right', color: colors.grey[900] }}>
          {money0(gpriPerSfAfterVac)}
        </Typography>
        <Typography sx={{ fontWeight: 700, textAlign: 'right', color: colors.grey[900] }}>
          {money0(gpriAnnualAfterVac)}
        </Typography>
      </Box>
    </Box>
  );
}
