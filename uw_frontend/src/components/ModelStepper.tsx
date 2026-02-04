import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  LinearProgress,
  Chip,
  Divider,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { ChevronLeft, ChevronRight, Check } from "@mui/icons-material";
import { createModelSubheaders } from "../utils/modelTypeConstants";

interface StepTree {
  id: number;
  title: string;
  branches: {
    id: number;
    title: string;
    shortTitle: string;
  }[];
}

interface ModelStepperProps {
  steps: string[];
  activeStep: number;
  completedSteps: number[];
  onStepChange: (currentStep: number, nextStep: number) => void;
  onNext: () => void;
  onBack: () => void;
  isStepComplete: (step: number) => boolean;
  isCreating?: boolean;
  leveredIrr?: string;
  leveredMoic?: string;
  finalMetricsCalculating?: boolean;
  finalMetricsCalculating2?: boolean;
  isDebouncing?: boolean;
  children?: React.ReactNode;
  showRetail?: boolean;
  existingModel?: boolean;
  handleSaveAndExit?: () => void;
  modelDetails?: any;
  unitSqFtTotal?: number;
  retailSqFtTotal?: number;
}

const ModelStepper: React.FC<ModelStepperProps> = ({
  steps,
  activeStep,
  completedSteps,
  onStepChange,
  onNext,
  onBack,
  isStepComplete,
  isCreating = false,
  leveredIrr = "",
  leveredMoic = "",
  finalMetricsCalculating = false,
  finalMetricsCalculating2 = false,
  isDebouncing = false,
  showRetail = false,
  children,
  existingModel = false,
  handleSaveAndExit,
  modelDetails,
  unitSqFtTotal = 0,
  retailSqFtTotal = 0,
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery('(max-width:1500px)');
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Flat list of steps (no sections)
  const flatSteps = steps.map((step, index) => ({
    id: index + 1,
    title: step,
    shortTitle: step,
  }));

  const totalBranches = flatSteps.length;
  const completedCount = completedSteps.length;
  const progressPercentage = (completedCount / totalBranches) * 100;
  const isBranchCompleted = (branchId: number) =>
    completedSteps.includes(branchId);
  const isCurrentBranch = (branchId: number) => branchId === activeStep + 1;
  const isNavDisabled =
    isCreating ||
    !modelDetails?.google_sheet_url ||
    modelDetails.google_sheet_url === "";

  const handleOnNext = () => {
    onNext();
  };

  const currentStepTitle = steps[activeStep];
  const isNoBackground = currentStepTitle === "Leasing Assumptions" || currentStepTitle === "Exit Assumptions";

  // Expose current step globally for lightweight diagnostics (read-only)
  useEffect(() => {
    try {
      (window as any).__uwCurrentStep = activeStep + 1;
      (window as any).__uwTotalSteps = steps?.length ?? 0;
      (window as any).__uwStepTitle = steps?.[activeStep] ?? '';
    } catch {
      // no-op
    }
  }, [activeStep, steps]);

  const grossSqFtField = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === 'Gross Square Feet');
  const grossSqFtValue = grossSqFtField ? Number(grossSqFtField.value) : null;
  const combinedSqFt = (unitSqFtTotal || 0) + (retailSqFtTotal || 0);
  const exceedsGrossSqFt = grossSqFtValue !== null && combinedSqFt > grossSqFtValue;
  const isSqFtBlocker = exceedsGrossSqFt && (currentStepTitle === 'Residential Rental Units' || currentStepTitle === 'Retail Income');

  const isNextDisabled =
    isCreating ||
    finalMetricsCalculating ||
    finalMetricsCalculating2 ||
    isDebouncing ||
    (!existingModel && !isStepComplete(activeStep)) ||
    !isStepComplete(activeStep) ||
    isSqFtBlocker ||
    (currentStepTitle === "Operating Expenses" &&
      (!modelDetails?.google_sheet_url || modelDetails.google_sheet_url === ""));
  const showUnitsDisabledReason =
    isNextDisabled &&
    (currentStepTitle === "Residential Rental Units" || currentStepTitle === "Market Rent Assumptions");
  const showSqFtExceededReason = isSqFtBlocker;

  const content = (
    <Box
      sx={{
        display: "flex",
        minHeight: "calc(100vh - 64px)",
        mt: '0px',
        bgcolor: "#f3f6fb",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <Box
        sx={{
          width: 320,
          pl: "20px",
          bgcolor: "rgba(255,255,255,0.06)",
          background: "transparent",
          borderRight: 1,
          borderColor: "rgba(255,255,255,0.18)",
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(12px) saturate(140%)",
          WebkitBackdropFilter: "blur(12px) saturate(140%)",
          // boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 24px rgba(0,0,0,0.06)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(180px 140px at 20% 5%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(220px 180px at 100% -10%, rgba(255,255,255,0.18), transparent 60%)",
            zIndex: 0,
          },
        }}
      >
        {/* Header */}

        {/* <Box
          sx={{
            // borderBottom: 1,
            // borderRight: 1,
            borderColor: "#1b4a7f",
            px: 3,
            py: 2,
            background: "#f6f8fe",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
            zIndex: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "left", justifyContent: "left", pl: 1.5, pt: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "grey.900", textAlign: "left" }}
            >
              {existingModel ? "Edit Model" : "Create Model"}
            </Typography>
          </Box>
        </Box> */}

        {/* Navigation - Flat list of steps */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            py: 2,
            pt: 4,
            bgcolor: "#f4f6fc",
            position: "relative",
            zIndex: 1,


            
          }}
        >
          <Box sx={{ opacity: isNavDisabled ? 0.5 : 1, pointerEvents: isNavDisabled ? "none" : "auto" }}>
          {flatSteps.map((branch) => (
            <Button
              key={branch.id}
              onClick={() => onStepChange(activeStep, branch.id - 1)}
              disabled={
                (!isBranchCompleted(branch.id) &&
                  !isBranchCompleted(branch.id - 1)) ||
                !modelDetails?.google_sheet_url ||
                modelDetails.google_sheet_url === "" ||
                !isStepComplete(activeStep) ||
                isNextDisabled
              }
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                px: 1,
                py: 1.5,
                pl: 8,
                textAlign: "left",
                textTransform: "none",
                transition: "background 0.2s",
                // transform: "scale(1)",
                borderRadius: 1,
                position: "relative",
                background: isBranchCompleted(branch.id)
                  ? `rgba(255,255,255,0.06)`
                  : "transparent",
                "&:hover": {
                  background: `rgba(255,255,255,0.10)`,
                },
                "&:active .timeline-node": {
                  transform: "translate(-50%, -50%) scale(0.98)",
                  filter: "brightness(0.95) saturate(1.1)",
                },
                ...(isCurrentBranch(branch.id) && {
                  background: `rgba(255,255,255,0.10)`,
                }),
              }}
            >
              {(() => {
                const prevId = branch.id - 1;
                const isPrevCompleted = prevId > 0 && isBranchCompleted(prevId);
                const current = isCurrentBranch(branch.id);
                const completed = isBranchCompleted(branch.id);
                return (
                  <Box sx={{ position: "absolute", left: 24, top: 0, bottom: 0, width: 36 }}>
                    {branch.id !== 1 && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: '50%',
                          transform: 'translateX(-1px)',
                          top: 0,
                          bottom: "50%",
                          width: 2,
                          bgcolor: isPrevCompleted ? "rgba(23,61,101,0.9)" : "rgba(255,255,255,0.25)",
                          borderRadius: 1,
                          zIndex: 0,
                        }}
                      />
                    )}
                    {branch.id !== flatSteps.length && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: '50%',
                          transform: 'translateX(-1px)',
                          top: "50%",
                          bottom: 0,
                          width: 2,
                          bgcolor: completed ? "rgba(23,61,101,0.9)" : "rgba(255,255,255,0.25)",
                          borderRadius: 1,
                          zIndex: 0,
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: '50%',
                        transform: "translate(-50%, -50%)",
                        width: current ? 26 : 22,
                        height: current ? 26 : 22,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        border: 2,
                        borderColor: completed || current ? "rgba(255,255,255,0.35)" : "rgba(24,118,210,0.55)",
                        color: "#ffffff",
                        // Ensure current step takes precedence over completed styling
                        background: current
                          ? "linear-gradient(180deg, rgba(30,123,226,0.9), rgba(22,103,193,0.9))"
                          : completed
                          ? "linear-gradient(180deg, #1b4f88, #173d65)"
                          : "linear-gradient(180deg, rgba(24,118,210,0.85), rgba(22,103,193,0.85))",
                        boxShadow: completed || current
                          ? "0 6px 16px rgba(23,61,101,0.28), inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "0 4px 12px rgba(24,118,210,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
                        zIndex: 1,
                        transition: "all 0.2s",
                      }}
                      className="timeline-node"
                    >
                      {branch.id}
                    </Box>
                  </Box>
                );
              })()}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transformOrigin: 'left center',
                    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms ease',
                    '.MuiButton-root:hover &': {
                      transform: 'scale(1.10)',
                    },
                    ...(isCurrentBranch(branch.id)
                      ? {
                          fontWeight: 700,
                          color: "rgba(0,0,0,0.85)",
                          fontSize: "0.95rem",
                        }
                      : isBranchCompleted(branch.id)
                      ? {
                          fontWeight: 500,
                          color: "rgba(0,0,0,0.75)",
                          fontSize: "0.9rem",
                          "&:hover": { color: "#1876d2" },
                        }
                      : {
                          color: "rgba(0,0,0,0.65)",
                          fontSize: "0.9rem",
                          "&:hover": { color: "rgba(0,0,0,0.85)" },
                        }),
                  }}
                >
                  {branch.shortTitle} 
                </Typography>
              </Box>
              {/* Removed trailing pulse dot */}
            </Button>
          ))}
          </Box>
        </Box>

        {/* Progress Footer - Sticky at bottom */}
        {/* <Box sx={{
          borderTop: 1,
          borderColor: 'grey.200',
          px: 3,
          py: 2,
          background: `#f4f6fa`,
          backdropFilter: 'blur(8px)'
        }}>
          <Typography variant="body2" sx={{ color: 'grey.600', fontWeight: 500 }}>
            Step {activeStep + 1} of {totalBranches} • {completedCount} completed
          </Typography>
          <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 12, mt: 1.5, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
            <Box sx={{
              background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              height: 12,
              borderRadius: 1,
              transition: 'width 0.7s ease-out',
              width: `${progressPercentage}%`,
              // boxShadow: 1,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'pulse 2s infinite'
              }
            }} />
          </Box>
          <Typography variant="caption" sx={{ color: 'grey.500', textAlign: 'center', display: 'block', mt: 0.5 }}>
            {Math.round(progressPercentage)}% Complete
          </Typography>
        </Box> */}
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top Header */}
        {/* <Box sx={{ 
          bgcolor: 'white', 
          borderBottom: 1, 
          borderColor: 'grey.200', 
          px: 3, 
          py: 2,
          boxShadow: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
              1. Property Details View Only
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <Button
                 variant="outlined"
                 size="small"
                 sx={{
                   textTransform: 'none',
                   borderColor: 'grey.300',
                   color: 'grey.700',
                   '&:hover': {
                     borderColor: 'grey.400',
                     boxShadow: 1
                   }
                 }}
               >
                 Fork
               </Button>
            </Box>
          </Box>
        </Box> */}

        {/* Main Content */}
        <Box
          sx={{
            overflowY: "auto",
            width: "100%",
            maxWidth: { xs: '100%', md: 'calc(100% - 48px)' },
            px: { xs: 0, sm: 2, md: 3 },
            py: { xs: 0, sm: 2, md: 4 },
            background: "#f4f6fc",
            borderWidth: "0px",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
            {/* Current Step Context */}
            <Box sx={{
              mb: { xs: 1, md: 3 },
              position: { xs: 'sticky', md: 'relative' },
              top: { xs: 0, md: 'auto' },
              zIndex: (theme) => theme.zIndex.appBar - 1,
              background: { xs: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))', md: 'transparent' },
              borderBottom: { xs: '1px solid rgba(0,0,0,0.06)', md: 'none' },
              backdropFilter: { xs: 'blur(6px) saturate(120%)', md: 'none' },
              WebkitBackdropFilter: { xs: 'blur(6px) saturate(120%)', md: 'none' },
              borderRadius: { xs: 0, md: 2 },
              px: { xs: 1, md: 0 },
              py: { xs: 1, md: 0 }
            }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  {isSmall && (
                    <IconButton
                      aria-label="open steps"
                      onClick={() => setDrawerOpen(true)}
                      sx={{
                        mr: 1,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.38))',
                        backdropFilter: 'blur(10px) saturate(140%)',
                        WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.45)',
                        color: 'black',
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,255,255,0.48))',
                        }
                      }}
                    >
                      <MenuIcon />
                    </IconButton>
                  )}
                  {/* Circular badge on >= sm */}
                  <Box
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      width: { sm: 36, md: 40 },
                      height: { sm: 36, md: 40 },
                      borderRadius: "50%",
                      bgcolor: isBranchCompleted(activeStep + 1)
                        ? "#173d65"
                        : theme.palette.grey[700],
                      color: "#e4e7eb",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: { sm: '1.05rem', md: '1.125rem' },
                      fontWeight: 700,
                      transition: "all 0.3s",
                    }}
                  >
                    {activeStep + 1}
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, color: "grey.900", fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.375rem' } }}
                    >
                      {isXs ? `${activeStep + 1}. ${flatSteps[activeStep]?.title === "Legal and Pre-Development Costs" ? "Legal and Setup Costs" : flatSteps[activeStep]?.title}` : flatSteps[activeStep]?.title === "Legal and Pre-Development Costs" ? "Legal and Setup Costs" : flatSteps[activeStep]?.title}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ color: "grey.600", fontSize: { xs: 12, sm: 13 } }}>
                        Step {activeStep + 1} of {totalBranches}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                {[
                  "Acquisition Financing",
                  "Refinancing",
                  "Leasing Assumptions",
                  "Exit Assumptions",
                ].includes(steps[activeStep]) && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 3,
                      alignItems: "center",
                      p: 1.75,
                      px: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.42))',
                      backdropFilter: 'blur(10px) saturate(140%)',
                      WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      // boxShadow: '0 10px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.45)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background:
                          'radial-gradient(320px 180px at 10% -10%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(380px 240px at 120% 0%, rgba(255,255,255,0.22), transparent 65%)',
                        pointerEvents: 'none'
                      }
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: finalMetricsCalculating ? 'text.disabled' : 'grey.800',
                        opacity: finalMetricsCalculating ? 0.6 : 1,
                        letterSpacing: 0.1,
                      }}
                    >
                      Levered IRR:&nbsp;
                      <Box
                        component="span"
                        sx={{
                          color: finalMetricsCalculating ? 'grey.400' : 'primary.main',
                          fontWeight: 800,
                          opacity: finalMetricsCalculating ? 0.6 : 1,
                        }}
                      >
                        {leveredIrr || "calculating..."}
                      </Box>
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: finalMetricsCalculating ? 'text.disabled' : 'grey.800',
                        opacity: finalMetricsCalculating ? 0.6 : 1,
                        letterSpacing: 0.1,
                      }}
                    >
                      Levered MOIC:&nbsp;
                      <Box
                        component="span"
                        sx={{
                          color: finalMetricsCalculating ? 'grey.400' : 'primary.main',
                          fontWeight: 800,
                          opacity: finalMetricsCalculating ? 0.6 : 1,
                        }}
                      >
                        {leveredMoic || "calculating..."}
                      </Box>
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {(() => {
              const stepKey = steps[
                activeStep
              ] as keyof typeof createModelSubheaders;
              const stepDescription = createModelSubheaders[stepKey];
              return typeof stepDescription === "string" &&
                stepDescription.trim().length > 0 ? (
                <Typography
                  variant="body1"
                  sx={{
                    color: 'grey.800',
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.35) 70%)',
                    backdropFilter: 'blur(10px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.45)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(800px 200px at -10% -20%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 60%), radial-gradient(1000px 200px at 110% 120%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)',
                      pointerEvents: 'none'
                    }
                  }}
                >
                  {stepDescription}
                </Typography>
              ) : null;
            })()}

            {/* Metrics moved into header row above */}

            {/* Step Content */}
            <Box
              sx={{
                mb: 4,
                p: 0,
                background: isNoBackground
                  ? "transparent"
                  : "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))",
                backdropFilter: isNoBackground ? "none" : "blur(10px) saturate(130%)",
                WebkitBackdropFilter: isNoBackground ? "none" : "blur(10px) saturate(130%)",
                border: isNoBackground ? 0 : 1,
                borderColor: isNoBackground ? "transparent" : "rgba(255,255,255,0.4)",
                borderRadius: 3,
                boxShadow: isNoBackground
                  ? "none"
                  : "0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.55)",
                position: "relative",
                overflow: "scroll",
                pointerEvents: finalMetricsCalculating2 ? 'none' : 'auto',
                cursor: finalMetricsCalculating2 ? 'wait' : 'auto',
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: isNoBackground
                    ? "none"
                    : "radial-gradient(320px 180px at 10% -10%, rgba(255,255,255,0.45), transparent 60%), radial-gradient(380px 240px at 120% 0%, rgba(255,255,255,0.28), transparent 65%)",
                  zIndex: 0,
                },
              }}
            >
              {children}
              {finalMetricsCalculating2 && (
                <Box
                  aria-busy={true}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 20,
                    background: 'transparent',
                    pointerEvents: 'auto',
                    cursor: 'wait',
                  }}
                />
              )}
            </Box>

            {/* Navigation Buttons */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
            >
              <Button
                variant="outlined"
                onClick={onBack}
                disabled={activeStep === 0 || isCreating}
                startIcon={<ChevronLeft />}
                sx={{
                  textTransform: "none",
                  color: "rgba(0,0,0,0.75)",
                  border: 1,
                  borderColor: "rgba(255,255,255,0.5)",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.2))",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
                  "&:hover": {
                    background: "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.28))",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                    borderColor: "rgba(255,255,255,0.65)",
                  },
                }}
              >
                Previous
              </Button>

              <Box sx={{ display: "flex", gap: 1, pr: 0, }}>
                {showUnitsDisabledReason && (
                  <Chip
                    icon={<WarningAmberRoundedIcon />}
                    label="All units must have rent and square feet values."
                    color="warning"
                    variant="filled"
                    sx={{
                      alignSelf: 'center',
                      px: 1,
                      bgcolor: 'rgba(255,193,7,0.18)',
                      color: '#7a5c00',
                      border: '1px solid rgba(255,193,7,0.45)',
                      backdropFilter: 'blur(6px) saturate(130%)',
                      WebkitBackdropFilter: 'blur(6px) saturate(130%)',
                    }}
                  />
                )}
                {showSqFtExceededReason && (
                  <Chip
                    icon={<WarningAmberRoundedIcon />}
                    label="Residential + Retail SF exceed Gross Square Feet. Adjust before continuing."
                    color="warning"
                    variant="filled"
                    sx={{
                      alignSelf: 'center',
                      px: 1,
                      bgcolor: 'rgba(211,47,47,0.12)',
                      color: '#7a0000',
                      border: '1px solid rgba(211,47,47,0.35)',
                      backdropFilter: 'blur(6px) saturate(130%)',
                      WebkitBackdropFilter: 'blur(6px) saturate(130%)',
                    }}
                  />
                )}
                {/* <Button
                   variant="outlined"
                   sx={{
                     textTransform: 'none',
                     borderColor: 'grey.300',
                     color: 'grey.700',
                     '&:hover': {
                       borderColor: 'grey.400',
                       boxShadow: 1,
                       transform: 'scale(1.05)'
                     }
                   }}
                   disabled={isCreating}
                 >
                   Save & Exit
                 </Button> */}
               {!(activeStep === steps.length - 1 && existingModel) && (
                <Button
                  onClick={handleOnNext}
                  disabled={isNextDisabled}
                  endIcon={
                    isXs ? undefined : (
                      activeStep === steps.length - 1 ? undefined : (
                        <ChevronRight />
                      )
                    )
                  }
                  sx={{
                    textTransform: "none",
                    color: "#ffffff",
                    border: 1,
                    borderColor: "rgba(255,255,255,0.4)",
                    background: "linear-gradient(180deg, rgba(30,123,226,0.9), rgba(22,103,193,0.9))",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    mr: isXs ? 1 : 2,
                    ml: isXs ? 1 : 2,
                    boxShadow: "0 10px 24px rgba(22,103,193,0.25), inset 0 1px 0 rgba(255,255,255,0.35)",
                    "&:hover": {
                      background: "linear-gradient(180deg, rgba(30,123,226,1), rgba(22,103,193,1))",
                      boxShadow: "0 12px 28px rgba(22,103,193,0.3)",
                    },
                    "&:disabled": {
                      color: "rgba(0,0,0,0.6)",
                      background: "linear-gradient(180deg, rgba(200,200,200,0.6), rgba(190,190,190,0.6))",
                      borderColor: "rgba(255,255,255,0.4)",
                      opacity: 0.6,
                      cursor: "not-allowed",
                    },
                  }}
                >
                  {activeStep === steps.length - 1
                    ? isCreating
                      ? "Creating Model..."
                      : "Finish"
                    : existingModel
                    ? "Next"
                    : "Continue"}
                </Button>
               )}
                {existingModel && (
                  <Button
                    variant="outlined"
                    onClick={handleSaveAndExit}
                    disabled={
                      !isStepComplete(activeStep) ||
                      isCreating ||
                      !modelDetails?.google_sheet_url ||
                      modelDetails.google_sheet_url === "" ||
                      isNextDisabled

                    }
                    sx={{
                      textTransform: "none",
                      color: "rgba(0,0,0,0.75)",
                      border: 1,
                      borderColor: "rgba(255,255,255,0.5)",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.2))",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
                      "&:hover": {
                        background: "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.28))",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                        borderColor: "rgba(255,255,255,0.65)",
                      },
                    }}
                  >
                    Save & Exit
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  if (isSmall) {
    return (
      <>
        {/* No floating button; hamburger appears inline next to step number below */}
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: '100%', maxWidth: 360 } }}>

          <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
          {/* Render only the left-side stepper column inside drawer */}
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            {/* Clone the left nav and inject onClick to close on navigation */}
            <Box
              sx={{
                width: 320,
                pl: '0px',
                bgcolor: 'rgba(255,255,255,0.06)',
                background: 'transparent',
                borderRight: 1,
                borderColor: 'rgba(255,255,255,0.18)',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(12px) saturate(140%)',
                WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  py: 2,
                  pt: 4,
                  bgcolor: '#f4f6fc',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, mt: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Steps</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
          </Box>
                <Box sx={{ opacity: isCreating || !modelDetails?.google_sheet_url ? 0.5 : 1, pointerEvents: isCreating || !modelDetails?.google_sheet_url ? 'none' : 'auto' }}>
                  {steps.map((step, idx) => {
                    const branchId = idx + 1;
                    const prevId = branchId - 1;
                    const isPrevCompleted = prevId > 0 && isBranchCompleted(prevId);
                    const current = isCurrentBranch(branchId);
                    const completed = isBranchCompleted(branchId);
                    return (
                      <Button key={idx}
                        onClick={() => { onStepChange(activeStep, idx); setDrawerOpen(false); }}
                        disabled={(!isStepComplete(idx - 1) && idx !== 0) || !modelDetails?.google_sheet_url || modelDetails.google_sheet_url === '' || !isStepComplete(activeStep) || isNextDisabled}
                        sx={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.2,
                          px: 1,
                          py: 1.5,
                          pl: 8,
                          textAlign: 'left',
                          textTransform: 'none',
                          transition: 'background 0.2s',
                          borderRadius: 1,
                          position: 'relative',
                          background: completed ? 'rgba(255,255,255,0.06)' : 'transparent',
                          '&:hover': { background: 'rgba(255,255,255,0.10)' },
                          '&:active .timeline-node': { transform: 'translate(-50%, -50%) scale(0.98)', filter: 'brightness(0.95) saturate(1.1)' },
                          ...(current && { background: 'rgba(255,255,255,0.10)' }),
                        }}
                      >
                        <Box sx={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 36 }}>
                          {branchId !== 1 && (
                            <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-1px)', top: 0, bottom: '50%', width: 2, bgcolor: isPrevCompleted ? 'rgba(23,61,101,0.9)' : 'rgba(255,255,255,0.25)', borderRadius: 1, zIndex: 0 }} />
                          )}
                          {branchId !== steps.length && (
                            <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-1px)', top: '50%', bottom: 0, width: 2, bgcolor: completed ? 'rgba(23,61,101,0.9)' : 'rgba(255,255,255,0.25)', borderRadius: 1, zIndex: 0 }} />
                          )}
                          <Box
                            className="timeline-node"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: current ? 26 : 22,
                              height: current ? 26 : 22,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              border: 2,
                              borderColor: completed || current ? 'rgba(255,255,255,0.35)' : 'rgba(24,118,210,0.55)',
                              color: '#ffffff',
                              background: current
                                ? 'linear-gradient(180deg, rgba(30,123,226,0.9), rgba(22,103,193,0.9))'
                                : completed
                                ? 'linear-gradient(180deg, #1b4f88, #173d65)'
                                : 'linear-gradient(180deg, rgba(24,118,210,0.85), rgba(22,103,193,0.85))',
                              boxShadow: completed || current
                                ? '0 6px 16px rgba(23,61,101,0.28), inset 0 1px 0 rgba(255,255,255,0.25)'
                                : '0 4px 12px rgba(24,118,210,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
                              zIndex: 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {branchId}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              transformOrigin: 'left center',
                              transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms ease',
                              '.MuiButton-root:hover &': { transform: 'scale(1.10)' },
                              ...(current
                                ? { fontWeight: 700, color: 'rgba(0,0,0,0.85)', fontSize: '0.95rem' }
                                : completed
                                ? { fontWeight: 500, color: 'rgba(0,0,0,0.75)', fontSize: '0.9rem', '&:hover': { color: '#1876d2' } }
                                : { color: 'rgba(0,0,0,0.65)', fontSize: '0.9rem', '&:hover': { color: 'rgba(0,0,0,0.85)' } }),
                            }}
                          >
                            {step === "Legal and Pre-Development Costs" ? "Legal and Setup Costs" : step}
                          </Typography>
                        </Box>
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </Drawer>
        {/* Main content area without the side stepper when closed */}
        {!drawerOpen && (
          <Box sx={{ flex: 1, width: '100%', maxWidth: '100%' }}>{content.props.children[1]}</Box>
        )}
      </>
    );
  }

  return content;
};

export default ModelStepper;
