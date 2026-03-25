import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CircularProgress,
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

  const [interestRateType, setInterestRateType] = useState(() =>
    getFieldValue("Sr. Cons: Interest Rate Type", "Floating")
  );
  const [exactLoanAmount, setExactLoanAmount] = useState(() => getFieldValue("Sr. Cons: Exact Loan Amount", 0));
  const [fixedRate, setFixedRate] = useState(() => getFieldValue("Fixed Rate for Sr. Cons. Loan", 7.5));
  const [baseRate, setBaseRate] = useState(() => getFieldValue("Floating: Base Rate", "1-Month SOFR"));
  const [spreadOverBaseRate, setSpreadOverBaseRate] = useState(() =>
    getFieldValue("Floating: Spread Over Base Rate", 400)
  );

  const SR_CONS_FIELD_KEYS = useMemo(
    () =>
      [
        "Sr. Cons: Interest Rate Type",
        "Sr. Cons: Exact Loan Amount",
        "Fixed Rate for Sr. Cons. Loan",
        "Floating: Base Rate",
        "Floating: Spread Over Base Rate",
      ] as const,
    []
  );

  /** Stable fingerprint so we rehydrate when API / parent modelDetails loads or updates, without re-running on every parent render */
  const srConsValuesFingerprint = useMemo(() => {
    const umfv = modelDetails?.user_model_field_values;
    if (!Array.isArray(umfv)) return "";
    return SR_CONS_FIELD_KEYS.map((k) => {
      const f = umfv.find((x: any) => x.field_key === k);
      return `${k}=${f?.value ?? ""}`;
    }).join("|");
  }, [modelDetails?.user_model_field_values, SR_CONS_FIELD_KEYS]);

  useEffect(() => {
    setInterestRateType(getFieldValue("Sr. Cons: Interest Rate Type", "Floating"));
    setExactLoanAmount(getFieldValue("Sr. Cons: Exact Loan Amount", 0));
    setFixedRate(getFieldValue("Fixed Rate for Sr. Cons. Loan", 7.5));
    setBaseRate(getFieldValue("Floating: Base Rate", "1-Month SOFR"));
    setSpreadOverBaseRate(getFieldValue("Floating: Spread Over Base Rate", 400));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- srConsValuesFingerprint tracks Sr. Cons. values in modelDetails
  }, [srConsValuesFingerprint]);

  const pushField = (field_key: string, value: string | number) => {
    handleFieldChange(getFieldId(field_key), field_key, value);
  };

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
                onChange={(e) => {
                  const v = e.target.value;
                  setExactLoanAmount(v);
                  pushField("Sr. Cons: Exact Loan Amount", v);
                }}
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setInterestRateType(v);
                    pushField("Sr. Cons: Interest Rate Type", v);
                  }}
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setFixedRate(v);
                    pushField("Fixed Rate for Sr. Cons. Loan", v);
                  }}
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
                      onChange={(e) => {
                        const v = e.target.value;
                        setBaseRate(v);
                        pushField("Floating: Base Rate", v);
                      }}
                      sx={{ fontSize: '0.875rem', '& .MuiSelect-select': { fontSize: '0.875rem' } }}
                    >
                      <MenuItem value="1-Month SOFR" sx={{ fontSize: '0.875rem' }}>1-Month SOFR</MenuItem>
                      <MenuItem value="WSJ Prime" sx={{ fontSize: '0.875rem' }}>WSJ Prime</MenuItem>
                    </Select>
                  </FormControl>
                  <NumberInput
                    label="Spread Over Base Rate (bps)"
                    value={spreadOverBaseRate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSpreadOverBaseRate(v);
                      pushField("Floating: Spread Over Base Rate", v);
                    }}
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
            sx={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.grey[300]}`,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {finalMetricsCalculating && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.68)',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <CircularProgress size={28} thickness={4} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: colors.grey[700] }}>
                  Updating summary...
                </Typography>
              </Box>
            )}
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
