import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { NumberInput, PercentInput } from "./StandardInput";
import { ContentCard } from "./StandardLayout";
import { colors } from "../theme";

export default function ExitAssumptions({
  modelDetails,
  handleFieldChange,
  showRetail = false,
  showRentalUnits = true,
  variables,
  numUnits = 0,
}: {
  modelDetails: any;
  handleFieldChange: (
    fieldId: string,
    field_key: string,
    value: string | number
  ) => void;
  showRetail?: boolean;
  showRentalUnits?: boolean;
  variables?: any;
  numUnits?: number;
}) {
  // Exact field_key strings (must match backend)
  const K = {
    mfExitMonth: "Multifamily Exit Month",
    mfCapRate: "Multifamily Applied Exit Cap Rate",
    mfSellingCosts: "Multifamily Less: Selling Costs",
    rtExitMonth: "Retail Exit Month",
    rtCapRate: "Retail Applied Exit Cap Rate",
    rtSellingCosts: "Retail Less: Selling Costs",
  };

  const getFieldValue = (field_key: string, def: any) => {
    const f = modelDetails?.user_model_field_values?.find(
      (x: any) => x.field_key === field_key
    );
    const v = f?.value;
    return v === "" || v === undefined || v === null ? def : v;
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

  // Helpers for currency and numeric parsing
  const parseNumber = (val: any, fallback = 0): number => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val === "number") return val;
    const s = String(val).trim();
    const hasParens = /^\(.*\)$/.test(s);
    const cleaned = s.replace(/[(),]/g, "");
    const n = Number(cleaned.replace(/[^0-9.+-]/g, ""));
    if (!Number.isFinite(n)) return fallback;
    return hasParens ? -Math.abs(n) : n;
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const formatCurrencyParens = (n: number) =>
    n < 0 ? `(${formatCurrency(Math.abs(n))})` : formatCurrency(n);

  // Local state for editable fields
  const [mfExitMonth, setMfExitMonth] = useState<string>(String(getFieldValue(K.mfExitMonth, "60")));
  const [mfCapRate, setMfCapRate] = useState<string>(String(getFieldValue(K.mfCapRate, "6")));
  const [mfSelling, setMfSelling] = useState<string>(String(getFieldValue(K.mfSellingCosts, "3")));

  const [rtExitMonth, setRtExitMonth] = useState<string>(String(getFieldValue(K.rtExitMonth, "60")));
  const [rtCapRate, setRtCapRate] = useState<string>(String(getFieldValue(K.rtCapRate, "8")));
  const [rtSelling, setRtSelling] = useState<string>(String(getFieldValue(K.rtSellingCosts, "3")));
  useEffect(() => {
    setMfExitMonth(String(getFieldValue(K.mfExitMonth, "60")));
    setMfCapRate(String(getFieldValue(K.mfCapRate, "6")));
    setMfSelling(String(getFieldValue(K.mfSellingCosts, "3")));
    setRtExitMonth(String(getFieldValue(K.rtExitMonth, "60")));
    setRtCapRate(String(getFieldValue(K.rtCapRate, "8")));
    setRtSelling(String(getFieldValue(K.rtSellingCosts, "3")));
  }, [modelDetails, getFieldValue]);

  const commit = (fieldKey: string) => (value: number | string) => {
    const v = typeof value === 'number' ? String(value) : value;
    switch (fieldKey) {
      case K.mfExitMonth: setMfExitMonth(v); break;
      case K.mfCapRate: setMfCapRate(v); break;
      case K.mfSellingCosts: setMfSelling(v); break;
      case K.rtExitMonth: setRtExitMonth(v); break;
      case K.rtCapRate: setRtCapRate(v); break;
      case K.rtSellingCosts: setRtSelling(v); break;
    }
    const id = getFieldId(fieldKey);
    handleFieldChange(id, fieldKey, v);
  };

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
          lineHeight: 1.4,
          maxWidth: 520,
        }}
      >
        {description}
      </Typography>
    </Box>
  );

  const rowShellSx = {
    display: "flex",
    alignItems: { xs: "flex-start", sm: "center" },
    flexDirection: { xs: "column", sm: "row" },
    justifyContent: "space-between",
    gap: { xs: 0.5, sm: 2 },
    py: 1,
  } as const;

  const listSx = {
    "& > *:not(:last-child)": {
      borderBottom: `1px solid ${colors.grey[300]}`,
    }
  } as const;

  const InputRow = ({ label, control }: { label: string; control: React.ReactNode }) => (
    <Box sx={rowShellSx}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.grey[700] }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: { sm: 160 }, width: { xs: "100%", sm: "auto" }, textAlign: { xs: "left", sm: "right" } }}>
        {control}
      </Box>
    </Box>
  );

  const ValueRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box sx={rowShellSx}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.grey[700] }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color: colors.grey[900] }}>
        {value}
      </Typography>
    </Box>
  );

  const MetricTile = ({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <Box
      sx={{
        border: `1px solid ${colors.grey[300]}`,
        borderRadius: 1,
        px: 1.5,
        py: 1,
        backgroundColor: highlight ? colors.blueTint : colors.grey[50],
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.grey[700] }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color: colors.grey[900] }}>
        {value}
      </Typography>
    </Box>
  );

  const space_type =
    (modelDetails?.user_model_field_values || []).find((f: any) => {
      const k = String(f.field_key || '');
      return k === 'space_type' || k.trim() === 'space_type';
    })?.value ?? 'Retail';

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 1200, mx: "auto", width: "100%" }}>
      {showRentalUnits && (
        <ContentCard title="Multifamily Exit Assumptions">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <SectionHeader title="Assumptions" description="Exit timing and pricing inputs." />
              <Box sx={listSx}>
                <InputRow
                  label="Multifamily Exit Month"
                  control={
                    <NumberInput
                      value={mfExitMonth}
                      onChange={(e) => setMfExitMonth(e.target.value)}
                      onBlur={() => commit(K.mfExitMonth)(mfExitMonth)}
                      suffix="months"
                      allowDecimals={false}
                      noCommas
                      fullWidth
                      inputProps={{ min: 1, max: 130 }}
                    />
                  }
                />
                <InputRow
                  label="Multifamily Applied Exit Cap Rate"
                  control={
                    <PercentInput
                      value={mfCapRate}
                      onChange={(e) => setMfCapRate(e.target.value)}
                      onBlur={() => commit(K.mfCapRate)(mfCapRate)}
                      fullWidth
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  }
                />
                <InputRow
                  label="Multifamily Less: Selling Costs"
                  control={
                    <PercentInput
                      value={mfSelling}
                      onChange={(e) => setMfSelling(e.target.value)}
                      onBlur={() => commit(K.mfSellingCosts)(mfSelling)}
                      fullWidth
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  }
                />
              </Box>
            </Box>
            <Box>
              <SectionHeader title="Results" description="Implied valuation and proceeds." />
              <Box sx={listSx}>
                <ValueRow
                  label={`Forward NOI in ${variables?.["Deal Time Horizon"] ?? ""}`}
                  value={formatCurrency(parseNumber(variables?.["Forward NOI in Month"], 0))}
                />
                <ValueRow
                  label="Implied Valuation at Exit"
                  value={formatCurrency(parseNumber(variables?.["Implied Valuation at Exit"], 0))}
                />
                <ValueRow
                  label="Implied Valuation per Unit"
                  value={(() => {
                    const totalVal = parseNumber(variables?.["Implied Valuation at Exit"], 0);
                    const perUnit = numUnits > 0 ? Math.round(totalVal / numUnits) : 0;
                    return formatCurrency(perUnit);
                  })()}
                />
                <ValueRow
                  label="Selling Costs"
                  value={formatCurrencyParens(parseNumber(variables?.["Selling Costs"], 0))}
                />
                <ValueRow
                  label="Net Reversion Proceeds"
                  value={formatCurrency(parseNumber(variables?.["Net Reversion Proceeds"], 0))}
                />
              </Box>
            </Box>
          </Box>
        </ContentCard>
      )}

      {showRetail && (
        <ContentCard title={`${space_type} Exit Assumptions`}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <SectionHeader title="Assumptions" description="Exit timing and pricing inputs." />
              <Box sx={listSx}>
                <InputRow
                  label={`${space_type} Exit Month`}
                  control={
                    <NumberInput
                      value={rtExitMonth}
                      onChange={(e) => setRtExitMonth(e.target.value)}
                      onBlur={() => commit(K.rtExitMonth)(rtExitMonth)}
                      suffix="months"
                      allowDecimals={false}
                      noCommas
                      fullWidth
                      inputProps={{ min: 0, step: 1 }}
                    />
                  }
                />
                <InputRow
                  label={`${space_type} Applied Exit Cap Rate`}
                  control={
                    <PercentInput
                      value={rtCapRate}
                      onChange={(e) => setRtCapRate(e.target.value)}
                      onBlur={() => commit(K.rtCapRate)(rtCapRate)}
                      fullWidth
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  }
                />
                <InputRow
                  label={`${space_type} Less: Selling Costs`}
                  control={
                    <PercentInput
                      value={rtSelling}
                      onChange={(e) => setRtSelling(e.target.value)}
                      onBlur={() => commit(K.rtSellingCosts)(rtSelling)}
                      fullWidth
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  }
                />
              </Box>
            </Box>
            <Box>
              <SectionHeader title="Results" description="Implied valuation and proceeds." />
              <Box sx={listSx}>
                <ValueRow
                  label={`Forward NOI in ${variables?.["Deal Time Horizon"] ?? ""}`}
                  value={formatCurrency(parseNumber(variables?.["Retail: Forward NOI in Month"], 0))}
                />
                <ValueRow
                  label="Implied Valuation at Exit"
                  value={formatCurrency(parseNumber(variables?.["Retail: Implied Valuation at Exit"], 0))}
                />
                {numUnits > 0 && (
                  <ValueRow
                    label="Implied Valuation per Unit"
                    value={(() => {
                      const totalVal = parseNumber(variables?.["Retail: Implied Valuation at Exit"], 0);
                      const perUnit = numUnits > 0 ? Math.round(totalVal / numUnits) : 0;
                      return formatCurrency(perUnit);
                    })()}
                  />
                )}
                {numUnits === 0 && (
                  <ValueRow
                    label="Implied Valuation per SF"
                    value={(() => {
                      const totalVal = parseNumber(variables?.["Retail: Implied Valuation at Exit"], 0);
                      const SF = getFieldValue("Gross Square Feet", 0);
                      const perSF = totalVal / SF;
                      return formatCurrency(perSF) + " / SF";
                    })()}
                  />
                )}
                <ValueRow
                  label="Selling Costs"
                  value={formatCurrencyParens(parseNumber(variables?.["Retail: Selling Costs"], 0))}
                />
                <ValueRow
                  label="Net Reversion Proceeds"
                  value={formatCurrency(parseNumber(variables?.["Retail: Net Reversion Proceeds"], 0))}
                />
              </Box>
            </Box>
          </Box>
        </ContentCard>
      )}

      {showRetail && showRentalUnits && (
        <ContentCard title="Combined Exit Summary">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <MetricTile
              label="Total Implied Property Valuation at Exit"
              value={(() => {
                const mfNet = parseNumber(variables?.["Implied Valuation at Exit"], 0);
                const rtNet = parseNumber(variables?.[space_type + ": Implied Valuation at Exit"], 0);
                return formatCurrency(mfNet + rtNet);
              })()}
              highlight
            />
            <MetricTile
              label="Total NOI at Exit"
              value={formatCurrency(parseNumber(variables?.["Forward NOI in Month"], 0) + parseNumber(variables?.["Retail: Forward NOI in Month"], 0))}
            />
            <MetricTile
              label="Blended Cap Rate"
              value={(() => {
                const mfNOI = parseNumber(variables?.["Forward NOI in Month"], 0);
                const rtNOI = parseNumber(variables?.["Retail: Forward NOI in Month"], 0);
                const totalNOI = mfNOI + rtNOI;
                if (totalNOI <= 0) return "-";
                const mfCap = parseNumber(mfCapRate, 0);
                const rtCap = parseNumber(rtCapRate, 0);
                const blended = (mfCap * mfNOI + rtCap * rtNOI) / totalNOI;
                return `${blended.toFixed(2)}%`;
              })()}
            />
          </Box>
        </ContentCard>
      )}
    </Box>
  );
}
