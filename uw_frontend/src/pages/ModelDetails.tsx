import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Button,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { pdf } from "@react-pdf/renderer";
import PdfSummaryDocument from "../components/PdfSummaryDocument";
import { DataGrid, GridPagination } from "@mui/x-data-grid";
import { BACKEND_URL } from "../utils/constants";
import { colors } from "../theme";
import SensitivityTable from "../components/SensitivityTable";
import { NumberInput } from "../components/NumberInput";
import OperatingExpensesReadOnly from "../components/OperatingExpensesReadOnly";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import RetailSummary from "../components/RetailSummary";

const ModelDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccessTokenSilently, user: auth0User } = useAuth0();
  const [modelDetails, setModelDetails] = useState<any>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);  
  const [downloadOptionsOpen, setDownloadOptionsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [accessError, setAccessError] = useState<string>("");
  const [companyInfo, setCompanyInfo] = useState<any | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState<string>('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  // Pictures (model gallery)
  const [pictures, setPictures] = useState<any[]>([]);
  const [newPicDesc, setNewPicDesc] = useState<string>('');
  const [newPicFile, setNewPicFile] = useState<File | null>(null);
  const [uploadingPic, setUploadingPic] = useState<boolean>(false);
  const [editingPicId, setEditingPicId] = useState<string | null>(null);
  const [editingPicDesc, setEditingPicDesc] = useState<string>('');
  const [deletePicId, setDeletePicId] = useState<string | null>(null);
  const [deletePicOpen, setDeletePicOpen] = useState<boolean>(false);
  const [reorderBusyId, setReorderBusyId] = useState<string | null>(null);

  // Polling refs for sensitivity generation status
  const pollingTimerRef = useRef<number | null>(null);
  const pollAttemptsRef = useRef<number>(0);

  const clearPolling = () => {
    if (pollingTimerRef.current) {
      window.clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    pollAttemptsRef.current = 0;
  };

  const startPolling = () => {
    setIsCalculating(true);
  };

  useEffect(() => {
    // Cleanup polling on unmount
    return () => clearPolling();
  }, []);

  // Normalize numeric inputs (strip commas and % if present)
  const normalizeNumberString = (val: string) =>
    (val || "").toString().replace(/,/g, "").replace(/%/g, "").trim();

  const [maxPrice, setMaxPrice] = useState<string>("185000");
  const [minCapRate, setMinCapRate] = useState<string>("10.00");

  // Track original values to detect changes
  const [originalMaxPrice, setOriginalMaxPrice] = useState<string>("185000");
  const [originalMinCapRate, setOriginalMinCapRate] = useState<string>("10.00");

  // Sensitivity analysis state
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [irrSensitivityData, setIrrSensitivityData] = useState({
    capRates: [],
    acquisitionPrices: [],
    values: [],
  });
  const [moicSensitivityData, setMoicSensitivityData] = useState({
    capRates: [],
    acquisitionPrices: [],
    values: [],
  });

  // Helper function to check if sensitivity analysis values have changed
  const hasValuesChanged = (): boolean => {
    if (
      irrSensitivityData.capRates[0] === parseFloat(minCapRate) &&
      irrSensitivityData.acquisitionPrices[0] === parseFloat(maxPrice)
    ) {
      return false;
    }
    return true;
  };

  // Helper function to get field value by field_key using sections structure
  const getFieldValue = (fieldKey: string, defaultValue: string): string => {
    if (!modelDetails?.sections || !modelDetails?.user_model_field_values) {
      return defaultValue;
    }

    // Find the field_id by looking through sections.fields for the matching field_key
    let fieldId: string | null = null;
    let foundSection = "";
    for (const section of modelDetails.sections) {
      const field = section.fields.find((f: any) => f.field_key === fieldKey);
      if (field) {
        fieldId = field.id;
        foundSection = section.name;
        break;
      }
    }

    if (!fieldId) {
      return defaultValue;
    }

    // Find the field value using the field_id
    const fieldValue = modelDetails.user_model_field_values.find(
      (fv: any) => fv.field_id === fieldId
    );
    if (!fieldValue) {
      return defaultValue;
    }

    const result = fieldValue.value?.toString() || defaultValue;
    return result;
  };

  const handleGenerate = async (maxPrice: string, minCapRate: string) => {
    if (!modelDetails?.google_sheet_url) {
      console.error("No Google Sheet URL available");
      return;
    }

    const maxPriceNum = parseFloat(normalizeNumberString(maxPrice));
    const minCapNum = parseFloat(normalizeNumberString(minCapRate));
    if (!Number.isFinite(maxPriceNum) || !Number.isFinite(minCapNum)) {
      console.warn("Sensitivity inputs not ready");
      return;
    }

    setIsCalculating(true);

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BACKEND_URL}/api/sensitivity-analysis`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          google_sheet_url: modelDetails.google_sheet_url,
          max_price: maxPriceNum,
          min_cap_rate: minCapNum,
          version_id: modelDetails.version_id,
        }),
      });

      if (response.status === 202) {
        // generation in progress
        startPolling();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.irr_table && result.moic_table) {
        const cleanTableData = (tableData: any) => {
          const cleanValues = tableData.values.map((row: any[]) =>
            row.map((val: any) => {
              if (typeof val === "string") {
                const cleaned = parseFloat(val.replace("x", "")) || 0;
                return cleaned;
              }
              return typeof val === "number" ? val : 0;
            })
          );
          const capRates = tableData.capRates.map((rate: any) => {
            const numRate =
              typeof rate === "number" ? rate : parseFloat(String(rate));
            return Number.isFinite(numRate) ? numRate : 0;
          });
          return {
            capRates,
            acquisitionPrices: tableData.acquisitionPrices.map((price: any) => {
              const n =
                typeof price === "number"
                  ? price
                  : parseFloat(String(price).replace(/,/g, ""));
              return Number.isFinite(n) ? n : 0;
            }),
            values: cleanValues,
          };
        };

        setIrrSensitivityData(cleanTableData(result.irr_table));
        setMoicSensitivityData(cleanTableData(result.moic_table));
        setOriginalMaxPrice(maxPrice);
        setOriginalMinCapRate(minCapRate);
      } else if (result.status === "generating") {
        startPolling();
      } else {
        throw new Error(
          "Invalid response format from sensitivity analysis API"
        );
      }
    } catch (error) {
      console.error("Error generating sensitivity analysis:", error);
      setIrrSensitivityData({
        capRates: [],
        acquisitionPrices: [],
        values: [],
      });
      setMoicSensitivityData({
        capRates: [],
        acquisitionPrices: [],
        values: [],
      });
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    const fetchModelDetails = async () => {
      try {
        const token = await getAccessTokenSilently();
        const url = selectedVersion
          ? `${BACKEND_URL}/api/user_models/${id}?version_id=${selectedVersion}`
          : `${BACKEND_URL}/api/user_models/${id}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (response.status === 403) {
          setAccessError("User does not have access to this model");
          setIsCalculating(false);
          return;
        }
        const data = await response.json();
        if (data.error) {
          setAccessError("User does not have access to this model");
          // alert(data.error);
          return;
        }

        setModelDetails(data);
        console.log("MODEL DETAILS", data);


        // Set the selected version to the current version if not already set
        if (!selectedVersion && data.version_id) {
          setSelectedVersion(data.version_id);
        }
      } catch (err) {
        console.error("Error fetching model details:", err);
      }
    };

    fetchModelDetails();
  }, [id, selectedVersion, getAccessTokenSilently]);

  // Fetch model notes (active) on render / id change
  useEffect(() => {
    const fetchNotes = async () => {
      if (!id) return;
      try {
        const token = await getAccessTokenSilently();
        const resp = await fetch(`${BACKEND_URL}/api/user_models/${id}/notes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!resp.ok) {
          setNotes([]);
          return;
        }
        const data = await resp.json();
        if (Array.isArray(data)) {
          setNotes(data);
        } else {
          setNotes([]);
        }
      } catch {
        setNotes([]);
      }
    };
    fetchNotes();
  }, [id, getAccessTokenSilently]);

  const refreshNotes = async () => {
    if (!id) return;
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${BACKEND_URL}/api/user_models/${id}/notes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!resp.ok) {
        setNotes([]);
        return;
      }
      const data = await resp.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    }
  };

  const handleAddNote = async () => {
    if (!id || !newNote.trim()) return;
    setAddingNote(true);
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${BACKEND_URL}/api/user_models/${id}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ note_value: newNote.trim() }),
      });
      if (resp.ok) {
        setNewNote('');
        await refreshNotes();
      }
    } catch {
      // ignore
    } finally {
      setAddingNote(false);
    }
  };

  const startEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteValue(note.note_value || '');
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteValue('');
  };

  const saveEditNote = async () => {
    if (!editingNoteId) return;
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${BACKEND_URL}/api/notes/${editingNoteId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ note_value: editingNoteValue }),
      });
      if (resp.ok) {
        setEditingNoteId(null);
        setEditingNoteValue('');
        await refreshNotes();
      }
    } catch {
      // ignore
    }
  };

  const confirmDeleteNote = (noteId: string) => {
    setDeleteNoteId(noteId);
    setDeleteOpen(true);
  };

  const handleDeleteNote = async () => {
    const noteId = deleteNoteId;
    setDeleteOpen(false);
    if (!noteId) return;
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${BACKEND_URL}/api/notes/${noteId}/remove`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (resp.ok) {
        await refreshNotes();
      }
    } catch {
      // ignore
    } finally {
      setDeleteNoteId(null);
    }
  };

  // Pictures helpers
  const refreshPictures = fetchPictures;
  async function fetchPictures() {
    if (!id) return;
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${BACKEND_URL}/api/user_models/${id}/pictures`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!resp.ok) return setPictures([]);
      const data = await resp.json();
      setPictures(Array.isArray(data) ? data : []);
    } catch {
      setPictures([]);
    }
  }
  useEffect(() => { fetchPictures(); }, [id, getAccessTokenSilently]);

  const handleUploadPicture = async () => {
    if (!id || !newPicFile) return;
    setUploadingPic(true);
    try {
      const token = await getAccessTokenSilently();
      const form = new FormData();
      form.append('file', newPicFile);
      form.append('description', newPicDesc || '');
      // default order: append at end
      if (pictures && pictures.length > 0) {
        form.append('picture_order', String(pictures.length));
      }
      const resp = await fetch(`${BACKEND_URL}/api/user_models/${id}/pictures/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        body: form,
      });
      if (resp.ok) {
        setNewPicFile(null);
        setNewPicDesc('');
        await refreshPictures();
      }
    } catch {
      // ignore
    } finally {
      setUploadingPic(false);
    }
  };

  const startEditPicture = (p: any) => {
    setEditingPicId(p.id);
    setEditingPicDesc(p.description || '');
  };
  const cancelEditPicture = () => {
    setEditingPicId(null);
    setEditingPicDesc('');
  };
  const saveEditPicture = async () => {
    if (!editingPicId) return;
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${BACKEND_URL}/api/pictures/${editingPicId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ description: editingPicDesc }),
      });
      if (resp.ok) {
        setEditingPicId(null);
        setEditingPicDesc('');
        await refreshPictures();
      }
    } catch {
      // ignore
    }
  };

  const confirmDeletePicture = (pictureId: string) => {
    setDeletePicId(pictureId);
    setDeletePicOpen(true);
  };
  const handleDeletePicture = async () => {
    const pictureId = deletePicId;
    setDeletePicOpen(false);
    if (!pictureId) return;
    try {
      const token = await getAccessTokenSilently();
      const resp = await fetch(`${BACKEND_URL}/api/pictures/${pictureId}/remove`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (resp.ok) {
        await refreshPictures();
      }
    } catch {
      // ignore
    } finally {
      setDeletePicId(null);
    }
  };

  const movePicture = async (index: number, direction: 'left' | 'right') => {
    if (!pictures || pictures.length === 0) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pictures.length) return;
    const a = pictures[index];
    const b = pictures[targetIndex];
    setReorderBusyId(a.id);
    try {
      const token = await getAccessTokenSilently();
      // Normalize orders by current indices for stability
      const updates = [
        { id: a.id, picture_order: targetIndex },
        { id: b.id, picture_order: index },
      ];
      for (const u of updates) {
        await fetch(`${BACKEND_URL}/api/pictures/${u.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ picture_order: u.picture_order }),
        });
      }
      await refreshPictures();
    } catch {
      // ignore
    } finally {
      setReorderBusyId(null);
    }
  };

  // Update sensitivity analysis inputs when modelDetails changes
  useEffect(() => {
    if (modelDetails?.sections && modelDetails?.user_model_field_values) {
      const acquisitionPriceValue = getFieldValue("Acquisition Price", "");
      setMaxPrice(acquisitionPriceValue);
      setOriginalMaxPrice(acquisitionPriceValue);

      const exitCapRateValue = getFieldValue(
        "Multifamily Applied Exit Cap Rate",
        ""
      );
      setMinCapRate(exitCapRateValue);
      setOriginalMinCapRate(exitCapRateValue);
    }
  }, [modelDetails]);

  useEffect(() => {
    // Auto-run sensitivity analysis only when inputs are ready
    if (!modelDetails) return;
    const tables = modelDetails.sensitivity_tables;
    const haveInputs =
      !!normalizeNumberString(maxPrice) && !!normalizeNumberString(minCapRate);
    if (!haveInputs) return;

    if (!tables || (tables && tables.status === "generating")) {
      if (tables && tables.status === "generating") {
        startPolling();
      } else if (!isCalculating && modelDetails.google_sheet_url) {
        let maxPrice = getFieldValue("Acquisition Price", "");
        let minCapRate = getFieldValue("Multifamily Applied Exit Cap Rate", "");
        handleGenerate(maxPrice, minCapRate);
      }
      return;
    }
    if (tables && tables.irr_table && tables.moic_table) {
      const mapTable = (t: any) => ({
        capRates: t.capRates || [],
        acquisitionPrices: t.acquisitionPrices || [],
        values: t.values || [],
      });
      setIrrSensitivityData(mapTable(tables.irr_table));
      setMoicSensitivityData(mapTable(tables.moic_table));
    }
  }, [modelDetails]);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => clearPolling();
  }, []);

  // Compute tables to show (filter summary==='false' then sort by order)
  const tablesToShow = React.useMemo(() => {
    const raw: any[] = Array.isArray(modelDetails?.table_mapping_output)
      ? (modelDetails.table_mapping_output as any[])
      : [];
    const hasSummaryFalse = raw.some(
      (t) => typeof t?.summary === "boolean" && !t.summary
    );
    const filtered = hasSummaryFalse
      ? raw.filter((t) => (typeof t?.summary === "boolean" ? !t.summary : true))
      : raw;
    const sorted = filtered.slice().sort((a, b) => {
      const ao = Number.isFinite(Number(a?.order)) ? Number(a.order) : 0;
      const bo = Number.isFinite(Number(b?.order)) ? Number(b.order) : 0;
      return ao - bo;
    });
    return sorted;
  }, [modelDetails?.table_mapping_output]);

  // PDF options state (defaults)
  const [pdfOptions, setPdfOptions] = useState<Record<string, boolean>>({});
  const [pdfOrder, setPdfOrder] = useState<string[]>([]);
  useEffect(() => {
    const base: Record<string, boolean> = {
      "Summary Info": true,
      "Sensitivity Tables": true,
      "Income and Expenses": true,
      "Include Company Info": true,
      "Include Company Logo": true,
      "Property Images": Array.isArray(pictures) && pictures.length > 0,
      "Include Notes": false,
    };
    tablesToShow.forEach((t: any) => {
      if (t?.table_name) base[t.table_name] = true;
    });
    setPdfOptions(base);
    // Initialize ordering: core sections, tables, then property images by default
    const defaultOrder: string[] = [
      "Summary Info",
      "Sensitivity Tables",
      "Income and Expenses",
      ...tablesToShow.map((t: any) => t?.table_name).filter(Boolean),
      "Property Images",
      "Include Notes",
    ];
    setPdfOrder(defaultOrder);
  }, [tablesToShow, pictures]);

  const togglePdfOption = (key: string) =>
    setPdfOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const movePdfOrder = (key: string, dir: 'up' | 'down') => {
    setPdfOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const tmp = next[idx];
      next[idx] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  // Drag & drop reordering for PDF sections
  const [dragKey, setDragKey] = useState<string | null>(null);
  const handleDragStart = (key: string) => (e: React.DragEvent<HTMLDivElement>) => {
    setDragKey(key);
    try {
      e.dataTransfer.setData('text/plain', key);
    } catch {}
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDropOn = (targetKey: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sourceKey = dragKey || (() => {
      try { return e.dataTransfer.getData('text/plain'); } catch { return ''; }
    })();
    if (!sourceKey || sourceKey === targetKey) { setDragKey(null); return; }
    setPdfOrder((prev) => {
      const from = prev.indexOf(sourceKey);
      const to = prev.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragKey(null);
  };
  const handleDragEnd = () => setDragKey(null);

  // Fetch company info when opening download options
  useEffect(() => {
    if (!downloadOptionsOpen) return;
    const run = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE },
        });
        const r = await fetch(`${BACKEND_URL}/api/company_info`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-User-Email": (auth0User as any)?.email || "",
          },
          credentials: "include",
        });
        if (!r.ok) { setCompanyInfo(null); return; }
        const d = await r.json();
        setCompanyInfo(d && d.exists ? d : null);
      } catch {
        setCompanyInfo(null);
      }
    };
    run();
  }, [downloadOptionsOpen, getAccessTokenSilently, auth0User]);

  const hasCompanyInfo =
    !!(companyInfo && (companyInfo.company_name || companyInfo.company_email || companyInfo.company_phone_number));
  const hasCompanyLogo = !!(companyInfo && companyInfo.company_logo_url);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPDF(true);
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const fileName = `${(modelDetails?.name || "Model").replace(/[^a-zA-Z0-9 _-]/g, "").trim()} - ${dateStr}.pdf`;

      // If logo requested, fetch as data URL from backend to avoid CORS in react-pdf
      let logoDataUrl: string | undefined = undefined;
      if (pdfOptions["Include Company Logo"] && (companyInfo?.company_logo_url)) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE },
          });
          const resp = await fetch(`${BACKEND_URL}/api/company_logo/data_url`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, "X-User-Email": (auth0User as any)?.email || "" },
            credentials: "include",
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.dataUrl) logoDataUrl = data.dataUrl;
          }
        } catch {
          // ignore, fallback to no logo
        }
      }

      // Get server-side data URLs for images to avoid CORS issues in react-pdf
      let pdfPictures: Array<{ picture_url: string; description?: string }> = [];
      if (pdfOptions["Property Images"] && Array.isArray(pictures) && pictures.length > 0) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE },
          });
          const resp = await fetch(`${BACKEND_URL}/api/user_models/${id}/pictures/data_urls`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          if (resp.ok) {
            const d = await resp.json();
            if (Array.isArray(d)) {
              pdfPictures = d.slice(0, 24).map((x: any) => ({
                picture_url: String(x.picture_url || ""),
                description: x.description,
              }));
            }
          }
        } catch {
          pdfPictures = [];
        }
      }

      const blob = await pdf(
        <PdfSummaryDocument
          modelDetails={modelDetails}
          variables={modelDetails?.variables || {}}
          logoSrc={logoDataUrl}
          options={pdfOptions}
          holdMonthsExternal={maxExitMonths}
          companyInfo={pdfOptions["Include Company Info"] ? companyInfo : null}
          summaryTables={summaryTables}
          otherTables={tablesToShow}
          irrTable={irrSensitivityData}
          moicTable={moicSensitivityData}
          pictures={pdfPictures}
          order={pdfOrder}
          notes={(Array.isArray(notes) ? notes : []).map((n: any) => String(n?.note_value || '')).filter((s: string) => s && s.trim().length > 0)}
          retailMode={modelDetails?.model_type?.show_rental_units === false && modelDetails?.model_type?.show_retail === true}
          spaceType={
            ((modelDetails?.user_model_field_values || []).find((f: any) => {
              const k = String(f.field_key || '');
              return k === 'space_type' || k.trim() === 'space_type';
            })?.value) ?? 'Retail'
          }
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // swallow
    } finally {
      setDownloadingPDF(false);
      setDownloadOptionsOpen(false);
    }
  };

  // Tables explicitly marked as summary === true (boolean), sorted by order
  const summaryTables = React.useMemo(() => {
    const raw: any[] = Array.isArray(modelDetails?.table_mapping_output)
      ? (modelDetails.table_mapping_output as any[])
      : [];
    const filtered = raw.filter(
      (t) => typeof t?.summary === "boolean" && t.summary === true
    );
    const sorted = filtered.slice().sort((a, b) => {
      const ao = Number.isFinite(Number(a?.order)) ? Number(a.order) : 0;
      const bo = Number.isFinite(Number(b?.order)) ? Number(b.order) : 0;
      return ao - bo;
    });
    return sorted;
  }, [modelDetails?.table_mapping_output]);

  // Helper: Max Exit (Retail Exit vs Multifamily Exit) from variables
  const maxExitMonths = React.useMemo<number | null>(() => {
    const vars: any = modelDetails?.variables || {};
    const toNum = (v: any): number => {
      if (v === null || v === undefined) return NaN;
      if (typeof v === 'number') return v;
      const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(n) ? n : NaN;
    };
    const retail = toNum(vars['Retail Exit']);
    const multifamily = toNum(vars['Multifamily Exit']);
    const numbers = [retail, multifamily].filter((n) => Number.isFinite(n)) as number[];
    if (numbers.length === 0) return null;
    return Math.max(...numbers);
  }, [modelDetails?.variables]);

  if (!modelDetails) {
    if (accessError) {
      return (
        <Box
          sx={{
            mt: 2,
            mb: 2,
            p: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            color: "#b71c1c",
            backgroundColor: "#ffebee",
          }}
        >
          {accessError}
        </Box>
      );
    } else {
      return <Typography>Loading...</Typography>;
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleVersionChange = (event: SelectChangeEvent) => {
    setSelectedVersion(event.target.value);
  };

  const downloadWorksheet = async (
    getAccessTokenSilently: () => Promise<string>,
    modelDetails: any
  ) => {
    setDownloading(true);
    try {
      const token = await getAccessTokenSilently();
      const userModelVersionId =
        modelDetails.user_model_version_id ||
        modelDetails.version_id ||
        modelDetails.versionNumberId ||
        modelDetails.version_number_id;
      const version_id = userModelVersionId || modelDetails.version_id;
      if (!version_id) {
        alert("No model version ID found for download.");
        setDownloading(false);
        return;
      }
      const response = await fetch(
        `${BACKEND_URL}/api/download_worksheet/${version_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ notes }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to download worksheet");
      }
      const blob = await response.blob();
      let modelName = modelDetails.name
        ? modelDetails.name.replace(/\s+/g, "_")
        : "model";
      let versionNumber = modelDetails.version_number || 1;
      let filename = `${modelName}_${versionNumber}.xlsx`;
      const disposition = response.headers.get("Content-Disposition");
      if (disposition && disposition.indexOf("filename=") !== -1) {
        const extracted = disposition.split("filename=")[1].replace(/"/g, "");
        if (extracted && extracted.endsWith(".xlsx")) {
          filename = extracted;
        }
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading worksheet");
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  // Update rows to include unitNumber and pf_rent
  // Define types for units and market rent assumptions
  interface Unit {
    id: string;
    rent_type: string;
    vacate_flag: number;
    layout: string;
    square_feet: number;
    vacate_month: number;
    current_rent: number;
    // Optionally, other fields
    [key: string]: any;
  }

  interface MarketRentAssumption {
    layout: string;
    pf_rent: number;
    // Optionally, other fields
    [key: string]: any;
  }

  // Defensive: fallback to empty array if undefined
  const units: Unit[] = Array.isArray(modelDetails.units)
    ? modelDetails.units
    : [];
  const marketRentAssumptions: MarketRentAssumption[] = Array.isArray(
    modelDetails.market_rent_assumptions
  )
    ? modelDetails.market_rent_assumptions
    : [];

  // Update rows to include unitNumber and pf_rent
  const rows = units.map((unit: Unit, index: number) => {
    const matchingAssumption = marketRentAssumptions.find(
      (assumption: MarketRentAssumption) => assumption.layout === unit.layout
    );
    return {
      ...unit,
      unitNumber: index + 1,
      pf_rent: matchingAssumption?.pf_rent || 0,
    };
  });

  // Calculate totals
  const totalSquareFeet = units.reduce(
    (sum: number, unit: Unit) => sum + (unit.square_feet || 0),
    0
  );
  const totalCurrentRent = units.reduce(
    (sum: number, unit: Unit) => sum + (unit.current_rent || 0),
    0
  );
  const totalPfRent = rows.reduce(
    (sum, row) =>
      sum + (row.vacate_flag === 0 ? row.current_rent || 0 : row.pf_rent || 0),
    0
  );

  const CustomFooter = () => (
    <div
      style={{
        padding: "8px 16px",
        backgroundColor: "#f5f5f5",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: "24px", justifyContent: "flex-end", width: "100%" }}>
        <div style={{ textAlign: "right" }}>
          <strong>Total Units:</strong> {units.length}
        </div>
        <div style={{ textAlign: "right" }}>
          <strong>Total Rentable Square Feet:</strong>{" "}
          {totalSquareFeet.toLocaleString()}
        </div>
        <div style={{ textAlign: "right" }}>
          <strong>Total Current Rent:</strong> $
          {totalCurrentRent.toLocaleString()}
        </div>
        <div style={{ textAlign: "right" }}>
          <strong>Total Pro Forma Rent:</strong> ${totalPfRent.toLocaleString()}
        </div>
      </div>
      {modelDetails.units.length > 100 && <GridPagination />}
    </div>
  );

  // Footer for Amenity Income table showing totals
  const AmenityIncomeFooter = () => {
    const totalMonthly = (modelDetails?.amenity_income || []).reduce(
      (sum: number, row: any) => {
        const usage = Math.round(
          ((row?.utilization || 0) / 100) * (row?.unit_count || 0)
        );
        const monthly = usage * (row?.monthly_fee || 0);
        return sum + monthly;
      },
      0
    );
    const totalAnnual = totalMonthly * 12;

    return (
      <div
        style={{
          padding: "8px 16px",
          backgroundColor: "#f5f5f5",
          borderTop: "1px solid #e0e0e0",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "24px" }}>
          <div style={{ textAlign: "right" }}>
            <strong>Total Monthly Amenity Income:</strong> $
            {totalMonthly.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>Total Annual Amenity Income:</strong> $
            {totalAnnual.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render a styled table mapping after removing entirely blank rows and columns
  const renderTableMappingRows = (mapping: any, maxWidth: number | null = null) => {
    const data: any[][] = Array.isArray(mapping?.data) ? mapping.data : [];
    const styles: any[][] = Array.isArray(mapping?.styles)
      ? mapping.styles
      : [];

    const isBlank = (cell: any) =>
      cell === null ||
      cell === undefined ||
      (typeof cell === "string" && cell.trim() === "");

    // Determine the last non-blank row and keep rows up to that (trim only trailing blanks)
    let lastNonBlank = -1;
    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i] || [];
      if (row.some((cell) => !isBlank(cell))) {
        lastNonBlank = i;
        break;
      }
    }
    if (lastNonBlank === -1) return null; // all rows blank
    const keptRowIndices: number[] = Array.from(
      { length: lastNonBlank + 1 },
      (_, i) => i
    );

    // Compute columns to keep across kept rows
    const maxCols = keptRowIndices.reduce(
      (m, ri) => Math.max(m, (data[ri] || []).length),
      0
    );
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
    if (keptColIndices.length === 0) return null;

    // Helper to convert CSS style string to React style object
    const styleStringToObject = (s: string) => {
      try {
        return Object.fromEntries(
          s
            .split(";")
            .filter((x: string) => x.trim())
            .map((x: string) => {
              const [prop, val] = x.split(":").map((y: string) => y.trim());
              const camelProp = prop.replace(/-([a-z])/g, (g) =>
                (g[1] || "").toUpperCase()
              );
              return [camelProp, val];
            })
        );
      } catch {
        return {} as any;
      }
    };

    const filteredRowIndices = keptRowIndices.filter((ri, idx) => {
      const row = data[ri] || [];
      const prevRowIndex = idx > 0 ? keptRowIndices[idx - 1] : -1;
      const prevRow = prevRowIndex >= 0 ? data[prevRowIndex] : null;
      const isPrevTotalSources = prevRow && prevRow.some(c => typeof c === 'string' && c.trim() === 'Total Sources');
      if (isPrevTotalSources && row.every(cell => isBlank(cell))) return false;
      return true;
    });

    return filteredRowIndices.map((ri) => {
      const row = data[ri] || [];
      const isTotalRow = row.some(c => typeof c === 'string' && (c.trim() === 'Total Sources' || c.trim() === 'Total Uses'));

      return (
      <tr key={ri}>
        {keptColIndices.map((ci) => {
          const cell = (data[ri] || [])[ci];
          const styleStr = (styles[ri] || [])[ci];
          const inlineStyle = styleStr ? styleStringToObject(styleStr) : {};
          return (
            <td
              key={ci}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e0e0e0",
                height: 18,
                verticalAlign: "middle",
            // fontSize: '1.2rem',
            textAlign: ci === keptColIndices[0] ? 'left' : 'right',
                  ...(isTotalRow ? { borderTop: "2px solid #333", fontWeight: 'bold' } : {}),
            ...(inlineStyle as any),
                maxWidth: maxWidth,
                }}
              >
                {(() => {
                  const val = cell;
                  if (val === null || val === undefined) return "\u00A0";
                  if (val === 0 || val === "0") return "-";
                  const str = typeof val === "string" ? val : String(val);
                  return str.trim() === "" ? "\u00A0" : val;
                })()}
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: colors.grey[100],
        padding: 0,
      }}
    >
      <Box
        sx={{
          mt: 0,
          padding: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Card
            sx={{
              flexGrow: 1,
              position: "relative",
              backgroundColor: colors.navy,
              borderRadius: 0,
              color: "#fff",
            }}
          >
            <CardContent sx={{ position: "relative", pb: 0, minHeight: "160px" }}>
              {/* Top right: Edit/Download buttons */}
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 1,
                  zIndex: 2,
                }}
              >
                {/* Edit Model Button */}
                <Tooltip title="Edit Model">
                  <IconButton
                    color="primary"
                    size="small"
                    disabled={downloadingPDF || downloading || isCalculating}
                    sx={{
                      backgroundColor: "primary.main",
                      color: "#fff",
                      "&:hover": { backgroundColor: "primary.dark" },
                      "&:disabled": { backgroundColor: "grey.400", color: "grey.600" },
                    }}
                    onClick={() => {
                      navigate(`/edit-model/${modelDetails.version_id}`);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download PDF Summary">
                  <IconButton
                    color="primary"
                    size="small"
                    sx={{
                      backgroundColor: "primary.main",
                      color: "#fff",
                      "&:hover": { backgroundColor: "primary.dark" },
                      "&:disabled": { backgroundColor: "grey.400", color: "grey.600" },
                    }}
                    onClick={() => setDownloadOptionsOpen(true)}
                    disabled={downloadingPDF || downloading || isCalculating}
                  >
                    <PictureAsPdfIcon />
                  </IconButton>
                </Tooltip>

                <Dialog open={downloadOptionsOpen} onClose={() => setDownloadOptionsOpen(false)} maxWidth="sm" fullWidth>
                  <DialogTitle sx={{ fontWeight: 800, bgcolor: 'grey.50', borderBottom: '1px solid #e5e7eb' }}>Download Options</DialogTitle>
                  <DialogContent>
                    <FormGroup>
                      {pdfOrder.map((key) => {
                        if (!key) return null;
                        // Skip arrows for Company Info/Logo (not part of order)
                        if (key === "Include Company Info" || key === "Include Company Logo") return null;
                        const disabled =
                          key === "Property Images"
                            ? (!Array.isArray(pictures) || pictures.length === 0)
                            : key === "Include Notes"
                              ? !(Array.isArray(notes) && notes.length > 1)
                              : false;
                        return (
                          <Box
                            key={`opt-${key}`}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid #f1f5f9',
                              py: 0.5,
                              bgcolor: dragKey === key ? 'rgba(25,118,210,0.06)' : 'transparent'
                            }}
                            onDragOver={handleDragOver}
                            onDrop={handleDropOn(key)}
                          >
                      <FormControlLabel
                              control={
                                <Checkbox
                                  checked={!!pdfOptions[key]}
                                  onChange={() => togglePdfOption(key)}
                                  disabled={disabled}
                                />
                              }
                              label={key}
                      />
                            <Box
                              sx={{ display: 'flex', alignItems: 'center', pr: 1, color: 'text.secondary', cursor: 'grab' }}
                              draggable
                              onDragStart={handleDragStart(key)}
                              onDragEnd={handleDragEnd}
                              title="Drag to reorder"
                            >
                              <DragIndicatorIcon fontSize="small" />
                            </Box>
                          </Box>
                        );
                      })}
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!pdfOptions["Include Company Info"] && hasCompanyInfo}
                            onChange={() => togglePdfOption("Include Company Info")}
                            disabled={!hasCompanyInfo}
                          />
                        }
                        label="Include Company Info"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!pdfOptions["Include Company Logo"] && hasCompanyLogo}
                            onChange={() => togglePdfOption("Include Company Logo")}
                            disabled={!hasCompanyLogo}
                          />
                        }
                        label="Include Company Logo"
                        />
                      {(!companyInfo || (!companyInfo.company_name && !companyInfo.company_email && !companyInfo.company_phone_number)) && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          Company info not set. Please set in <a href="/settings">/settings</a>.
                        </Typography>
                      )}
                      {(!companyInfo || !companyInfo.company_logo_url) && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          Company logo not set. Please set in <a href="/settings">/settings</a>.
                        </Typography>
                      )}
                    </FormGroup>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setDownloadOptionsOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleDownloadPdf} disabled={downloadingPDF}>
                      {downloadingPDF ? "Preparing..." : "Download"}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Download Worksheet Button */}
                <Tooltip title={
                  modelDetails.sensitivity_tables && isCalculating
                    ? "Generating..."
                    : downloading
                    ? "Downloading..."
                    : "Download Worksheet"
                }>
                  <span>
                    <IconButton
                      color="primary"
                      size="small"
                      sx={{
                        backgroundColor: "primary.main",
                        color: "#fff",
                        "&:hover": { backgroundColor: "primary.dark" },
                        "&:disabled": { backgroundColor: "grey.400", color: "grey.600" },
                        opacity: downloading ? 0.7 : 1,
                      }}
                      onClick={() =>
                        downloadWorksheet(getAccessTokenSilently, modelDetails)
                      }
                      disabled={downloadingPDF || downloading || isCalculating}
                    >
                      {downloading ? (
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            border: "2px solid #fff",
                            borderTop: `2px solid ${colors.blue}`,
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      ) : (
                        <GridOnIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                {/* Spinner keyframes */}
                <style>
                  {`
                    @keyframes spin {
                      0% { transform: rotate(0deg);}
                      100% { transform: rotate(360deg);}
                    }
                  `}
                </style>

              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                {/* Empty for spacing/alignment */}
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, maxWidth: "calc(100% - 180px)", color: "#fff" }}
              >
                {modelDetails.name}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontSize: "1rem", fontWeight: 500, mb: 1, mt: 1, color: "#fff" }}
              >
                {modelDetails.street_address}, {modelDetails.city},{" "}
                {modelDetails.state}, {modelDetails.zip_code}
              </Typography>
              <Box sx={{ position: "absolute", left: 16, bottom: 16, zIndex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontSize: "1rem",
                    color: "#eee",
                    fontWeight: 700,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    p: 1,
                    borderRadius: 1,
                    width: "fit-content",
                    minWidth: 0,
                  }}
                >
                  Model Type: {modelDetails.model_type.name}
                </Typography>
              </Box>
              {/* <Typography variant="subtitle1" sx={{ fontSize: '1rem' }}>
                <span style={{ fontWeight: 500, marginRight: 8 }}>Leveraged IRR:</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1976d2' }}>
                  {modelDetails.levered_irr || 'N/A'}
                </span>
              </Typography> */}
              {/* <Typography variant="subtitle1" sx={{ fontSize: '1rem' }}>
                <span style={{ fontWeight: 500, marginRight: 8 }}>Leveraged MOIC:</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1976d2' }}>
                  {modelDetails.levered_moic || 'N/A'}
                </span>
              </Typography> */}
              {/* Version Dropdown moved to bottom right */}
              {modelDetails.versions && modelDetails.versions.length > 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    right: 16,
                    bottom: 24,
                    zIndex: 2,
                  }}
                >
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedVersion}
                      onChange={handleVersionChange}
                      displayEmpty
                      size="small"
                      sx={{
                        backgroundColor: "#fff",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        height: 36,
                        ".MuiSelect-select": {
                          py: 0.5,
                          px: 1.5,
                        },
                      }}
                    >
                      {modelDetails.versions.map((version: any) => (
                        <MenuItem
                          key={version.version_id}
                          value={version.version_id}
                        >
                          Version {version.version}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ padding: 0, backgroundColor: "#fafcff" }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="model details tabs"
            sx={{ mt: 2 }}
            variant="scrollable"
            scrollButtons={false}
          >
            <Tab label="Summary" />
            <Tab label="Income and Expenses" />
            {tablesToShow.map((table: any, index: number) => (
              <Tab key={index} label={table.table_name} />
            ))}
            <Tab label="Notes & Pictures" />
          </Tabs>
          {tabIndex === 0 && (
            <Box sx={{ mt: 2 }}>
              {/* Key Performance Metrics */}
              <Box sx={{ mb: 2, mt: 4, px:2 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 3,
                    mt: 3,
                  }}
                >
                  {/* Levered IRR */}
                  <Paper elevation={1} sx={{ borderRadius: '6px', border: `1px solid ${colors.grey[300]}`, bgcolor: 'white', p: 3 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: colors.grey[600], fontWeight: 600 }}>
                      Levered IRR
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: colors.grey[900], mt: 0.5 }}>
                      {modelDetails.levered_irr ? `${modelDetails.levered_irr}` : 'N/A'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.80rem', color: colors.grey[600], mt: 0.25 }}>
                      Internal Rate of Return
                    </Typography>
                  </Paper>

                  {/* Levered MOIC */}
                  <Paper elevation={1} sx={{ borderRadius: '6px', border: `1px solid ${colors.grey[300]}`, bgcolor: 'white', p: 3 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: colors.grey[600], fontWeight: 600 }}>
                      Levered MOIC
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: colors.grey[900], mt: 0.5 }}>
                      {modelDetails.levered_moic ? `${modelDetails.levered_moic}` : 'N/A'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.80rem', color: colors.grey[600], mt: 0.25 }}>
                      Multiple on Invested Capital
                    </Typography>
                  </Paper>

                  {/* Exit/Hold Period (max of Retail Exit/Multifamily Exit) */}
                  {maxExitMonths !== null && (
                  <Paper elevation={1} sx={{ borderRadius: '6px', border: `1px solid ${colors.grey[300]}`, bgcolor: 'white', p: 3 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: colors.grey[600], fontWeight: 600 }}>
                      Hold Period
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: colors.grey[900], mt: 0.5 }}>
                      {Number(maxExitMonths).toLocaleString()} Months
                    </Typography>
                  </Paper>
                  )}
                </Box>
              </Box>
              {summaryTables.map((tbl: any, idx: number) => (
                <Box key={idx} sx={{ p: 2, mb: 0 }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", border: `2px solid ${colors.navy}` }}>
                    <tbody>{renderTableMappingRows(tbl, 100)}</tbody>
                  </table>
                </Box>
              ))}

              
              <Box sx={{ mt: 2, px:2 }}>
                {/* <Typography
                  variant="h5"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    fontFamily:
                      '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    fontSize: "1.5rem",
                    color: "grey.800",
                  }}
                >
                  Sensitivity Analysis
                </Typography> */}

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    backgroundColor: "grey.50",
                    p: 2,
                    borderRadius: 2,
                    border: `2px solid ${colors.navy}`,
                  }}
                >
                  <TextField
                    value={
                      maxPrice && maxPrice !== ""
                        ? Number(maxPrice).toLocaleString()
                        : maxPrice
                    }
                    className="no-spinner"
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, ""); // Remove commas for processing
                      const cursorPosition = e.target.selectionStart ?? 0; // Handle null case
                      const originalValue = e.target.value;

                      setMaxPrice(rawValue);

                      // Restore cursor position after state update
                      setTimeout(() => {
                        if (e.target) {
                          const newValue =
                            rawValue && rawValue !== ""
                              ? Number(rawValue).toLocaleString()
                              : rawValue;

                          // Calculate new cursor position accounting for added/removed commas
                          const commasBefore = (
                            originalValue
                              .substring(0, cursorPosition)
                              .match(/,/g) || []
                          ).length;
                          const commasAfter = (
                            newValue.substring(0, cursorPosition).match(/,/g) ||
                            []
                          ).length;
                          const newCursorPosition =
                            cursorPosition + (commasAfter - commasBefore);

                          e.target.setSelectionRange(
                            newCursorPosition,
                            newCursorPosition
                          );
                        }
                      }, 0);
                    }}
                    required
                    type="text"
                    label="Max Purchase Price"
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1, minWidth: 0 }}
                    placeholder="Enter dollar amount"
                    InputProps={{
                      sx: { textAlign: "right" },
                      inputProps: { style: { textAlign: "right" } },
                      startAdornment: <span style={{ marginRight: 4 }}>$</span>,
                    }}
                  />
                  <TextField
                    label="Min Cap Rate Exit"
                    variant="outlined"
                    size="small"
                    value={minCapRate}
                    onChange={(e) => {
                      // Allow only digits and a single decimal point
                      const next = e.target.value
                        .replace(/%/g, "")
                        .replace(/,/g, "")
                        .replace(/[^0-9.]/g, "")
                        .replace(/(\..*)\./g, "$1");
                      setMinCapRate(next);
                    }}
                    sx={{ flex: 1, minWidth: 0 }}
                    placeholder="Enter cap rate"
                    InputProps={{
                      sx: { textAlign: "right" },
                      inputProps: { style: { textAlign: "right" } },
                      endAdornment: <span style={{ marginLeft: 4 }}>%</span>,
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleGenerate(maxPrice, minCapRate)}
                    disabled={
                      !hasValuesChanged() ||
                      !maxPrice ||
                      !minCapRate ||
                      isCalculating
                    }
                    sx={{
                      flex: 1,
                      height: 40,
                      minWidth: 0,
                      opacity: hasValuesChanged() && !isCalculating ? 1 : 0.6,
                      cursor:
                        hasValuesChanged() && !isCalculating
                          ? "pointer"
                          : "not-allowed",
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    {isCalculating
                      ? "Calculating..."
                      : hasValuesChanged()
                      ? "Generate"
                      : "Change Values to Generate"}
                  </Button>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {/* IRR Sensitivity */}
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 1,
                      overflow: "hidden",
                      border: `2px solid ${colors.navy}`,
                      // transition: "all 0.2s ease-in-out",
                      // "&:hover": {
                      //   boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      // },
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "grey.50",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundColor: colors.navy,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontFamily:
                            '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          fontSize: "1.25rem",
                          color: "#fff",
                        }}
                      >
                        Levered IRR Sensitivity Analysis
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily:
                            '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          color: "#fff",
                          mt: 0.5,
                        }}
                      >
                        Impact of exit cap rate and purchase price on IRR
                      </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      {irrSensitivityData.values.length === 0 && (
                        <Typography variant="body2" sx={{ color: "grey.600" }}>
                          {isCalculating
                            ? "Generating..."
                            : "No data available"}
                        </Typography>
                      )}
                      {irrSensitivityData.values.length > 0 && (
                        <SensitivityTable
                          data={irrSensitivityData}
                          formatValue={(val) => {
                            if (typeof val !== "number" || isNaN(val)) {
                              return "N/A";
                            }
                            return `${val.toFixed(1)}%`;
                          }}
                          title="Acquisition Price ($)"
                          isLoading={isCalculating}
                        />
                      )}
                    </Box>
                  </Card>

                  {/* MOIC Sensitivity */}
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 1,
                      overflow: "hidden",
                      border: `2px solid ${colors.navy}`,
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "grey.50",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundColor: colors.navy,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontFamily:
                            '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          fontSize: "1.25rem",
                          color: "#fff",
                        }}
                      >
                        Levered MOIC Sensitivity Analysis
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily:
                            '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          color: "#fff",
                          mt: 0.5,
                        }}
                      >
                        Impact of exit cap rate and purchase price on MOIC
                      </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      {moicSensitivityData.values.length === 0 && (
                        <Typography variant="body2" sx={{ color: "grey.600" }}>
                          {isCalculating
                            ? "Generating..."
                            : "No data available"}
                        </Typography>
                      )}
                      {moicSensitivityData.values.length > 0 && (
                        <SensitivityTable
                          data={moicSensitivityData}
                          formatValue={(val) =>
                            `${
                              typeof val === "number" ? val.toFixed(2) : "0.00"
                            }x`
                          }
                          title="Acquisition Price ($)"
                          isLoading={isCalculating}
                        />
                      )}
                    </Box>
                  </Card>
                </Box>
              </Box>
            </Box>
          )}

{tabIndex === 1 && modelDetails?.model_type?.show_rental_units === false && modelDetails?.model_type?.show_retail === true && (
  <Box sx={{ p: 2 }}>
    <RetailSummary
      retailIncome={modelDetails.retail_income}
      modelDetails={modelDetails}
      unitsTotalSqFt={modelDetails.units.reduce((acc: number, unit: any) => acc + unit.square_feet, 0)}
      showIndustrialColumns={true}
      expenses={modelDetails.expenses}
    />
  </Box>
)}
          {tabIndex === 1 && modelDetails?.model_type?.show_rental_units === true && (
            <Box sx={{ mt: 2 }}>
             

              {/* Table for Units */}
              <Box sx={{ mt: 2, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize:"1.125rem", fontWeight:"bold" }}>
                  Units
                </Typography>
                <DataGrid
                            disableColumnMenu
                            disableColumnFilter
                            disableColumnSelector
                            disableColumnSorting
                  columns={[
                    {
                      field: "id",
                      headerName: "Unit",
                      flex: 0.6,
                      minWidth: 70,
                      align: 'left',
                      headerAlign: 'left',
                    },
                    {
                      field: "layout",
                      headerName: "Layout",
                      flex: 1,
                      minWidth: 120,
                      align: 'right',
                      headerAlign: 'right',
                    },
                    {
                      field: "square_feet",
                      headerName: "Square Feet",
                      flex: 1,
                      minWidth: 110,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => (
                        <span>
                          {params.value !== undefined && params.value !== null
                            ? params.value.toLocaleString()
                            : ""}
                        </span>
                      ),
                    },
                    {
                      field: "current_rent",
                      headerName: "Current Rent",
                      flex: 1,
                      minWidth: 110,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => (
                        <span>
                          {params.value !== undefined && params.value !== null
                            ? `$${Number(params.value).toLocaleString()}`
                            : ""}
                        </span>
                      ),
                    },
                    {
                      field: "rent_type",
                      headerName: "Rent Type",
                      flex: 1,
                      minWidth: 110,
                      align: 'right',
                      headerAlign: 'right',
                    },
                    {
                      field: "pf_rent",
                      headerName: "Pro Forma Rent",
                      flex: 1,
                      minWidth: 110,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => {
                        // params.row gives access to the full row data
                        const vacateFlag = params.row?.vacate_flag;
                        const currentRent = params.row?.current_rent;
                        const pfRent = params.value;
                        let displayValue;

                        if (vacateFlag === 0 || vacateFlag === "0") {
                          displayValue =
                            currentRent !== undefined && currentRent !== null
                              ? `$${Number(currentRent).toLocaleString()}`
                              : "";
                        } else {
                          displayValue =
                            pfRent !== undefined && pfRent !== null
                              ? `$${Number(pfRent).toLocaleString()}`
                              : "";
                        }

                        return <span>{displayValue}</span>;
                      },
                    },
                    {
                      field: "vacate_flag",
                      headerName: "Vacate Flag",
                      flex: 0.8,
                      minWidth: 100,
                      align: 'right',
                      headerAlign: 'right',
                    },
                    {
                      field: "vacate_month",
                      headerName: "Vacate Month",
                      flex: 1,
                      minWidth: 100,
                      align: 'right',
                      headerAlign: 'right',
                    },
                  ]}
                  rows={modelDetails.units.map((unit: any, index: number) => ({
                    ...unit,
                    id: index + 1,
                    pf_rent: modelDetails.market_rent_assumptions.find(
                      (assumption: any) => assumption.layout === unit.layout
                    )?.pf_rent,
                  }))}
                  disableRowSelectionOnClick
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize:
                          modelDetails.units.length > 100
                            ? 100
                            : modelDetails.units.length,
                      },
                    },
                  }}
                  slots={{
                    footer: CustomFooter,
                  }}
                  pagination
                  sx={{
                    border: `2px solid ${colors.navy}`,
                    borderRadius: 1,
                    "& .MuiDataGrid-footerContainer": {
                      display:
                        modelDetails.units.length > 100 ? "flex" : "none",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: `${colors.navy} !important`,
                      backgroundImage: "none !important",
                      color: "#fff",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: `${colors.navy} !important`,
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                      color: "#fff",
                      fontWeight: 600,
                    },
                    "& .MuiDataGrid-columnSeparator": { color: "rgba(255,255,255,0.35)" },
                    "& .MuiSvgIcon-root": { color: "#fff" },
                    "& .MuiDataGrid-withBorderColor": { borderColor: colors.navy },
                  }}
                  density="compact"
                />
              </Box>

              {/* Table for Amenity Income */}
              <Box sx={{ mt: 2, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize:"1.125rem", fontWeight:"bold" }}>
                  Amenity Income
                </Typography>
                <DataGrid
          
                  disableColumnMenu
                  disableColumnFilter
                  disableColumnSelector
                  disableColumnSorting
                  columns={[
                    {
                      field: "name",
                      headerName: "Name",
                      flex: 1.2,
                      minWidth: 140,
                      align: 'left',
                      headerAlign: 'left',
                    },
                    {
                      field: "start_month",
                      headerName: "Start Month",
                      flex: 1,
                      minWidth: 120,
                      align: 'right',
                      headerAlign: 'right',
                    },
                    {
                      field: "utilization",
                      headerName: "Utilization",
                      flex: 1,
                      minWidth: 120,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => (
                        <span>
                          {params.value !== undefined && params.value !== null
                            ? `${params.value}%`
                            : ""}
                        </span>
                      ),
                    },
                    {
                      field: "unit_count",
                      headerName: "Unit Count",
                      flex: 1,
                      minWidth: 120,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => (
                        <span>
                          {params.value !== undefined && params.value !== null
                            ? `${params.value} units`
                            : ""}
                        </span>
                      ),
                    },
                    {
                      field: "monthly_fee",
                      headerName: "Monthly Fee",
                      flex: 1,
                      minWidth: 120,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => (
                        <span>
                          {params.value !== undefined && params.value !== null
                            ? `$${params.value}`
                            : ""}
                        </span>
                      ),
                    },
                    {
                      field: "usage",
                      headerName: "Usage",
                      flex: 1,
                      minWidth: 120,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => {
                        const row = params.row || {};
                        const usage = Math.round(
                          ((row.utilization || 0) / 100) * (row.unit_count || 0)
                        );
                        return <span>{`${usage} Units`}</span>;
                      },
                    },
                    {
                      field: "monthly",
                      headerName: "Monthly",
                      flex: 1,
                      minWidth: 120,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => {
                        const row = params.row || {};
                        const usage = Math.round(
                          ((row.utilization || 0) / 100) * (row.unit_count || 0)
                        );
                        const monthly = usage * (row.monthly_fee || 0);
                        return (
                          <span>{`$${Number(monthly).toLocaleString()}`}</span>
                        );
                      },
                    },
                    {
                      field: "annual",
                      headerName: "Annual",
                      flex: 1,
                      minWidth: 120,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params: any) => {
                        const row = params.row || {};
                        const usage = Math.round(
                          ((row.utilization || 0) / 100) * (row.unit_count || 0)
                        );
                        const monthly = usage * (row.monthly_fee || 0);
                        const annual = monthly * 12;
                        return (
                          <span>{`$${Number(annual).toLocaleString()}`}</span>
                        );
                      },
                    },
                  ]}
                  rows={modelDetails.amenity_income.map(
                    (income: any, index: number) => ({ ...income, id: index })
                  )}
                  disableRowSelectionOnClick
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize:
                          modelDetails.amenity_income.length > 100
                            ? 100
                            : modelDetails.amenity_income.length,
                      },
                    },
                  }}
                  pagination
                  sx={{
                    border: `2px solid ${colors.navy}`,
                    borderRadius: 1,
                    "& .MuiDataGrid-footerContainer": {
                      display:
                        modelDetails.amenity_income.length > 100
                          ? "flex"
                          : "none",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: `${colors.navy} !important`,
                      backgroundImage: "none !important",
                      color: "#fff",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: `${colors.navy} !important`,
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                      color: "#fff",
                      fontWeight: 600,
                    },
                    "& .MuiDataGrid-columnSeparator": { color: "rgba(255,255,255,0.35)" },
                    "& .MuiSvgIcon-root": { color: "#fff" },
                    "& .MuiDataGrid-withBorderColor": { borderColor: colors.navy },
                  }}
                  density="compact"
                  slots={{ footer: AmenityIncomeFooter }}
                />
              </Box>

              {/* Table for Operating Expenses */}
              <Box sx={{ mt: 2, p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize:"1.125rem", fontWeight:"bold" }}>
                  Operating Expenses
                </Typography>
                <OperatingExpensesReadOnly
                  operatingExpenses={modelDetails.operating_expenses.map(
                    (expense: any, index: number) => ({
                      ...expense,
                      id: String(index),
                    })
                  )}
                  units={
                    Array.isArray(modelDetails.units) ? modelDetails.units : []
                  }
                  amenityIncome={
                    Array.isArray(modelDetails.amenity_income)
                      ? modelDetails.amenity_income
                      : []
                  }
                  modelDetails={modelDetails}
                  retailIncome={
                    Array.isArray(modelDetails.retail_income)
                      ? modelDetails.retail_income
                      : []
                  }
                  retailExpenses={
                    Array.isArray(modelDetails.expenses)
                      ? modelDetails.expenses.filter(
                          (expense: any) => expense.type === "Retail"
                        )
                      : []
                  }
                />
              </Box>

         
            </Box>
          )}
          {(() => {
            const firstDynamicIdx = 2;
            const lastDynamicIdxExclusive = 2 + tablesToShow.length;
            const notesTabIdx = lastDynamicIdxExclusive;
            if (tabIndex >= firstDynamicIdx && tabIndex < lastDynamicIdxExclusive) {
              const tableIdx = tabIndex - firstDynamicIdx;
              return (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  overflowX: "auto",
                  // border: "5px solid #e0e0e0",
                  borderRadius: 2,
                  padding: 2,
                }}
              >
                <table style={{ borderCollapse: "collapse", width: "100%", border: `2px solid ${colors.navy}`}}>
                  <tbody>
                        {renderTableMappingRows(tablesToShow[tableIdx])}
                  </tbody>
                </table>
              </Box>
            </Box>
              );
            }
            if (tabIndex === notesTabIdx) {
              return (
                <Box sx={{ mt: 2, p: 2 }}>
<Typography variant="h6" sx={{ mb: 1.5, fontSize: "1.125rem", fontWeight: "bold" }}>
                      Notes
                    </Typography>
                  <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 1, border: "1px solid #e5e7eb", background: "#fff" }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            if (!addingNote && newNote.trim()) {
                              handleAddNote();
                            }
                          }
                        }}
                        placeholder="Add a note..."
                        multiline
                        minRows={1}
                        maxRows={6}
                        fullWidth
                        size="small"
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddNote}
                        disabled={addingNote || !newNote.trim()}
                        sx={{ alignSelf: "stretch", whiteSpace: "nowrap" }}
                      >
                        {addingNote ? "Adding..." : "Add"}
                      </Button>
                    </Box>
                  </Paper>
                  
                  {notes.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No notes yet.
                    </Typography>
                  )}
                  {notes.length > 0 && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {notes.map((n: any) => {
                        const created = n.created_at ? new Date(n.created_at) : null;
                        const updated = n.updated_at ? new Date(n.updated_at) : null;
                        const edited = created && updated ? updated.getTime() !== created.getTime() : false;
                        const metaLine = [
                          created ? `created ${created.toLocaleString()}` : null,
                          edited ? `edited ${updated?.toLocaleString()}` : null
                        ].filter(Boolean).join(" • ");
                        const isEditing = editingNoteId === n.id;
                        return (
                          <Paper
                            key={n.id}
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 1,
                              border: "1px solid #e5e7eb",
                              background: "#fff",
                              position: "relative",
                              "&:hover .note-actions": { opacity: 1, visibility: "visible" }
                            }}
                          >
                            {isEditing ? (
                              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mt: 0.5 }}>
                                <TextField
                                  value={editingNoteValue}
                                  onChange={(e) => setEditingNoteValue(e.target.value)}
                                  multiline
                                  minRows={2}
                                  maxRows={8}
                                  fullWidth
                                  size="small"
                                />
                                <Tooltip title="Save" arrow>
                                  <span>
                                    <IconButton size="small" color="primary" onClick={saveEditNote} disabled={!editingNoteValue.trim()}>
                                      <SaveIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Cancel" arrow>
                                  <IconButton size="small" onClick={cancelEditNote}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                                <Typography sx={{ whiteSpace: "pre-wrap", fontSize: "0.95rem", color: "#374151", flex: 1 }}>
                                  {n.note_value || ""}
                                </Typography>
                                <Box className="note-actions" sx={{ display: "flex", gap: 0.5, opacity: 0, visibility: "hidden", transition: "opacity 120ms ease" }}>
                                  <Tooltip title="Edit" arrow>
                                    <IconButton size="small" onClick={() => startEditNote(n)}>
                                      <EditIcon fontSize="small" sx={{ color: colors.blue }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete" arrow>
                                    <IconButton size="small" color="error" onClick={() => confirmDeleteNote(n.id)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            )}
                            <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "text.secondary" }}>
                              {metaLine}
                            </Typography>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                  <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                    <DialogTitle>Delete note?</DialogTitle>
                    <DialogContent>
                      <Typography variant="body2">This will remove the note. You can’t undo this action.</Typography>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                      <Button color="error" variant="contained" onClick={handleDeleteNote}>Delete</Button>
                    </DialogActions>
                  </Dialog>


                  {/* Pictures Gallery */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1.5, fontSize: "1.125rem", fontWeight: "bold" }}>
                      Property Images
                    </Typography>

                    {/* Pictures upload */}
                  <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 1, border: "1px solid #e5e7eb", background: "#fff" }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Button variant="outlined" component="label" sx={{ whiteSpace: 'nowrap' }}>
                        Choose Image (JPEG or PNG)
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
                              // Ignore unsupported types
                              return;
                            }
                            setNewPicFile(file);
                          }}
                        />
                      </Button>
                      <TextField
                        placeholder="Description"
                        value={newPicDesc}
                        onChange={(e) => setNewPicDesc(e.target.value)}
                        size="small"
                        sx={{ minWidth: 260, flex: 1 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleUploadPicture}
                        disabled={uploadingPic || !newPicFile}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {uploadingPic ? 'Uploading...' : 'Upload'}
                      </Button>
                    </Box>
                  </Paper>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: 2,
                        '@media (min-width:900px)': {
                          gridTemplateColumns: 'repeat(2, 1fr)',
                        },
                      }}
                    >
                      {pictures.map((p: any, idx: number) => {
                        const created = p.created_at ? new Date(p.created_at) : null;
                        const updated = p.updated_at ? new Date(p.updated_at) : null;
                        const edited = created && updated ? updated.getTime() !== created.getTime() : false;
                        const meta = [
                          created ? `created ${created.toLocaleString()}` : null,
                          edited ? `edited ${updated?.toLocaleString()}` : null
                        ].filter(Boolean).join(' • ');
                        const isFirst = idx === 0;
                        const isEditingPic = editingPicId === p.id;
                        return (
                          <Box
                            key={p.id}
                            sx={{
                              gridColumn: isFirst ? '1 / -1' : 'auto',
                              position: 'relative',
                              border: '1px solid #e5e7eb',
                              borderRadius: 1,
                              background: '#fff',
                              overflow: 'hidden',
                              '&:hover .pic-actions': { opacity: 1, visibility: 'visible' }
                            }}
                          >
                            <Box sx={{ position: 'relative' }}>
                              <img
                                src={p.picture_url}
                                alt={p.description || 'model picture'}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  height: 'auto',
                                  maxHeight: isFirst ? 600 : 380,
                                  objectFit: 'contain',
                                  background: '#f9fafb'
                                }}
                              />
                              {/* Reorder arrows */}
                              <Box className="pic-actions" sx={{ position: 'absolute', left: 8, top: 8, display: 'flex', gap: 0.5, opacity: 0, visibility: 'hidden', transition: 'opacity 120ms ease' }}>
                                <Tooltip title="Move left" arrow>
                                  <span>
                                    <IconButton size="small" disabled={idx === 0 || !!reorderBusyId} onClick={() => movePicture(idx, 'left')}>
                                      {/* Using chevron-like glyphs to avoid another icon import */}
                                      <span style={{ fontSize: 14 }}>◀</span>
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Move right" arrow>
                                  <span>
                                    <IconButton size="small" disabled={idx === pictures.length - 1 || !!reorderBusyId} onClick={() => movePicture(idx, 'right')}>
                                      <span style={{ fontSize: 14 }}>▶</span>
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                              {/* Edit/Delete */}
                              <Box className="pic-actions" sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 0.5, opacity: 0, visibility: 'hidden', transition: 'opacity 120ms ease' }}>
                                {!isEditingPic && (
                                  <Tooltip title="Edit" arrow>
                                    <IconButton size="small" onClick={() => startEditPicture(p)}>
                                      <EditIcon fontSize="small" sx={{ color: colors.blue }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {!isEditingPic && (
                                  <Tooltip title="Delete" arrow>
                                    <IconButton size="small" color="error" onClick={() => confirmDeletePicture(p.id)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ p: 1.5 }}>
                              {isEditingPic ? (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 0.5 }}>
                                  <TextField
                                    value={editingPicDesc}
                                    onChange={(e) => setEditingPicDesc(e.target.value)}
                                    size="small"
                                    fullWidth
                                  />
                                  <Tooltip title="Save" arrow>
                                    <span>
                                      <IconButton size="small" color="primary" onClick={saveEditPicture} disabled={!editingPicDesc.trim()}>
                                        <SaveIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Cancel" arrow>
                                    <IconButton size="small" onClick={cancelEditPicture}>
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Typography sx={{ fontSize: '0.95rem', color: '#374151' }}>
                                  {p.description || ''}
                                </Typography>
                              )}
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                                {meta}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                  <Dialog open={deletePicOpen} onClose={() => setDeletePicOpen(false)}>
                    <DialogTitle>Delete picture?</DialogTitle>
                    <DialogContent>
                      <Typography variant="body2">This will remove the picture. You can’t undo this action.</Typography>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setDeletePicOpen(false)}>Cancel</Button>
                      <Button color="error" variant="contained" onClick={handleDeletePicture}>Delete</Button>
                    </DialogActions>
                  </Dialog>
                </Box>
              );
            }
            return null;
          })()}
        </Box>
      </Box>
    </Box>
  );
};

export default ModelDetails;
