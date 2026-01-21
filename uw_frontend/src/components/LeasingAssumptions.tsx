import React, { useMemo, useCallback, useState, useEffect } from "react";
import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import { MonthsInput, PercentageInput } from "./NumberInput";
// using Box-based responsive grid instead of MUI Grid to avoid typing issues

/**
 * Mirrors the pattern used in RefinancingSection:
 * - Pulls values & field ids from modelDetails.user_model_field_values
 * - Uses handleFieldChange(fieldId, field_key, value) for updates
 */
export default function LeasingAssumptions({
  modelDetails,
  handleFieldChange,
}: {
  modelDetails: any;
  handleFieldChange: (
    fieldId: string,
    field_key: string,
    value: string | number
  ) => void;
}) {
  const getFieldValue = (field_key: string, def: any) => {
    const f = modelDetails?.user_model_field_values?.find(
      (x: any) => x.field_key === field_key
    );
    return f ? f.value : def;
  };
  const getFieldId = useCallback(
    (field_key: string) => {
      const f = modelDetails?.user_model_field_values?.find(
        (x: any) => x.field_key === field_key
      );
      return f ? f.field_id : "";
    },
    [modelDetails]
  );

  // Exact field_key strings from modelDetails.user_model_field_values
  // (These must match precisely, including spaces/punctuation)
  const K = {
    rehab: "Rehab time",
    leaseup: "Lease-up Time",
    badDebt: "Bad Debt",
    vacancy: "Vacancy", // note trailing space in source data
    freeMonths: "Free Month's Rent",
    brokerFee: "Broker Fee",
    annualTurnover: "Annual Turnover",
  };

  // Local state (mirrors Acquisition/Refinancing pattern) to ensure stable input UX
  const [rehabTime, setRehabTime] = useState<number>(Number(getFieldValue(K.rehab, 2) || 0));
  const [leaseUpTime, setLeaseUpTime] = useState<number>(Number(getFieldValue(K.leaseup, 1) || 0));
  const [badDebt, setBadDebt] = useState<number>(Number(getFieldValue(K.badDebt, 0) || 0));
  const [vacancy, setVacancy] = useState<number>(Number(getFieldValue(K.vacancy, 5) || 0));
  const [freeMonths, setFreeMonths] = useState<number>(Number(getFieldValue(K.freeMonths, 0) || 0));
  const [brokerFee, setBrokerFee] = useState<number>(Number(getFieldValue(K.brokerFee, 1) || 0));
  const [annualTurnover, setAnnualTurnover] = useState<number>(Number(getFieldValue(K.annualTurnover, 20) || 0));

  // Persist single-field updates to backend when local state changes
  useEffect(() => {
    const id = getFieldId(K.rehab);
    if (id) handleFieldChange(id, K.rehab, rehabTime);
  }, [rehabTime]);
  useEffect(() => {
    const id = getFieldId(K.leaseup);
    if (id) handleFieldChange(id, K.leaseup, leaseUpTime);
  }, [leaseUpTime]);
  useEffect(() => {
    const id = getFieldId(K.badDebt);
    if (id) handleFieldChange(id, K.badDebt, badDebt);
  }, [badDebt]);
  useEffect(() => {
    const id = getFieldId(K.vacancy);
    if (id) handleFieldChange(id, K.vacancy, vacancy);
  }, [vacancy]);
  useEffect(() => {
    const id = getFieldId(K.freeMonths);
    if (id) handleFieldChange(id, K.freeMonths, freeMonths);
  }, [freeMonths]);
  useEffect(() => {
    const id = getFieldId(K.brokerFee);
    if (id) handleFieldChange(id, K.brokerFee, brokerFee);
  }, [brokerFee]);
  useEffect(() => {
    const id = getFieldId(K.annualTurnover);
    if (id) handleFieldChange(id, K.annualTurnover, annualTurnover);
  }, [annualTurnover]);

  // Derived metrics
  const totalTimeVacant = useMemo(
    () => rehabTime + leaseUpTime,
    [rehabTime, leaseUpTime]
  );

  // Turnover cost % of rent = ((freeMonths + brokerFee)/12) * (annualTurnover%)
  const turnoverCostPct = useMemo(() => {
    const annualized = ((freeMonths + brokerFee) / 12) * (annualTurnover / 100);
    return (annualized * 100).toFixed(2); // %
  }, [freeMonths, brokerFee, annualTurnover]);

  const totalLossesPct = useMemo(
    () => (badDebt + vacancy).toFixed(2),
    [badDebt, vacancy]
  );

  // Local onChange to update state; effects above will trigger backend updates
  const onNum = (fieldKey: string) => (value: number | string) => {
    let val = value === "" ? 0 : Number(value);
    // For month-based fields, disallow decimals and coerce to non-negative integers
    if (fieldKey === K.rehab || fieldKey === K.leaseup) {
      if (!Number.isFinite(val)) val = 0;
      val = Math.max(0, Math.trunc(val));
    }
    switch (fieldKey) {
      case K.rehab: setRehabTime(val); break;
      case K.leaseup: setLeaseUpTime(val); break;
      case K.badDebt: setBadDebt(val); break;
      case K.vacancy: setVacancy(val); break;
      case K.freeMonths: setFreeMonths(val); break;
      case K.brokerFee: setBrokerFee(val); break;
      case K.annualTurnover: setAnnualTurnover(val); break;
    }
  };

  // Consistent, cleaner section title styling
  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography
      variant="h6"
      component="h3"
      sx={{
        fontWeight: 700,
        fontSize: { xs: "1.06rem", sm: "1.12rem" },
        lineHeight: 1.35,
        letterSpacing: 0.15,
        color: "text.primary",
        borderBottom: "1px solid #bdbdbd",
        // mb: 1.5,
        backgroundColor: "#fafafe",
        p: 2
      }}
    >
      {children}
    </Typography>
  );


  const BlueCard: React.FC<{
    title: string;
    value: string;
    noOutline?: boolean;
  }> = ({ title, value, noOutline }) => (
    <Card
      elevation={0}
      variant="outlined"
      sx={{
        mt: 1.25,
        bgcolor: "rgba(33,150,243,0.06)",
        border: noOutline ? "none" : "1px solid rgba(33,150,243,0.30)", // remove outline when asked
      }}
    >
      <CardContent
        sx={{
          px: 1.5,
          paddingTop: "8px !important",
          paddingBottom: "8px !important",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{ fontWeight: 700, color: "rgb(13,71,161)", fontSize: 16 }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: "rgb(13,71,161)",
              bgcolor: "white",
              px: 1.25,
              py: 0.25, // tighter chip height
              borderRadius: 1,
              border: "none", // remove inner white box outline
            }}
          >
            {value}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        width: "calc(100% - 60px)",
        maxWidth: 1140,
        mx: "auto",
        padding: "30px",
        backgroundColor: "transparent",
      }}
    >
      {/* Card 1: Turnover Time */}
      <Card
        variant="outlined"
        elevation={0}
        sx={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))",
          backdropFilter: "blur(10px) saturate(130%)",
          WebkitBackdropFilter: "blur(10px) saturate(130%)",
          border: 1,
          borderColor: "rgba(255,255,255,0.4)",
          borderRadius: 3,
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.55)",
        }}
      >
        <CardContent sx={{ pt: 0, px: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <SectionTitle>Turnover Time for Renovations and Vacated Units</SectionTitle>
          <Box sx={{ px: 2 }}>
           
            <Box
              sx={{
                display: "grid",
                gap: 2,
                
                // Go full-width (1 column) until large screens to avoid cutoff
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    borderBottom: "1px solid #bdbdbd",
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      minWidth: { xs: "100%", sm: 200, md: 240 },
                      mb: { xs: 0.5, sm: 0 },
                      fontSize: { xs: "0.95rem", sm: "0.9rem" },
                    }}
                  >
                    Total Months of Rehab / Renovations
                  </Typography>
                  <MonthsInput
                    value={rehabTime}
                    onChange={onNum(K.rehab)}
                    min={0}
                    step={1}
                    variant="standard"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: 80,
                      width: { xs: "100%", sm: "auto" },
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.95rem", sm: "0.9rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "right",
                      },
                    }}
                    InputProps={{
                      disableUnderline: true,
                      inputProps: { style: { textAlign: "right" }, inputMode: 'numeric', pattern: '[0-9]*' },
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    borderBottom: "1px solid #bdbdbd",
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      minWidth: { xs: "100%", sm: 200, md: 240 },
                      mb: { xs: 0.5, sm: 0 },
                      fontSize: { xs: "0.95rem", sm: "0.9rem" },
                    }}
                  >
                    Months to Lease-up
                  </Typography>
                  <MonthsInput
                    value={leaseUpTime}
                    onChange={onNum(K.leaseup)}
                    min={0}
                    step={1}
                    variant="standard"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: 80,
                      width: { xs: "100%", sm: "auto" },
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.95rem", sm: "0.9rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "right",
                      },
                    }}
                    InputProps={{
                      disableUnderline: true,
                      inputProps: { style: { textAlign: "right" }, inputMode: 'numeric', pattern: '[0-9]*' },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <BlueCard
              title="Total Time Vacant"
              value={`${totalTimeVacant} months`}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Card 2: Estimating the Turnover Cost Post-Stabilization */}
      <Card
        variant="outlined"
        elevation={0}
        sx={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))",
          backdropFilter: "blur(10px) saturate(130%)",
          WebkitBackdropFilter: "blur(10px) saturate(130%)",
          border: 1,
          borderColor: "rgba(255,255,255,0.4)",
          borderRadius: 3,
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.55)",
        }}
      >
        <CardContent sx={{ pt: 0, px: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <SectionTitle>Estimating the Turnover Cost Post-Stabilization</SectionTitle>
          <Box sx={{ px: 2 }}>
            
            <Box
              sx={{
                display: "grid",
                gap: 2,
                // Keep single column until large screens so long labels don't truncate
                gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    borderBottom: "1px solid #bdbdbd",
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      minWidth: { xs: "100%", sm: 200, md: 240 },
                      mb: { xs: 0.5, sm: 0 },
                      fontSize: { xs: "0.95rem", sm: "0.9rem" },
                    }}
                  >
                    {"Free Month's Rent on New Leases"}
                  </Typography>
                  <MonthsInput
                    value={freeMonths}
                    onChange={onNum(K.freeMonths)}
                    min={0}
                    step={0.5}
                    variant="standard"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: 80,
                      width: { xs: "100%", sm: "auto" },
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.95rem", sm: "0.9rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "right",
                      },
                    }}
                    InputProps={{
                      disableUnderline: true,
                      inputProps: { style: { textAlign: "right" } },
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    borderBottom: "1px solid #bdbdbd",
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      minWidth: { xs: "100%", sm: 200, md: 240 },
                      mb: { xs: 0.5, sm: 0 },
                      fontSize: { xs: "0.95rem", sm: "0.9rem" },
                    }}
                  >
                    Broker Fee Paid by Landlord
                  </Typography>
                  <MonthsInput
                    value={brokerFee}
                    onChange={onNum(K.brokerFee)}
                    min={0}
                    step={0.5}
                    variant="standard"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: 80,
                      width: { xs: "100%", sm: "auto" },
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.95rem", sm: "0.9rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "right",
                      },
                    }}
                    InputProps={{
                      disableUnderline: true,
                      inputProps: { style: { textAlign: "right" } },
                    }}
                  />
                </Box>
                {/* <Box
                  sx={{
                    mt: 1, bgcolor: "rgba(255,193,7,0.12)",
                    border: "1px solid rgba(255,193,7,0.45)", borderRadius: 1, p: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "rgb(102,60,0)" }}>
                    <strong>Note:</strong> 20% turnover implies the average tenant stays ~5 years.
                  </Typography>
                </Box> */}
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    borderBottom: "1px solid #bdbdbd",
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      minWidth: { xs: "100%", sm: 200, md: 240 },
                      mb: { xs: 0.5, sm: 0 },
                      fontSize: { xs: "0.95rem", sm: "0.9rem" },
                    }}
                  >
                    Annual Unit Turnover
                  </Typography>
                  <PercentageInput
                    value={annualTurnover}
                    onChange={onNum(K.annualTurnover)}
                    min={0}
                    max={100}
                    step={1}
                    variant="standard"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: 80,
                      width: { xs: "100%", sm: "auto" },
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.95rem", sm: "0.9rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "right",
                      },
                    }}
                    InputProps={{
                      disableUnderline: true,
                      inputProps: { style: { textAlign: "right" } },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <BlueCard
              title="Turnover Cost as % of Rent"
              value={`${turnoverCostPct}%`}
            />
             <Box
              sx={{
                mt: 2,
                mb: 1,
                bgcolor: "rgba(255,193,7,0.12)",
                border: "1px solid rgba(255,193,7,0.45)",
                borderRadius: 1,
                p: 2,
              }}
            >
              <Typography variant="body2">
                <strong>Note:</strong> 20% turnover implies the average tenant
                stays ~5 years. Turnover cost estimates may not be necessary for
                smaller properties that can easily achieve 100% occupancy, but
                this calculation—along with Vacancy—is modeled as a deduction
                from rents collected.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Card 3: Losses & Allowances */}
      <Card
        variant="outlined"
        elevation={0}
        sx={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))",
          backdropFilter: "blur(10px) saturate(130%)",
          WebkitBackdropFilter: "blur(10px) saturate(130%)",
          border: 1,
          borderColor: "rgba(255,255,255,0.4)",
          borderRadius: 3,
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.55)",
        }}
      >
        <CardContent sx={{ pt: 0, px: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <SectionTitle>Losses and Allowances After Stabilization</SectionTitle>
          <Box sx={{ px: 2 }}>
            
            <Box
              sx={{
                display: "grid",
                gap: 2,
                // Delay multi-column layout to larger screens
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    borderBottom: "1px solid #bdbdbd",
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      minWidth: { xs: "100%", sm: 200, md: 240 },
                      mb: { xs: 0.5, sm: 0 },
                      fontSize: { xs: "0.95rem", sm: "0.9rem" },
                    }}
                  >
                    Bad Debt (Credit Loss)
                  </Typography>
                  <PercentageInput
                    value={badDebt}
                    onChange={onNum(K.badDebt)}
                    min={0}
                    max={100}
                    step={0.5}
                    variant="standard"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: 80,
                      width: { xs: "100%", sm: "auto" },
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.95rem", sm: "0.9rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "right",
                      },
                    }}
                    InputProps={{
                      disableUnderline: true,
                      inputProps: { style: { textAlign: "right" } },
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    flexDirection: { xs: "column", sm: "row" },
                    borderBottom: "1px solid #bdbdbd",
                    pb: 0.5,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      mr: { xs: 0, sm: 2 },
                      minWidth: { xs: "100%", sm: 200, md: 240 },
                      mb: { xs: 0.5, sm: 0 },
                      fontSize: { xs: "0.95rem", sm: "0.9rem" },
                    }}
                  >
                    Vacancy
                  </Typography>
                  <PercentageInput
                    value={vacancy}
                    onChange={onNum(K.vacancy)}
                    min={0}
                    max={100}
                    step={0.5}
                    variant="standard"
                    size="small"
                    sx={{
                      flex: 1,
                      minWidth: 80,
                      width: { xs: "100%", sm: "auto" },
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "0.95rem", sm: "0.9rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "right",
                      },
                    }}
                    InputProps={{
                      disableUnderline: true,
                      inputProps: { style: { textAlign: "right" } },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
