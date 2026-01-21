import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Paper,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Divider,
  Checkbox,
  Grid
} from "@mui/material";
import { NumberInput, PercentageInput, BasisPointsInput, YearsInput } from './NumberInput';
import { LIGHT_THEME_COLOR } from "../utils/constants";

// Helper functions
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

const calculateLoanConstant = (interestRate: number, amortizationYears: number) => {
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = amortizationYears * 12;
  if (monthlyRate === 0) return 1 / totalPayments;
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, totalPayments);
  const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1;
  return (numerator / denominator) * 12; // Annual constant
};

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

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid #e0e0e0" }}>
      {/* <Typography variant="h6" fontWeight={700} gutterBottom>
        Refinancing
      </Typography> */}
      {/* <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Model refinancing options for your acquisition loan
      </Typography> */}

      <Box sx={{ mt: 0 }}>
        <Typography fontWeight={600} sx={{ mb: 1 }}>
          Would you like to model in a refinancing of the acquisition loan?
        </Typography>
        <FormControl fullWidth sx={{ maxWidth: 300 }}>
          <Select
            value={modelRefinancing}
            onChange={(e) => setModelRefinancing(e.target.value)}
            size="medium"
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {modelRefinancing === "Yes" && (
        <>
          <Box sx={{ mt: 4 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              What month is the refinancing to take place?
            </Typography>
            <NumberInput
              value={refinancingMonth}
              onChange={(value: number | string) => setRefinancingMonth(value)}
              placeholder="Enter month number"
              min={1}
              step={1}
              startAdornment={<InputAdornment position="start">Month</InputAdornment>}
              sx={{ maxWidth: 300 }}
            />
          </Box>
          {refinancingMonth !== "" && (
            <>
              <Paper
                sx={{
                  mt: 4,
                  p: 3,
                  background: "#f5f5f5",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  flexDirection: { xs: "column", sm: "row" },
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  gap: { xs: 0.5, sm: 0 },
                }}
                elevation={0}
              >
                <span>Current Principal Outstanding of Acquisition Loan:</span>
                <span style={{ fontWeight: 900, fontSize: "1.3rem" }}>
                  {currentPrincipalOutstanding === "N/A" ? "N/A" : '$' + currentPrincipalOutstanding}
                </span>
              </Paper>
              
              {/* General Refinancing Inputs */}
              <Box sx={{ mt: 4, display: 'grid', gap: { xs: 2, sm: 3 }, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
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
                  />




                </Box>
                <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>


           

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0, border: 1, borderColor: 'primary.main', padding: 2, borderRadius: 2 }}>
                  <span style={{ fontWeight: 500, fontSize: "1rem", marginRight: 8 }}>
                    SOFR Spread at Origination:
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {variables?.["Refi: SOFR Spread at Origination"] !== undefined && variables?.["Refi: SOFR Spread at Origination"] !== null
                      ? variables["Refi: SOFR Spread at Origination"]
                      : "N/A"}
                  </span>
                </Box>


                </Box>
                <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                  <YearsInput
                    label="Amortization"
                    value={getFieldValue("Refi Amortization", "")}
                    onChange={(value: number | string) => {
                      handleFieldChange(getFieldId("Refi Amortization"), "Refi Amortization", value === "" ? "" : Number(value));
                    }}
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                  <TextField
                    label="Origination Cost (Includes Title)"
                    type="number"
                    className="no-spinner"
                    value={getFieldValue("Origination Cost (Includes Title)", "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleFieldChange(getFieldId("Origination Cost (Includes Title)"), "Origination Cost (Includes Title)", value === "" ? "" : Number(value));
                      }
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    fullWidth
                  />
                </Box>
                {/* <Box sx={{ flex: 1, minWidth: 250 }}>
                  <TextField
                    label="Share of Equity from Sponsor"
                    type="number"
                    className="no-spinner"
                    value={getFieldValue("Share of Equity from Sponsor", "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        handleFieldChange(getFieldId("Share of Equity from Sponsor"), "Share of Equity from Sponsor", value === "" ? "" : Number(value));
                      }
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    fullWidth
                  />
                </Box> */}
              </Box>
            </>
          )}
        </>
      )}
        {modelRefinancing === "Yes" && refinancingMonth !== "" && (
          <>
      <Box sx={{ mt: 2, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, alignItems: 'stretch' }}>
        <Box sx={{ display: 'flex', minWidth: 0, width: '100%'}}>
          <LtvCalculationColumn
            modelDetails={modelDetails}
            handleFieldChange={handleFieldChange}
            variables={variables}
          />
        </Box>
        <Box sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
          <DscrCalculationColumn
            modelDetails={modelDetails}
            handleFieldChange={handleFieldChange}
            variables={variables}
            refinancingMonth={refinancingMonth}
          />
        </Box>
        <Box sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
          <DebtYieldMinColumn
            modelDetails={modelDetails}
            handleFieldChange={handleFieldChange}
            variables={variables}
            refinancingMonth={refinancingMonth}
          />
        </Box>
      </Box>
      </>
    )}
    {modelRefinancing === "Yes" && refinancingMonth !== "" && (
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            
            {/* Calculate max loan and which method */}
            {(() => {
              // All methods are always enabled
              const loanOptions = [
                { value: variables?.["Refi: LTV calculation"] || 0, label: "LTV calculation" },
                { value: variables?.["Refi: DSCR calculation"] || 0, label: "DSCR calculation" },
                { value: variables?.["Refi: Debt Yield calculation"] || 0, label: "Debt Yield calculation" }
              ];
              const minLoan = loanOptions.reduce((min, curr) => curr.value < min.value ? curr : min, loanOptions[0]);
              
              return (
                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start', backgroundColor: '#fdfdfe' }}>
                  {/* Left: Max Loan */}
                  <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                  <Typography variant="h5" fontWeight={700}>Maximum Refinancing Loan Summary</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
              Based on the smallest loan size from the selected calculation methods
            </Typography>
                    <Paper sx={{ p: 2, mb: 2, background: "#f5f5f5" }} elevation={0}>
                      <Typography fontWeight={700} fontSize="1.2rem">
                        Max Refinancing Loan Size:
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: "space-between", flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Typography color="text.secondary" fontSize="1rem" sx={{ mb: { xs: 0.5, sm: 0 } }}>
                          Based on {(() => {
                            if (variables?.["Refi: Max Perm Loan"] == variables?.["Refi: LTV calculation"]) {
                              return "LTV Loan"
                            } else if (variables?.["Refi: Max Perm Loan"] == variables?.["Refi: DSCR calculation"]) {
                              return "DSCR Loan"
                            } else if (variables?.["Refi: Max Perm Loan"] == variables?.["Refi: Debt Yield calculation"]) {
                                return "Debt Yield Loan"
                            } else {
                              return "calculation"
                            }
                          })()}
                        </Typography>
                        <Typography fontWeight={900} fontSize={{ xs: '1.6rem', sm: '2rem' }} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
                          ${variables?.["Refi: Max Perm Loan"] || 0}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                  {/* Right: All Methods */}
                  <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: `1px solid ${LIGHT_THEME_COLOR}`, background: '#fff' }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                    <Typography fontWeight={700}>Annualized NOI in Month {refinancingMonth}:</Typography>
                    <Typography fontWeight={700} sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["Refi: Annualized NOI in Month"] || 0}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                    <Typography fontWeight={700}>Loan Factor:</Typography>
                    <Typography fontWeight={700} sx={{ mt: { xs: 0.5, sm: 0 } }}>{variables?.["Refi: Loan Factor"] !== undefined ? variables["Refi: Loan Factor"] : "-"}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                    <Typography fontWeight={700}>Refi Loan Proceeds net of fees:</Typography>
                    <Typography fontWeight={700} sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["Refi: Loan Proceeds net of fees"] || 0}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                    <Typography fontWeight={700}>Proceeds from Cashout:</Typography>
                    <Typography fontWeight={700} sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["Refi: Proceeds from Cashout"] || 0}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                    <Typography fontWeight={700}>Annual Debt Service:</Typography>
                    <Typography fontWeight={700} sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["Refi: Annual Debt Service"] || 0}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                    <Typography fontWeight={700}>Monthly Debt Service:</Typography>
                    <Typography fontWeight={700} sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["Refi: Monthly Debt Service"] || 0}</Typography>
                  </Box>
                    </Paper>
                  </Box>
                </Box>
              );
            })()}
            <Divider sx={{ my: 3 }} />

          </CardContent>
        </Card>
      </Box>
    )}
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

  const [appliedCapRate, setAppliedCapRate] = useState(getFieldValue("Applied Cap Rate for Valuation at Refi", 6));
  const [ltvMax, setLtvMax] = useState(getFieldValue("LTV Max", 75));

  useEffect(() => { 
    handleFieldChange(getFieldId("Applied Cap Rate for Valuation at Refi"), "Applied Cap Rate for Valuation at Refi", appliedCapRate); 
  }, [appliedCapRate]);
  useEffect(() => { 
    handleFieldChange(getFieldId("LTV Max"), "LTV Max", ltvMax); 
  }, [ltvMax]);

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 1, height: '100%', minHeight: { xs: 320, sm: 300 }, display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: '#fdfdfe' }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>LTV Calculation</Typography>
              <Typography variant="body2" color="text.secondary">
                Calculate loan based on property value
              </Typography>
            </Box>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ opacity: 1, pointerEvents: "auto", flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Applied Cap Rate for Valuation at Refi"
            type="number"
            className="no-spinner"
            value={appliedCapRate}
            onChange={e => setAppliedCapRate(Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
          />
           <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={700}>Implied Valuation:</Typography>
            <Typography>
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
                // Normalize: if provided as percent (e.g., 7.5), convert to decimal
                if (rate > 0) rate = rate / 100;
                if (!isFinite(noi) || !isFinite(rate) || rate <= 0) return "-";
                const implied = noi / rate;
                return formatCurrency(implied);
              })()}
            </Typography>
          </Box>
          <TextField
            label="LTV Max"
            type="number"
            className="no-spinner"
            value={ltvMax}
            onChange={e => setLtvMax(Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
          />
          <br />
          <br />
          <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e0e0e0", paddingTop: 2 }}>
            <Typography fontWeight={700}>Max LTV Loan:</Typography>
            <Typography fontWeight={900} fontSize="1.3rem">
              {variables && "Refi: LTV calculation" in variables
                ? `$${variables["Refi: LTV calculation"]}`
                : ''}
            </Typography>
          </Box>
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

  const [minDscr, setMinDscr] = useState(getFieldValue("Minimum Debt-Service-Coverage Ratio", 1.25));

  useEffect(() => { 
    handleFieldChange(getFieldId("Minimum Debt-Service-Coverage Ratio"), "Minimum Debt-Service-Coverage Ratio", minDscr); 
  }, [minDscr]);

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 1, height: '100%', minHeight: { xs: 320, sm: 300 }, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#fdfdfe' }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Debt-Service Coverage Ratio Calculation</Typography>
              <Typography variant="body2" color="text.secondary">
                Calculate loan based on DSCR requirements
              </Typography>
            </Box>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ opacity: 1, pointerEvents: "auto", flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 8 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Minimum Debt-Service-Coverage Ratio"
            type="number"
            className="no-spinner"
            value={minDscr}
            onChange={e => setMinDscr(Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">x</InputAdornment>
            }}
          />
          <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e0e0e0", paddingTop: 2  }}>
            <Typography fontWeight={700}>Max DSCR Loan:</Typography>
            <Typography fontWeight={900} fontSize="1.3rem">
              ${variables?.["Refi: DSCR calculation"] || 0}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginTop: 2 }}>
            <Typography fontWeight={700}>Annualized NOI in Month {refinancingMonth}</Typography>
            <Typography>
              ${variables?.["Refi: Annualized NOI in Month"] || 0}
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

  const [debtYieldMin, setDebtYieldMin] = useState(getFieldValue("Debt Yield Min", 8.75));

  useEffect(() => { 
    handleFieldChange(getFieldId("Debt Yield Min"), "Debt Yield Min", debtYieldMin); 
  }, [debtYieldMin]);

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 1, height: '100%', minHeight: { xs: 320, sm: 300 }, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#fdfdfe' }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Debt Yield Min</Typography>
              <Typography variant="body2" color="text.secondary">
                Calculate loan based on debt yield requirements
              </Typography>
            </Box>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ opacity: 1, pointerEvents: "auto", flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 8 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Debt Yield Min"
            type="number"
            className="no-spinner"
            value={debtYieldMin}
            onChange={e => setDebtYieldMin(Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>
            }}
          />
          <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e0e0e0", paddingTop: 2 }}>
            <Typography fontWeight={700}>Max Loan:</Typography>
            <Typography fontWeight={900} fontSize="1.3rem">
              ${variables?.["Refi: Debt Yield calculation"] || 0}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginTop: 2 }}>
            <Typography fontWeight={700}>Annualized NOI in Month {refinancingMonth}:</Typography>
            <Typography>
              ${variables?.["Refi: Annualized NOI in Month"] || 0}
            </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}