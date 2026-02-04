"use client"

import React, { useMemo } from "react"
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from "@mui/material"

interface SensitivityTableProps {
  data: {
    capRates: (number | string)[]
    acquisitionPrices: (number | string)[]
    values: (number | string)[][]
  }
  formatValue: (value: number) => string
  title: string
  isLoading?: boolean
}

export default function SensitivityTable({ data, formatValue, title, isLoading = false }: SensitivityTableProps) {
  const toNumeric = (val: number | string): number => {
    if (typeof val === "number") return val
    const s = String(val).trim().toLowerCase()
    // strip commas/spaces
    const stripped = s.replace(/,/g, "")
    if (stripped.endsWith("%")) return parseFloat(stripped.slice(0, -1))
    if (stripped.endsWith("x")) return parseFloat(stripped.slice(0, -1))
    const n = parseFloat(stripped)
    return isNaN(n) ? Number.NEGATIVE_INFINITY : n
  }

  const parseNumber = (val: number | string): number => {
    if (typeof val === "number") return val
    const n = Number(String(val).replace(/[^0-9.-]/g, ""))
    return isNaN(n) ? 0 : n
  }

  const maxValue = useMemo(() => {
    const flat = (data?.values || []).flat()
    const nums = flat.map(toNumeric).filter((v) => Number.isFinite(v)) as number[]
    if (!nums.length) return undefined
    return Math.max(...nums)
  }, [data])

  const effectiveHighlight = maxValue

  return (
    <TableContainer
      component={Paper}
      sx={{
        overflowX: "auto",
        borderRadius: 2,
        // boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        // border: "1px solid",
        // borderColor: "grey.200",
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.100" }}>
            <TableCell
              sx={{
                fontWeight: 600,
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                fontSize: "0.875rem",
                color: "grey.700",
                borderRight: "1px solid",
                borderColor: "grey.300",
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0 }}>
                Exit Cap Rate (%)
                </Typography>
                <Typography variant="caption" sx={{ color: "grey.600" }}>
                  vs
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {title}
                </Typography>
              </Box>
            </TableCell>
            {isLoading ? (
              // Loading state - show skeleton columns
              Array.from({ length: 5 }, (_, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{
                    fontWeight: 600,
                    bgcolor: "grey.50",
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    fontSize: "0.875rem",
                    color: "grey.700",
                    minWidth: 100,
                    borderRight: index < 4 ? "1px solid" : "none",
                    borderColor: "grey.200",
                  }}
                >
                  <Box
                    sx={{
                      width: "80px",
                      height: "20px",
                      bgcolor: "grey.300",
                      borderRadius: 1,
                      margin: "0 auto",
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%": { opacity: 1 },
                        "50%": { opacity: 0.5 },
                        "100%": { opacity: 1 },
                      },
                    }}
                  />
                </TableCell>
              ))
            ) : (
              data.acquisitionPrices.map((price, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{
                    fontWeight: 600,
                    bgcolor: "grey.50",
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    fontSize: "0.875rem",
                    color: "grey.700",
                    minWidth: 100,
                    borderRight: index < data.acquisitionPrices.length - 1 ? "1px solid" : "none",
                    borderColor: "grey.200",
                  }}
                >
                  ${parseNumber(price).toLocaleString()}
                </TableCell>
              ))
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            // Loading state - show skeleton rows
            Array.from({ length: 5 }, (_, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 600,
                    bgcolor: "grey.50",
                    whiteSpace: "nowrap",
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    fontSize: "0.875rem",
                    color: "grey.700",
                    borderRight: "1px solid",
                    borderColor: "grey.300",
                  }}
                >
                  <Box
                    sx={{
                      width: "60px",
                      height: "20px",
                      bgcolor: "grey.300",
                      borderRadius: 1,
                      animation: "pulse 1.5s ease-in-out infinite",
                      "@keyframes pulse": {
                        "0%": { opacity: 1 },
                        "50%": { opacity: 0.5 },
                        "100%": { opacity: 1 },
                      },
                    }}
                  />
                </TableCell>
                {Array.from({ length: 5 }, (_, colIndex) => (
                  <TableCell
                    key={colIndex}
                    align="center"
                    sx={{
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      fontSize: "0.875rem",
                      borderRight: colIndex < 4 ? "1px solid" : "none",
                      borderColor: "grey.200",
                    }}
                  >
                    <Box
                      sx={{
                        width: "50px",
                        height: "20px",
                        bgcolor: "grey.300",
                        borderRadius: 1,
                        margin: "0 auto",
                        animation: "pulse 1.5s ease-in-out infinite",
                        "@keyframes pulse": {
                          "0%": { opacity: 1 },
                          "50%": { opacity: 0.5 },
                          "100%": { opacity: 1 },
                        },
                      }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            data.capRates.map((capRate, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  "&:hover": { bgcolor: "grey.25" },
                  transition: "background-color 0.2s ease-in-out",
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 600,
                    bgcolor: "grey.50",
                    whiteSpace: "nowrap",
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    fontSize: "0.875rem",
                    color: "grey.700",
                    borderRight: "1px solid",
                    borderColor: "grey.300",
                  }}
                >
                  {`${toNumeric(capRate).toFixed(1)}%`}
                </TableCell>
                {data.values[rowIndex].map((value, colIndex) => {
                  const cellNum = toNumeric(value as number | string)
                  // const isHighlighted =
                  //   effectiveHighlight !== undefined && Math.abs(cellNum - (effectiveHighlight as number)) < 1e-9
                  return (
                    <TableCell
                      key={colIndex}
                      align="center"
                      sx={{
                        fontWeight: 500,
                        color: "grey.800",
                        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                        fontSize: "0.875rem",
                        position: "relative",
                        borderRight: colIndex < data.values[rowIndex].length - 1 ? "1px solid" : "none",
                        borderColor: "grey.200",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          bgcolor: "grey.100",
                        },
                      }}
                    >
                    
                      {formatValue(cellNum)}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
} 