import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from "@mui/material";
import { CurrencyInput, PercentInput, NumberInput } from './StandardInput';
import { InfoBox, FormRow } from './StandardLayout';
import { colors } from "../theme";

const formatCurrencySafe = (value: any) => {
  if (value === undefined || value === null || value === "" || value === "N/A") return "—";
  const num = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(num)) return String(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
};

const MetricRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ py: 1, borderBottom: `1px solid ${colors.grey[300]}` }}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block', mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}
    >
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
  </Box>
);

export default function SeniorConstructionLoanSection({
  modelDetails,
  handleFieldChange,
  variables,
  finalMetricsCalculating,
}: {
  modelDetails: any;
  handleFieldChange: (fieldId: string, field_key: string, value: string | number) => void;
  variables: any;
  finalMetricsCalculating: boolean;
}) {
  const getFieldValue = (field_key: string, defaultValue: any) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);

    return field ? field.value : defaultValue;
  };

  const getFieldId = (field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  };

  const [interestRateType, setInterestRateType] = useState(getFieldValue("Sr. Cons: Interest Rate Type", "Floating"));
  const [exactLoanAmount, setExactLoanAmount] = useState(getFieldValue("Sr. Cons: Exact Loan Amount", 0));
  const [fixedRate, setFixedRate] = useState(getFieldValue("Fixed Rate for Sr. Cons. Loan", 7.5));
  const [baseRate, setBaseRate] = useState(getFieldValue("Floating: Base Rate", "1-Month SOFR"));
  const [spreadOverBaseRate, setSpreadOverBaseRate] = useState(getFieldValue("Floating: Spread Over Base Rate", 400));

  // Rehydrate when modelDetails updates (e.g. on load of existing model)
  useEffect(() => {
    setInterestRateType(getFieldValue("Sr. Cons: Interest Rate Type", "Floating"));
    setExactLoanAmount(getFieldValue("Sr. Cons: Exact Loan Amount", 0));
    setFixedRate(getFieldValue("Fixed Rate for Sr. Cons. Loan", 7.5));
    setBaseRate(getFieldValue("Floating: Base Rate", "1-Month SOFR"));
    setSpreadOverBaseRate(getFieldValue("Floating: Spread Over Base Rate", 400));
  }, [modelDetails]);

  useEffect(() => {
    handleFieldChange(getFieldId("Sr. Cons: Interest Rate Type"), "Sr. Cons: Interest Rate Type", interestRateType);
  }, [interestRateType]);

  useEffect(() => {
    handleFieldChange(getFieldId("Sr. Cons: Exact Loan Amount"), "Sr. Cons: Exact Loan Amount", exactLoanAmount);
  }, [exactLoanAmount]);

  useEffect(() => {
    handleFieldChange(getFieldId("Fixed Rate for Sr. Cons. Loan"), "Fixed Rate for Sr. Cons. Loan", fixedRate);
  }, [fixedRate]);

  useEffect(() => {
    handleFieldChange(getFieldId("Floating: Base Rate"), "Floating: Base Rate", baseRate);
  }, [baseRate]);

  useEffect(() => {
    handleFieldChange(getFieldId("Floating: Spread Over Base Rate"), "Floating: Spread Over Base Rate", spreadOverBaseRate);
  }, [spreadOverBaseRate]);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: 4, pb: 4 }}>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* LEFT COLUMN: Inputs (65%) */}
        <Box sx={{ flex: '0 0 65%', minWidth: 0 }}>


          {/* Loan Amount Card */}
          <Card elevation={0} sx={{ border: `1px solid ${colors.grey[300]}`, borderRadius: 2, mb:3  }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Loan Amount
              </Typography>
              <CurrencyInput
                label="Exact Loan Amount"
                value={exactLoanAmount}
                onChange={(e) => setExactLoanAmount(e.target.value)}
                fullWidth
              />
            </CardContent>
          </Card>


          {/* Loan Parameters Card */}
          <Card elevation={0} sx={{ border: `1px solid ${colors.grey[300]}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Loan Parameters
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }} size="small">
                <InputLabel sx={{ fontSize: '0.875rem' }}>Interest Rate Type</InputLabel>
                <Select
                  value={interestRateType}
                  label="Interest Rate Type"
                  onChange={(e) => setInterestRateType(e.target.value)}
                  sx={{ fontSize: '0.875rem', '& .MuiSelect-select': { fontSize: '0.875rem' } }}
                >
                  <MenuItem value="Fixed" sx={{ fontSize: '0.875rem' }}>Fixed</MenuItem>
                  <MenuItem value="Floating" sx={{ fontSize: '0.875rem' }}>Floating</MenuItem>
                </Select>
              </FormControl>

              {interestRateType === "Fixed" && (
                <PercentInput
                  label="Fixed Rate for Sr. Cons. Loan"
                  value={fixedRate}
                  onChange={(e) => setFixedRate(e.target.value)}
                  fullWidth
                />
              )}

              {interestRateType === "Floating" && (
                <FormRow>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.875rem' }}>Base Rate</InputLabel>
                    <Select
                      value={baseRate}
                      label="Base Rate"
                      onChange={(e) => setBaseRate(e.target.value)}
                      sx={{ fontSize: '0.875rem', '& .MuiSelect-select': { fontSize: '0.875rem' } }}
                    >
                      <MenuItem value="1-Month SOFR" sx={{ fontSize: '0.875rem' }}>1-Month SOFR</MenuItem>
                      <MenuItem value="WSJ Prime" sx={{ fontSize: '0.875rem' }}>WSJ Prime</MenuItem>
                    </Select>
                  </FormControl>
                  <NumberInput
                    label="Spread Over Base Rate (bps)"
                    value={spreadOverBaseRate}
                    onChange={(e) => setSpreadOverBaseRate(e.target.value)}
                    allowDecimals
                    fullWidth
                  />
                </FormRow>
              )}
            </CardContent>
          </Card>

        </Box>

        {/* RIGHT COLUMN: Sticky Summary (32%) */}
        <Box
          sx={{
            flex: '0 0 32%',
            minWidth: 0,
            position: 'sticky',
            top: 20,
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}
        >
          <Card
            elevation={0}
            sx={{ backgroundColor: colors.white, border: `1px solid ${colors.grey[300]}`, borderRadius: 2 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Construction Loan Summary
              </Typography>

              {/* Primary metric */}
              <Box sx={{ mb: 3 }}>
                <InfoBox
                  label="Total Senior Construction Loan Size"
                  value={formatCurrencySafe(variables?.["Sr. Cons: Total Loan Size"] ?? exactLoanAmount)}
                  variant="primary"
                />
              </Box>

              {/* TODO: Replace placeholder keys below with actual Google Sheet named ranges */}
              <MetricRow
                label="Origination"
                value={variables?.["Sr. Cons: Origination"] ?? "—"}
              />
              <MetricRow
                label="LTC on Project Costs"
                value={variables?.["Sr. Cons: LTC"] ?? "—"}
              />
              <MetricRow
                label="Project Costs Funded by Sr. Construction Loan"
                value={formatCurrencySafe(variables?.["Sr. Cons: Project Costs Funded"] ?? "—")}
              />
              <MetricRow
                label="Interest Reserve"
                value={formatCurrencySafe(variables?.["Sr. Cons. Estimated Interest Reserve"] ?? "—")}
              />
              <MetricRow
                label="Average Interest Rate for Life of Loan"
                value={variables?.["Sr. Cons: Average Interest Rate for Life of Loan"] ?? "—"}
              />
            </CardContent>
          </Card>
        </Box>

      </Box>
    </Box>
  );
}
