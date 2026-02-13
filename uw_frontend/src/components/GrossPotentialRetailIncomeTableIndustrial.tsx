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
  const vacAnnual = gpriAnnualBeforeVac * vacancyRate;
  const vacAnnualPerSf = totalSF ? vacAnnual / totalSF : 0;

  const gpriPerSfAfterVac = gpriPerSfBeforeVac - vacPerSf;
  const gpriAnnualAfterVac = gpriAnnualBeforeVac - vacAnnual;

  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const money0 = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const space_type =
    (modelDetails?.user_model_field_values || []).find((f: any) => {
      const k = String(f.field_key || '');
      return k === 'space_type' || k.trim() === 'space_type';
    })?.value ?? 'Retail';

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
          Gross Potential {space_type} Income
        </Typography>
        <Typography sx={{ fontWeight: 600, textAlign: 'right', color: colors.grey[900] }}>
          {money0(gpriPerSfBeforeVac)}
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
          Gross Potential {space_type} Income
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
