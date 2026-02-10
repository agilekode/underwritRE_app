import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
  Divider,
  Checkbox,
  Grid,
  TextField
} from "@mui/material";
import { NumberInput, PercentageInput, CurrencyInput, YearsInput } from './NumberInput';
import { LIGHT_THEME_COLOR, MID_DARK_THEME_COLOR } from "../utils/constants";

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

  // Shared interest rate and amortization state
  const [sharedInterestRate, setSharedInterestRate] = useState(getFieldValue("Acquisition Loan Interest Rate", 5));
  const [sharedAmortization, setSharedAmortization] = useState(getFieldValue("Acquisition Loan Amortization", 30));

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

  // --- LTV Calculation Column State ---
  const [ltvEnabled, setLtvEnabled] = useState(
    getFieldValue("Acquisition Loan: LTV Calculation", "no") === "yes"
  );
  const [purchasePrice, setPurchasePrice] = useState(getFieldValue("Acquisition Price", 0));
  const [ltc, setLtc] = useState<string | number>(getFieldValue("Loan-to-Value (LTV)", 0));
  const [financeHardCosts, setFinanceHardCosts] = useState("no"); // Default to "no" since this field is not tracked
  const [ltcOnHardCosts, setLtcOnHardCosts] = useState(getFieldValue("LTC on Hard Costs", 75));
  const [hardCostAmount, setHardCostAmount] = useState(getFieldValue("Hard Cost Amount", 0));
  const [lendersInterestReserve, setLendersInterestReserve] = useState(getFieldValue("Lender's Minimum Required Interest Reserve", 0));
  // Rehydrate ltvEnabled when modelDetails changes
  const ltvHydratedRef = useRef(false);
  useEffect(() => {
    const v = getFieldValue("Acquisition Loan: LTV Calculation", "no");
    setLtvEnabled(v === "yes");
    if (!ltvHydratedRef.current) {
      ltvHydratedRef.current = true;
    }
  }, [modelDetails]);
  // Save ltvEnabled after first hydration
  useEffect(() => {
    if (!ltvHydratedRef.current) return;
    handleFieldChange(
      getFieldId("Acquisition Loan: LTV Calculation"),
      "Acquisition Loan: LTV Calculation",
      ltvEnabled ? "yes" : "no"
    );
  }, [ltvEnabled]);
  useEffect(() => { handleFieldChange(getFieldId("Purchase Price"), "Purchase Price", purchasePrice); }, [purchasePrice]);
  useEffect(() => {
    handleFieldChange(
      getFieldId("Loan-to-Value (LTV)"),
      "Loan-to-Value (LTV)",
      Number(ltc)
    );
  }, [ltc]);
  useEffect(() => { 
    // If financeHardCosts is "no", set LTC on Hard Costs to 0
    if (financeHardCosts === "no") {
      setLtcOnHardCosts(0);
    }
    handleFieldChange(getFieldId("LTC on Hard Costs"), "LTC on Hard Costs", ltcOnHardCosts); 
  }, [ltcOnHardCosts, financeHardCosts]);
  useEffect(() => { handleFieldChange(getFieldId("Hard Cost Amount"), "Hard Cost Amount", hardCostAmount); }, [hardCostAmount]);
  useEffect(() => { 
    handleFieldChange(getFieldId("Lender's Minimum Required Interest Reserve"), "Lender's Minimum Required Interest Reserve", lendersInterestReserve); 
  }, [lendersInterestReserve]);

  const maxLtcLoan = () => {
    const baseLoan = Number(purchasePrice) * Number(ltc) / 100;
    const hardCostsLoan = financeHardCosts === "yes" ? Number(hardCostAmount) * Number(ltcOnHardCosts) / 100 : 0;
    return baseLoan + hardCostsLoan;
  };

  // --- DSCR Calculation Column State ---
  const [dscrEnabled, setDscrEnabled] = useState(
    getFieldValue("Acquisition Loan: Debt-Service Coverage Ratio Calculation", "no") === "yes"
  );
  const [dscrMinDscr, setDscrMinDscr] = useState(getFieldValue("Minimum DSCR", 1.25));
  const [dscrIoType, setDscrIoType] = useState(getFieldValue("DSCR IO Type", "no"));
  const assumedNOI = 75000;
  // Rehydrate dscrEnabled when modelDetails changes
  const dscrHydratedRef = useRef(false);
  useEffect(() => {
    const v = getFieldValue("Acquisition Loan: Debt-Service Coverage Ratio Calculation", "no");
    setDscrEnabled(v === "yes");
    if (!dscrHydratedRef.current) {
      dscrHydratedRef.current = true;
    }
  }, [modelDetails]);
  // Save dscrEnabled after first hydration
  useEffect(() => {
    if (!dscrHydratedRef.current) return;
    handleFieldChange(
      getFieldId("Acquisition Loan: Debt-Service Coverage Ratio Calculation"),
      "Acquisition Loan: Debt-Service Coverage Ratio Calculation",
      dscrEnabled ? "yes" : "no"
    );
  }, [dscrEnabled]);
  useEffect(() => { handleFieldChange(getFieldId("Minimum DSCR"), "Minimum DSCR", dscrMinDscr); }, [dscrMinDscr]);
  useEffect(() => { handleFieldChange(getFieldId("DSCR IO Type"), "DSCR IO Type", dscrIoType); }, [dscrIoType]);

  const dscrLoanConstant = calculateLoanConstant(Number(sharedInterestRate), Number(sharedAmortization));
  const maxDscrLoan = assumedNOI / Number(dscrMinDscr) / dscrLoanConstant;

  // --- Fixed Loan Amount Column State ---
  // boolean from model
  const [fixedEnabled, setFixedEnabled] = useState(
    getFieldValue("Acquisition Loan: Fixed Loan Amount Selected", "no") === "yes"
  );

  // re-hydrate when modelDetails changes
  useEffect(() => {
    const v = getFieldValue("Acquisition Loan: Fixed Loan Amount Selected", "no");
    setFixedEnabled(v === "yes");
  }, [modelDetails]); // or whichever prop holds the latest values

  // skip auto-save on first mount
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) { hydrated.current = true; return; }
    handleFieldChange(
      getFieldId("Acquisition Loan: Fixed Loan Amount Selected"),
      "Acquisition Loan: Fixed Loan Amount Selected",
      fixedEnabled ? "yes" : "no"
    );
  }, [fixedEnabled]);

  const [fixedLoanAmount, setFixedLoanAmount] = useState(getFieldValue("Fixed Loan Amount", 750000));
  const [fixedIoType, setFixedIoType] = useState(getFieldValue("Fixed Loan IO Type", "no"));

  useEffect(() => { handleFieldChange(getFieldId("Fixed Loan Amount"), "Fixed Loan Amount", fixedLoanAmount); }, [fixedLoanAmount]);
  useEffect(() => { handleFieldChange(getFieldId("Fixed Loan IO Type"), "Fixed Loan IO Type", fixedIoType); }, [fixedIoType]);

  const fixedLoanConstant = calculateLoanConstant(Number(sharedInterestRate), Number(sharedAmortization));
  const annualDebtService = Number(fixedLoanAmount) * fixedLoanConstant;
  const dscr = annualDebtService > 0 ? assumedNOI / annualDebtService : 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 0, p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid #e0e0e0" }}>
      {/* <Typography variant="h6" fontWeight={700} gutterBottom>
      Acquisition Financing
      </Typography> */}
      {/* <Typography variant="subtitle1" color="text.secondary" gutterBottom>
      Configure your acquisition loan parameters by selecting and configuring the columns below.
      </Typography> */}

      {/* Shared Interest Rate and Amortization */}
      <Box sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, display: 'flex', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
        {/* Interest Rate */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', borderBottom: '1px solid #bdbdbd', pb: 0.5 }}>
          <Typography
            variant="body1"
            fontWeight={600}
            component="label"
            htmlFor="acq-loan-interest-rate"
            sx={{ mr: 2, minWidth: { xs: 110, sm: 140, md: 160 }, fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }, lineHeight: 1.2 }}
          >
            Acquisition Loan Interest Rate
          </Typography>
          <PercentageInput
            value={sharedInterestRate}
            onChange={(value: string | number) => {
             setSharedInterestRate(value.toString());
            }}
            variant="standard"
            size="small"
            sx={{ flex: 1, minWidth: 60, width: { xs: '100%', sm: 'auto', fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' } } }}
            InputProps={{
              disableUnderline: true,
              sx: { '& .MuiInputBase-input': { textAlign: 'right', whiteSpace: 'nowrap', fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6, paddingTop: '6px', paddingBottom: '6px' } },
              inputProps: { style: { textAlign: 'right', whiteSpace: 'nowrap' } }
            }}
          />
        </Box>
        {/* Amortization */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', borderBottom: '1px solid #bdbdbd', pb: 0.5 }}>
          <Typography
            variant="body1"
            fontWeight={600}
            component="label"
            htmlFor="acq-loan-amortization"
            sx={{ mr: 2, minWidth: { xs: 110, sm: 140, md: 160 }, fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' }, lineHeight: 1.2 }}
          >
            Acquisition Loan Amortization
          </Typography>
          <YearsInput
            value={sharedAmortization}
            onChange={(value: number | string) => setSharedAmortization(Number(value))}
            variant="standard"
            size="small"
            sx={{ flex: 1, minWidth: 60, width: { xs: '100%', sm: 'auto' } }}
            InputProps={{
              disableUnderline: true,
              sx: { '& .MuiInputBase-input': { textAlign: 'right', whiteSpace: 'nowrap', fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6, paddingTop: '6px', paddingBottom: '6px' } },
              inputProps: { style: { textAlign: 'right', whiteSpace: 'nowrap' } }
            }}
          />
        </Box>
      </Box>

  
      <Box sx={{ mt: 2, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, alignItems: 'stretch' }}>
        <Box sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
          <LtvCalculationColumn
            modelDetails={modelDetails}
            handleFieldChange={handleFieldChange}
            enabled={ltvEnabled}
            setEnabled={setLtvEnabled}
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            variables={variables}
            ltc={ltc}
            setLtc={setLtc}
            financeHardCosts={financeHardCosts}
            setFinanceHardCosts={setFinanceHardCosts}
            ltcOnHardCosts={ltcOnHardCosts}
            setLtcOnHardCosts={setLtcOnHardCosts}
            hardCostAmount={hardCostAmount}
            setHardCostAmount={setHardCostAmount}
            lendersInterestReserve={lendersInterestReserve}
            setLendersInterestReserve={setLendersInterestReserve}
            finalMetricsCalculating={finalMetricsCalculating}
          />
        </Box>
        <Box sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
          <DscrCalculationColumn
            modelDetails={modelDetails}
            handleFieldChange={handleFieldChange}
            enabled={dscrEnabled}
            setEnabled={setDscrEnabled}
            sharedInterestRate={sharedInterestRate}
            sharedAmortization={sharedAmortization}
            variables={variables}
            finalMetricsCalculating={finalMetricsCalculating}
          />
        </Box>
        <Box sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
          <FixedLoanAmountColumn
            sharedInterestRate={sharedInterestRate}
            sharedAmortization={sharedAmortization}
            modelDetails={modelDetails}
            handleFieldChange={handleFieldChange}
            enabled={fixedEnabled}
            setEnabled={setFixedEnabled}
            variables={variables}
          />
        </Box>
      </Box>
      
    
    {(ltvEnabled || dscrEnabled || fixedEnabled) && (
      <Box sx={{ mt: 4 }}>
        <Card sx={{ backgroundColor: '#fdfdfe' }}>
          <CardContent>
            
            {/* Calculate max loan and which method */}
            {(() => {
              // Only consider enabled methods
              const loanOptions = [];
              if (ltvEnabled) loanOptions.push({ value: maxLtcLoan(), label: "LTV calculation" });
              if (dscrEnabled) loanOptions.push({ value: maxDscrLoan, label: "DSCR calculation" });
              if (fixedEnabled) loanOptions.push({ value: fixedLoanAmount, label: "Fixed loan amount" });
              if (loanOptions.length === 0) return null;
              const minLoan = loanOptions.reduce((min, curr) => curr.value < min.value ? curr : min, loanOptions[0]);
              // For right column, use the method that produced minLoan
              let details: any = {};
              if (minLoan.label === "LTV calculation") {
                details = {
                  interestRate: sharedInterestRate,
                  amortization: sharedAmortization,
                  ioPeriod: "no", // No IO for LTV
                  annualDebtService: Number(fixedLoanAmount) * fixedLoanConstant, // Use fixed loan constant
                  ltc: ltc,
                  dscr: dscr
                };
              } else if (minLoan.label === "DSCR calculation") {
                details = {
                  interestRate: sharedInterestRate,
                  amortization: sharedAmortization,
                  ioPeriod: dscrIoType,
                  annualDebtService: annualDebtService,
                  ltc: ltc,
                  dscr: dscr
                };
              } else {
                details = {
                  interestRate: sharedInterestRate,
                  amortization: sharedAmortization,
                  ioPeriod: fixedIoType,
                  annualDebtService: annualDebtService,
                  ltc: ltc,
                  dscr: dscr
                };
              }
              return (
                <Box sx={{ display: 'grid', gap: { xs: 2, sm: 3 }, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
                  {/* Left: Max Loan */}
                  <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={700}>Maximum Acquisition Loan Summary</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
              Based on the smallest loan size from the selected calculation methods
            </Typography>
                    <Paper sx={{ p: 2, mb: 2, background: "#f5f5f5" }} elevation={0}>
                      <Typography fontWeight={700} fontSize="1.2rem">
                      Max Acquisition Loan Size:
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: "space-between", flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Typography color="text.secondary" fontSize="1rem" sx={{ mb: { xs: 0.5, sm: 0 } }}>
                          Based on {(() => {
                            if (variables?.["AQ: Max Acquisition Loan at Closing"] == variables?.["AQ: Max Loan Size Based on LTC"]) {
                              return "LTV Loan"
                            } else if (variables?.["AQ: Max Acquisition Loan at Closing"] == variables?.["AQ: Max Loan Size Based on DSCR"]) {
                              return "DSCR Loan"
                            } else if (variables?.["AQ: Max Acquisition Loan at Closing"] == variables?.["AQ: Exact Loan Amount"]) {
                              return "Fixed Loan"
                            } else {
                              return "calculation"
                            }
                          })()}
                        </Typography>
                        <Typography fontWeight={900} fontSize={{ xs: '1.6rem', sm: '1.8rem', md: '2rem' }} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
                          ${variables?.["AQ: Max Acquisition Loan at Closing"] || 0}
                        </Typography>
                      </Box>
                    </Paper>
                    
                    
                  </Box>
                  {/* Right: Metrics */}
                  <Box sx={{ flex: 1, minWidth: 320 }}>
                  <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: `1px solid ${LIGHT_THEME_COLOR}`, background: '#fff' }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                      <Typography fontWeight={700}>Interest Rate:</Typography>
                      <Typography sx={{ mt: { xs: 0.5, sm: 0 } }}>{Number(details.interestRate).toFixed(3)}%</Typography>
                    </Box>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                      <Typography fontWeight={700}>Amortization:</Typography>
                      <Typography sx={{ mt: { xs: 0.5, sm: 0 } }}>{details.amortization} years</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Typography fontWeight={700}>Annual NOI at Acquisition:</Typography>
                      <Typography sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["AQ: Annualized NOI in Month"] || "N/A"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mt: 2, mb: 2 }}>
                      <Typography fontWeight={700}>Annual Debt Service:</Typography>
                      <Typography sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["AQ: Annual Debt Service"] || "N/A"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 2 }}>
                      <Typography fontWeight={700}>Monthly Debt Service:</Typography>
                      <Typography sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["AQ: Monthly Debt Service"] || "N/A"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 2 }}>
                      <Typography fontWeight={700}>DSCR:</Typography>
                      <Typography sx={{ mt: { xs: 0.5, sm: 0 } }}>{variables?.["AQ: DSCR"] ? `${variables["AQ: DSCR"]}` : "N/A"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 2 }}>
                      <Typography fontWeight={700}>LTV:</Typography>
                      <Typography sx={{ mt: { xs: 0.5, sm: 0 } }}>{variables?.["AQ: LTV"] ? `${variables["AQ: LTV"]}` : "N/A"}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 2 }}>
                      <Typography fontWeight={700}>Interest Reserve:</Typography>
                      <Typography sx={{ mt: { xs: 0.5, sm: 0 } }}>${variables?.["AQ: Interest Reserve"] ? `${variables["AQ: Interest Reserve"]}` : "N/A"}</Typography>
                    </Box>
                    
                  </Paper>

                  
                  </Box>
                </Box>
              );
            })()}
            
          </CardContent>
        </Card>
      </Box>
    )}
    </Box>
  );
}


export function LtvCalculationColumn({ modelDetails, handleFieldChange, enabled, setEnabled, purchasePrice, setPurchasePrice, ltc, setLtc, financeHardCosts, setFinanceHardCosts, ltcOnHardCosts, setLtcOnHardCosts, hardCostAmount, setHardCostAmount, lendersInterestReserve, setLendersInterestReserve, variables, finalMetricsCalculating }: {
  modelDetails: any;
  handleFieldChange: (fieldId: string, field_key: string, value: string | number) => void;
  enabled: boolean;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  purchasePrice: number;
  setPurchasePrice: React.Dispatch<React.SetStateAction<number>>;
  ltc: string | number;
  setLtc: React.Dispatch<React.SetStateAction<string | number>>;
  financeHardCosts: string;
  setFinanceHardCosts: React.Dispatch<React.SetStateAction<string>>;
  ltcOnHardCosts: number;
  setLtcOnHardCosts: React.Dispatch<React.SetStateAction<number>>;
  hardCostAmount: number;
  setHardCostAmount: React.Dispatch<React.SetStateAction<number>>;
  lendersInterestReserve: number;
  setLendersInterestReserve: React.Dispatch<React.SetStateAction<number>>;
  variables: any;
  finalMetricsCalculating: boolean;
}) {

  // Calculation
  const maxLtcLoan = () => {
    const baseLoan = Number(purchasePrice) * Number(ltc) / 100;
    const hardCostsLoan = financeHardCosts === "yes"
      ? Number(hardCostAmount) * Number(ltcOnHardCosts) / 100
      : 0;
    return baseLoan + hardCostsLoan;
  };

  // Format currency that can handle numbers, strings with commas, parentheses, and whitespace
  // Improved formatCurrency to robustly handle "(27,591,648)" and " 10,000 "
  const formatCurrency = (input: number | string) => {
    // If input is a number, format directly
    if (typeof input === "number" && !isNaN(input)) {
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(input);
      return formatted;
    }
    if (typeof input === "string") {
      // Remove whitespace and commas
      let str = input.trim().replace(/,/g, "");
      // Handle parentheses for negatives
      let isNegative = false;
      if (str.startsWith("(") && str.endsWith(")")) {
        isNegative = true;
        str = str.slice(1, -1);
      }
      // Remove any whitespace again
      str = str.replace(/\s+/g, "");
      // If the string is now empty, return as is
      if (str.length === 0) {
        return input;
      }
      // Try to parse as number
      let num = Number(str);
      // If still NaN, try to extract all digits (including negatives and decimals)
      if (isNaN(num)) {
        // This will match numbers like 10000, -10000, 10000.55, etc.
        const digits = str.match(/-?\d+(\.\d+)?/g);
        if (digits && digits.length > 0) {
          // Join all found digit groups (in case of e.g. "27,591,648" or " 10,000 ")
          num = Number(digits.join(""));
        }
      }
      if (isNaN(num)) {
        return input; // fallback to original if not a number
      }
      if (isNegative) num = -num;
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
      return formatted;
    }
    return input;
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 1, backgroundColor: '#fdfdfe', height: '100%', minHeight: { xs: 320, sm: 300 }, display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>LTV Calculation</Typography>
              <Typography variant="body2" color="text.secondary">
                Calculate loan based on property value
              </Typography>
            </Box>
            <Checkbox checked={enabled} onChange={(_event, checked) => setEnabled(checked)} />
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? "auto" : "none", flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 8 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={700}>Purchase Price:</Typography>
            <Typography>
              {formatCurrency(
                Number(
                  purchasePrice
                )
              )}
            </Typography>
          </Box>
          <PercentageInput
            label="Loan-to-Value (LTV)"
            value={ltc}
            onChange={(value: number | string) => setLtc(value)}
          />
          <FormControl fullWidth>
            <InputLabel>Acquisition Loan to Also Finance Hard Costs?</InputLabel>
            <Select
              value={financeHardCosts}
              label="Acquisition Loan to Also Finance Hard Costs?"
              onChange={e => setFinanceHardCosts(e.target.value)}
            >
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </Select>
          </FormControl>
          {financeHardCosts === "yes" && (
            <>
              <PercentageInput
                label="LTC on Hard Costs"
                value={ltcOnHardCosts}
                onChange={(value: number | string) => setLtcOnHardCosts(Number(value))}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography fontWeight={700}>Hard Cost Amount:</Typography>
                <Typography>
                  {formatCurrency(Number(hardCostAmount))}
                </Typography>
              </Box>
            </>
          )}
          <CurrencyInput
            label="Lender's Minimum Required Interest Reserve"
            value={lendersInterestReserve}
            onChange={(value: number | string) => setLendersInterestReserve(Number(value))}
          />
          {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={700}>Interest Reserve:</Typography>
            <Typography sx={finalMetricsCalculating ? { color: "text.disabled" } : {}}>
              {variables?.["AQ: Interest Reserve"] !== undefined ? "$" + String(variables["AQ: Interest Reserve"]).trim() : "N/A"}
              
            </Typography>
          </Box> */}
          <br />
          <br />
    
          <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e0e0e0', paddingTop: 2 }}>
            <Typography fontWeight={700}>Max LTV Loan:</Typography>
            <Typography fontWeight={900} fontSize="1.3rem">
              {"AQ: Max Loan Size Based on LTC" in (variables || {}) ? `$${variables["AQ: Max Loan Size Based on LTC"]}` : ''}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// --- DSCR Calculation Column ---
function DscrCalculationColumn({ modelDetails, handleFieldChange, enabled, setEnabled, sharedInterestRate, sharedAmortization, variables, finalMetricsCalculating }: any) {
  const getFieldValue = (field_key: string, defaultValue: any) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.value : defaultValue;
  };
  const getFieldId = (field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  };

  const [minDscr, setMinDscr] = useState(getFieldValue("Minimum DSCR", 1.25));
  const [assumedNOI, setAssumedNOI] = useState(variables?.["AQ: Annualized NOI in Month"] !== undefined ? variables["AQ: Annualized NOI in Month"] : 0);

  useEffect(() => {
    setAssumedNOI(variables?.["AQ: Annualized NOI in Month"] !== undefined ? variables["AQ: Annualized NOI in Month"] : 0);
  }, [variables]);

  useEffect(() => { handleFieldChange(getFieldId("Minimum DSCR"), "Minimum DSCR", minDscr); }, [minDscr]);

  const loanConstant = calculateLoanConstant(Number(sharedInterestRate), Number(sharedAmortization));
  const maxDscrLoan = assumedNOI / Number(minDscr) / loanConstant;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 1, backgroundColor: '#fdfdfe', height: '100%', minHeight: { xs: 320, sm: 300 }, display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Debt-Service Coverage Ratio</Typography>
              <Typography variant="body2" color="text.secondary">
                Calculate loan based on DSCR requirements
              </Typography>
            </Box>
            <Checkbox checked={enabled} onChange={(_event, checked) => setEnabled(checked)} />
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? "auto" : "none", flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 8 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={700}>NOI:</Typography>
            <Typography>
                  ${String(variables?.["AQ: Annualized NOI in Month"] ?? "").trim()}
            </Typography>
          </Box>
          <NumberInput
            label="Minimum DSCR"
            value={minDscr}
            onChange={setMinDscr}
            min={0}
            step={0.01}
            endAdornment={<InputAdornment position="end">x</InputAdornment>}
            fullWidth
            size="medium"
          />
          {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={700}>Interest Reserve:</Typography>
            <Typography sx={finalMetricsCalculating ? { color: "text.disabled" } : {}}>
              {assumedNOI}
            </Typography>
          </Box> */}
   
          <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e0e0e0', paddingTop: 2 }}>
            <Typography fontWeight={700}>Max DSCR Loan:</Typography>
            <Typography fontWeight={900} fontSize="1.3rem">
            $ {variables?.["AQ: Max Loan Size Based on DSCR"]}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// --- Fixed Loan Amount Column ---
function FixedLoanAmountColumn({ modelDetails, handleFieldChange, enabled, setEnabled, sharedInterestRate, sharedAmortization, variables }: any) {
  const getFieldValue = (field_key: string, defaultValue: any) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.value : defaultValue;
  };
  const getFieldId = (field_key: string) => {
    const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
    return field ? field.field_id : "";
  };

  const [fixedLoanAmount, setFixedLoanAmount] = useState(getFieldValue("Fixed Loan Amount", 750000));


  useEffect(() => { handleFieldChange(getFieldId("Fixed Loan Amount"), "Fixed Loan Amount", fixedLoanAmount); }, [fixedLoanAmount]);


  const loanConstant = calculateLoanConstant(Number(sharedInterestRate), Number(sharedAmortization));
  const annualDebtService = Number(fixedLoanAmount) * loanConstant;

  // Coerce display value to number to enable comma formatting when safe
  const fixedLoanAmountDisplay =
    typeof fixedLoanAmount === 'string'
      ? (() => {
          const raw = fixedLoanAmount.replace(/,/g, '');
          return /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : fixedLoanAmount;
        })()
      : fixedLoanAmount;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 1, backgroundColor: '#fdfdfe', height: '100%', minHeight: { xs: 320, sm: 300 }, display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Fixed Loan Amount</Typography>
              <Typography variant="body2" color="text.secondary">
                Calculate metrics based on a fixed loan amount
              </Typography>
            </Box>
            <Checkbox checked={enabled} onChange={(_event, checked) => setEnabled(checked)} />
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? "auto" : "none", flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 8 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <CurrencyInput
            label="Loan Amount"
            value={fixedLoanAmountDisplay}
            onChange={(value: number | string) => setFixedLoanAmount(value)}
          />
    
          <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e0e0e0', paddingTop: 2 }}>
            <Typography fontWeight={700}>Exact Loan Amount:</Typography>
            <Typography fontWeight={900} fontSize="1.3rem">
              {formatCurrency(fixedLoanAmount)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}