import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  CircularProgress,
} from "@mui/material";
import { CurrencyInput, PercentInput } from './StandardInput';
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

export default function SecondLienSection({
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

  const getFieldId = useCallback((field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  }, [modelDetails]);

  const [loanAmount, setLoanAmount] = useState(getFieldValue("Pref. Equity / Mezz. Loan Amount", ""));
  const [interestRate, setInterestRate] = useState(getFieldValue("Interest Rate (Accrual)", 5));
  const [participation, setParticipation] = useState(getFieldValue("Participation", 10));
  const [loanName, setLoanName] = useState(getFieldValue("Loan Name", "Pref / Mezz Loan"));
  
  useEffect(() => {
    handleFieldChange(getFieldId("Pref. Equity / Mezz. Loan Amount"), "Pref. Equity / Mezz. Loan Amount", loanAmount);
  }, [loanAmount]);

  useEffect(() => {
    handleFieldChange(getFieldId("Interest Rate (Accrual)"), "Interest Rate (Accrual)", interestRate);
  }, [interestRate]);

  useEffect(() => {
    
    handleFieldChange(getFieldId("Participation"), "Participation", participation);
  }, [participation]);

  useEffect(() => {
    console.log("loanName", loanName);
    console.log("getFieldId('Loan Name')", getFieldId("Loan Name"));
    handleFieldChange(getFieldId("Loan Name"), "Loan Name", loanName);
  }, [loanName]);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: 4, pb: 4 }}>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* LEFT COLUMN: Inputs (65%) */}
        <Box sx={{ flex: '0 0 65%', minWidth: 0 }}>
          <Card elevation={0} sx={{ border: `1px solid ${colors.grey[300]}`, borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Loan Terms
              </Typography>

              <FormRow sx={{ mb: 2 }}>
                <TextField
                  label="Loan Name"
                  value={loanName}
                  onChange={(e) => setLoanName(e.target.value)}
                  size="small"
                  fullWidth
                />
              </FormRow>


              <FormRow sx={{ mb: 2 }}>
                <CurrencyInput
                  label="Pref. Equity / Mezz. Loan Amount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  fullWidth
                />
               
              </FormRow>

              <FormRow>
              <PercentInput
                  label="Interest Rate (Accrual)"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  fullWidth
                />
                <PercentInput
                  label="Participation"
                  value={participation}
                  onChange={(e) => setParticipation(e.target.value)}
                  fullWidth
                />
              </FormRow>
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
                Second Lien Summary
              </Typography>

              {/* Primary metric */}
              <Box sx={{ mb: 3 }}>
                <InfoBox
                  label={`${loanName} Loan Size`} 
                  value={formatCurrencySafe(loanAmount)}
                  variant="primary"
                />
              </Box>

              {/* TODO: Replace placeholder keys below with actual Google Sheet named ranges */}
              <MetricRow
                label="Origination"
                value={variables?.["2L: Origination"] ?? "—"}
              />
              <MetricRow
                label="LTC on Project Costs"
                value={variables?.["2L: LTC on Project Costs"] ?? "—"}
              />
              <MetricRow
                label="LTC on Total Project Costs"
                value={variables?.["2L: LTC on Total Project Costs"] ?? "—"}
              />
            </CardContent>
          </Card>
        </Box>

      </Box>
    </Box>
  );
}
