import {
    Box,
    Typography,
    Button,
    RadioGroup,
    Radio,
    FormControlLabel,
    Stepper,
    Step,
    StepLabel,
  } from "@mui/material";
  import { useEffect, useState } from "react";
  import { usePlanTier, PlanTier } from "../context/UserContext";
  import { Snackbar, Alert, Chip } from "@mui/material";
  import { useNavigate } from "react-router-dom";
  
  const steps = [
    "Select a Model Type",
    "Answer a few questions to get started",
    "Answer a few questions to get started",
    "Summary",
  ];

  interface ModelType {
    id: string;
    name: string;
    is_active: boolean;
    show_retail: boolean;
    description?: string;
  }
  
  interface ModelIntroStepsProps {
    modelTypes: ModelType[];
    selectedModelType: string;
    handleModelTypeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    getStarted: () => void;
    handleFieldChange: (fieldId: string, field_key: string, value: string | number) => void;
    modelDetails: any;
  }
  
  const ModelIntroSteps = ({ handleFieldChange, modelDetails, modelTypes, selectedModelType, handleModelTypeChange, getStarted }: ModelIntroStepsProps) => {
    const [activeStep, setActiveStep] = useState(0);
  
    const [propertyType, setPropertyType] = useState("");
    const [financingType, setFinancingType] = useState("");
    const planTier = usePlanTier();
    const navigate = useNavigate();

    const [upgradeSnackbar, setUpgradeSnackbar] = useState<{ open: boolean; tier: string }>({
      open: false,
      tier: "",
    });

    const getRequiredTier = (typeName: string): PlanTier => {
      if (typeName.toLowerCase().includes("development")) return "max";
      if (typeName === "Mixed-Use" || typeName === "Industrial / Retail") return "pro";
      return "freemium";
    };

    const isLocked = (typeName: string): boolean => {
      const required = getRequiredTier(typeName);
      if (required === "max") return planTier !== "max";
      if (required === "pro") return planTier === "freemium";
      return false;
    };

    const getFieldValue = (field_key: string, defaultValue: any) => {
      const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
      return field ? field.value : defaultValue;
    };


    const [expectsRefinance, setExpectsRefinance] = useState(
      getFieldValue("Peramanent Loan?", "")
    );
  
    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    useEffect(() => {
      // setActiveStep(0);
      
      setExpectsRefinance(getFieldValue("Peramanent Loan?", ""));

    }, [modelTypes, modelDetails]);
  
    const renderStepContent = () => {
      switch (activeStep) {
        case 0:
          return (
            <>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                What type of model would you like to create?
              </Typography>
              <RadioGroup
                value={selectedModelType}
                onChange={handleModelTypeChange}
              >
                {[...modelTypes]
                  .filter((type) => type.is_active === true)
                  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                  .map((type) => {
                    const locked = isLocked(type.name);
                    const requiredTier = getRequiredTier(type.name);
                    
                    return (
                      <Box
                        key={type.id}
                        sx={{
                          border: 2,
                          borderColor: selectedModelType === type.id ? "primary.main" : "grey.300",
                          borderRadius: 2,
                          p: 1,
                          mb: 2,
                          width: "100%",
                          maxWidth: '100%',
                          boxSizing: 'border-box',
                          display: "flex",
                          alignItems: "center",
                          cursor: locked ? "not-allowed" : "pointer",
                          transition: "border-color 0.2s",
                          opacity: locked ? 0.6 : 1,
                          position: 'relative',
                        }}
                        onClick={() => {
                          if (locked) {
                            setUpgradeSnackbar({ open: true, tier: requiredTier });
                          } else {
                            handleModelTypeChange({ target: { value: type.id } } as React.ChangeEvent<HTMLInputElement>);
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <FormControlLabel
                              value={type.id}
                              control={<Radio checked={selectedModelType === type.id} disabled={locked} />}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '18px' }}>
                                    {type.name}
                                  </Typography>
                                  {locked && (
                                    <Chip 
                                      label={requiredTier === 'max' ? 'Max' : 'Pro'} 
                                      size="small" 
                                      color="primary" 
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}
                                    />
                                  )}
                                </Box>
                              }
                              sx={{ m: 0, width: '100%', alignItems: 'center' }}
                            />
                          </Box>
                          {type.description && (
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0, mb: 1, pl: 5 }}>
                              {type.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}

                  {/* Multifamily and Mixed-Use Development (Hardcoded if not in modelTypes) */}
                  {!modelTypes.some(t => t.name.toLowerCase().includes("development")) && (
                    <Box
                      sx={{
                        border: 2,
                        borderColor: selectedModelType === "multifamily-mixed-use" ? "primary.main" : "grey.300",
                        borderRadius: 2,
                        p: 1,
                        mb: 2,
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: planTier !== 'max' ? 'not-allowed' : 'pointer',
                        opacity: planTier !== 'max' ? 0.6 : 1,
                        transition: "border-color 0.2s",
                      }}
                      onClick={() => {
                        if (planTier !== 'max') {
                          setUpgradeSnackbar({ open: true, tier: 'max' });
                        } else {
                          handleModelTypeChange({ target: { value: "multifamily-mixed-use" } } as React.ChangeEvent<HTMLInputElement>);
                        }
                      }}
                    >
                      <Box sx={{ flex: 1, width: '100%' }}>
                        <FormControlLabel
                          value="multifamily-mixed-use"
                          control={<Radio checked={selectedModelType === "multifamily-mixed-use"} disabled={planTier !== 'max'} />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '18px' }}>
                                Multifamily and Mixed-Use Development
                              </Typography>
                              {planTier !== 'max' && (
                                <Chip 
                                  label="Max" 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}
                                />
                              )}
                            </Box>
                          }
                          sx={{ m: 0, width: '100%', alignItems: 'center' }}
                        />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0, mb: 1, pl: 5 }}>
                          Comprehensive development modeling for ground-up projects.
                        </Typography>
                      </Box>
                    </Box>
                  )}
              </RadioGroup>

              <Snackbar
                open={upgradeSnackbar.open}
                autoHideDuration={6000}
                onClose={() => setUpgradeSnackbar({ ...upgradeSnackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              >
                <Alert
                  onClose={() => setUpgradeSnackbar({ ...upgradeSnackbar, open: false })}
                  severity="info"
                  variant="filled"
                  sx={{ 
                    width: '100%', 
                    alignItems: 'center',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    boxShadow: 3
                  }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => navigate(`/settings?upgrade=${upgradeSnackbar.tier.toLowerCase()}`)}
                      sx={{ 
                        ml: 2, 
                        fontWeight: 700, 
                        textTransform: 'none',
                        borderColor: 'rgba(255,255,255,0.5)',
                        '&:hover': {
                          borderColor: '#fff',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Upgrade
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                    Available on the {upgradeSnackbar.tier === 'max' ? 'Max' : 'Pro'} plan
                  </Typography>
                </Alert>
              </Snackbar>
            </>
          );
        //   case 1:
        //     return (
        //       <>
        //         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        //           Ok, great. What type of acquisition financing will you be seeking for your {propertyType.toLowerCase()}?
        //         </Typography>
        //         <RadioGroup
        //           value={financingType}
        //           onChange={(e) => setFinancingType(e.target.value)}
        //         >
        //           <Box
        //             sx={{
        //               border: 2,
        //               borderColor: financingType === "None" ? "primary.main" : "grey.300",
        //               borderRadius: 2,
        //               p: 0,
        //               mb: 2,
        //               width: "100%",
        //               display: "flex",
        //               alignItems: "center",
        //               cursor: "pointer",
        //               transition: "border-color 0.2s",
        //             }}
        //             onClick={() => setFinancingType("None")}
        //           >
        //             <FormControlLabel
        //               value="None"
        //               control={<Radio checked={financingType === "None"} />}
        //               label="None"
        //               sx={{ flex: 1, m: 0, width: "100%" }}
        //             />
        //           </Box>
        //           <Box
        //             sx={{
        //               border: 2,
        //               borderColor: financingType === "Permanent Mortgage" ? "primary.main" : "grey.300",
        //               borderRadius: 2,
        //               p: 0,
        //               mb: 2,
        //               width: "100%",
        //               display: "flex",
        //               alignItems: "center",
        //               cursor: "pointer",
        //               transition: "border-color 0.2s",
        //             }}
        //             onClick={() => setFinancingType("Permanent Mortgage")}
        //           >
        //             <FormControlLabel
        //               value="Permanent Mortgage"
        //               control={<Radio checked={financingType === "Permanent Mortgage"} />}
        //               label="Permanent Mortgage"
        //               sx={{ flex: 1, m: 0, width: "100%" }}
        //             />
        //           </Box>
        //           <Box
        //             sx={{
        //               border: 2,
        //               borderColor: financingType === "Bridge Loan" ? "primary.main" : "grey.300",
        //               borderRadius: 2,
        //               p: 0,
        //               width: "100%",
        //               display: "flex",
        //               alignItems: "center",
        //               cursor: "pointer",
        //               transition: "border-color 0.2s",
        //             }}
        //             onClick={() => setFinancingType("Bridge Loan")}
        //           >
        //             <FormControlLabel
        //               value="Bridge Loan"
        //               control={<Radio checked={financingType === "Bridge Loan"} />}
        //               label="Bridge Loan"
        //               sx={{ flex: 1, m: 0, width: "100%" }}
        //             />
        //           </Box>
        //         </RadioGroup>
        //       </>
        //     );
          // case 1:
          //   return (
          //     <>
          //       <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          //         Sounds good. Do you expect to refinance at any point during the life of the deal?
          //       </Typography>
          //       <RadioGroup
          //         value={expectsRefinance}
          //         onChange={(e) => {
          //           setExpectsRefinance(e.target.value);
          //           handleFieldChange(
          //             getFieldId("Peramanent Loan?"),
          //             "Peramanent Loan?",
          //             e.target.value
          //           );
          //         }}
          //       >
          //         <Box
          //           sx={{
          //             border: 2,
          //             borderColor: expectsRefinance === "Yes" ? "primary.main" : "grey.300",
          //             borderRadius: 2,
          //             p: 0,
          //             mb: 2,
          //             width: "100%",
          //             display: "flex",
          //             alignItems: "center",
          //             cursor: "pointer",
          //             transition: "border-color 0.2s",
          //           }}
          //         >
          //           <FormControlLabel
          //             value="Yes"
          //             control={<Radio checked={expectsRefinance === "Yes"} />}
          //             label="Yes"
          //             sx={{ flex: 1, m: 0, width: "100%" }}
          //           />
          //         </Box>
          //         <Box
          //           sx={{
          //             border: 2,
          //             borderColor: expectsRefinance === "No" ? "primary.main" : "grey.300",
          //             borderRadius: 2,
          //             p: 0,
          //             width: "100%",
          //             display: "flex",
          //             alignItems: "center",
          //             cursor: "pointer",
          //             transition: "border-color 0.2s",
          //           }}
          //         >
          //           <FormControlLabel
          //             value="No"
          //             control={<Radio checked={expectsRefinance === "No"} />}
          //             label="No"
          //             sx={{ flex: 1, m: 0, width: "100%" }}
          //           />
          //         </Box>
          //       </RadioGroup>
          //     </>
          //   );
          case 1:
            return (
              <>
                <Typography variant="h6" gutterBottom>
                  Awesome! Let's get started analyzing your potential investment.
                </Typography>

{/*                 
                <Box bgcolor="#f5f5f5" p={2} mt={2} borderRadius={1}>
                  <Typography>
                    You're creating a model for a <b>{propertyType.toLowerCase()}</b> property {" "}
                    <b>{financingType.toLowerCase()}</b> acquisition financing{financingType === "None" ? "" : " and "}
                    {expectsRefinance === "Yes" ? "assuming a refinancing solution." : "with no refinancing expected."}
                  </Typography>
                </Box>
                 */}
                
              </>
            );
          default:
            return null;
      }
    };
  
    const isNextDisabled = () => {
      if (activeStep === 0) {
        if (!selectedModelType) return true;
        
        // Find the selected model type in modelTypes or check if it's the hardcoded development model
        const selectedType = modelTypes.find(t => t.id === selectedModelType);
        const typeName = selectedType ? selectedType.name : (selectedModelType === "multifamily-mixed-use" ? "Multifamily and Mixed-Use Development" : "");
        
        return isLocked(typeName);
      }
      return false;
    };
  

    const getFieldId = (field_key: string) => {
      const field = modelDetails?.user_model_field_values?.find((f: any) => f.field_key === field_key);
      return field ? field.field_id : "";
    };
  
    return (
      <Box
        maxWidth={{ xs: '100%', sm: 640 }}
        mx="auto"
        mt={{ xs: 2, sm: 5 }}
        sx={{
          backgroundColor: 'white',
          borderRadius: { xs: 2, sm: 3 },
          p: { xs: 2, sm: 3 },
          boxSizing: 'border-box'
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          fontWeight="bolder"
          sx={{ fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2.125rem' } }}
        >
          New Investment Model
        </Typography>
        {/* <Typography variant="subtitle2" gutterBottom>
          Step {activeStep + 1} of 3: {steps[activeStep]}
        </Typography> */}
  
        <Box my={{ xs: 2, sm: 3 }}>{renderStepContent()}</Box>
  
        <Box
          display="flex"
          justifyContent="space-between"
          mt={2}
          sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1.5, sm: 0 } }}
        >
          {activeStep > 0 && (
            <Button onClick={handleBack} fullWidth={true} sx={{ display: { xs: 'block', sm: 'inline-flex' } }}>
              Back
            </Button>
          )}
          {activeStep < 1 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isNextDisabled()}
              fullWidth={true}
              sx={{ display: { xs: 'block', sm: 'inline-flex' } }}
            >
              Next
            </Button>
          )}
          {activeStep === 1 && (
            <Button variant="contained" onClick={getStarted} fullWidth={true} sx={{ display: { xs: 'block', sm: 'inline-flex' } }}>
              Get Started
            </Button>
          )}
        </Box>
      </Box>
    );
  };
  
  export default ModelIntroSteps;