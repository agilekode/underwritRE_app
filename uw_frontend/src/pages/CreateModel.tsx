import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Box, Button, Stepper, Step, StepLabel, Typography, TextField, MenuItem, FormControl, RadioGroup, FormLabel, FormControlLabel, Radio, Tooltip, Divider } from '@mui/material';
import { useUser } from '../context/UserContext';
import UnitTable from '../components/UnitTable';
import OperatingExpensesTable from '../components/OperatingExpenses';
import AmenityIncomeTable from '../components/AmentityIncome';
import { BACKEND_URL } from '../utils/constants';
import ModelIntroSteps from '../components/ModelIntroSteps';
import ModelStepper from '../components/ModelStepper';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { SectionFields } from '../components/SectionFields';
import RetailIncomeTable from '../components/RetailIncomeTable';
import RefinancingSection from '../components/RefinancingSection';
import { AmenityIncomeBasic, ExpensesBasic, ExpensesIndustrial, GrowthRatesBasic, MarketRentAssumptionsBasic, OperatingExpensesBasic } from '../utils/newModelConstants';
import { Expenses } from '../components/Expenses';
import { Expense } from '../utils/interface';
import AcquisitionFinancingSection from '../components/AcquisitionFinancingSection';
import { RetailExpenses } from '../components/RetailExpenses';
import { NumberInput } from '../components/NumberInput';
import LeasingAssumptions from '../components/LeasingAssumptions';
import RecoveryIncomeTable from '../components/RecoveryIncomeTable';
import GrossPotentialRetailIncomeTable from '../components/GrossPotentialRetailIncomeTable';
import LeasingCostReserves from '../components/LeasingCostReserves';
import ExitAssumptions from '../components/ExitAssumptions';
import { NetOperatingIncomeTable } from '../components/NetOperatingIncomeTable';
import RecoveryIncomeTableIndustrial from '../components/RecoveryIncomeTableIndustrial';
import { RetailExpensesIndustrial } from '../components/RetailExpensesIndustrial';
import GrossPotentialRetailIncomeTableIndustrial from '../components/GrossPotentialRetailIncomeTableIndustrial';
import RetailSummary from '../components/RetailSummary';

type Section = {
  id: string;
  name: string;
  order: number;
  fields: { id: string; name: string; default_value: string; required: boolean; field_key: string; field_title: string; field_type: string; order: number; }[];
};

interface ModelTypeInfo {
  show_retail: boolean;
  show_rental_units?: boolean;
  sections: {
    id: string;
    name: string;
    order: number;
    fields: Field[];
  }[];
}

type Field = {
  id: string;
  name: string;
  default_value: string;
  required: boolean;
  field_key: string;
  field_title: string;
  field_type: string;
  order: number;
  time_phased: boolean;
  description: string;
  active: boolean;
};

interface Unit {
  id: string;
  rent_type: string;
  vacate_flag: number;
  layout: string;
  square_feet: number;
  vacate_month: number;
  current_rent: number | null;
}

interface AmenityIncome {
  id: string;
  name: string;
  start_month: number;
  utilization: number;
  unit_count: number;
  monthly_fee: number;
}

interface OperatingExpense {
  id: string;
  name: string;
  factor: number;
  broker: number;
  cost_per: string;
}

interface RetailIncome {
  id: string;
  suite: string;
  tenant_name: string;
  square_feet: number;
  rent_start_month: number;
  annual_bumps: number;
  rent_per_square_foot_per_year: number;
  lease_start_month: number;
  recovery_start_month: number;
}

interface CreateModelProps {
  existingModel?: boolean;
  modelId?: string;
}


export const CreateModel = ({ existingModel, modelId }: CreateModelProps) => {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const { user } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedModelType, setSelectedModelType] = useState('');
  const [introStepComplete, setIntroStepComplete] = useState(false);
  const [modelDetails, setModelDetails] = useState<Record<string, any>>({
    name: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    user_model_field_values: [],
    market_rent_assumptions: []
  });
  const [modelTypes, setModelTypes] = useState<{ id: string; name: string; is_active: boolean, show_retail: boolean }[]>([]);
  const [selectedModelTypeInfo, setSelectedModelTypeInfo] = useState<ModelTypeInfo | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [nameError, setNameError] = useState(false);
  const [rentalRateError, setRentalRateError] = useState(false);
  const [marketRentAssumptions, setMarketRentAssumptions] = useState<{ layout: string; pf_rent: number; }[]>(MarketRentAssumptionsBasic);
  const [growthRates, setGrowthRates] = useState<{ name: string; value: number; type: string; }[]>(GrowthRatesBasic);
  const [amenityIncome, setAmenityIncome] = useState<AmenityIncome[]>([]);
  const [retailIncome, setRetailIncome] = useState<RetailIncome[]>([]);
  const [operatingExpenses, setOperatingExpenses] = useState<OperatingExpense[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [newRentalGrowthName, setNewRentalGrowthName] = useState('');
  const [modelMapping, setModelMapping] = useState({});
  const [variableMapping, setVariableMapping] = useState({});
  const [leveredIrr, setLeveredIrr] = useState('');
  const [leveredMoic, setLeveredMoic] = useState('');
  const [variables, setVariables] = useState({});
  const [noiTableValues, setNoiTableValues] = useState<any[]>([]);
  const [finalMetricsCalculating, setFinalMetricsCalculating] = useState(false);
  const [finalMetricsCalculating2, setFinalMetricsCalculating2] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);



  // Add debounce timeout ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep latest readiness values in refs to avoid stale closures
  const modelMappingRef = useRef(modelMapping);
  useEffect(() => { modelMappingRef.current = modelMapping; }, [modelMapping]);
  const variableMappingRef = useRef(variableMapping);
  useEffect(() => { variableMappingRef.current = variableMapping; }, [variableMapping]);
  const googleUrlRef = useRef(modelDetails.google_sheet_url);
  useEffect(() => { googleUrlRef.current = modelDetails.google_sheet_url; }, [modelDetails.google_sheet_url]);


  const [steps, setSteps] = useState<string[]>([]);

  // Module-level variable to persist across renders and prevent duplicate calls
  const fetchModelDetailsRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Global flag to prevent duplicate calls (persists across component instances)
  if (!(window as any).__modelDetailsFetchFlag) {
    (window as any).__modelDetailsFetchFlag = new Set();
  }

  const isCreatingRef = useRef(isCreating);
  useEffect(() => {
    isCreatingRef.current = isCreating;
  }, [isCreating]);


  useEffect(() => {
    if(!selectedModelTypeInfo){
      setSteps(["Property Address"]);
      return;
    }



    if (selectedModelTypeInfo?.show_retail) {
      if(selectedModelTypeInfo?.show_rental_units) {
        setOperatingExpenses(OperatingExpensesBasic);
        if(!existingModel){
          setExpenses(ExpensesBasic);
        }
        setSteps(
          [
            "Property Address",
            "General Property Assumptions",
            "Residential Rental Units",
            "Market Rent Assumptions",
            "Retail Income",
            "Amenity Income",
            "Operating Expenses",
            "Net Operating Income",
            "Acquisition Financing",
            "Leasing Assumptions",
            "Refinancing",
            ...EXPENSE_STEPS,
            "Exit Assumptions"
          ]
        )
      }
      else {
        if(!existingModel){
          setExpenses(ExpensesIndustrial);
        }
        setSteps(
          [
            "Property Address",
            "General Property Assumptions",
            // "Retail Income",
            "Base Income",
            "Recoverable Operating Expenses",
            "Recovery and Gross Potential Income",
            "Leasing Cost Reserves",
            "Income Summary",
            "Amenity Income",
            "Net Operating Income",
            "Acquisition Financing",
            "Refinancing",
            ...EXPENSE_STEPS,
            "Exit Assumptions"
          ]
        )

      }

    } else {

      if(selectedModelTypeInfo?.show_rental_units) {
        setOperatingExpenses(OperatingExpensesBasic);
        if(!existingModel){
          setExpenses(ExpensesBasic);
        }
        setSteps(
          [
            "Property Address",
            "General Property Assumptions",
            "Residential Rental Units",
            "Market Rent Assumptions",
            "Retail Income",
            "Amenity Income",
            "Operating Expenses",
            "Net Operating Income",
            "Acquisition Financing",
            "Leasing Assumptions",
            "Refinancing",
            ...EXPENSE_STEPS,
            "Exit Assumptions"
          ]
        )
      }
      else {
        if(!existingModel){
          setExpenses(ExpensesIndustrial);
        }
        setSteps(
          [
            "Property Address",
            "General Property Assumptions",
            "Retail Income",
            "Amenity Income",
            "Net Operating Income",
            "Acquisition Financing",
            "Refinancing",
            ...EXPENSE_STEPS,
            "Exit Assumptions"
          ]
        )
      }
    }
  }, [selectedModelTypeInfo]);





  const EXPENSE_STEPS = [
    "Closing Costs",
    "Legal and Pre-Development Costs",
    "Reserves",
    "Hard Costs"
  ]


  const PRIMARY_STEPS = [
    "Property Address",
    "General Property Assumptions",
    "Residential Rental Units",
    "Market Rent Assumptions",
    "Retail Income",
    "Amenity Income",
    "Operating Expenses",
    "Base Income",
    "Recoverable Operating Expenses",
    "Recovery and Gross Potential Income",
    "Leasing Cost Reserves",
    "Income Summary",
  ]

  const SECONDARY_STEPS = [
    "Net Operating Income",
    "Acquisition Financing",
    "Leasing Assumptions",
    "Refinancing",
    ...EXPENSE_STEPS,
    "Exit Assumptions"
  ]



  let called = false;

  useEffect(() => {


    // Create a unique key for this fetch operation
    const fetchKey = `${existingModel}-${modelId}-${user?.id}`;


    if (existingModel && modelId && user?.id) {

      // Mark as fetched immediately using global flag
      (window as any).__modelDetailsFetchFlag.add(fetchKey);

      setModelDetails(prevDetails => ({
        ...prevDetails,
        google_sheet_url: ''
      }));

      setIntroStepComplete(true);
      setCompletedSteps(Array.from({ length: PRIMARY_STEPS.length + SECONDARY_STEPS.length }, (_, i) => i + 1));

      const fetchModelDetails = async () => {

        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(BACKEND_URL + `/api/user_models_version/${modelId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
          });
          const data = await response.json();
          if (data.error) {
            console.error("ERROR", data.error)
            return;
          }
          data.google_sheet_url = '';
          generateGoogleSheet(data.model_type.id);
          setModelDetails(data);
          setMarketRentAssumptions(data.market_rent_assumptions);
          setSelectedModelType(data.model_type.id);
          setUnits(data.units);
          setMarketRentAssumptions(data.market_rent_assumptions);
          setGrowthRates(data.growth_rates);
          setAmenityIncome(data.amenity_income);
          setRetailIncome(data.retail_income);
          setOperatingExpenses(data.operating_expenses);
          setExpenses(data.expenses);

        } catch (err) {
          console.error('Error fetching model details:', err);
        }
      };
      if (!called) {
        fetchModelDetails();
        called = true;
      }
    }

    // Cleanup function to reset global flag when dependencies change
    return () => {
      (window as any).__modelDetailsFetchFlag.delete(fetchKey);
    };
  }, [existingModel, modelId, user?.id]);



  const handleNext = async () => {
    handleStepChange(activeStep, activeStep + 1)
  };

  const handleStepChange = (currentStep: number, nextStep: number) => {


    let current = steps[currentStep]
    let next = steps[nextStep]



    // Initial to secondary -> handle create int
    // Secondary to initials -> new sheet
    // Secondary to secondary -> nothing UNLESS expense, then do expense update

    if (PRIMARY_STEPS.includes(current) && SECONDARY_STEPS.includes(next)) {

      handleCreateIntermediate();
    }
    else if (SECONDARY_STEPS.includes(current) && PRIMARY_STEPS.includes(next)) {
      setModelDetails(prevDetails => ({
        ...prevDetails,
        google_sheet_url: ''
      }));
      setLeveredIrr('');
      setLeveredMoic('');
      setVariables({});
      setNoiTableValues([]);
      generateGoogleSheet(selectedModelType);
    }

    else if (EXPENSE_STEPS.includes(current)) {

      handleUpdateExpenseTable(current);
    }

    // Mark next step as completed only if not already completed
    setCompletedSteps(prev => {
      if (!prev.includes(nextStep)) {
        return [...prev, nextStep];
      }
      return prev;
    });

    setActiveStep(nextStep);
  };

  const handleBack = () => {
    if (activeStep === steps.indexOf("Operating Expenses") + 1) {
      setModelDetails(prevDetails => ({
        ...prevDetails,
        google_sheet_url: ''
      }));
      setLeveredIrr('');
      setLeveredMoic('');
      setVariables({});
      setNoiTableValues([]);
      generateGoogleSheet(selectedModelType);
    }
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };



  const handleModelTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedModelType(event.target.value);
  };

  // Fix type error by specifying the type of updatesPending as an array of any (or a more specific type if known)
  const [updatesPending, setUpdatesPending] = useState<any[]>([]);
  const updatesPendingRef = useRef<any[]>([]);
  useEffect(() => { updatesPendingRef.current = updatesPending; }, [updatesPending]);

  const enqueueUpdate = (update: any) => {
    setUpdatesPending((prev) => {
      const idx = prev.findIndex((u: any) => u.field_id === update.field_id || u.field_key === update.field_key);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = { ...prev[idx], ...update };
        return copy;
      }
      return [...prev, update];
    });
  };


  const handleUpdateExpenseTable = async (sheet_name: string) => {

    const token = await getAccessTokenSilently();
    const response = await fetch(BACKEND_URL + '/api/user_models_expense', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sheet_name: sheet_name, expenses: expenses.filter((expense: any) => expense.type === sheet_name), google_sheet_url: modelDetails.google_sheet_url })
    })
  }

  const handleSingleFieldUpdate = async (updateObject: any) => {
    // Always enqueue the latest change so many rapid changes are coalesced
    enqueueUpdate(updateObject)
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);

    }

    // Set a new timeout to delay the API call
    debounceTimeoutRef.current = setTimeout(async () => {
      setIsDebouncing(false);

      ;

      // Wait up to 20s for mappings and sheet URL to be ready and not creating
      const isReady = () => (
        Object.keys(modelMappingRef.current || {}).length > 0 &&
        !!googleUrlRef.current &&
        Object.keys(variableMappingRef.current || {}).length > 0
      );
      const readyDeadline = Date.now() + 20_000;
      while ((!isReady() || isCreatingRef.current) && Date.now() < readyDeadline) {
        await new Promise((r) => setTimeout(r, 250));
      }
      if (!isReady() || isCreatingRef.current) {
        // Still not ready after 20s; keep queued and exit
        return;
      }

      if (isReady()) {

        const toSend = updatesPendingRef.current;
        if (!toSend || toSend.length === 0) {
          return;
        }



        setFinalMetricsCalculating(true);
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(BACKEND_URL + '/api/user_models_single_field_updates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ updates: toSend, variable_mapping: variableMappingRef.current, model_mapping: modelMappingRef.current, google_sheet_url: googleUrlRef.current })
          });
          const result = await response.json();

          if (result.result) {
            setLeveredIrr(result.result.levered_irr);
            setLeveredMoic(result.result.levered_moic);
            setVariables(result.result.variables);
            setNoiTableValues(result.result.NOI || []);
          }
        } catch (error) {
          console.error("Error updating field:", error);
        } finally {
          setFinalMetricsCalculating(false);
        }
        // Clear the queue we just sent (avoid clearing if new items arrived during send)
        setUpdatesPending((prev) => {
          // Drop the items that were in toSend; keep any that arrived after we started sending
          const sentKeys = new Set(toSend.map((u: any) => u.field_id || u.field_key));
          return prev.filter((u: any) => !sentKeys.has(u.field_id || u.field_key));
        });
      }
      else {
        // Not ready; the update is already queued by enqueueUpdate
      }
    }, 500); // 500ms delay
  }

  const handleFieldChange = (
    fieldId: string,
    field_key: string,
    value: string | number,
    isTimePhased: boolean = false,
    timeField?: 'start_month' | 'end_month',
    fieldType?: string // <-- optionally pass fieldType if available
  ) => {

    // Preserve leading zero for decimals like 0.25; only strip for integers like 01
    if (typeof value === 'string' && value.length > 1 && value.startsWith('0') && value[1] !== '.') {
      value = value.slice(1);
    }

    // Helper to convert YYYY-MM-DD to MM/DD/YYYY
    const formatDate = (dateStr: string) => {
      if (!dateStr || typeof dateStr !== 'string') return dateStr;
      // Only format if matches YYYY-MM-DD
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [, year, month, day] = match;
        return `${month}/${day}/${year}`;
      }

      return dateStr;
    };

    setModelDetails(prevDetails => {
      // Try to get the field_type from selectedModelTypeInfo if not passed
      let actualFieldType = fieldType;


      let processedValue = value;
      if (actualFieldType === 'date' && typeof value === 'string') {
        processedValue = formatDate(value);
      }

      const existingFieldIndex = prevDetails.user_model_field_values.findIndex(
        (fieldValue: any) => fieldValue.field_id === fieldId
      );
      let updatedFieldValues;
      if (existingFieldIndex !== -1) {
        updatedFieldValues = [...prevDetails.user_model_field_values];
        if (timeField) {
          updatedFieldValues[existingFieldIndex] = {
            ...updatedFieldValues[existingFieldIndex],
            [timeField]: processedValue
          };
        } else {
          updatedFieldValues[existingFieldIndex] = {
            ...updatedFieldValues[existingFieldIndex],
            value: processedValue
          };
        }
      } else {
        const newFieldValue = timeField
          ? { field_id: fieldId, field_key: field_key, [timeField]: processedValue }
          : { field_id: fieldId, field_key: field_key, value: processedValue };
        updatedFieldValues = [...prevDetails.user_model_field_values, newFieldValue];
      }


      if (selectedModelTypeInfo && selectedModelTypeInfo.sections) {

        const section = selectedModelTypeInfo.sections.find((section: any) =>
          section.fields.some((f: any) => f.id === fieldId)
        );

        if (section) {

          let sectionFieldType = section.fields.find((f: any) => f.id === fieldId)?.field_type;
          let updateObject = { ...updatedFieldValues.find((field: any) => field.field_key === field_key) };
          updateObject["field_type"] = sectionFieldType;
          updateObject["section"] = section.name;

          // Only call handleSingleFieldUpdate if this is a real field change (not during re-render)
          // Check if the value actually changed from the previous value
          const existingField = prevDetails.user_model_field_values.find((fv: any) => fv.field_id === fieldId);
          const valueChanged = !existingField || existingField.value !== processedValue;

          if (section.name !== "General Property Assumptions" && section.name !== "Retail Leasing Assumptions" && valueChanged) {

            handleSingleFieldUpdate(updateObject);
          }

        }

      }
      return { ...prevDetails, user_model_field_values: updatedFieldValues };
    });
  };

  useEffect(() => {
    const fetchModelTypes = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            scope: "openid profile email"
          }
        });
        const res = await fetch(BACKEND_URL + '/api/model_types', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });
        const data = await res.json();

        setModelTypes(data);
      } catch (err) {
        console.error('Error fetching model types:', err);
      }
    };

    fetchModelTypes();
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (selectedModelType) {
      const fetchModelType = async () => {
        try {
          const token = await getAccessTokenSilently();
          const res = await fetch(BACKEND_URL + `/api/model_types/${selectedModelType}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
          });
          const data = await res.json();

          setSelectedModelTypeInfo(data);
          interface FieldValue {
            field_id: string;
            field_key: string;
            field_title: string;
            field_type: string;
            value: string | number;
            start_month?: number;
            end_month?: number;
          }
          if (!existingModel) {
            let fieldValues: FieldValue[] = [];
            for (const section of data.sections) {
              for (const field of section.fields) {
                if (field.time_phased) {
                  fieldValues.push({
                    field_id: field.id,
                    field_key: field.field_key,
                    field_title: field.field_title,
                    field_type: field.field_type,
                    value: field.default_value || '',
                    start_month: 0,
                    end_month: 0
                  });
                }
                else if (field.default_value) {
                  fieldValues.push({
                    field_id: field.id,
                    field_key: field.field_key,
                    field_title: field.field_title,
                    field_type: field.field_type,
                    value: field.default_value
                  });
                }
              }
            }
            setModelDetails(prevDetails => ({ ...prevDetails, user_model_field_values: fieldValues }));
          }
        } catch (err) {
          console.error('Error fetching selected model type:', err);
        }
      };

      fetchModelType();
    }
  }, [selectedModelType, getAccessTokenSilently]);

  useEffect(() => {
    if (selectedModelTypeInfo) {
      // Sort sections and fields by their order
      selectedModelTypeInfo.sections.sort((a, b) => a.order - b.order);
      selectedModelTypeInfo.sections.forEach(section => {
        section.fields.sort((a, b) => a.order - b.order);
      });
    }
  }, [selectedModelTypeInfo]);

  useEffect(() => {
    if (amenityIncome.length === 0) {
      setAmenityIncome(AmenityIncomeBasic);
    }
  }, []);

  // Helper function to check if a field is complete
  const isFieldComplete = (field: any, fieldValue: any) => {
    if (fieldValue === undefined) {
      return false;
    }
    // Check if required and value is present
    const isValueComplete = !field.required || (fieldValue && fieldValue.value !== '');
    // Additional check for date fields: must be a valid MM/DD/YYYY date
    let isDateValid = true;
    if (field.field_type === 'date' && fieldValue && fieldValue.value) {
      isDateValid = /^\d{2}\/\d{2}\/\d{4}$/.test(fieldValue.value);
    }
    // Check for time-phased fields
    const isTimePhasedComplete = !field.time_phased || (fieldValue && fieldValue.start_month !== undefined && fieldValue.end_month !== undefined);
    return isValueComplete && isTimePhasedComplete && isDateValid;
  };

  const isStepComplete = (step: number) => {
    // Global validation: any Retail expense with end_month < start_month blocks progression

    if (steps[activeStep] === "Property Address") {
      return modelDetails.street_address && modelDetails.city && modelDetails.state && modelDetails.zip_code;
    } else if (steps[activeStep] === "General Property Assumptions" && selectedModelTypeInfo) {
      const currentSection = selectedModelTypeInfo.sections.find(section => section.name === 'General Property Assumptions');
      if (!currentSection) return false; // Ensure currentSection is defined
      return currentSection.fields.every(field => {
        const fieldValue = modelDetails.user_model_field_values.find((fv: any) => fv.field_key === field.field_key);
        return isFieldComplete(field, fieldValue);
      });
    }
    else if (steps[activeStep] === "Residential Rental Units") {
      // Check that there is at least one unit, the sum of all unit square_feet > 0,
      // and none of the units have current_rent === null
      return (
        units.length > 0 &&
        units.map(unit => unit.square_feet).reduce((sum, sf) => sum + sf, 0) > 0 &&
        units.every(unit => unit.current_rent !== null)
      );
    }
    else if (activeStep === steps.indexOf("Market Rent Assumptions")) {
      return (
        units.length > 0 &&
        units.map(unit => unit.square_feet).reduce((sum, sf) => sum + sf, 0) > 0 &&
        units.every(unit => unit.current_rent !== null)
      );
      // return marketRentAssumptions.every((assumption) => assumption.layout && assumption.pf_rent);
    }
    else if (activeStep === steps.indexOf("Operating Expenses")) {
      return true;
      // return operatingExpenses.every((expense) => expense.name && expense.start_month && expense.end_month && expense.amount);
    }
    else if (activeStep === steps.indexOf("Retail Income")) {
      return true;
      // return operatingExpenses.every((expense) => expense.name && expense.start_month && expense.end_month && expense.amount);
    }
    else if (activeStep === steps.indexOf("Base Income")) {
      return true;
    }
    else if (activeStep === steps.indexOf("Recoverable Operating Expenses")) {
      return true;
    }
    else if (activeStep === steps.indexOf("Recovery and Gross Potential Income")) {
      return true;
    }
    else if (activeStep === steps.indexOf("Leasing Cost Reserves")) {
      return true;
    }
    else if (activeStep === steps.indexOf("Income Summary")) {
      return true;
    }
    else if (activeStep === steps.indexOf("Amenity Income")) {
      return amenityIncome.every((income) =>
        income.name &&
        income.utilization !== undefined &&
        income.utilization !== null &&
        income.unit_count !== undefined &&
        income.unit_count !== null &&
        income.monthly_fee !== undefined &&
        income.monthly_fee !== null
      );
    }
    else if (['Closing Costs', 'Legal and Pre-Development Costs', 'Reserves', 'Hard Costs'].includes(steps[activeStep])) {
      try {
        const retailInvalid = (expenses || [])
          .some((expense: any) => {
            const sm = Number(expense?.start_month);
            const em = Number(expense?.end_month);
            return Number.isFinite(sm) && Number.isFinite(em) && em < sm;
          });
        if (retailInvalid) {
          return false;
        }
      } catch {}
      return true;
    }
    else if (activeStep === steps.indexOf("Net Operating Income")) {
      return true;
    }
    else if (activeStep === steps.indexOf("Rental Unit Growth Rates")) {
      if (!modelDetails.google_sheet_url) {
        return false;
      }
      return growthRates.some((rate: any) => rate.type === 'rental');
    } else if (selectedModelTypeInfo) {
      const currentSection = selectedModelTypeInfo.sections.find(section => section.name === steps[activeStep]);
      if (!currentSection) return false; // Ensure currentSection is defined
      for (let i = 0; i < currentSection.fields.length; i++) {
        const field = currentSection.fields[i];
        const fieldValue = modelDetails.user_model_field_values.find((fv: any) => fv.field_key === field.field_key);
        if (!isFieldComplete(field, fieldValue)) {
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const prepareDataForPostRequest = () => {
    const userModelData = {
      name: modelDetails.name,
      street_address: modelDetails.street_address,
      city: modelDetails.city,
      state: modelDetails.state,
      zip_code: modelDetails.zip_code,
      model_type_id: selectedModelType,
      user_id: user.id, // Use actual user ID from context
      google_sheet_url: modelDetails.google_sheet_url,
      id: existingModel ? modelDetails.id : null
    };


    const userModelFieldValuesData = modelDetails.user_model_field_values.map((fieldValue: any) => ({
      field_id: fieldValue.field_id,
      field_key: fieldValue.field_key,
      field_type: fieldValue.field_type,
      value: fieldValue.value,
      start_month: fieldValue.start_month || null,
      end_month: fieldValue.end_month || null,
    }));

    return {
      ...userModelData,
      user_model_field_values: userModelFieldValuesData,
      units,
      market_rent_assumptions: marketRentAssumptions,
      growth_rates: growthRates,
      amenity_income: amenityIncome,
      operating_expenses: operatingExpenses,
      retail_income: retailIncome,
      expenses: expenses,
    };
  };


  const handleCreateIntermediate = async () => {
    setIsCreating(true);
    let waited = 0;
    const maxWait = 20000; // 20 seconds
    const interval = 500; // 0.5 seconds
    setFinalMetricsCalculating2(true);

    // Helper to wait for google_sheet_url to exist
    const waitForGoogleSheetUrl = () => {
      return new Promise<void>((resolve, reject) => {
        const check = () => {
          if (modelDetails.google_sheet_url) {
            resolve();
          } else if (waited >= maxWait) {
            reject(new Error("Timeout: google_sheet_url not set after 20 seconds"));
          } else {
            waited += interval;
            setTimeout(check, interval);
          }
        };
        check();
      });
    };

    try {
      await waitForGoogleSheetUrl();
      const token = await getAccessTokenSilently();
      const data = prepareDataForPostRequest();


      const response = await fetch(BACKEND_URL + '/api/user_models_intermediate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();

      if (response.ok) {
        setModelMapping(result.result?.model_mapping || {});
        setVariableMapping(result.result?.variable_mapping || {});
        setLeveredIrr(result.result?.levered_irr || 'N/A');
        setLeveredMoic(result.result?.levered_moic || 'N/A');
        setVariables(result.result?.variables || {});
        setNoiTableValues(result.result?.NOI || []);
        setIsCreating(false);
        setFinalMetricsCalculating(false);
        setFinalMetricsCalculating2(false);
      } else {
        console.error('Error creating user model:', result.error);
      }
    } catch (err) {
      console.error('Error during model creation:', err);
    } finally {
      setIsCreating(false);
    }
  }



  const handleSaveAndExit = async () => {
    let waited = 0;
    const interval = 500; // 0.5 seconds
    const maxWait = 30000; // 20 seconds

    // Helper to wait for google_sheet_url to exist AND isCreating to be false
    const waitForGoogleSheetUrlAndNotCreating = () => {
      return new Promise<void>((resolve, reject) => {
        const check = () => {
          if (modelDetails.google_sheet_url && !isCreating && !finalMetricsCalculating && !finalMetricsCalculating2 && !isDebouncing) {
            resolve();
          } else if (waited >= maxWait) {
            reject(new Error("Timeout: google_sheet_url not set or isCreating still true after 20 seconds"));
          } else {
            waited += interval;
            setTimeout(check, interval);
          }
        };
        check();
      });
    };
    try {
      let current = steps[activeStep];
      if (PRIMARY_STEPS.includes(current)) {
        await handleCreateIntermediate();
      }
      else if (EXPENSE_STEPS.includes(current)) {
        await handleUpdateExpenseTable(current);
      }
      await waitForGoogleSheetUrlAndNotCreating();
      setIsCreating(true);
      const token = await getAccessTokenSilently();
      const data = prepareDataForPostRequest();

      const response = await fetch(BACKEND_URL + '/api/user_models_new_version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        navigate(`/models/${result.id}`);
      } else {
        console.error('Error creating user model:', result.error);
      }
    } catch (err) {
      console.error('Error during model creation:', err);
    } finally {
      setIsCreating(false);
    }
  }



  const handleFinish = async () => {
    let waited = 0;
    const interval = 500; // 0.5 seconds
    const maxWait = 20000; // 20 seconds

    // Helper to wait for google_sheet_url to exist AND isCreating to be false
    const waitForGoogleSheetUrlAndNotCreating = () => {
      return new Promise<void>((resolve, reject) => {
        const check = () => {
          if (modelDetails.google_sheet_url && !isCreating && !finalMetricsCalculating && !finalMetricsCalculating2 && !isDebouncing) {
            resolve();
          } else if (waited >= maxWait) {
            reject(new Error("Timeout: google_sheet_url not set or isCreating still true after 20 seconds"));
          } else {
            waited += interval;
            setTimeout(check, interval);
          }
        };
        check();
      });
    };

    try {

      await waitForGoogleSheetUrlAndNotCreating();
      setIsCreating(true);
      const token = await getAccessTokenSilently();
      const data = prepareDataForPostRequest();
      const response = await fetch(BACKEND_URL + '/api/user_models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        navigate(`/models/${result.id}`);
      } else {
        console.error('Error creating user model:', result.error);
      }
    } catch (err) {
      console.error('Error during model creation:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Function to check for duplicate names
  const checkForDuplicateNames = () => {
    const names = growthRates.map((rate: any) => rate.name);
    const uniqueNames = new Set(names);
    return uniqueNames.size !== names.length;
  };

  // Function to check if at least one rental unit growth rate is added
  const checkForRentalUnitGrowthRate = () => {

    return growthRates.some((rate: any) => rate.type === 'rental');
  };

  // Function to check for duplicate layout names
  const checkForDuplicateLayouts = () => {
    const layouts = marketRentAssumptions.map((assumption) => assumption.layout);
    const uniqueLayouts = new Set(layouts);
    return uniqueLayouts.size !== layouts.length;
  };


  useEffect(() => {
    setNameError(checkForDuplicateLayouts());
  }, [marketRentAssumptions]);


  const generateGoogleSheet = async (selectedModelType: string) => {
    setModelMapping({});
    setVariableMapping({});
    try {
      const token = await getAccessTokenSilently();
      const userId = user.id;

      const response = await fetch(BACKEND_URL + `/api/model_types/${selectedModelType}/generate_sheet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setModelDetails(prevDetails => ({
          ...prevDetails,
          google_sheet_url: data.sheet_url
        }));
        console.log("google sheet url", data.sheet_url);
      } else {
        console.error('Error generating Google Sheet:', data.error);
      }
    } catch (err) {
      console.error('Error during Google Sheet generation:', err);
    }

  }
  const getStarted = async () => {
    setIntroStepComplete(true);
    if (selectedModelType) {
      generateGoogleSheet(selectedModelType);
    }
  };



  const rentalNames = growthRates
    .filter(rate => rate.type === 'rental')
    .map(rate => rate.name.trim().toLowerCase());

  const isDuplicate = rentalNames.includes(newRentalGrowthName.trim().toLowerCase());
  const isAddDisabled = !newRentalGrowthName.trim() || isDuplicate;

  const isReady = () =>
    Object.keys(modelMappingRef.current || {}).length > 0 &&
    !!googleUrlRef.current &&
    Object.keys(variableMappingRef.current || {}).length > 0;

  const scheduleFlush = () => {
    debounceTimeoutRef.current = setTimeout(async () => {
      // wait up to 20s for both ready and not creating
      const deadline = Date.now() + 20_000;
      while ((!isReady() || isCreatingRef.current) && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 250));
      }
      if (!isReady() || isCreatingRef.current) {
        // still not ready → try again shortly; keep queue as-is
        scheduleFlush();
        return;
      }

      const toSend = updatesPendingRef.current;
      if (!toSend.length) return;

      setFinalMetricsCalculating(true);
      const token = await getAccessTokenSilently();
      const resp = await fetch(BACKEND_URL + '/api/user_models_single_field_updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ updates: toSend, variable_mapping: variableMappingRef.current, model_mapping: modelMappingRef.current, google_sheet_url: googleUrlRef.current })
      });
      const result = await resp.json();
      if (result.result) setFinalMetricsCalculating(false);
      setUpdatesPending(prev => {
        const sentKeys = new Set(toSend.map(u => u.field_id || u.field_key));
        return prev.filter(u => !sentKeys.has(u.field_id || u.field_key));
      });
    }, 500);
  };

  useEffect(() => {
    if (isReady() && !isCreatingRef.current && updatesPendingRef.current.length) {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      scheduleFlush();
    }
  }, [modelMapping, variableMapping, modelDetails.google_sheet_url, isCreating]);






  return (
    <>
      {!introStepComplete && !existingModel && (
        <Container maxWidth="lg" sx={{ mt: 6, maxWidth: '1000px', mx: 'auto' }}>
          <ModelIntroSteps
            handleFieldChange={handleFieldChange}
            modelDetails={modelDetails}
            modelTypes={modelTypes}
            selectedModelType={selectedModelType}
            handleModelTypeChange={handleModelTypeChange}
            getStarted={getStarted}
          />
        </Container>
      )}
      {introStepComplete && (
        <ModelStepper
          steps={steps}
          activeStep={activeStep}
          completedSteps={completedSteps}
          onStepChange={handleStepChange}
          onNext={activeStep === steps.length - 1 ? handleFinish : handleNext}
          onBack={handleBack}
          isStepComplete={isStepComplete}
          isCreating={isCreating}
          leveredIrr={leveredIrr}
          leveredMoic={leveredMoic}
          finalMetricsCalculating={finalMetricsCalculating}
          finalMetricsCalculating2={finalMetricsCalculating2}
          isDebouncing={isDebouncing}
          showRetail={selectedModelTypeInfo?.show_retail}
          existingModel={existingModel}
          handleSaveAndExit={handleSaveAndExit}
          modelDetails={modelDetails}
          unitSqFtTotal={units.reduce((acc, u) => acc + (u.square_feet || 0), 0)}
          retailSqFtTotal={retailIncome.reduce((acc, r) => acc + (r.square_feet || 0), 0)}
        >
          {steps[activeStep] === "Property Address" && (
            <Box
              sx={{
                p: { xs: 1.5, sm: 2, md: 3 },
                px: { xs: 1.5, sm: 3, md: 4 },
                pb: { xs: 2, sm: 3, md: 4 },
                borderRadius: { xs: 1.5, sm: 2 },
                maxWidth: "1200px",
                mx: "auto"
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: "bolder", fontSize: { xs: "1rem", sm: "1.125rem" } }}>Property Name</Typography>
              <TextField
                placeholder="e.g., Downtown Apartment Building"
                value={modelDetails.name}
                disabled={false}
                onChange={(e) => setModelDetails({ ...modelDetails, name: e.target.value })}
                fullWidth
                sx={{ mt: 1, mb: { xs: 1.5, sm: 2 } }}
              />

              <Typography variant="subtitle1" sx={{ fontWeight: "bolder", fontSize: { xs: "1rem", sm: "1.125rem" } }}>Address</Typography>
              <TextField
                placeholder="Street address"
                disabled={false}
                value={modelDetails.street_address}
                onChange={(e) => setModelDetails({ ...modelDetails, street_address: e.target.value })}
                fullWidth
                sx={{ mt: 1, mb: { xs: 1.5, sm: 2 } }}
                required
              />

              <Box sx={{ display: "flex", gap: { xs: 1.5, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bolder", fontSize: { xs: "1rem", sm: "1.125rem" } }}>City</Typography>
                  <TextField
                    placeholder="City"
                    disabled={false}
                    value={modelDetails.city}
                    onChange={(e) => setModelDetails({ ...modelDetails, city: e.target.value })}
                    fullWidth
                    sx={{ mt: 1 }}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bolder", fontSize: { xs: "1rem", sm: "1.125rem" } }}>State</Typography>
                  <TextField
                    placeholder="State"
                    disabled={false}
                    value={modelDetails.state}
                    onChange={(e) => setModelDetails({ ...modelDetails, state: e.target.value })}
                    fullWidth
                    sx={{ mt: 1 }}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bolder", fontSize: { xs: "1rem", sm: "1.125rem" } }}>Zip Code</Typography>
                  <TextField
                    placeholder="Zip Code"
                    disabled={false}
                    value={modelDetails.zip_code}
                    onChange={(e) => setModelDetails({ ...modelDetails, zip_code: e.target.value })}
                    fullWidth
                    sx={{ mt: 1 }}
                    required
                  />
                </Box>
              </Box>

            </Box>
          )}
          {steps[activeStep] === "Rental Unit Growth Rates" && (
            <Box sx={{ width: "100%", mx: "auto" }}>
              {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }} >Rental Unit Growth Rates</Typography>
              <Box sx={{ mt: 0, mb: 2 }}>
                {growthRates
                  .filter((rate: any) => rate.type === 'rental')
                  .map((rate: any, idx: number) => {
                    const rentalIndexes = growthRates
                      .map((r: any, i: number) => r.type === 'rental' ? i : -1)
                      .filter((i: number) => i !== -1);
                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 1.5,
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: '#f8f9fa',
                          // boxShadow: 1,
                          border: '1px solid #e0e0e0',
                          transition: 'background 0.2s',
                          '&:hover': { bgcolor: '#f1f3f6' },
                        }}
                      >
                        <Box
                          sx={{
                            width: "calc(100% - 260px)",
                            pr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            borderRight: '1px solid #e0e0e0',
                            height: '100%',
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              letterSpacing: 0.2,
                            }}
                          >
                            {rate.name}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, pl: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TextField
                            label="Growth Rate (%)"
                            type="number"
                            value={rate.value}
                            onChange={e => {
                              const newGrowthRates = growthRates.map((r: any, i: number) =>
                                i === rentalIndexes[idx] ? { ...r, value: Number(e.target.value) } : r
                              );
                              setGrowthRates(newGrowthRates);
                            }}
                            size="small"
                            placeholder="Enter percentage"
                            inputProps={{ min: 0 }}
                            sx={{
                              width: 120,
                              bgcolor: '#fff',
                              borderRadius: 1,
                              '& .MuiInputBase-input': { textAlign: 'right', fontWeight: 500 },
                            }}
                          />
                          {growthRates.filter((r: any) => r.type === 'rental').length > 1 && (() => {
                            const removeIdx = rentalIndexes[idx];
                            const growthRateName = rate.name;
                            const isUsedByUnit = units.some((unit: any) => unit.rent_type === growthRateName);
                            const tooltipText = isUsedByUnit
                              ? "Cannot delete: This growth rate is used by a unit's rent type."
                              : "";

                            return (
                              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <Tooltip
                                  title={tooltipText}
                                  disableHoverListener={!isUsedByUnit}
                                  disableFocusListener={!isUsedByUnit}
                                  disableTouchListener={!isUsedByUnit}
                                  arrow
                                >
                                  <span>
                                    <Button
                                      color="error"
                                      onClick={() => {
                                        const newGrowthRates = growthRates.filter((_: any, i: number) => i !== removeIdx);
                                        setGrowthRates(newGrowthRates);
                                      }}
                                      size="small"
                                      sx={{
                                        minWidth: 0,
                                        px: 1.5,
                                        fontWeight: 600,
                                        borderRadius: 1,
                                        bgcolor: isUsedByUnit ? '#f5f5f5' : '#fff',
                                        color: isUsedByUnit ? 'text.disabled' : 'error.main',
                                        boxShadow: 0,
                                        '&:hover': {
                                          bgcolor: isUsedByUnit ? '#f5f5f5' : '#ffeaea',
                                        },
                                      }}
                                      disabled={isUsedByUnit}
                                    >
                                      Delete
                                    </Button>
                                  </span>
                                </Tooltip>
                              </span>
                            );
                          })()}
                        </Box>
                      </Box>
                    );
                  })}
              </Box> */}
              {/* <Box sx={{ display: 'flex', alignItems: 'center', mt: 0, width: '100%' }}>
                <TextField
                  label="New Rental Growth Name"
                  value={newRentalGrowthName}
                  onChange={(e) => setNewRentalGrowthName(e.target.value)}
                  size="small"
                  sx={{ mr: 2, flex: 1 }}
                  error={isDuplicate}
                  helperText={isDuplicate ? "Name already exists" : ""}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    setGrowthRates([
                      ...growthRates,
                      { name: newRentalGrowthName.trim(), value: 0, type: 'rental' }
                    ]);
                    setNewRentalGrowthName('');
                  }}
                  disabled={isAddDisabled}
                  sx={{ mt: 0, whiteSpace: 'nowrap' }}
                >
                  Add Rental Unit Growth Rate
                </Button>
              </Box> */}

              <UnitTable
                highlightedFields={['rent_type', 'vacate_flag', 'vacate_month']}
                units={units}
                setUnits={setUnits}
                growthRates={growthRates}
                marketRentAssumptions={marketRentAssumptions}
                showMarketRentLayouts={false}
                showMarketRentAssumptions={true}
                setMarketRentAssumptions={setMarketRentAssumptions}
                showGrowthRates={true}
                setGrowthRates={setGrowthRates}
                modelDetails={modelDetails}
                growthRatesOnly={true}
                vacate={true}
                activeStepTitle={steps[activeStep]}
              />


            </Box>

          )}
          {steps[activeStep] === "Market Rent Assumptions" && (
            <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
              {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Market Rent Assumptions</Typography> */}
              {/* <Box sx={{ mt: 0 }}>
                {marketRentAssumptions
                  .filter(assumption =>
                    units.some(unit => unit.layout === assumption.layout)
                  )
                  .map((assumption, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1.5,
                        alignItems: 'center',
                        mb: 1.2,
                        px: 1.5,
                        py: 1,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 1,
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '1.08rem',
                            color: '#222',
                            letterSpacing: 0.1,
                            mr: 1,
                          }}
                        >
                          Layout:
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '1.08rem',
                            color: '#444',
                          }}
                        >
                          {assumption.layout}
                        </Typography>
                      </Box>
                      <NumberInput
                        label="Pro Forma $ Rent"
                        value={assumption.pf_rent}
                        onChange={(val) => {
                          const newAssumptions = marketRentAssumptions.map((a) =>
                            a.layout === assumption.layout
                              ? { ...a, pf_rent: val === '' ? 0 : Number(val) }
                              : a
                          );
                          setMarketRentAssumptions(newAssumptions);
                        }}
                        size="small"
                        variant="outlined"
                        fullWidth={false}
                        sx={{ minWidth: 120 }}
                        InputProps={{ shrink: "true" }}
                      />
                    </Box>
                  ))}
              </Box> */}

              <UnitTable
                highlightedFields={[]}
                units={units}
                setUnits={setUnits}
                growthRates={growthRates}
                marketRentAssumptions={marketRentAssumptions}
                showMarketRentLayouts={false}
                showMarketRentAssumptions={true}
                setMarketRentAssumptions={setMarketRentAssumptions}
                showGrowthRates={false}
                setGrowthRates={setGrowthRates}
                modelDetails={modelDetails}
                growthRatesOnly={false}
                vacate={true}
                activeStepTitle={steps[activeStep]}
              />

            </Box>
          )}
          {steps[activeStep] === "Residential Rental Units" && (
            <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
              {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Residential Rental Units</Typography> */}
              <UnitTable
                highlightedFields={[ 'layout', 'square_feet', 'current_rent']}
                units={units}
                setUnits={setUnits}
                growthRates={growthRates}
                marketRentAssumptions={marketRentAssumptions}
                showMarketRentLayouts={true}
                showMarketRentAssumptions={false}
                setMarketRentAssumptions={setMarketRentAssumptions}
                showGrowthRates={false}
                setGrowthRates={setGrowthRates}
                modelDetails={modelDetails}
                growthRatesOnly={false}
                vacate={false}
                activeStepTitle={steps[activeStep]}
              />

            </Box>
          )}

          {steps[activeStep] === "Retail Income" && selectedModelTypeInfo?.show_retail === true && selectedModelTypeInfo?.show_rental_units === true && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bolder", fontSize: { xs: "1rem", sm: "1.125rem" } }}>Base Retail Income</Typography>

              <RetailIncomeTable
                retailIncome={retailIncome}
                setRetailIncome={setRetailIncome}
                modelDetails={modelDetails}
                unitsTotalSqFt={units.reduce((acc, u) => acc + (u.square_feet || 0), 0)}
                showIndustrialColumns={true}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: "bolder", mt: 2, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem" } }}>Recovery Income</Typography>

              <RecoveryIncomeTable expenses={expenses} retailIncome={retailIncome as any[]} setRetailIncome={setRetailIncome as any} />

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: "bolder", mt: 2, mb: 0, fontSize: { xs: "1rem", sm: "1.125rem" } }}>Gross Potential Retail Income</Typography>
              <GrossPotentialRetailIncomeTable retailIncome={retailIncome as any[]} expenses={expenses} modelDetails={modelDetails} handleFieldChange={handleFieldChange} />

              <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: "bolder", mt: 2, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem", mt: 2  } }}>Recoverable Retail Operating Expenses</Typography>


              <RetailExpenses expenses={expenses} setExpenses={setExpenses} step={steps[activeStep]} totalRetailSF={retailIncome.reduce((acc, curr) => acc + curr.square_feet, 0)} />

              <Box sx={{ mt: 2, width: '100%' }}>
                {growthRates
                  .filter((rate: any) => rate.type === 'retail')
                  .map((rate: any, idx: number) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                        width: '100%',
                      }}
                    >
                      <Box sx={{ flex: '0 0 auto', fontWeight: 500, color: 'text.secondary', pr: 2, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rate.name} (%)
                      </Box>
                      <TextField
                        type="number"
                        value={rate.value}
                        onChange={(e) => {
                          const newGrowthRates = growthRates.map((r: any) =>
                            r.name === rate.name && r.type === 'retail'
                              ? { ...r, value: Number(e.target.value) }
                              : r
                          );
                          setGrowthRates(newGrowthRates);
                        }}
                        size="small"
                        sx={{ flex: 1, minWidth: 120 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                        variant="outlined"
                        fullWidth
                      />
                    </Box>
                  ))}
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: "bolder", mt: 2, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem", mt: 2  } }}>Calculate the Leasing Cost Reserves</Typography>
              <LeasingCostReserves modelDetails={modelDetails} handleFieldChange={handleFieldChange} retailIncome={retailIncome as any[]} />
            </Box>
          )}

          {steps[activeStep] === "Base Income" && selectedModelTypeInfo?.show_retail === true && selectedModelTypeInfo?.show_rental_units === false && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
              <RetailIncomeTable
                retailIncome={retailIncome}
                setRetailIncome={setRetailIncome}
                modelDetails={modelDetails}
                unitsTotalSqFt={units.reduce((acc, u) => acc + (u.square_feet || 0), 0)}
                showIndustrialColumns={true}
              />
            </Box>
          )}
          {steps[activeStep] === "Recoverable Operating Expenses" && selectedModelTypeInfo?.show_retail === true && selectedModelTypeInfo?.show_rental_units === false && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
              <RetailExpensesIndustrial
                expenses={expenses}
                setExpenses={setExpenses}
                step={steps[activeStep]}
                totalRetailSF={retailIncome.reduce((acc, curr) => acc + curr.square_feet, 0)}
                retailIncome={retailIncome as any[]}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mt: 2, width: '100%' }}>
                {growthRates
                  .filter((rate: any) => rate.type === 'retail')
                  .map((rate: any, idx: number) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                        width: '100%',
                      }}
                    >
                      <Box sx={{ flex: '0 0 auto', fontWeight: 500, color: 'text.secondary', pr: 2, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rate.name} (%)
                      </Box>
                      <TextField
                        type="number"
                        value={rate.value}
                        onChange={(e) => {
                          const newGrowthRates = growthRates.map((r: any) =>
                            r.name === rate.name && r.type === 'retail'
                              ? { ...r, value: Number(e.target.value) }
                              : r
                          );
                          setGrowthRates(newGrowthRates);
                        }}
                        size="small"
                        sx={{ flex: 1, minWidth: 120 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                        variant="outlined"
                        fullWidth
                      />
                    </Box>
                  ))}
              </Box>
            </Box>
          )}
          {steps[activeStep] === "Recovery and Gross Potential Income" && selectedModelTypeInfo?.show_retail === true && selectedModelTypeInfo?.show_rental_units === false && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
              <RecoveryIncomeTableIndustrial retailIncome={retailIncome as any[]} setRetailIncome={setRetailIncome as any} expenses={expenses} />
              <Divider sx={{ my: 2 }} />
              <GrossPotentialRetailIncomeTableIndustrial retailIncome={retailIncome as any[]} expenses={expenses} modelDetails={modelDetails} handleFieldChange={handleFieldChange} />
            </Box>
          )}
          {steps[activeStep] === "Leasing Cost Reserves" && selectedModelTypeInfo?.show_retail === true && selectedModelTypeInfo?.show_rental_units === false && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
              <LeasingCostReserves modelDetails={modelDetails} handleFieldChange={handleFieldChange} retailIncome={retailIncome as any[]} />
            </Box>
          )}
          {steps[activeStep] === "Income Summary" && selectedModelTypeInfo?.show_retail === true && selectedModelTypeInfo?.show_rental_units === false && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
              <RetailSummary retailIncome={retailIncome as any[]} expenses={expenses} modelDetails={modelDetails} />
            </Box>
          )}
          {/* {steps[activeStep] === "Retail Income" && selectedModelTypeInfo?.show_retail === true && selectedModelTypeInfo?.show_rental_units === false && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bolder", fontSize: { xs: "1rem", sm: "1.125rem" } }}>Base Retail Income</Typography>

              <RetailIncomeTable
                retailIncome={retailIncome}
                setRetailIncome={setRetailIncome}
                modelDetails={modelDetails}
                unitsTotalSqFt={units.reduce((acc, u) => acc + (u.square_feet || 0), 0)}
                showIndustrialColumns={true}
              />
              
              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: "bolder", mt: 2, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem" } }}>Recovery Income</Typography>

                  <RecoveryIncomeTableIndustrial expenses={expenses} retailIncome={retailIncome as any[]} setRetailIncome={setRetailIncome as any} />
          
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: "bolder", mt: 2, mb: 0, fontSize: { xs: "1rem", sm: "1.125rem" } }}>Gross Potential Retail Income</Typography>
                  <GrossPotentialRetailIncomeTableIndustrial retailIncome={retailIncome as any[]} expenses={expenses} modelDetails={modelDetails} handleFieldChange={handleFieldChange} />

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: "bolder", mt: 2, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem", mt: 2  } }}>Recoverable Retail Operating Expenses</Typography>


                  <RetailExpensesIndustrial
                    expenses={expenses}
                    setExpenses={setExpenses}
                    step={steps[activeStep]}
                    totalRetailSF={retailIncome.reduce((acc, curr) => acc + curr.square_feet, 0)}
                    retailIncome={retailIncome as any[]}
                  />

                <Box sx={{ mt: 2, width: '100%' }}>
                {growthRates
                  .filter((rate: any) => rate.type === 'retail')
                  .map((rate: any, idx: number) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                        width: '100%',
                      }}
                    >
                      <Box sx={{ flex: '0 0 auto', fontWeight: 500, color: 'text.secondary', pr: 2, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rate.name} (%)
                      </Box>
                      <TextField
                        type="number"
                        value={rate.value}
                        onChange={(e) => {
                          const newGrowthRates = growthRates.map((r: any) =>
                            r.name === rate.name && r.type === 'retail'
                              ? { ...r, value: Number(e.target.value) }
                              : r
                          );
                          setGrowthRates(newGrowthRates);
                        }}
                        size="small"
                        sx={{ flex: 1, minWidth: 120 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                        variant="outlined"
                        fullWidth
                      />
                    </Box>
                  ))}
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: "bolder", mt: 2, mb: 2, fontSize: { xs: "1rem", sm: "1.125rem", mt: 2  } }}>Calculate the Leasing Cost Reserves</Typography>
                  <LeasingCostReserves modelDetails={modelDetails} handleFieldChange={handleFieldChange} retailIncome={retailIncome as any[]} />
            </Box>
          )} */}

          {EXPENSE_STEPS.includes(steps[activeStep]) && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
              <Expenses
                operatingExpenses={operatingExpenses}
                variables={variables}
                modelDetails={modelDetails}
                expenses={expenses}
                setExpenses={setExpenses}
                step={steps[activeStep]}
                units={units}
                amenityIncome={amenityIncome}
                retailIncome={retailIncome}
                retailExpenses={expenses.filter((expense: any) => expense.type === "Retail")}
                industrialModel={selectedModelTypeInfo?.show_rental_units === false && selectedModelTypeInfo?.show_retail === true}
              />
              {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>{steps[activeStep]}</Typography> */}

            </Box>
          )}
          {steps[activeStep] === "Amenity Income" && (
            <Box sx={{ maxWidth: "1200px", mx: "auto" , p:2}}>

              <AmenityIncomeTable amenityIncome={amenityIncome} setAmenityIncome={setAmenityIncome} />
              <Box sx={{ mt: 2, width: '100%' }}>
                {growthRates
                  .filter((rate: any) => rate.type === 'amenity')
                  .map((rate: any, idx: number) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                        width: '100%',
                      }}
                    >
                      <Box sx={{ flex: '0 0 auto', fontWeight: 500, color: 'text.secondary', pr: 2, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rate.name} (%)
                      </Box>
                      <TextField
                        type="number"
                        value={rate.value}
                        onChange={(e) => {
                          const newGrowthRates = growthRates.map((r: any) =>
                            r.name === rate.name && r.type === 'amenity'
                              ? { ...r, value: Number(e.target.value) }
                              : r
                          );
                          setGrowthRates(newGrowthRates);
                        }}
                        size="small"
                        sx={{ flex: 1, minWidth: 120 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                        variant="outlined"
                        fullWidth
                      />
                    </Box>
                  ))}
              </Box>

            </Box>
          )}
          {steps[activeStep] === "Operating Expenses" && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>

              <OperatingExpensesTable operatingExpenses={operatingExpenses} setOperatingExpenses={setOperatingExpenses} units={units} amenityIncome={amenityIncome} modelDetails={modelDetails} retailIncome={retailIncome}
                retailExpenses={expenses.filter((expense: any) => expense.type === "Retail")} />
              <Box sx={{ mt: 2, width: '100%' }}>
                {growthRates
                  .filter((rate: any) => rate.type === 'expense')
                  .map((rate: any, idx: number) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                        width: '100%',
                      }}
                    >
                      <Box sx={{ flex: '0 0 auto', fontWeight: 500, color: 'text.secondary', pr: 2, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rate.name} (%)
                      </Box>
                      <TextField
                        type="number"
                        value={rate.value}
                        onChange={(e) => {
                          const newGrowthRates = growthRates.map((r: any) =>
                            r.name === rate.name && r.type === 'expense'
                              ? { ...r, value: Number(e.target.value) }
                              : r
                          );
                          setGrowthRates(newGrowthRates);
                        }}
                        size="small"
                        sx={{ flex: 1, minWidth: 120 }}
                        inputProps={{ style: { textAlign: 'right' } }}
                        variant="outlined"
                        fullWidth
                      />
                    </Box>
                  ))}
              </Box>

            </Box>
          )}

          {steps[activeStep] === "Refinancing" && (
            <>
              <RefinancingSection modelDetails={modelDetails} handleFieldChange={handleFieldChange} finalMetricsCalculating={finalMetricsCalculating} variables={variables} />
            </>
          )
          }

          {steps[activeStep] === "Net Operating Income" && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:2 }}>
              <NetOperatingIncomeTable finalMetricsCalculating={finalMetricsCalculating} noiTableValues={noiTableValues} />
            </Box>
          )}

          {steps[activeStep] === "Acquisition Financing" && (
            <>
              <AcquisitionFinancingSection modelDetails={modelDetails} handleFieldChange={handleFieldChange} finalMetricsCalculating={finalMetricsCalculating} variables={variables} />
            </>
          )}

          {steps[activeStep] === "Leasing Assumptions" && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p:0 }}>
              <LeasingAssumptions
                modelDetails={modelDetails}
                handleFieldChange={handleFieldChange}
              />
            </Box>
          )}


          {steps[activeStep] === "Exit Assumptions" && (
            <Box sx={{ maxWidth: "1200px", mx: "auto", p: 0 }}>
              <ExitAssumptions
                modelDetails={modelDetails}
                handleFieldChange={handleFieldChange}
                showRetail={selectedModelTypeInfo?.show_retail}
                showRentalUnits={selectedModelTypeInfo?.show_rental_units}
                variables={variables}
                numUnits={units?.length || 0}
              />
            </Box>
          )}


          {/* Show "General Property Assumptions" section at step 1, all others at the end */}
          {selectedModelTypeInfo?.sections.map((section, index) => {
            // Show "General Property Assumptions" at step 1
            if (
              section.name === "General Property Assumptions" &&
              activeStep === steps.indexOf("General Property Assumptions")
            ) {
              return (
                <Box key={section.id} sx={{ p: 2, px:4, borderRadius: 2, maxWidth: "1200px", mx: "auto" }}>

                  {section.fields.filter(field => field.active === true).map((field: Field) => {
                    const fieldValue = modelDetails.user_model_field_values.find((fv: any) => fv.field_id === field.id)?.value || '';
                    const startMonth = modelDetails.user_model_field_values.find((fv: any) => fv.field_id === field.id)?.start_month ?? '';
                    const endMonth = modelDetails.user_model_field_values.find((fv: any) => fv.field_id === field.id)?.end_month ?? '';

                    return (
                      <SectionFields key={field.id} field={field} fieldValue={fieldValue} startMonth={startMonth} endMonth={endMonth} handleFieldChange={handleFieldChange} />

                    );
                  })}

                </Box>
              );
            }


            // Only show the current section that matches the current step
            if (
              steps[activeStep] === section.name && section.name !== "General Property Assumptions"
              && section.name !== "Acquisition Financing"
              && section.name !== "Refinancing"
              && section.name !== "Leasing Assumptions"
              && section.name !== "Exit Assumptions"
            ) {
              // Calculate the last step for finish button
              const lastStep = steps.length - 1;
              const thisStep = activeStep;

              return (
                <Box key={section.id} sx={{ p: 2, borderRadius: 2, border: "1px solid #e6e9ef", maxWidth: "1200px", mx: "auto" }}>
                  {/* <Box key={section.id} sx={{ mt: 0, backgroundColor: "white", p: 2, borderRadius: 2, maxWidth: "600px", mx: "auto" }}> */}

                  {section.fields.filter(field => field.active === true).map((field: Field) => {
                    const fieldValue = modelDetails.user_model_field_values.find((fv: any) => fv.field_id === field.id)?.value || '';
                    const startMonth = modelDetails.user_model_field_values.find((fv: any) => fv.field_id === field.id)?.start_month ?? '';
                    const endMonth = modelDetails.user_model_field_values.find((fv: any) => fv.field_id === field.id)?.end_month ?? '';

                    return (
                      <SectionFields key={field.id} field={field} fieldValue={fieldValue} startMonth={startMonth} endMonth={endMonth} handleFieldChange={handleFieldChange} />
                    );
                  })}

                  {/* </Box> */}
                </Box>
              );
            }


            // Otherwise, don't render anything for this section at this step
            return null;
          })}




          {nameError && (
            <Typography color="error" sx={{ mt: 2 }}>
              Duplicate names are not allowed.
            </Typography>
          )}
          {rentalRateError && (
            <Typography color="error" sx={{ mt: 2 }}>
              At least one rental unit growth rate is required.
            </Typography>
          )}
        </ModelStepper>
      )}
    </>
  );
};

export default CreateModel;