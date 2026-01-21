import React, { useCallback, useEffect, useState } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { MonthsInput, PercentageInput } from "./NumberInput";
import { ExitInlineMonthsInput, ExitInlinePercentageInput } from "./ExitInlineNumberInput";
import { LIGHT_THEME_COLOR, MID_DARK_THEME_COLOR, MID_LIGHT_THEME_COLOR, MID_THEME_COLOR, THEME_GREEN, THEME_LIGHT_GREEN, THEME_LIGHT_GREY } from "../utils/constants";

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
    // Strip common adornments including parentheses and commas before numeric parse
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

  // Local state for editable fields (mirrors Refinancing/Acquisition pattern)
  const [mfExitMonth, setMfExitMonth] = useState<string>(String(getFieldValue(K.mfExitMonth, "60")));
  const [mfCapRate, setMfCapRate] = useState<string>(String(getFieldValue(K.mfCapRate, "6")));
  const [mfSelling, setMfSelling] = useState<string>(String(getFieldValue(K.mfSellingCosts, "3")));

  const [rtExitMonth, setRtExitMonth] = useState<string>(String(getFieldValue(K.rtExitMonth, "60")));
  const [rtCapRate, setRtCapRate] = useState<string>(String(getFieldValue(K.rtCapRate, "8")));
  const [rtSelling, setRtSelling] = useState<string>(String(getFieldValue(K.rtSellingCosts, "3")));

  // Commit helpers (send to parent only on blur/commit) and sync local state
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

  // Do not update parent/local state on each keypress to avoid re-render blips
  const onNum = (_fieldKey: string) => (_value: number | string) => {};

  // Values now come from local state (above)

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Typography
      variant="h6"
      component="h3"
      sx={{
        fontWeight: 700,
        fontSize: { xs: "1.25rem", sm: "1.5rem" },
        lineHeight: 1.35,
        letterSpacing: 0.15,
        color: "white",
        borderBottom: "1px solid #bdbdbd",
        backgroundColor: MID_DARK_THEME_COLOR,
        px: 2,
        py: 4,
      }}
    >
      {children}
    </Typography>
  );

  const Row = ({
    label,
    control,
  }: {
    label: string;
    control: React.ReactNode;
  }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        borderBottom: "1px solid #bdbdbd",
        px: 1.5,
        py: 1.5,
        minHeight: { xs: 56, sm: 56 },
      }}
    >
      <Typography
        variant="body1"
        fontWeight={400}
        sx={{
          mr: { xs: 0, sm: 2 },
          minWidth: { xs: "100%", sm: 200, md: 240 },
          mb: { xs: 0.5, sm: 0 },
          fontSize: { xs: "1.125rem", sm: "1.25rem" },
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 80, width: { xs: "100%", sm: "100%" },fontSize: { xs: "1.125rem", sm: "1.25rem" }, pr: { xs: 0, sm: 1 } }}>{control}</Box>
    </Box>
  );

  const CardShell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <Card
      variant="outlined"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))",
        backdropFilter: "blur(10px) saturate(130%)",
        WebkitBackdropFilter: "blur(10px) saturate(130%)",
        border: 1,
        borderColor: "rgba(255,255,255,0.4)",
        borderRadius: 3,
        py: 0,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.55)",
      }}
    >
      <CardContent sx={{ py: 0, px: 0, display: "flex", flexDirection: "column", gap: 0, pb: "0 !important"}}>
        <SectionTitle>{title}</SectionTitle>
        <Box sx={{ px: 0, py: 0 }}>{children}</Box>
      </CardContent>
    </Card>
  );

  const ReadonlyRow = ({ label, value, bgColor, valueColor, labelFontWeight }: { label: string; value: React.ReactNode; bgColor?: string; valueColor?: string; labelFontWeight?: number }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        borderBottom: "1px solid #bdbdbd",
        px: 1.5,
        py: 1,
        minHeight: { xs: 56, sm: 56 },
        backgroundColor: bgColor ?? 'rgba(33,150,243,0.06)',
      }}
    >
      <Typography
        variant="body1"
        fontWeight={labelFontWeight ?? 400}
        sx={{
          mr: { xs: 0, sm: 2 },
          minWidth: { xs: "100%", sm: 200, md: 240 },
          mb: { xs: 0, sm: 0 },
          fontSize: { xs: "1.125rem", sm: "1.25rem" },
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 80, width: "100%", display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" }, pr: { xs: 0, sm: 1 } }}>
        <Typography sx={{ fontWeight: 400, fontSize: { xs: "1.125rem", sm: "1.25rem" }, color: "#000000" }}>{value}</Typography>
      </Box>
    </Box>
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
      {showRentalUnits && (
      <CardShell title="Multifamily Exit Assumptions">
        {/* Read-only rows fed from variables */}
        <ReadonlyRow
          label={`Forward NOI in ${variables?.["Deal Time Horizon"] ?? ""}`}
          value={formatCurrency(
            parseNumber(variables?.["Forward NOI in Month"], 0)
          )}
          bgColor="#fafbff"
          valueColor="#000000"
        />
        <Row
          label="Multifamily Exit Month"
          control={
            <ExitInlineMonthsInput
              value={mfExitMonth}
              onChange={onNum(K.mfExitMonth)}
              onCommit={commit(K.mfExitMonth)}
              min={1}
              max={130}
              step={1}
              sx={{ width: '100%' }}
            />
          }
        />
        <Row
          label="Multifamily Applied Exit Cap Rate"
          control={
            <ExitInlinePercentageInput
              value={mfCapRate}
              onChange={onNum(K.mfCapRate)}
              onCommit={commit(K.mfCapRate)}
              min={0}
              max={100}
              step={0.01}
              sx={{ width: '100%' }}
            />
          }
        />
        <ReadonlyRow
          label="Implied Valuation at Exit"
          value={formatCurrency(
            parseNumber(variables?.["Implied Valuation at Exit"], 0)
          )}
        />
        <ReadonlyRow
          label="Implied Valuation per Unit"
          value={(() => {
            const totalVal = parseNumber(variables?.["Implied Valuation at Exit"], 0);
            const perUnit = numUnits > 0 ? Math.round(totalVal / numUnits) : 0;
            return formatCurrency(perUnit);
          })()}
        />
        <Row
          label="Multifamily Less: Selling Costs"
          control={
            <ExitInlinePercentageInput
              value={mfSelling}
              onChange={onNum(K.mfSellingCosts)}
              onCommit={commit(K.mfSellingCosts)}
              min={0}
              max={100}
              step={0.01}
              sx={{ width: '100%' }}
            />
          }
        />
        <ReadonlyRow
          label="Selling Costs"
          value={formatCurrencyParens(
            parseNumber(variables?.["Selling Costs"], 0)
          )}
        />
        <ReadonlyRow
          label="Net Reversion Proceeds"
          value={formatCurrency(
            parseNumber(variables?.["Net Reversion Proceeds"], 0)
          )}
        />
      </CardShell>
      )}

      {showRetail && (
        <CardShell title="Retail Exit Assumptions">
          <ReadonlyRow
            label={`Forward NOI in ${variables?.["Deal Time Horizon"] ?? ""}`}
            value={formatCurrency(parseNumber(variables?.["Retail: Forward NOI in Month"], 0))}
          />
          <Row
            label="Retail Exit Month"
            control={
              <ExitInlineMonthsInput
                value={rtExitMonth}
                onChange={onNum(K.rtExitMonth)}
                onCommit={commit(K.rtExitMonth)}
                min={0}
                step={1}
                sx={{ width: '100%' }}
              />
            }
          />
          <Row
            label="Retail Applied Exit Cap Rate"
            control={
              <ExitInlinePercentageInput
                value={rtCapRate}
                onChange={onNum(K.rtCapRate)}
                onCommit={commit(K.rtCapRate)}
                min={0}
                max={100}
                step={0.01}
                sx={{ width: '100%' }}
              />
            }
          />
          <ReadonlyRow
            label="Implied Valuation at Exit"
            value={formatCurrency(parseNumber(variables?.["Retail: Implied Valuation at Exit"], 0))}
          />
          <ReadonlyRow
            label="Implied Valuation per Unit"
            value={(() => {
              const totalVal = parseNumber(variables?.["Retail: Implied Valuation at Exit"], 0);
              const perUnit = numUnits > 0 ? Math.round(totalVal / numUnits) : 0;
              return formatCurrency(perUnit);
            })()}
          />
          <Row
            label="Retail Less: Selling Costs"
            control={
              <ExitInlinePercentageInput
                value={rtSelling}
                onChange={onNum(K.rtSellingCosts)}
                onCommit={commit(K.rtSellingCosts)}
                min={0}
                max={100}
                step={0.01}
                sx={{ width: '100%' }}
              />
            }
          />
          <ReadonlyRow
            label="Selling Costs"
            value={formatCurrencyParens(parseNumber(variables?.["Retail: Selling Costs"], 0))}
          />
          <ReadonlyRow
            label="Net Reversion Proceeds"
            value={formatCurrency(parseNumber(variables?.["Retail: Net Reversion Proceeds"], 0))}
          />
        </CardShell>
      )}
      {showRetail && showRentalUnits && (
        <CardShell title="Combined Exit Summary">
          <ReadonlyRow
            label="Total Implied Property Valuation at Exit"
            value={(() => {
              const mfNet = parseNumber(variables?.["Implied Valuation at Exit"], 0);
              const rtNet = parseNumber(variables?.["Retail: Implied Valuation at Exit"], 0);
              return formatCurrency(mfNet + rtNet);
            })()}
            bgColor={THEME_LIGHT_GREEN}
            valueColor={THEME_GREEN}
          // labelFontWeight={700}
          />
          <ReadonlyRow
            label="Total NOI at Exit"
            value={formatCurrency(parseNumber(variables?.["Forward NOI in Month"], 0) + parseNumber(variables?.["Retail: Forward NOI in Month"], 0))}
            bgColor="#fafbff"
          valueColor="#000000"
          />
                    <ReadonlyRow
            label="Blended Cap Rate"
           value={(() => {
             const mfNOI = parseNumber(variables?.["Forward NOI in Month"], 0);
             const rtNOI = parseNumber(variables?.["Retail: Forward NOI in Month"], 0);
             const totalNOI = mfNOI + rtNOI;
             if (totalNOI <= 0) return "-";
             const mfCap = parseNumber(mfCapRate, 0); // percent value (e.g., 6.25)
             const rtCap = parseNumber(rtCapRate, 0);
             const blended = (mfCap * mfNOI + rtCap * rtNOI) / totalNOI;
             return `${blended.toFixed(2)}%`;
           })()}
            bgColor="#fafbff"
          valueColor="#000000"
          />
        </CardShell>
      )}
    </Box>
  );
}