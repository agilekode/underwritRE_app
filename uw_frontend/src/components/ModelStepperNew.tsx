import React from "react";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Divider,
  IconButton,
} from "@mui/material";
import { ChevronLeft, ChevronRight, Check, Circle, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { colors } from "../theme";
import { createModelSubheaders } from "../utils/modelTypeConstants";

const SIDEBAR_WIDTH = 280;

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
  children,
  existingModel = false,
  handleSaveAndExit,
  modelDetails,
}) => {
  const navigate = useNavigate();
  const completedCount = completedSteps.length;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const isBranchCompleted = (stepIndex: number) => completedSteps.includes(stepIndex + 1);
  const isCurrentStep = (stepIndex: number) => stepIndex === activeStep;

  const isNavDisabled =
    isCreating ||
    !modelDetails?.google_sheet_url ||
    modelDetails.google_sheet_url === "";

  const isNextDisabled = !isStepComplete(activeStep);

  const currentStepTitle = steps[activeStep];
  const stepDescription = createModelSubheaders[currentStepTitle as keyof typeof createModelSubheaders];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Dark Left Sidebar - Step Navigation */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          bgcolor: colors.navy,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          zIndex: 1200,
          borderRight: `1px solid rgba(255,255,255,0.12)`,
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <IconButton
              onClick={() => navigate('/')}
              size="small"
              sx={{
                color: colors.white,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                '&:hover': {
                  color: colors.white,
                },
              }}
              onClick={() => navigate('/')}
            >
              Back to Your Models
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: colors.white,
              fontWeight: 700,
              mb: 1,
            }}
          >
            {existingModel ? 'Edit Model' : 'Create Model'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.75rem',
            }}
          >
            Step {activeStep + 1} of {totalSteps}
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ px: 3, pb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.12)',
              '& .MuiLinearProgress-bar': {
                bgcolor: colors.blue,
                borderRadius: 3,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.7rem',
              mt: 0.5,
              display: 'block',
            }}
          >
            {completedCount} of {totalSteps} completed
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* Steps List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            py: 2,
            opacity: isNavDisabled ? 0.5 : 1,
            pointerEvents: isNavDisabled ? 'none' : 'auto',
          }}
        >
          <List sx={{ p: 0 }}>
            {steps.map((step, index) => {
              const completed = isBranchCompleted(index);
              const current = isCurrentStep(index);
              const canNavigate = completed || isBranchCompleted(index - 1) || index === 0;

              return (
                <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      if (canNavigate && !isNextDisabled) {
                        onStepChange(activeStep, index);
                      }
                    }}
                    disabled={!canNavigate || isNextDisabled}
                    sx={{
                      borderRadius: 1,
                      py: 1.5,
                      px: 1.5,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                      },
                      ...(current && {
                        bgcolor: colors.blue,
                        '&:hover': {
                          bgcolor: colors.blueDark,
                        },
                      }),
                      '&.Mui-disabled': {
                        opacity: 0.4,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {completed ? (
                        <Check sx={{ color: colors.white, fontSize: '1.25rem' }} />
                      ) : (
                        <Circle
                          sx={{
                            color: current ? colors.white : 'rgba(255,255,255,0.4)',
                            fontSize: current ? '0.75rem' : '0.5rem',
                          }}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={step}
                      primaryTypographyProps={{
                        fontWeight: current ? 600 : 500,
                        fontSize: '0.875rem',
                        color: colors.white,
                        sx: {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Metrics Section */}
        {(leveredIrr || leveredMoic) && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.7rem',
                  display: 'block',
                  mb: 1,
                }}
              >
                Current Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {leveredIrr && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}
                    >
                      Levered IRR
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: finalMetricsCalculating ? 'rgba(255,255,255,0.4)' : colors.white,
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      {leveredIrr || 'calculating...'}
                    </Typography>
                  </Box>
                )}
                {leveredMoic && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}
                    >
                      Levered MOIC
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: finalMetricsCalculating ? 'rgba(255,255,255,0.4)' : colors.white,
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      {leveredMoic || 'calculating...'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          marginLeft: `${SIDEBAR_WIDTH}px`,
          minHeight: '100vh',
          bgcolor: colors.grey[100],
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Content Container */}
        <Box
          sx={{
            flex: 1,
            p: 4,
            maxWidth: 1400,
            width: '100%',
            mx: 'auto',
          }}
        >
          {/* Step Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.grey[900],
              mb: 1,
            }}
          >
            {currentStepTitle}
          </Typography>

          {/* Step Description */}
          {stepDescription && (
            <Typography
              variant="body1"
              sx={{
                color: colors.grey[700],
                mb: 3,
              }}
            >
              {stepDescription}
            </Typography>
          )}

          {/* Step Content */}
          <Box
            sx={{
              opacity: finalMetricsCalculating2 ? 0.6 : 1,
              pointerEvents: finalMetricsCalculating2 ? 'none' : 'auto',
              cursor: finalMetricsCalculating2 ? 'wait' : 'default',
            }}
          >
            {children}
          </Box>
        </Box>

        {/* Bottom Navigation */}
        <Box
          sx={{
            borderTop: `1px solid ${colors.grey[300]}`,
            bgcolor: colors.white,
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={activeStep === 0 || isCreating}
            startIcon={<ChevronLeft />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {existingModel && (
              <Button
                variant="outlined"
                onClick={handleSaveAndExit}
                disabled={
                  !isStepComplete(activeStep) ||
                  isCreating ||
                  !modelDetails?.google_sheet_url ||
                  modelDetails.google_sheet_url === ""
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Save & Exit
              </Button>
            )}
            <Button
              variant="contained"
              onClick={onNext}
              disabled={isCreating || (!existingModel && !isStepComplete(activeStep)) || !isStepComplete(activeStep)}
              endIcon={activeStep === steps.length - 1 ? undefined : <ChevronRight />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 140,
              }}
            >
              {activeStep === steps.length - 1
                ? isCreating
                  ? 'Creating Model...'
                  : 'Finish'
                : existingModel
                ? 'Next'
                : 'Continue'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ModelStepper;