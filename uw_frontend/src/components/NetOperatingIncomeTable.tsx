import { Box, CircularProgress, Tooltip } from "@mui/material";
import { colors, typography } from "../theme";

export const NetOperatingIncomeTable = ({
  finalMetricsCalculating,
  noiTableValues,
}: {
  finalMetricsCalculating: boolean;
  noiTableValues: any[];
}) => {
  // Helpers to trim and render a 2D array similar to ModelDetails.tsx
  const isBlank = (val: any) =>
    val === null ||
    val === undefined ||
    (typeof val === "string" && val.trim() === "");

  const buildTrimmed = (rows: any[][]) => {
    const safeRows: any[][] = Array.isArray(rows) ? rows : [];
    // Trim leading and trailing completely blank rows; keep interior blank rows
    let lastNonBlank = -1;
    for (let i = safeRows.length - 1; i >= 0; i--) {
      const r = safeRows[i];
      if (Array.isArray(r) && r.some((c) => !isBlank(c))) {
        lastNonBlank = i;
        break;
      }
    }
    if (lastNonBlank === -1) return { rows: [] as any[][], keptCols: [] as number[] };
    let firstNonBlank = 0;
    for (let i = 0; i <= lastNonBlank; i++) {
      const r = safeRows[i];
      if (Array.isArray(r) && r.some((c) => !isBlank(c))) {
        firstNonBlank = i;
        break;
      }
    }
    const keptRows = safeRows.slice(firstNonBlank, lastNonBlank + 1);
    const maxCols = keptRows.reduce((m, r) => Math.max(m, (r || []).length), 0);
    const keptCols: number[] = [];
    for (let c = 0; c < maxCols; c++) {
      let keep = false;
      for (const r of keptRows) {
        if (!isBlank(r[c])) {
          keep = true;
          break;
        }
      }
      if (keep) keptCols.push(c);
    }
    const trimmedRows = keptRows.map((r) => keptCols.map((ci) => (r || [])[ci] ?? ""));
    return { rows: trimmedRows, keptCols };
  };

  const { rows, keptCols } = buildTrimmed(Array.isArray(noiTableValues) ? noiTableValues : []);
  // Hide the first row (sheet title row)
  const rowsToRender = rows.slice(1);

  // Consider the table \"loading\" until we have at least one row to render,
  // or while the calculation flag is set
  const isLoading =
    finalMetricsCalculating ||
    !Array.isArray(noiTableValues) ||
    noiTableValues.length === 0 ||
    rowsToRender.length === 0;

  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", p: 2 }}>
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 240,
            py: 6,
          }}
          aria-busy
        >
          <CircularProgress />
        </Box>
      ) : (
      <Box sx={{ overflowX: "auto" }}>
        <table style={{
          borderCollapse: "separate",
          borderSpacing: 0,
          width: "100%",
          border: `1px solid ${colors.grey[300]}`,
          borderRadius: 8,
          overflow: "hidden",
        }}>
          <tbody>
            {rowsToRender.map((row, ri) => {
              const firstCell = row?.[0];
              const label = typeof firstCell === "string" ? firstCell.trim() : String(firstCell ?? "");
              const emphasize =
                label === "Effective Gross Income" ||
                label === "Total Operating Expenses" ||
                label === "Total Property NOI";
              const isYieldOnCost = !(
                ri === 0
              ) && label === "Yield on Cost";
              const isVacancyPercent = label === "Vacancy" && row.some((c) => {
                const s = String(c ?? "");
                return s.includes("%");
              });
              const isOperatingExpensesHeader = label === "Operating Expenses";
              const isNoiHighlight = label === "Multifamily NOI" || label === "Retail NOI";
              const isLastRow = ri === rowsToRender.length - 1;
              const isFirstRow = ri === 0;
              return (
              <tr key={`r-${ri}`}>
                {row.map((cell, ci) => {
                  const isFirstCol = ci === 0;
                  const isLastCol = ci === row.length - 1;
                  // Determine border radius for corners
                  let borderRadius: string | undefined;
                  if (isFirstRow && isFirstCol) borderRadius = "7px 0 0 0";
                  else if (isFirstRow && isLastCol) borderRadius = "0 7px 0 0";
                  else if (isLastRow && isFirstCol) borderRadius = "0 0 0 7px";
                  else if (isLastRow && isLastCol) borderRadius = "0 0 7px 0";

                  return (
                  <td
                    key={`c-${ci}`}
                    style={{
                      padding: "6px 16px",
                      borderBottom: isLastRow ? "none" : (isNoiHighlight ? `2px solid ${colors.grey[300]}` : `1px solid ${colors.grey[300]}`),
                      borderTop: (emphasize || isYieldOnCost) && !isFirstRow ? `2px solid ${colors.grey[300]}` : undefined,
                      verticalAlign: "middle",
                      textAlign: ci === 0 ? "left" : "right",
                      fontFamily: typography.fontFamily,
                      fontSize: typography.fontSize.sm,
                      fontWeight: isFirstRow ? typography.fontWeight.bold : ((emphasize || isNoiHighlight || isOperatingExpensesHeader) ? typography.fontWeight.semibold : typography.fontWeight.regular),
                      fontStyle: (isYieldOnCost || isVacancyPercent) ? "italic" : undefined,
                      backgroundColor: isFirstRow ? colors.navy : (isNoiHighlight ? colors.grey[50] : colors.white),
                      color: isFirstRow ? colors.white : colors.grey[900],
                      lineHeight: typography.lineHeight.normal,
                      borderRadius,
                    }}
                  >
                    {(() => {
                      const val = cell;
                      if (val === null || val === undefined) return "\u00A0";
                      const str = typeof val === "string" ? val : String(val);
                        const display = str.trim() === "" ? "\u00A0" : val;
                        if (isYieldOnCost && ci === 0) {
                          return (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span>{display}</span>
                              <Tooltip
                                title="Net Operating Income divided by the Total Capital Invested into the deal"
                                arrow
                                enterDelay={100}
                                placement="right"
                              >
                                <span
                                  style={{
                                    fontStyle: "normal",
                                    cursor: "help",
                                    color: colors.grey[600],
                                    border: `1px solid ${colors.grey[300]}`,
                                    borderRadius: "50%",
                                    width: 14,
                                    height: 14,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: typography.fontSize.xs,
                                    lineHeight: "12px",
                                    background: colors.grey[50],
                                    fontFamily: typography.fontFamily,
                                  }}
                                  aria-label="Yield on Cost info"
                                >
                                  i
                                </span>
                              </Tooltip>
                            </span>
                          );
                        }
                        return display;
                    })()}
                  </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
      )}
    </Box>
  );
};
