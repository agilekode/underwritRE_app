import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

type PdfSummaryProps = {
  modelDetails: any;
  variables?: Record<string, any>;
  logoSrc?: string;
  options?: Record<string, boolean>;
  holdMonthsExternal?: number | null;
  pictures?: Array<{ picture_url: string; description?: string }>;
  order?: string[];
  companyInfo?: {
    company_name?: string;
    company_email?: string;
    company_phone_number?: string;
    company_logo_url?: string;
  } | null;
  summaryTables?: any[];
  otherTables?: any[];
  irrTable?: { capRates: (number | string)[]; acquisitionPrices: (number | string)[]; values: (number | string)[][] };
  moicTable?: { capRates: (number | string)[]; acquisitionPrices: (number | string)[]; values: (number | string)[][] };
  notes?: string[];
};

// Base styles for the PDF document
const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 64,
    paddingHorizontal: 32,
    fontSize: 11,
    color: "#1f2937", // slate-800
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 34,
    textAlign: "right",
    fontSize: 10,
    color: "#9CA3AF",
  },
  footerLeft: {
    position: "absolute",
    bottom: 24,
    left: 34,
    textAlign: "left",
    fontSize: 10,
    color: "#9CA3AF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderBottomStyle: "solid",
    paddingBottom: 2,
  },
  headerLeft: {
    width: "70%",
    paddingRight: 12,
    marginTop:36
  },
  headerRight: {
    width: 200, // fixed column so right edge is consistent with page padding/divider
    alignItems: "flex-end",
    paddingRight: 0,
    marginRight: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
  },
  subTitle: {
    fontSize: 12,
    marginTop: 1,
    color: "#4B5563",
  },
  logo: {
    height: 40,
    objectFit: "contain",
    alignSelf: "flex-end",
    marginRight: 0,
  },
  companyBlock: {
    alignItems: "flex-end",
  },
  logoWrap: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 4,
    marginRight: 0
  },
  companyLine: {
    fontSize: 9,
    color: "#4B5563",
    textAlign: "right",
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 2,
    textTransform: "uppercase",
    borderBottom: "1.2px solid #E5E7EB",
  },
  sectionHeaderWrap: {
    width: "100%",
    paddingBottom: 4,
    marginBottom: 8,
    borderBottomWidth: 1.2,
    borderBottomColor: "#E5E7EB",
    borderBottomStyle: "solid",
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "50%",
    paddingRight: 12,
    paddingBottom: 8,
  },
  gridItemFull: {
    width: "100%",
    paddingRight: 12,
    paddingBottom: 8,
  },
  gridItemThird: {
    width: "33.3333%",
    paddingRight: 12,
    paddingBottom: 8,
  },
  label: {
    color: "#6B7280",
    fontSize: 10,
  },
  value: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: 700,
  },
});

// Minimal, printable PDF document. Extend sections as needed.
export const PdfSummaryDocument: React.FC<PdfSummaryProps> = ({
  modelDetails,
  variables = {},
  logoSrc,
  options = {},
  holdMonthsExternal,
  pictures = [],
  order = [],
  companyInfo = null,
  summaryTables = [],
  otherTables = [],
  irrTable,
  moicTable,
  notes = [],
}) => {
  const addressLine = modelDetails
    ? `${modelDetails?.street_address ?? ""}, ${modelDetails?.city ?? ""}, ${
        modelDetails?.state ?? ""
      } ${modelDetails?.zip_code ?? ""}`
    : "";

  const safeVar = (k: string) => (variables && variables[k] !== undefined ? String(variables[k]) : "-");

  // Basic helper to parse numbers from mixed strings (e.g., "10", "10%")
  const toNum = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    const n = Number(String(v).replace(/[^0-9.+-]/g, ""));
    return Number.isFinite(n) ? n : null;
  };
  // Match ModelDetails.tsx Hold Period logic: use max of Multifamily/Retail Exit Month only
  const computedHoldMonths = (() => {
    const mf = toNum((variables as any)["Multifamily Exit Month"]);
    const rt = toNum((variables as any)["Retail Exit Month"]);
    if (mf === null && rt === null) return null;
    const max = Math.max(mf ?? 0, rt ?? 0);
    return Number.isFinite(max) ? max : null;
  })();
  const holdMonths = holdMonthsExternal ?? computedHoldMonths;

  // Table utilities (modeled after renderTableMappingRows) for trimming and rendering tables
  const isBlank = (cell: any) =>
    cell === null || cell === undefined || (typeof cell === "string" && cell.trim() === "");

  // PDF page sizing helpers (LETTER width 612pt, horizontal padding 32*2 = 64)
  const CONTENT_WIDTH = 612 - 64; // 548
  const FULL_IMG_WIDTH = CONTENT_WIDTH;
  const HALF_IMG_WIDTH = Math.floor((CONTENT_WIDTH - 8) / 2); // account for inner paddingRight: 8

  const buildTrimmedTable = (mapping: any) => {
    const data: any[][] = Array.isArray(mapping?.data) ? mapping.data : [];
    const stylesArr: any[][] = Array.isArray(mapping?.styles) ? mapping.styles : [];
    let lastNonBlank = -1;
    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i] || [];
      if (row.some((cell) => !isBlank(cell))) {
        lastNonBlank = i;
        break;
      }
    }
    if (lastNonBlank === -1) return { rows: [] as any[][], styles: [] as any[][] };
    const keptRowIndices: number[] = Array.from({ length: lastNonBlank + 1 }, (_, i) => i);
    const maxCols = keptRowIndices.reduce((m, ri) => Math.max(m, (data[ri] || []).length), 0);
    const keptColIndices: number[] = [];
    for (let c = 0; c < maxCols; c++) {
      let keep = false;
      for (const ri of keptRowIndices) {
        const cell = (data[ri] || [])[c];
        if (!isBlank(cell)) {
          keep = true;
          break;
        }
      }
      if (keep) keptColIndices.push(c);
    }
    const rows = keptRowIndices.map((ri) => keptColIndices.map((ci) => (data[ri] || [])[ci] ?? ""));
    const styles = keptRowIndices.map((ri) => keptColIndices.map((ci) => (stylesArr[ri] || [])[ci] ?? ""));
    return { rows, styles };
  };

  const tableStyles = StyleSheet.create({
    container: {
      marginTop: 6,
    },
    table: {
      width: "100%",
      marginTop: 6,
    },
    tableRow: { flexDirection: "row", flexShrink: 0 },
    tableCell: {
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      borderBottomStyle: "solid",
      paddingVertical: 6,
      paddingRight: 8,
      paddingLeft: 8,
      fontSize: 8,
      flexShrink: 0,
    },
    tableHeaderCell: { fontWeight: 700 },
    right: { textAlign: "right" as const },
  });

  // Map CSS-like inline style strings to react-pdf supported styles
  const mapCssToPdfStyle = (styleStr: string): { cell: any; text: any } => {
    if (!styleStr || typeof styleStr !== "string") return { cell: {}, text: {} };
    const outCell: any = {};
    const outText: any = {};
    const parts = styleStr
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      const [rawK, rawV] = part.split(":");
      if (!rawK || !rawV) continue;
      const k = rawK.trim().toLowerCase();
      const v = rawV.trim();
      if (k === "background-color") outCell.backgroundColor = v;
      else if (k === "color") outText.color = v;
      else if (k === "font-weight") outText.fontWeight = v === "bold" ? 700 : Number(v) || undefined;
      else if (k === "text-align") outText.textAlign = v as any;
      else if (k === "border-bottom") {
        // expect like: 1px solid #e0e0e0
        const m = v.match(/(\d+)px\s+\w+\s+(.*)/);
        outCell.borderBottomWidth = m ? Number(m[1]) : 1;
        outCell.borderBottomStyle = "solid";
        outCell.borderBottomColor = m ? m[2] : "#e5e7eb";
      }
    }
    return { cell: outCell, text: outText };
  };

  const looksNumeric = (val: any): boolean => {
    const s = String(val ?? "").trim();
    if (!s) return false;
    return /[0-9]/.test(s) && !/[a-zA-Z]/.test(s);
  };

  const renderPdfTable = (mapping: any, key: string) => {
    const { rows, styles } = buildTrimmedTable(mapping);
    if (!rows || rows.length === 0) return null;
    const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const base = colCount > 0 ? 100 / (colCount + 1) : 100; // first column counts as 2x
    const firstPct = (2 * base).toFixed(6);
    const otherPct = base.toFixed(6);
    // Small tables should stay together; large tables can paginate by row
    const keepTogether = rows.length <= 18;
    const containerProps: any = keepTogether ? { wrap: false } : {};
    return (
      <View key={key} style={tableStyles.container} {...containerProps}>
        <View style={tableStyles.table}>
          {rows.map((row, ri) => (
            <View key={`r-${ri}`} style={tableStyles.tableRow} wrap={false}>
            {Array.from({ length: colCount }).map((_, ci) => {
              const raw = row[ci];
              const cellStyleStr = (styles[ri] && styles[ri][ci]) || "";
              const mapped = mapCssToPdfStyle(cellStyleStr);
              const isFirst = ci === 0;
              const finalCellStyle = [
                tableStyles.tableCell,
                ri === 0 ? tableStyles.tableHeaderCell : undefined,
                mapped.cell,
                { width: `${isFirst ? firstPct : otherPct}%` },
              ] as any;
              const finalTextStyle = [
                mapped.text,
                !isFirst ? tableStyles.right : undefined,
              ] as any;
              return (
                <View key={`c-${ci}`} style={finalCellStyle}>
                  <Text style={finalTextStyle}>
                    {raw === undefined || raw === null || String(raw).trim() === "" ? " " : String(raw)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
        </View>
      </View>
    );
  };

  // Sensitivity table rendering (IRR/MOIC)
  const renderSensitivity = (
    tbl: { capRates: (number | string)[]; acquisitionPrices: (number | string)[]; values: (number | string)[][] } | undefined,
    key: string,
    format: (n: number) => string,
    leftHeader: string
  ) => {
    if (!tbl || !Array.isArray(tbl.capRates) || !Array.isArray(tbl.acquisitionPrices)) return null;
    const headerRow = [leftHeader, ...tbl.acquisitionPrices.map((p) => `$${(toNum(p) ?? 0).toLocaleString()}`)];
    const rows = [headerRow, ...tbl.capRates.map((cr, ri) => {
      const left = `${(toNum(cr) ?? 0).toFixed(2)}%`;
      const vals = (tbl.values?.[ri] || []).map((v) => format(toNum(v) ?? 0));
      return [left, ...vals];
    })];
    const colCount = rows[0]?.length || 0;
    const base = colCount > 0 ? 100 / (colCount + 1) : 100; // 2x first col
    const firstPct = (2 * base).toFixed(6);
    const otherPct = base.toFixed(6);
    return (
      <View key={key} style={tableStyles.container}>
        <View style={tableStyles.table}>
          {rows.map((row, ri) => (
            <View key={`sr-${ri}`} style={tableStyles.tableRow} wrap={false}>
              {row.map((raw, ci) => {
                const isFirst = ci === 0;
                const finalCellStyle = [
                  tableStyles.tableCell,
                  ri === 0 ? tableStyles.tableHeaderCell : undefined,
                  { width: `${isFirst ? firstPct : otherPct}%` },
                ] as any;
                const finalTextStyle = [!isFirst ? tableStyles.right : undefined] as any;
                return (
                  <View key={`sc-${ci}`} style={finalCellStyle}>
                    <Text style={finalTextStyle}>{String(raw)}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Generic simple table renderer from an array-of-arrays
  const renderSimpleTable = (rows: (string | number)[][], key: string) => {
    if (!rows || rows.length === 0) return null;
    const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const base = colCount > 0 ? 100 / (colCount + 1) : 100;
    const firstPct = (2 * base).toFixed(6);
    const otherPct = base.toFixed(6);
    return (
      <View key={key} style={tableStyles.container} wrap={false}>
        <View style={tableStyles.table}>
          {rows.map((row, ri) => (
            <View key={`sr-${ri}`} style={tableStyles.tableRow}>
              {Array.from({ length: colCount }).map((_, ci) => {
                const isFirst = ci === 0;
                const raw = row[ci] ?? '';
                const finalCellStyle = [
                  tableStyles.tableCell,
                  ri === 0 ? tableStyles.tableHeaderCell : undefined,
                  { width: `${isFirst ? firstPct : otherPct}%` },
                ] as any;
                const finalTextStyle = [!isFirst ? tableStyles.right : undefined] as any;
                return (
                  <View key={`sc-${ci}`} style={finalCellStyle}>
                    <Text style={finalTextStyle}>{String(raw)}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ===== Income & Expenses helpers =====
  const getUserField = (key: string) => {
    try {
      const f = (modelDetails?.user_model_field_values || []).find((x: any) => x.field_key === key);
      return f?.value;
    } catch { return undefined; }
  };

  const renderUnitsTable = () => {
    const units: any[] = Array.isArray(modelDetails?.units) ? modelDetails.units : [];
    if (!units.length) return null;
    const mra: any[] = Array.isArray(modelDetails?.market_rent_assumptions) ? modelDetails.market_rent_assumptions : [];
    const header = ['Unit','Layout','Square Feet','Current Rent','Rent Type','Pro Forma Rent'];
    let totalUnits = 0, totalSf = 0, totalCurrent = 0, totalPf = 0;
    const rows = [header, ...units.map((u: any, i: number) => {
      totalUnits += 1;
      totalSf += Number(u.square_feet || 0);
      totalCurrent += Number(u.current_rent || 0);
      const pfAssump = mra.find((a: any) => a.layout === u.layout);
      const pfRent = pfAssump?.pf_rent;
      const displayPf = (u.vacate_flag === 0 || u.vacate_flag === '0')
        ? (u.current_rent != null ? `$${Number(u.current_rent).toLocaleString()}` : '')
        : (pfRent != null ? `$${Number(pfRent).toLocaleString()}` : '');
      totalPf += (u.vacate_flag === 0 || u.vacate_flag === '0') ? Number(u.current_rent || 0) : Number(pfRent || 0);
      return [
        String(i + 1),
        u.layout ?? '',
        u.square_feet != null ? Number(u.square_feet).toLocaleString() : '',
        u.current_rent != null ? `$${Number(u.current_rent).toLocaleString()}` : '',
        u.rent_type ?? '',
        displayPf,
      ];
    })];

    // Append totals row aligned to columns
    const totalsRow = [
      'Totals',
      '',
      totalSf.toLocaleString(),
      `$${totalCurrent.toLocaleString()}`,
      '',
      `$${totalPf.toLocaleString()}`,
    ];
    const allRows = [...rows, totalsRow];
    const colCount = header.length;
    const base = 100 / (colCount + 1); // first column 2x
    const firstPct = (2 * base).toFixed(6);
    const otherPct = base.toFixed(6);

    return (
      <View style={styles.section}>
        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 6 }}>Units</Text>
        <View wrap={false}>
          <View style={tableStyles.table}>
            {allRows.map((row, ri) => {
              const isHeader = ri === 0;
              const isTotals = ri === allRows.length - 1;
              return (
                <View key={`u-r-${ri}`} style={tableStyles.tableRow} wrap={false}>
                  {Array.from({ length: colCount }).map((_, ci) => {
                    const isFirst = ci === 0;
                    const raw = row[ci] ?? '';
                    const finalCellStyle = [
                      tableStyles.tableCell,
                      isHeader ? tableStyles.tableHeaderCell : undefined,
                      isTotals ? { backgroundColor: '#F3F4F6' } : undefined,
                      { width: `${isFirst ? firstPct : otherPct}%` },
                    ] as any;
                    const finalTextStyle = [
                      !isFirst ? tableStyles.right : undefined,
                      isTotals && isFirst ? { fontWeight: 700 } : undefined,
                    ] as any;
                    return (
                      <View key={`u-c-${ri}-${ci}`} style={finalCellStyle}>
                        <Text style={finalTextStyle}>{String(raw)}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderAmenityIncomeTable = () => {
    const list: any[] = Array.isArray(modelDetails?.amenity_income) ? modelDetails.amenity_income : [];
    if (!list.length) return null;
    const header = ['Name','Start Month','Utilization','Unit Count','Monthly Fee','Usage','Monthly','Annual'];
    let totalMonthly = 0, totalAnnual = 0;
    const rows = [header, ...list.map((row: any) => {
      const utilization = Number(row.utilization || 0);
      const unitCount = Number(row.unit_count || 0);
      const usage = Math.round((utilization / 100) * unitCount);
      const monthly = usage * Number(row.monthly_fee || 0);
      const annual = monthly * 12;
      totalMonthly += monthly; totalAnnual += annual;
      return [
        row.name ?? '',
        row.start_month ?? '',
        `${utilization}%`,
        `${unitCount} units`,
        row.monthly_fee != null ? `$${row.monthly_fee}` : '',
        `${usage} Units`,
        `$${Number(monthly).toLocaleString()}`,
        `$${Number(annual).toLocaleString()}`,
      ];
    })];
    const totalsRow = [
      'Totals', '', '', '', '', '',
      `$${Number(totalMonthly).toLocaleString()}`,
      `$${Number(totalAnnual).toLocaleString()}`
    ];
    const allRows = [...rows, totalsRow];
    const colCount = header.length;
    const base = 100 / (colCount + 1);
    const firstPct = (2 * base).toFixed(6);
    const otherPct = base.toFixed(6);
    return (
      <View style={styles.section}>
        <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 12 }}>Amenity Income</Text>
        <View wrap={false}>
          <View style={tableStyles.table}>
            {allRows.map((row, ri) => {
              const isHeader = ri === 0;
              const isTotals = ri === allRows.length - 1;
              return (
                <View key={`am-r-${ri}`} style={tableStyles.tableRow} wrap={false}>
                  {Array.from({ length: colCount }).map((_, ci) => {
                    const isFirst = ci === 0;
                    const raw = row[ci] ?? '';
                    const finalCellStyle = [
                      tableStyles.tableCell,
                      isHeader ? tableStyles.tableHeaderCell : undefined,
                      isTotals ? { backgroundColor: '#F3F4F6' } : undefined,
                      { width: `${isFirst ? firstPct : otherPct}%` },
                    ] as any;
                    const finalTextStyle = [
                      !isFirst ? tableStyles.right : undefined,
                      isTotals && isFirst ? { fontWeight: 700 } : undefined,
                    ] as any;
                    return (
                      <View key={`am-c-${ri}-${ci}`} style={finalCellStyle}>
                        <Text style={finalTextStyle}>{String(raw)}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderOperatingExpensesTable = () => {
    const list: any[] = Array.isArray(modelDetails?.operating_expenses) ? modelDetails.operating_expenses : [];
    if (!list.length) return null;
    const header = ['Name','Cost per','Expense','Statistic','Monthly','Annual'];
    const units: any[] = Array.isArray(modelDetails?.units) ? modelDetails.units : [];
    const retailIncome: any[] = Array.isArray(modelDetails?.retail_income) ? modelDetails.retail_income : [];
    const retailExpenses: any[] = Array.isArray(modelDetails?.expenses) ? modelDetails.expenses.filter((e:any)=>e.type==='Retail') : [];
    const amenityIncome: any[] = Array.isArray(modelDetails?.amenity_income) ? modelDetails.amenity_income : [];
    const getRetailIncomeTotal = (arr: any[]) => arr.reduce((sum: number, u: any) => sum + (u.square_feet * (u.rent_per_square_foot_per_year || 0)), 0);
    const totalRetailIncome = getRetailIncomeTotal(retailIncome);
    const egi = (() => {
      // conservative EGI: current rents + amenity monthly * 12 + retail income annual-like
      const current = units.reduce((sum, u:any)=> sum + Number(u.current_rent || 0), 0) * 12;
      const amenMonthly = amenityIncome.reduce((sum, a:any)=>{
        const util = Number(a.utilization || 0); const cnt = Number(a.unit_count || 0); const usage = Math.round((util/100)*cnt); return sum + usage*Number(a.monthly_fee||0);
      },0);
      return current + amenMonthly*12 + totalRetailIncome;
    })();
    let totalMonthly = 0, totalAnnual = 0;
    const rows = [header, ...list.map((row:any)=>{
      const byUnit = String(row.cost_per || '').toLowerCase();
      let statistic: string | number | null = null;
      if (byUnit === 'per unit') statistic = `${units.length} units`;
      else if (byUnit === 'per ca square foot' || byUnit === 'per total square feet') {
        const totalSf = Number(getUserField('Gross Square Feet') || 0);
        statistic = `${totalSf.toLocaleString()} sf`;
      }
      const expenseVal = row.factor;
      let monthly = 0, annual = 0;
      if (byUnit === 'per unit') { annual = expenseVal * units.length; monthly = annual/12; }
      else if (byUnit === 'total') { annual = expenseVal; monthly = annual/12; }
      else if (byUnit === 'per ca square foot' || byUnit === 'per total square feet') { const totalSf = Number(getUserField('Gross Square Feet') || 0); annual = Math.round(expenseVal * totalSf); monthly = annual/12; }
      else if (byUnit === 'percent of egi') { annual = (expenseVal * egi)/100; monthly = annual/12; }
      totalMonthly += monthly; totalAnnual += annual;
      return [
        row.name ?? '',
        row.cost_per ?? '',
        byUnit === 'percent of egi' ? `${expenseVal}%` : (['per unit','total','per ca square foot','per total square feet'].includes(byUnit) ? `$${Number(expenseVal).toLocaleString()}` : String(expenseVal)),
        statistic ?? '',
        `$${Number(monthly).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}`,
        `$${Number(annual).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}`,
      ];
    })];

    const totalsRow = [
      'Totals', '', '', '',
      `$${Number(totalMonthly).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}`,
      `$${Number(totalAnnual).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}`,
    ];
    const allRows = [...rows, totalsRow];
    const colCount = header.length;
    const base = 100 / (colCount + 1);
    const firstPct = (2 * base).toFixed(6);
    const otherPct = base.toFixed(6);

    return (
      <View style={styles.section} break>
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>OPERATING EXPENSES</Text>
        </View>
        <View wrap={false}>
          <View style={tableStyles.table}>
            {allRows.map((row, ri) => {
              const isHeader = ri === 0;
              const isTotals = ri === allRows.length - 1;
              return (
                <View key={`op-r-${ri}`} style={tableStyles.tableRow} wrap={false}>
                  {Array.from({ length: colCount }).map((_, ci) => {
                    const isFirst = ci === 0;
                    const raw = row[ci] ?? '';
                    const finalCellStyle = [
                      tableStyles.tableCell,
                      isHeader ? tableStyles.tableHeaderCell : undefined,
                      isTotals ? { backgroundColor: '#F3F4F6' } : undefined,
                      { width: `${isFirst ? firstPct : otherPct}%` },
                    ] as any;
                    const finalTextStyle = [
                      !isFirst ? tableStyles.right : undefined,
                      isTotals && isFirst ? { fontWeight: 700 } : undefined,
                    ] as any;
                    return (
                      <View key={`op-c-${ri}-${ci}`} style={finalCellStyle}>
                        <Text style={finalTextStyle}>{String(raw)}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{modelDetails?.name ?? "Model Summary"}</Text>
            <Text style={styles.subTitle}>{addressLine}</Text>
          </View>
          <View style={[styles.companyBlock, styles.headerRight]}>
            {options["Include Company Logo"] && (logoSrc || (companyInfo && companyInfo.company_logo_url)) ? (
              <View style={styles.logoWrap}>
                <Image style={styles.logo} src={logoSrc || (companyInfo?.company_logo_url as any)} />
              </View>
            ) : null}
            {options["Include Company Info"] && (companyInfo?.company_name || companyInfo?.company_phone_number || companyInfo?.company_email) ? (
              <View>
                {companyInfo?.company_name ? <Text style={styles.companyLine}>{companyInfo.company_name}</Text> : null}
                {companyInfo?.company_phone_number ? <Text style={styles.companyLine}>{companyInfo.company_phone_number}</Text> : null}
                {companyInfo?.company_email ? <Text style={styles.companyLine}>{companyInfo.company_email}</Text> : null}
              </View>
            ) : null}
          </View>
        </View>

        

        {/* Render sections strictly in the provided order */}
        {Array.isArray(order) && order.length > 0
          ? order.map((key, idx) => {
              // Handle named tables from otherTables
              const tbl = (otherTables as any[]).find((t: any) => t?.table_name === key);

              if (key === "Summary Info" && options["Summary Info"]) {
                return (
                  <View key={`sec-${idx}`} style={styles.section} {...(idx > 0 ? { break: true } : {})}>
              <Text style={styles.sectionTitle}>Key Performance Metrics</Text>
              <View style={styles.grid}>
                <View style={styles.gridItemThird}>
                  <Text style={styles.label}>Levered IRR</Text>
                  <Text style={styles.value}>{modelDetails?.levered_irr ?? safeVar("Levered IRR")}</Text>
                </View>
                <View style={styles.gridItemThird}>
                  <Text style={styles.label}>Levered MOIC</Text>
                  <Text style={styles.value}>{modelDetails?.levered_moic ?? safeVar("Levered MOIC")}</Text>
                </View>
                <View style={styles.gridItemThird}>
                  <Text style={styles.label}>Hold Period</Text>
                  <Text style={styles.value}>{holdMonths !== null ? `${String(holdMonths)} Months` : '-'}</Text>
                </View>
              </View>
            {summaryTables && summaryTables.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary Tables</Text>
                        {summaryTables.map((tbl: any, i: number) => renderPdfTable(tbl, `sum-${i}`))}
              </View>
            ) : null}
                  </View>
                );
              }

              if (key === "Sensitivity Tables" && options["Sensitivity Tables"]) {
                return (
                  <View key={`sec-${idx}`} style={styles.section} {...(idx > 0 ? { break: true } : {})}>
            <Text style={styles.sectionTitle}>Sensitivity Tables</Text>
            {irrTable ? (
              <>
                <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 6 }}>Levered IRR Sensitivity Analysis</Text>
                <Text style={{ fontSize: 8, color: '#6B7280' }}>Exit Cap Rate (%) vs Acquisition Price ($)</Text>
                {renderSensitivity(irrTable, 'irr', (n) => `${n.toFixed(1)}%`, 'Exit Cap Rate (%)')}
              </>
            ) : null}
            {moicTable ? (
              <>
                <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 12 }}>Levered MOIC Sensitivity Analysis</Text>
                <Text style={{ fontSize: 8, color: '#6B7280' }}>Exit Cap Rate (%) vs Acquisition Price ($)</Text>
                {renderSensitivity(moicTable, 'moic', (n) => `${n.toFixed(2)}x`, 'Exit Cap Rate (%)')}
              </>
            ) : null}
          </View>
                );
              }

              if (key === "Income and Expenses" && options["Income and Expenses"]) {
                return (
                  <View key={`sec-${idx}`} style={styles.section} {...(idx > 0 ? { break: true } : {})}>
            <Text style={styles.sectionTitle}>Income and Expenses</Text>
            {renderUnitsTable()}
            {renderAmenityIncomeTable()}
            {renderOperatingExpensesTable()}
          </View>
                );
              }

              if (key === "Property Images" && options["Property Images"] && Array.isArray(pictures) && pictures.length > 0) {
                return (
                  <View key={`sec-${idx}`} style={styles.section} {...(idx > 0 ? { break: true } : {})}>
                    <Text style={styles.sectionTitle}>Property Images</Text>
                    <View style={{ marginBottom: 8 }}>
                      <Image
                        src={String(pictures[0]?.picture_url)}
                        style={{ height: 280, maxWidth: FULL_IMG_WIDTH, objectFit: "contain", alignSelf: "flex-start" }}
                      />
                      {(() => {
                        const desc = String(pictures[0]?.description || "").trim();
                        return desc
                          ? (<Text style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}>{desc}</Text>)
                          : null;
                      })()}
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {pictures.slice(1).map((p, i) => (
                        <View key={`pic-${i}`} style={{ width: HALF_IMG_WIDTH, paddingRight: 8, paddingBottom: 8 }}>
                          <Image
                            src={String(p.picture_url)}
                            style={{ height: 180, maxWidth: HALF_IMG_WIDTH, objectFit: "contain", alignSelf: "flex-start" }}
                          />
                          {(() => {
                            const desc = String(p.description || "").trim();
                            return desc
                              ? (<Text style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}>{desc}</Text>)
                              : null;
                          })()}
                        </View>
                      ))}
                    </View>
                  </View>
                );
              }

              if (key === "Include Notes" && options["Include Notes"]) {
                if (Array.isArray(notes) && notes.length > 1) {
                  return (
                    <View key={`sec-${idx}`} style={styles.section} {...(idx > 0 ? { break: true } : {})}>
                      <Text style={styles.sectionTitle}>Notes</Text>
                      <View style={{ marginTop: 6 }}>
                        {notes.map((n, i) => {
                          const isLast = i === notes.length - 1;
                          return (
                            <View
                              key={`note-${i}`}
                              style={{
                                marginBottom: 6,
                                paddingBottom: 6,
                                borderBottomWidth: isLast ? 0 : 1,
                                borderBottomColor: "#E5E7EB",
                                borderBottomStyle: "solid",
                              }}
                            >
                              <Text style={{ fontSize: 10, color: "#374151", lineHeight: 1.4 as any }}>
                                {String(n)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                }
                return null;
              }

              // Handle named table
              if (tbl && options[key]) {
                return (
                  <View key={`tbl-${idx}`} style={styles.section} {...(idx > 0 ? { break: true } : {})}>
                    <Text style={styles.sectionTitle}>{key}</Text>
                    {renderPdfTable(tbl, `tbl-${idx}`)}
                </View>
                );
              }
              return null;
            })
          : null}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber }) => `${pageNumber}`}
          fixed
        />
        <Text style={styles.footerLeft} fixed>
          Powered by underwritre.com
        </Text>
      </Page>
    </Document>
  );
};

export default PdfSummaryDocument;


