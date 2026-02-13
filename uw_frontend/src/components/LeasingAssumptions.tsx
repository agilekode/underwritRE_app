import React, { useMemo, useCallback, useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { NumberInput, PercentInput } from "./StandardInput";
import { ContentCard } from "./StandardLayout";
import { colors } from "../theme";

/**
 * Leasing Assumptions - Standardized with design system
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

  // Field keys
  const K = {
    rehab: "Rehab time",
    leaseup: "Lease-up Time",
    badDebt: "Bad Debt",
    vacancy: "Vacancy",
    freeMonths: "Free Month's Rent",
    brokerFee: "Broker Fee",
    annualTurnover: "Annual Turnover",
  };

  // Local state
  const [rehabTime, setRehabTime] = useState<number>(Number(getFieldValue(K.rehab, 2) || 0));
  const [leaseUpTime, setLeaseUpTime] = useState<number>(Number(getFieldValue(K.leaseup, 1) || 0));
  const [badDebt, setBadDebt] = useState<number>(Number(getFieldValue(K.badDebt, 0) || 0));
  const [vacancy, setVacancy] = useState<number>(Number(getFieldValue(K.vacancy, 5) || 0));
  const [freeMonths, setFreeMonths] = useState<number>(Number(getFieldValue(K.freeMonths, 0) || 0));
  const [brokerFee, setBrokerFee] = useState<number>(Number(getFieldValue(K.brokerFee, 1) || 0));
  const [annualTurnover, setAnnualTurnover] = useState<number>(Number(getFieldValue(K.annualTurnover, 20) || 0));

  // Persist updates to backend
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

  const turnoverCostPct = useMemo(() => {
    const annualized = ((freeMonths + brokerFee) / 12) * (annualTurnover / 100);
    return (annualized * 100).toFixed(2);
  }, [freeMonths, brokerFee, annualTurnover]);

  const avgTenantStay = useMemo(() => {
    return annualTurnover > 0 ? Math.round(100 / annualTurnover) : 0;
  }, [annualTurnover]);

  const SectionHeader = ({ title, description }: { title: string; description: string }) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "baseline" },
        gap: { xs: 0.5, sm: 2 },
        mb: 1.5,
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

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
      <ContentCard title="Leasing Assumptions">
        <Box sx={{ display: "grid", gap: 3 }}>
          {/* Section 1: Turnover Time */}
          <Box>
            <SectionHeader
              title="Turnover Time"
              description="Time the unit is offline for rehab and lease-up."
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <NumberInput
                label="Rehab / Renovations"
                value={rehabTime}
                onChange={(e) => setRehabTime(Number(e.target.value) || 0)}
                suffix="months"
                allowDecimals={false}
                noCommas
                fullWidth
              />
              <NumberInput
                label="Lease-up Time"
                value={leaseUpTime}
                onChange={(e) => setLeaseUpTime(Number(e.target.value) || 0)}
                suffix="months"
                allowDecimals={false}
                noCommas
                fullWidth
              />
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 1.75,
                backgroundColor: colors.blueTint,
                borderRadius: 1,
                border: `1px solid ${colors.blue}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Total time vacant
              </Typography>
              <Typography variant="h6" sx={{ color: colors.blue, fontWeight: 700 }}>
                {totalTimeVacant} months
              </Typography>
            </Box>
          </Box>

          {/* Section 2: Turnover Cost */}
          <Box>
            <SectionHeader
              title="Turnover Cost"
              description="One-time costs per turnover and annual turnover rate."
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <NumberInput
                label="Free Rent (New Leases)"
                value={freeMonths}
                onChange={(e) => setFreeMonths(Number(e.target.value) || 0)}
                suffix="months"
                allowDecimals={false}
                noCommas
                fullWidth
              />
              <NumberInput
                label="Broker Fee"
                value={brokerFee}
                onChange={(e) => setBrokerFee(Number(e.target.value) || 0)}
                suffix="months"
                allowDecimals={false}
                noCommas
                fullWidth
              />
              <PercentInput
                label="Annual Turnover"
                value={annualTurnover}
                onChange={(e) => setAnnualTurnover(Number(e.target.value) || 0)}
                fullWidth
              />
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 1.75,
                backgroundColor: colors.blueTint,
                borderRadius: 1,
                border: `1px solid ${colors.blue}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Turnover cost as % of rent
              </Typography>
              <Typography variant="h6" sx={{ color: colors.blue, fontWeight: 700 }}>
                {turnoverCostPct}%
              </Typography>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              {annualTurnover}% turnover implies an average tenant stay of about {avgTenantStay} years. These costs,
              together with vacancy, reduce collected rent in the model.
            </Typography>
          </Box>

          {/* Section 3: Losses and Allowances */}
          <Box>
            <SectionHeader
              title="Losses and Allowances"
              description="Ongoing losses after stabilization."
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <PercentInput
                label="Bad Debt (Credit Loss)"
                value={badDebt}
                onChange={(e) => setBadDebt(Number(e.target.value) || 0)}
                fullWidth
              />
              <PercentInput
                label="Vacancy"
                value={vacancy}
                onChange={(e) => setVacancy(Number(e.target.value) || 0)}
                fullWidth
              />
            </Box>
          </Box>
        </Box>
      </ContentCard>
    </Box>
  );
}
