import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
} from "@mui/material";
import { NumberInput, PercentageInput, YearsInput } from './NumberInput';
import { InfoBox } from './StandardLayout';
import { colors } from "../theme";

// Helper functions
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

const formatCurrencySafe = (value: any) => {
  if (value === undefined || value === null || value === "" || value === "N/A") return "�";
  const num = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(num)) return String(value);
  return formatCurrency(num);
};

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      alignItems: { xs: "flex-start", sm: "baseline" },
      gap: { xs: 0.5, sm: 2 },
      mb: 2,
    }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.grey[900] }}>
      {title}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: colors.grey[600],
        maxWidth: 520,
        lineHeight: 1.4,
      }}
    >
      {description}
    </Typography>
  </Box>
);

const InlineHeader = ({ title, description }: { title: string; description: string }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      alignItems: { xs: "flex-start", sm: "baseline" },
      gap: { xs: 0.5, sm: 2 },
    }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.grey[900] }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: colors.grey[600], lineHeight: 1.4 }}>
      {description}
    </Typography>
  </Box>
);

export default function RefinancingSection({
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
  // Memoize the handleFieldChange function to prevent infinite loops
  const memoizedHandleFieldChange = useCallback(handleFieldChange, [handleFieldChange]);

  const handleFieldChangeRef = useRef(memoizedHandleFieldChange);
  handleFieldChangeRef.current = memoizedHandleFieldChange;

  // Helper to get value from user_model_field_values
  const getFieldValue = (field_key: string, defaultValue: any) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.value : defaultValue;
  };

  // Coerce values that may arrive as formatted strings (e.g., "5.350%", " 1,234 ") into numbers
  const parseNumber = (val: any, fallback: number | string = "") => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val === "number") return val;
    const n = Number(String(val).replace(/[^0-9.+-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  };
  const getFieldId = useCallback((field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  }, [modelDetails]);

  // State for main refinancing fields only
  const [modelRefinancing, setModelRefinancing] = useState(getFieldValue("Permanent Loan Issued?", ""));
  const [refinancingMonth, setRefinancingMonth] = useState(getFieldValue("Refinancing Month", ""));
  const [currentPrincipalOutstanding, setCurrentPrincipalOutstanding] = useState(variables?.["Acquisition Loan Balance Outstanding"] ?? "N/A");

  useEffect(() => {
    setCurrentPrincipalOutstanding(variables?.["Acquisition Loan Balance Outstanding"] ?? "N/A");
    const fieldId = getFieldId("Refinancing: Fixed Interest Rate");
    const existing = modelDetails?.user_model_field_values?.find(
      (f: any) => f.field_key === "Refinancing: Fixed Interest Rate"
    )?.value;

    const parsed = parseNumber(variables?.["Refi: Fixed Interest Rate"], "");
    if (fieldId && (existing === "" || existing === undefined || existing === null) && parsed !== "") {
      handleFieldChangeRef.current(fieldId, "Refinancing: Fixed Interest Rate", parsed);
    }
  }, [variables]);

  // Sync main fields to parent
  useEffect(() => {
    handleFieldChange(getFieldId("Permanent Loan Issued?"), "Permanent Loan Issued?", modelRefinancing);
  }, [modelRefinancing]);

  useEffect(() => {
    handleFieldChange(getFieldId("Refinancing Month"), "Refinancing Month", refinancingMonth);
  }, [refinancingMonth]);

  const refiMonthNumber = Number(parseNumber(refinancingMonth, 0));
  const showRefiInputs = modelRefinancing === "Yes" && refiMonthNumber > 0;

  const refiLtv = Number(parseNumber(variables?.["Refi: LTV calculation"], 0));
  const refiDscr = Number(parseNumber(variables?.["Refi: DSCR calculation"], 0));
  const refiDebtYield = Number(parseNumber(variables?.["Refi: Debt Yield calculation"], 0));
  const refiMaxPermLoan = Number(parseNumber(variables?.["Refi: Max Perm Loan"], 0));

  const loanOptions = [
    { label: "LTV", value: refiLtv },
    { label: "DSCR", value: refiDscr },
    { label: "Debt Yield", value: refiDebtYield },
  ];
  const nonZeroOptions = loanOptions.filter((opt) => opt.value > 0);
  const minOption = nonZeroOptions.reduce(
    (min, curr) => (curr.value < min.value ? curr : min),
    nonZeroOptions[0] || { label: "Selected", value: 0 }
  );
  const maxLoanValue = refiMaxPermLoan > 0 ? refiMaxPermLoan : minOption.value;
  const maxLoanMethod =
    refiMaxPermLoan === refiLtv
      ? "LTV"
      : refiMaxPermLoan === refiDscr
      ? "DSCR"
      : refiMaxPermLoan === refiDebtYield
      ? "Debt Yield"
      : minOption.label;

  const formatPercent = (val: any) => {
    const num = parseNumber(val, "");
    if (num === "" || num === null || num === undefined) return "�";
    return `${num}%`;
  };

  const formatYears = (val: any) => {
    const num = parseNumber(val, "");
    if (num === "" || num === null || num === undefined) return "�";
    return `${num} years`;
  };

  const MetricRow = ({ label, value }: { label: string; value: string }) => (
    <Box sx={{ py: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );

  const summaryMetrics = showRefiInputs
    ? [
        { label: "Refinancing Month", value: `Month ${refiMonthNumber}` },
        { label: "Current Principal", value: formatCurrencySafe(currentPrincipalOutstanding) },
        { label: "Interest Rate", value: formatPercent(getFieldValue("Refinancing: Fixed Interest Rate", "")) },
        { label: "Amortization", value: formatYears(getFieldValue("Refi Amortization", "")) },
        { label: "Origination Cost", value: formatPercent(getFieldValue("Origination Cost (Includes Title)", "")) },
        { label: "SOFR Spread", value: `${variables?.["Refi: SOFR Spread at Origination"] ?? "N/A"}` },
        { label: `Annualized NOI in Month ${refiMonthNumber}`, value: formatCurrencySafe(variables?.["Refi: Annualized NOI in Month"]) },
        { label: "Loan Factor", value: `${variables?.["Refi: Loan Factor"] ?? "N/A"}` },
        { label: "Refi Proceeds Net of Fees", value: formatCurrencySafe(variables?.["Refi: Loan Proceeds net of fees"]) },
        { label: "Proceeds from Cashout", value: formatCurrencySafe(variables?.["Refi: Proceeds from Cashout"]) },
        { label: "Annual Debt Service", value: formatCurrencySafe(variables?.["Refi: Annual Debt Service"]) },
        { label: "Monthly Debt Service", value: formatCurrencySafe(variables?.["Refi: Monthly Debt Service"]) },
      ]
    : [];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: 4, pb: 4 }}>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* LEFT COLUMN: Inputs */}
        <Box sx={{ flex: '0 0 65%', minWidth: 0, width: '100%' }}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${colors.grey[300]}`,
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                title="Refinancing Options"
                description="Model refinancing options for your acquisition loan."
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: modelRefinancing === "Yes" ? 'repeat(2, minmax(0, 1fr))' : '1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Model a refinancing?
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={modelRefinancing}
                      onChange={(e) => setModelRefinancing(e.target.value)}
                      size="small"
                    >
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {modelRefinancing === "Yes" && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Refinancing month
                    </Typography>
                    <NumberInput
                      value={refinancingMonth}
                      onChange={(value: number | string) => setRefinancingMonth(value)}
                      placeholder="Enter month number"
                      min={1}
                      step={1}
                      startAdornment={<InputAdornment position="start">Month</InputAdornment>}
                      size="small"
                      fullWidth
                    />
                  </Box>
                )}
              </Box>

              {modelRefinancing === "Yes" && refiMonthNumber <= 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Enter the month number to unlock refinancing calculations.
                </Typography>
              )}
            </CardContent>
          </Card>

          {modelRefinancing === "Yes" && (
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${colors.grey[300]}`,
                borderRadius: 2,
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <SectionHeader
                  title="Refinancing Terms"
                  description="Core interest, amortization, and closing inputs."
                />

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  <PercentageInput
                    label="Fixed Interest Rate"
                    value={getFieldValue(
                      "Refinancing: Fixed Interest Rate",
                      variables?.["Refi: Fixed Interest Rate"] ?? ""
                    )}
                    onChange={(value: number | string) => {
                      handleFieldChange(
                        getFieldId("Refinancing: Fixed Interest Rate"),
                        "Refinancing: Fixed Interest Rate",
                        value === "" ? "" : value
                      );
                    }}
                    fullWidth
                    size="small"
                  />
                  <YearsInput
                    label="Amortization"
                    value={getFieldValue("Refi Amortization", "")}
                    onChange={(value: number | string) => {
                      handleFieldChange(getFieldId("Refi Amortization"), "Refi Amortization", value === "" ? "" : Number(value));
                    }}
                    fullWidth
                    size="small"
                  />
                  <PercentageInput
                    label="Origination Cost (Includes Title)"
                    value={getFieldValue("Origination Cost (Includes Title)", "")}
                    onChange={(value: number | string) => {
                      handleFieldChange(getFieldId("Origination Cost (Includes Title)"), "Origination Cost (Includes Title)", value === "" ? "" : Number(value));
                    }}
                    fullWidth
                    size="small"
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: `1px solid ${colors.grey[300]}`,
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.25,
                      backgroundColor: colors.grey[50],
                      minHeight: 34,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      SOFR Spread at Origination
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: colors.grey[900] }}>
                      {variables?.["Refi: SOFR Spread at Origination"] !== undefined && variables?.["Refi: SOFR Spread at Origination"] !== null
                        ? variables["Refi: SOFR Spread at Origination"]
                        : "N/A"}
                    </Typography>
                  </Box>
                </Box>

                {showRefiInputs && (
                  <Box
                    sx={{
                      mt: 2,
                      borderRadius: 1,
                      border: `1px solid ${colors.grey[300]}`,
                      backgroundColor: colors.grey[50],
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 1.5,
                      py: 0.25,
                      minHeight: 34,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Current principal outstanding
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatCurrencySafe(currentPrincipalOutstanding)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {showRefiInputs && (
            <Box>
              <SectionHeader
                title="Calculation Methods"
                description="We compute three loan sizes and use the smallest for the refinance."
              />

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
                <LtvCalculationColumn
                  modelDetails={modelDetails}
                  handleFieldChange={handleFieldChange}
                  variables={variables}
                />
                <DscrCalculationColumn
                  modelDetails={modelDetails}
                  handleFieldChange={handleFieldChange}
                  variables={variables}
                  refinancingMonth={refiMonthNumber}
                />
                <DebtYieldMinColumn
                  modelDetails={modelDetails}
                  handleFieldChange={handleFieldChange}
                  variables={variables}
                  refinancingMonth={refiMonthNumber}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* RIGHT COLUMN: Summary (only shown when refinancing is selected) */}
        {modelRefinancing === "Yes" && (
          <Box
            sx={{
              flex: '0 0 32%',
              minWidth: 0,
              width: '100%',
              position: { xs: 'static', lg: 'sticky' },
              top: 20,
              alignSelf: 'flex-start',
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
                <InlineHeader
                  title="Refinancing Summary"
                  description={showRefiInputs ? `Based on ${maxLoanMethod} calculation` : ""}
                />

                <Box sx={{ mb: 3 }}>
                  <InfoBox
                    label="Max Refinance Loan"
                    value={showRefiInputs ? formatCurrencySafe(maxLoanValue) : "�"}
                    variant="primary"
                  />
                </Box>

                {!showRefiInputs && (
                  <Typography variant="body2" color="text.secondary">
                    Enter a refinancing month to see loan calculations.
                  </Typography>
                )}

                {showRefiInputs && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2, rowGap: 1.5 }}>
                    {summaryMetrics.map((metric) => (
                      <MetricRow key={metric.label} label={metric.label} value={metric.value} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export function LtvCalculationColumn({ modelDetails, handleFieldChange, variables }: {
  modelDetails: any;
  handleFieldChange: (fieldId: string, field_key: string, value: string | number) => void;
  variables: any;
}) {
  // Memoize the handleFieldChange function to prevent infinite loops
  const memoizedHandleFieldChange = useCallback(handleFieldChange, [handleFieldChange]);

  const handleFieldChangeRef = useRef(memoizedHandleFieldChange);
  handleFieldChangeRef.current = memoizedHandleFieldChange;

  const getFieldValue = (field_key: string, defaultValue: any) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.value : defaultValue;
  };
  const getFieldId = useCallback((field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  }, [modelDetails]);

  const [appliedCapRate, setAppliedCapRate] = useState(String(getFieldValue("Applied Cap Rate for Valuation at Refi", 6)));
  const [ltvMax, setLtvMax] = useState(String(getFieldValue("LTV Max", 75)));

  useEffect(() => {
    const num = parseFloat(appliedCapRate);
    if (appliedCapRate !== "" && Number.isFinite(num)) {
      handleFieldChange(getFieldId("Applied Cap Rate for Valuation at Refi"), "Applied Cap Rate for Valuation at Refi", num);
    }
  }, [appliedCapRate]);
  useEffect(() => {
    const num = parseFloat(ltvMax);
    if (ltvMax !== "" && Number.isFinite(num)) {
      handleFieldChange(getFieldId("LTV Max"), "LTV Max", num);
    }
  }, [ltvMax]);

  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${colors.grey[300]}`, boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: colors.white }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
        <InlineHeader
          title="LTV Calculation"
          description="Calculate loan based on property value"
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <TextField
            label="Applied Cap Rate for Valuation at Refi"
            type="text"
            inputMode="decimal"
            className="no-spinner"
            value={appliedCapRate}
            onChange={e => setAppliedCapRate(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
          />
          <Box
            sx={{
              border: `1px solid ${colors.grey[300]}`,
              borderRadius: 1,
              px: 1.5,
              py: 0.25,
              backgroundColor: colors.grey[50],
              minHeight: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Implied Valuation
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {(() => {
                const rawNoi = variables?.["Refi: Annualized NOI in Month"];
                const noi =
                  typeof rawNoi === "number"
                    ? rawNoi
                    : Number(String(rawNoi ?? "").replace(/[^0-9.-]/g, "")) || 0;
                let rate =
                  typeof appliedCapRate === "number"
                    ? appliedCapRate
                    : Number(String(appliedCapRate ?? "").replace(/[^0-9.-]/g, "")) || 0;
                if (rate > 0) rate = rate / 100;
                if (!isFinite(noi) || !isFinite(rate) || rate <= 0) return "-";
                const implied = noi / rate;
                return formatCurrency(implied);
              })()}
            </Typography>
          </Box>
          <TextField
            label="LTV Max"
            type="text"
            inputMode="decimal"
            className="no-spinner"
            value={ltvMax}
            onChange={e => setLtvMax(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
          />
        </Box>
        <Box sx={{ mt: 1, pt: 2, borderTop: `1px solid ${colors.grey[300]}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700}>Max LTV Loan:</Typography>
          <Typography fontWeight={900} fontSize="1.2rem">
            {variables && "Refi: LTV calculation" in variables
              ? formatCurrencySafe(variables["Refi: LTV calculation"])
              : "�"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// --- DSCR Calculation Column ---
function DscrCalculationColumn({ modelDetails, handleFieldChange, variables, refinancingMonth }: any) {
  // Memoize the handleFieldChange function to prevent infinite loops
  const memoizedHandleFieldChange = useCallback(handleFieldChange, [handleFieldChange]);

  const handleFieldChangeRef = useRef(memoizedHandleFieldChange);
  handleFieldChangeRef.current = memoizedHandleFieldChange;

  const getFieldValue = (field_key: string, defaultValue: any) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.value : defaultValue;
  };
  const getFieldId = useCallback((field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  }, [modelDetails]);

  const [minDscr, setMinDscr] = useState(String(getFieldValue("Minimum Debt-Service-Coverage Ratio", 1.25)));

  useEffect(() => {
    const num = parseFloat(minDscr);
    if (minDscr !== "" && Number.isFinite(num)) {
      handleFieldChange(getFieldId("Minimum Debt-Service-Coverage Ratio"), "Minimum Debt-Service-Coverage Ratio", num);
    }
  }, [minDscr]);

  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${colors.grey[300]}`, boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.white }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
        <InlineHeader
          title="Debt-Service Coverage Ratio"
          description="Calculate loan based on DSCR requirements"
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <TextField
            label="Minimum Debt-Service-Coverage Ratio"
            type="text"
            inputMode="decimal"
            className="no-spinner"
            value={minDscr}
            onChange={e => setMinDscr(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">x</InputAdornment>
            }}
          />
          <Box
            sx={{
              border: `1px solid ${colors.grey[300]}`,
              borderRadius: 1,
              px: 1.5,
              py: 0.25,
              backgroundColor: colors.grey[50],
              minHeight: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Annualized NOI in Month {refinancingMonth}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatCurrencySafe(variables?.["Refi: Annualized NOI in Month"]) }
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 1, pt: 2, borderTop: `1px solid ${colors.grey[300]}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700}>Max DSCR Loan:</Typography>
          <Typography fontWeight={900} fontSize="1.2rem">
            {formatCurrencySafe(variables?.["Refi: DSCR calculation"]) }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// --- Debt Yield Min Column ---
function DebtYieldMinColumn({ modelDetails, handleFieldChange, variables, refinancingMonth }: any) {
  // Memoize the handleFieldChange function to prevent infinite loops
  const memoizedHandleFieldChange = useCallback(handleFieldChange, [handleFieldChange]);

  const handleFieldChangeRef = useRef(memoizedHandleFieldChange);
  handleFieldChangeRef.current = memoizedHandleFieldChange;

  const getFieldValue = (field_key: string, defaultValue: any) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.value : defaultValue;
  };
  const getFieldId = useCallback((field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  }, [modelDetails]);

  const [debtYieldMin, setDebtYieldMin] = useState(String(getFieldValue("Debt Yield Min", 8.75)));

  useEffect(() => {
    const num = parseFloat(debtYieldMin);
    if (debtYieldMin !== "" && Number.isFinite(num)) {
      handleFieldChange(getFieldId("Debt Yield Min"), "Debt Yield Min", num);
    }
  }, [debtYieldMin]);

  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${colors.grey[300]}`, boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: colors.white }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
        <InlineHeader
          title="Debt Yield Min"
          description="Calculate loan based on debt yield requirements"
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <TextField
            label="Debt Yield Min"
            type="text"
            inputMode="decimal"
            className="no-spinner"
            value={debtYieldMin}
            onChange={e => setDebtYieldMin(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
          />
          <Box
            sx={{
              border: `1px solid ${colors.grey[300]}`,
              borderRadius: 1,
              px: 1.5,
              py: 0.25,
              backgroundColor: colors.grey[50],
              minHeight: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Annualized NOI in Month {refinancingMonth}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatCurrencySafe(variables?.["Refi: Annualized NOI in Month"]) }
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 1, pt: 2, borderTop: `1px solid ${colors.grey[300]}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700}>Max Loan:</Typography>
          <Typography fontWeight={900} fontSize="1.2rem">
            {formatCurrencySafe(variables?.["Refi: Debt Yield calculation"]) }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
