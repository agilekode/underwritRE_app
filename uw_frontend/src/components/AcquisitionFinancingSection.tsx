import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
} from "@mui/material";
import { CurrencyInput, PercentInput, NumberInput, YearInput } from './StandardInput';
import { InfoBox, FormRow } from './StandardLayout';
import { colors } from "../theme";

// Helper functions
const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
};

const calculateLoanConstant = (interestRate: number, amortizationYears: number) => {
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = amortizationYears * 12;
  if (monthlyRate === 0) return 1 / totalPayments;
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, totalPayments);
  const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1;
  return (numerator / denominator) * 12; // Annual constant
};

export default function AcquisitionFinancingSection({
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
  // Helper to get value from user_model_field_values
  const getFieldValue = (field_key: string, defaultValue: any) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.value : defaultValue;
  };
  const getFieldId = (field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  };

  // Shared loan parameters
  const [sharedInterestRate, setSharedInterestRate] = useState(getFieldValue("Acquisition Loan Interest Rate", 5));
  const [sharedAmortization, setSharedAmortization] = useState(getFieldValue("Acquisition Loan Amortization", 30));

  // Method enabled states (checkboxes - multiple can be selected)
  const [ltvEnabled, setLtvEnabled] = useState(getFieldValue("Acquisition Loan: LTV Calculation", "no") === "yes");
  const [dscrEnabled, setDscrEnabled] = useState(getFieldValue("Acquisition Loan: Debt-Service Coverage Ratio Calculation", "no") === "yes");
  const [fixedEnabled, setFixedEnabled] = useState(getFieldValue("Acquisition Loan: Fixed Loan Amount Selected", "no") === "yes");
  useEffect(() => {
    if (!sharedInterestRate) return;

    if (
      sharedInterestRate === "." ||
      sharedInterestRate.endsWith(".")
    ) {
      return;
    }

    const floatValue = parseFloat(sharedInterestRate);

    if (isNaN(floatValue)) return;

    handleFieldChange(
      getFieldId("Acquisition Loan Interest Rate"),
      "Acquisition Loan Interest Rate",
      floatValue.toFixed(1)
    );

  }, [sharedInterestRate]);
  useEffect(() => { handleFieldChange(getFieldId("Acquisition Loan Amortization"), "Acquisition Loan Amortization", sharedAmortization); }, [sharedAmortization]);

  // LTV Calculation State
  const [purchasePrice, setPurchasePrice] = useState(getFieldValue("Acquisition Price", 0));
  const [ltv, setLtv] = useState<string | number>(getFieldValue("Loan-to-Value (LTV)", 0));
  const [financeHardCosts, setFinanceHardCosts] = useState("no");
  const [ltcOnHardCosts, setLtcOnHardCosts] = useState(getFieldValue("LTC on Hard Costs", 75));
  const [hardCostAmount, setHardCostAmount] = useState(getFieldValue("Hard Cost Amount", 0));
  const [lendersInterestReserve, setLendersInterestReserve] = useState(getFieldValue("Lender's Minimum Required Interest Reserve", 0));

  // DSCR Calculation State
  const [minDscr, setMinDscr] = useState(getFieldValue("Minimum DSCR", 1.25));

  // Fixed Loan Amount State
  const [fixedLoanAmount, setFixedLoanAmount] = useState(getFieldValue("Fixed Loan Amount", 750000));

  // Hydration refs
  const ltvHydratedRef = useRef(false);
  const dscrHydratedRef = useRef(false);
  const fixedHydratedRef = useRef(false);

  // Rehydrate enabled states when modelDetails changes
  useEffect(() => {
    setLtvEnabled(getFieldValue("Acquisition Loan: LTV Calculation", "no") === "yes");
    if (!ltvHydratedRef.current) ltvHydratedRef.current = true;
  }, [modelDetails]);

  useEffect(() => {
    setDscrEnabled(getFieldValue("Acquisition Loan: Debt-Service Coverage Ratio Calculation", "no") === "yes");
    if (!dscrHydratedRef.current) dscrHydratedRef.current = true;
  }, [modelDetails]);

  useEffect(() => {
    setFixedEnabled(getFieldValue("Acquisition Loan: Fixed Loan Amount Selected", "no") === "yes");
    if (!fixedHydratedRef.current) fixedHydratedRef.current = true;
  }, [modelDetails]);

  // Save shared parameters
  useEffect(() => {
    handleFieldChange(getFieldId("Acquisition Loan Interest Rate"), "Acquisition Loan Interest Rate", sharedInterestRate);
  }, [sharedInterestRate]);

  useEffect(() => {
    handleFieldChange(getFieldId("Acquisition Loan Amortization"), "Acquisition Loan Amortization", sharedAmortization);
  }, [sharedAmortization]);

  // Save LTV enabled state
  useEffect(() => {
    if (!ltvHydratedRef.current) return;
    handleFieldChange(
      getFieldId("Acquisition Loan: LTV Calculation"),
      "Acquisition Loan: LTV Calculation",
      ltvEnabled ? "yes" : "no"
    );
  }, [ltvEnabled]);

  // Save DSCR enabled state
  useEffect(() => {
    if (!dscrHydratedRef.current) return;
    handleFieldChange(
      getFieldId("Acquisition Loan: Debt-Service Coverage Ratio Calculation"),
      "Acquisition Loan: Debt-Service Coverage Ratio Calculation",
      dscrEnabled ? "yes" : "no"
    );
  }, [dscrEnabled]);

  // Save Fixed enabled state
  useEffect(() => {
    if (!fixedHydratedRef.current) return;
    handleFieldChange(
      getFieldId("Acquisition Loan: Fixed Loan Amount Selected"),
      "Acquisition Loan: Fixed Loan Amount Selected",
      fixedEnabled ? "yes" : "no"
    );
  }, [fixedEnabled]);

  // Save LTV fields
  useEffect(() => {
    handleFieldChange(getFieldId("Loan-to-Value (LTV)"), "Loan-to-Value (LTV)", Number(ltv));
  }, [ltv]);

  useEffect(() => {
    if (financeHardCosts === "no") {
      setLtcOnHardCosts(0);
    }
    handleFieldChange(getFieldId("LTC on Hard Costs"), "LTC on Hard Costs", ltcOnHardCosts);
  }, [ltcOnHardCosts, financeHardCosts]);

  useEffect(() => {
    handleFieldChange(getFieldId("Hard Cost Amount"), "Hard Cost Amount", hardCostAmount);
  }, [hardCostAmount]);

  useEffect(() => {
    handleFieldChange(getFieldId("Lender's Minimum Required Interest Reserve"), "Lender's Minimum Required Interest Reserve", lendersInterestReserve);
  }, [lendersInterestReserve]);

  // Save DSCR fields
  useEffect(() => {
    handleFieldChange(getFieldId("Minimum DSCR"), "Minimum DSCR", minDscr);
  }, [minDscr]);

  // Save Fixed Loan fields
  useEffect(() => {
    handleFieldChange(getFieldId("Fixed Loan Amount"), "Fixed Loan Amount", fixedLoanAmount);
  }, [fixedLoanAmount]);

  // Calculations
  const maxLtvLoan = () => {
    const baseLoan = Number(purchasePrice) * Number(ltv) / 100;
    const hardCostsLoan = financeHardCosts === "yes" ? Number(hardCostAmount) * Number(ltcOnHardCosts) / 100 : 0;
    return baseLoan + hardCostsLoan;
  };

  const loanConstant = calculateLoanConstant(Number(sharedInterestRate), Number(sharedAmortization));
  const assumedNOI = variables?.["AQ: Annualized NOI in Month"] ?? 0;
  const maxDscrLoan = Number(assumedNOI) / Number(minDscr) / loanConstant;

  // Get the method label for summary
  const getMethodLabel = () => {
    if (variables?.["AQ: Max Acquisition Loan at Closing"] == variables?.["AQ: Max Loan Size Based on LTC"]) {
      return "LTV";
    } else if (variables?.["AQ: Max Acquisition Loan at Closing"] == variables?.["AQ: Max Loan Size Based on DSCR"]) {
      return "DSCR";
    } else if (variables?.["AQ: Max Acquisition Loan at Closing"] == variables?.["AQ: Exact Loan Amount"]) {
      return "Fixed";
    }
    return "selected methods";
  };

  const anyMethodEnabled = ltvEnabled || dscrEnabled || fixedEnabled;

  // Compact metric display component
  const MetricRow = ({ label, value }: { label: string; value: string }) => (
    <Box sx={{ py: 1, borderBottom: `1px solid ${colors.grey[300]}` }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: 4, pb: 4 }}>
      {/* TWO-COLUMN LAYOUT */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* LEFT COLUMN: Inputs (2/3 width) */}
        <Box sx={{ flex: '0 0 65%', minWidth: 0 }}>

          {/* Global Loan Parameters */}
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${colors.grey[300]}`,
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Loan Parameters
              </Typography>
              <FormRow>
                <PercentInput
                  label="Acquisition Loan Interest Rate"
                  value={sharedInterestRate}
                  onChange={(e) => setSharedInterestRate(Number(e.target.value))}
                  fullWidth
                />
                <YearInput
                  label="Acquisition Loan Amortization"
                  value={sharedAmortization}
                  onChange={(e) => setSharedAmortization(Number(e.target.value))}
                  fullWidth
                />
              </FormRow>
            </CardContent>
          </Card>

          {/* Calculation Method Selection */}
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Calculation Method
            </Typography>

            {/* METHOD 1: LTV CALCULATION */}
            <Card
              elevation={0}
              sx={{
                mb: 2,
                border: ltvEnabled ? `2px solid ${colors.blue}` : `1px solid ${colors.grey[300]}`,
                borderRadius: 2,
                transition: 'border 0.2s ease',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={ltvEnabled}
                      onChange={(e) => setLtvEnabled(e.target.checked)}
                      sx={{
                        color: colors.blue,
                        '&.Mui-checked': { color: colors.blue },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>LTV Calculation</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Calculate loan based on property value
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, alignItems: 'flex-start' }}
                />

                {ltvEnabled && (
                  <Box sx={{ mt: 3, pl: 4 }}>
                    <FormRow sx={{ mb: 2 }}>
                      <CurrencyInput
                        label="Purchase Price"
                        value={purchasePrice}
                        calculated
                        fullWidth
                      />
                      <PercentInput
                        label="Loan-to-Value (LTV)"
                        value={ltv}
                        onChange={(e) => setLtv(e.target.value)}
                        fullWidth
                      />
                    </FormRow>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel sx={{ fontSize: '0.875rem' }}>Finance Hard Costs?</InputLabel>
                      <Select
                        value={financeHardCosts}
                        label="Finance Hard Costs?"
                        onChange={(e) => setFinanceHardCosts(e.target.value)}
                        size="small"
                        sx={{
                          fontSize: '0.875rem',
                          '& .MuiSelect-select': { fontSize: '0.875rem' },
                        }}
                      >
                        <MenuItem value="no" sx={{ fontSize: '0.875rem' }}>No - Do not finance hard costs</MenuItem>
                        <MenuItem value="yes" sx={{ fontSize: '0.875rem' }}>Yes - Finance hard costs</MenuItem>
                      </Select>
                    </FormControl>

                    {financeHardCosts === 'yes' && (
                      <FormRow sx={{ mb: 2 }}>
                        <PercentInput
                          label="LTC on Hard Costs"
                          value={ltcOnHardCosts}
                          onChange={(e) => setLtcOnHardCosts(Number(e.target.value))}
                          fullWidth
                        />
                        <CurrencyInput
                          label="Hard Cost Amount"
                          value={hardCostAmount}
                          calculated
                          fullWidth
                        />
                      </FormRow>
                    )}

                    <CurrencyInput
                      label="Lender's Minimum Required Interest Reserve"
                      value={lendersInterestReserve}
                      onChange={(e) => setLendersInterestReserve(Number(e.target.value))}
                      fullWidth
                      sx={{ mb: 2 }}
                    />

                    {/* Inline result indicator */}
                    <Box sx={{ p: 2, backgroundColor: colors.blueTint, borderRadius: 1, border: `1px solid ${colors.blue}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Max LTV Loan
                      </Typography>
                      <Typography variant="h5" sx={{ color: colors.navy, fontWeight: 700 }}>
                        {variables?.["AQ: Max Loan Size Based on LTC"] ? `$${variables["AQ: Max Loan Size Based on LTC"]}` : formatCurrency(maxLtvLoan())}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* METHOD 2: DSCR CALCULATION */}
            <Card
              elevation={0}
              sx={{
                mb: 2,
                border: dscrEnabled ? `2px solid ${colors.blue}` : `1px solid ${colors.grey[300]}`,
                borderRadius: 2,
                transition: 'border 0.2s ease',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={dscrEnabled}
                      onChange={(e) => setDscrEnabled(e.target.checked)}
                      sx={{
                        color: colors.blue,
                        '&.Mui-checked': { color: colors.blue },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Debt-Service Coverage Ratio</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Calculate loan based on DSCR requirements
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, alignItems: 'flex-start' }}
                />

                {dscrEnabled && (
                  <Box sx={{ mt: 3, pl: 4 }}>
                    <FormRow sx={{ mb: 2 }}>
                      <CurrencyInput
                        label="Annual NOI"
                        value={assumedNOI}
                        calculated
                        fullWidth
                      />
                      <NumberInput
                        label="Minimum DSCR"
                        value={minDscr}
                        onChange={(e) => setMinDscr(Number(e.target.value))}
                        suffix="x"
                        allowDecimals
                        fullWidth
                      />
                    </FormRow>

                    {/* Inline result indicator */}
                    <Box sx={{ p: 2, backgroundColor: colors.blueTint, borderRadius: 1, border: `1px solid ${colors.blue}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Max DSCR Loan
                      </Typography>
                      <Typography variant="h5" sx={{ color: colors.navy, fontWeight: 700 }}>
                        {variables?.["AQ: Max Loan Size Based on DSCR"] ? `$${variables["AQ: Max Loan Size Based on DSCR"]}` : formatCurrency(maxDscrLoan)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* METHOD 3: FIXED LOAN AMOUNT */}
            <Card
              elevation={0}
              sx={{
                mb: 2,
                border: fixedEnabled ? `2px solid ${colors.blue}` : `1px solid ${colors.grey[300]}`,
                borderRadius: 2,
                transition: 'border 0.2s ease',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fixedEnabled}
                      onChange={(e) => setFixedEnabled(e.target.checked)}
                      sx={{
                        color: colors.blue,
                        '&.Mui-checked': { color: colors.blue },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Fixed Loan Amount</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Specify an exact loan amount
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, alignItems: 'flex-start' }}
                />

                {fixedEnabled && (
                  <Box sx={{ mt: 3, pl: 4 }}>
                    <CurrencyInput
                      label="Loan Amount"
                      value={fixedLoanAmount}
                      onChange={(e) => setFixedLoanAmount(e.target.value)}
                      fullWidth
                      sx={{ mb: 2 }}
                    />

                    {/* Inline result indicator */}
                    <Box sx={{ p: 2, backgroundColor: colors.blueTint, borderRadius: 1, border: `1px solid ${colors.blue}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Exact Loan Amount
                      </Typography>
                      <Typography variant="h5" sx={{ color: colors.navy, fontWeight: 700 }}>
                        {formatCurrency(fixedLoanAmount)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* RIGHT COLUMN: Sticky Summary (1/3 width) */}
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
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700 }}>
                Loan Summary
              </Typography>
              {anyMethodEnabled && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Based on {getMethodLabel()} calculation
                </Typography>
              )}

              {/* Primary metric */}
              <Box sx={{ mb: 3 }}>
                <InfoBox
                  label="Max Acquisition Loan"
                  value={anyMethodEnabled ? `$${variables?.["AQ: Max Acquisition Loan at Closing"] || 0}` : "—"}
                  variant="primary"
                />
              </Box>

              {/* Compact metrics list */}
              <MetricRow
                label="Interest Rate"
                value={`${Number(sharedInterestRate).toFixed(3)}%`}
              />
              <MetricRow
                label="Amortization"
                value={`${sharedAmortization} years`}
              />
              <MetricRow
                label="Annual NOI at Acquisition"
                value={`$${variables?.["AQ: Annualized NOI in Month"] || "N/A"}`}
              />
              <MetricRow
                label="Annual Debt Service"
                value={`$${variables?.["AQ: Annual Debt Service"] || "N/A"}`}
              />
              <MetricRow
                label="Monthly Debt Service"
                value={`$${variables?.["AQ: Monthly Debt Service"] || "N/A"}`}
              />
              <MetricRow
                label="DSCR"
                value={variables?.["AQ: DSCR"] ? `${variables["AQ: DSCR"]}` : "N/A"}
              />
              <MetricRow
                label="LTV"
                value={variables?.["AQ: LTV"] ? `${variables["AQ: LTV"]}` : "N/A"}
              />
              <Box sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                  Interest Reserve
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {`$${variables?.["AQ: Interest Reserve"] || "N/A"}`}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

      </Box>
    </Box>
  );
}
