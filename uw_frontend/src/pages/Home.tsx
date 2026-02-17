import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, Typography, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Tooltip, Autocomplete, Chip, InputBase, Select, MenuItem } from "@mui/material"
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUserModels } from '../context/UserModelsContext';
import { useUser } from '../context/UserContext';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL, APP_TOP_BAR_HEIGHT } from '../utils/constants';
import OnboardingStepOne from '../components/OnboardingStepOne';
import OnboardingStepTwo from '../components/OnboardingStepTwo';
import { useTheme } from '@mui/material/styles';
import { colors } from '../theme';

const TAG_COLORS: Record<string, string> = {
  'Offer Submitted': '#4B90D8',
  'Offer Accepted': '#059669',
  'Under Contract': '#D97706',
  'Deal Closed': '#7C3AED',
  'Passed': '#9CA3AF',
};

const COLOR_PALETTE = [
  '#4B90D8', '#059669', '#D97706', '#7C3AED', '#9CA3AF',
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6',
];

const getTagColor = (tagName: string, storedColor?: string | null): string => {
  if (storedColor) return storedColor;
  if (TAG_COLORS[tagName]) return TAG_COLORS[tagName];
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
};

const Home = () => {
  const theme = useTheme();
  const { getAccessTokenSilently } = useAuth0();
  const { user } = useUser();
  const { userModels, setUserModels } = useUserModels();
  const [view, setView] = useState('cards');
  const [orderBy, setOrderBy] = useState<string>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null);

  const [subLoading, setSubLoading] = useState(true);
  const [isSubActive, setIsSubActive] = useState<boolean>(false);
  const [eligibleForTrial, setEligibleForTrial] = useState<boolean>(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoError, setPromoError] = useState<string>("");
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagTargetModelId, setTagTargetModelId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>("");
  const [tagColor, setTagColor] = useState<string>(COLOR_PALETTE[0]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      try {
        const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE } });
        const r = await fetch(`${BACKEND_URL}/api/user_info`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, 'X-User-Email': user.email },
          credentials: 'include'
        });
        if (!r.ok) {
          setNeedsOnboarding(false);
          return;
        }
        const data = await r.json();
        const missingUserInfo = Boolean(data && data.exists === false);
        const termsNotAccepted = Boolean(data && data.exists !== false && data.accepted_terms_and_conditions !== true);
        setNeedsOnboarding(missingUserInfo || termsNotAccepted);
      } catch {
        setNeedsOnboarding(false);
      }
    };
    checkOnboarding();
  }, [user, getAccessTokenSilently]);

  const handleOnboardingComplete = async (data: any) => {
    try {
      const token = await getAccessTokenSilently({ authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE } });
      await fetch(`${BACKEND_URL}/api/user_info`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-User-Email': user.email },
        credentials: 'include',
        body: JSON.stringify({
          job_role: data.jobRole || '',
          company: data.company || '',
          experience_level: data.experienceLevel || '',
          asset_type_focus: data.assetTypeFocus || [],
          typical_deal_size: data.typicalDealSize || '',
          geographic_focus: data.geographicFocus || '',
          hear_about_us: data.referralSource || '',
          keep_updated: Boolean(data.emailUpdates)
        })
      });
      setNeedsOnboarding(false);
    } catch (e) {
      console.error('Failed to save onboarding info', e);
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      try {
        setSubLoading(true);
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
        });
        const r = await fetch(`${BACKEND_URL}/api/billing/subscription`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        let data: any = null;
        try {
          data = await r.json();
        } catch {
          data = null;
        }
        if (r.ok && data) {
          const status = data.status as string | undefined;
          setIsSubActive(status === 'active' || status === 'trialing');
          setEligibleForTrial(Boolean(data.eligible_for_trial));
        } else {
          setIsSubActive(false);
          if (data && typeof data.eligible_for_trial === 'boolean') {
            setEligibleForTrial(data.eligible_for_trial);
          } else {
            setEligibleForTrial(true);
          }
        }
      } catch {
        setIsSubActive(false);
        setEligibleForTrial(true);
      } finally {
        setSubLoading(false);
      }
    };
    fetchSubscription();
  }, [user, getAccessTokenSilently]);

  useEffect(() => {
    const fetchUserModels = async () => {
      if (!user) return;
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(BACKEND_URL + `/api/user_models?user_id=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });
        const data = await response.json();

        if (JSON.stringify(data) !== JSON.stringify(userModels)) {
          setUserModels(data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user models:', err);
        setLoading(false);
      }
    };

    fetchUserModels();
  }, [user, userModels, setUserModels, getAccessTokenSilently]);
  const models = userModels
    .filter((m: any) => m.active !== false)
    .map((model: any) => ({
    id: model.id,
    name: model.name,
    location: `${model.city}, ${model.state}`,
    created_at: model.created_at ? new Date(model.created_at).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) : 'N/A',
    created_at_raw: model.created_at ? new Date(model.created_at).getTime() : 0,
    created_date: model.created_at ? new Date(model.created_at).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }) : 'N/A',
    irr: model.levered_irr && !String(model.levered_irr).startsWith('#') ? `${model.levered_irr}` : 'N/A',
    moic: model.levered_moic && !String(model.levered_moic).startsWith('#') ? `${model.levered_moic}` : 'N/A',
    version_count: model.version_count,
    model_type: model.model_type,
    tags: Array.isArray(model.model_tags)
      ? model.model_tags
          .filter((t: any) => t && t.tag_name && t.status !== 'removed')
          .map((t: any) => ({ id: t.id, name: t.tag_name, color: t.tag_color || null }))
      : []
  }));

  const defaultRecommendedTags = React.useMemo(
    () => ['Offer Submitted', 'Offer Accepted', 'Under Contract', 'Deal Closed', 'Passed'],
    []
  );
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    (userModels || []).forEach((m: any) => {
      (m?.model_tags || [])
        .filter((t: any) => t && t.status !== 'removed')
        .forEach((t: any) => {
          if (t?.tag_name) set.add(String(t.tag_name));
        });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [userModels]);
  const userSeenTags = React.useMemo(() => {
    const set = new Set<string>();
    (userModels || []).forEach((m: any) => {
      (m?.model_tags || []).forEach((t: any) => {
        if (t?.tag_name) set.add(String(t.tag_name));
      });
    });
    return Array.from(set);
  }, [userModels]);
  const recommendedTags = React.useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    defaultRecommendedTags.forEach(t => { if (!seen.has(t)) { seen.add(t); ordered.push(t); } });
    userSeenTags.forEach(t => { if (!seen.has(t)) { seen.add(t); ordered.push(t); } });
    return ordered;
  }, [defaultRecommendedTags, userSeenTags]);

  // Lookup: tag name → stored color (from any model's tags)
  const tagNameColorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    (userModels || []).forEach((m: any) => {
      (m?.model_tags || [])
        .filter((t: any) => t && t.status !== 'removed' && t.tag_color)
        .forEach((t: any) => {
          if (t.tag_name && !map[t.tag_name]) map[t.tag_name] = t.tag_color;
        });
    });
    return map;
  }, [userModels]);

  // Auto-populate color picker when selecting an existing tag name
  React.useEffect(() => {
    const name = tagInput.trim();
    if (name && tagNameColorMap[name]) {
      setTagColor(tagNameColorMap[name]);
    }
  }, [tagInput, tagNameColorMap]);

  const filteredModels = React.useMemo(() => {
    let result = models;
    if (tagFilter && tagFilter.length > 0) {
      const selected = tagFilter.map(t => String(t).toLowerCase().trim());
      result = result.filter((m: any) => {
        const tagSet = new Set((m.tags || []).map((t: any) => String(t.name || t).toLowerCase().trim()));
        return selected.every(t => tagSet.has(t));
      });
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter((m: any) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q) ||
        (m.model_type || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [models, tagFilter, searchText]);

  const openAddTag = (modelId: string) => {
    setTagTargetModelId(modelId);
    setTagInput('');
    setTagColor(COLOR_PALETTE[0]);
    setTagDialogOpen(true);
  };
  const closeAddTag = () => {
    setTagDialogOpen(false);
    setTagTargetModelId(null);
    setTagInput('');
    setTagColor(COLOR_PALETTE[0]);
  };
  const submitAddTag = async () => {
    if (!tagTargetModelId || !tagInput.trim()) return;
    try {
      const token = await getAccessTokenSilently();
      const r = await fetch(`${BACKEND_URL}/api/user_models/${tagTargetModelId}/tags`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tag_name: tagInput.trim(), tag_color: tagColor })
      });
      if (!r.ok) {
        return;
      }
      const created = await r.json();
      const appliedColor = created.tag_color;
      const appliedName = created.tag_name;
      setUserModels((prev: any[]) =>
        prev.map((m: any) => {
          let tags = m.model_tags || [];
          // Add the new tag to the target model
          if (m.id === tagTargetModelId) {
            tags = [...tags, created];
          }
          // Propagate color to all tags with the same name across all models
          if (appliedColor) {
            tags = tags.map((t: any) =>
              t.tag_name === appliedName ? { ...t, tag_color: appliedColor } : t
            );
          }
          return { ...m, model_tags: tags };
        })
      );
      setTagInput('');
      setTagColor(COLOR_PALETTE[0]);
    } catch (e) {
      // keep dialog open on error
    }
  };
  const selectedModelActiveTags = React.useMemo(() => {
    if (!tagTargetModelId) return [];
    const m = (userModels || []).find((x: any) => x.id === tagTargetModelId);
    return (m?.model_tags || []).filter((t: any) => t && t.status !== 'removed');
  }, [userModels, tagTargetModelId]);
  const filteredRecommendedTags = React.useMemo(() => {
    const selected = new Set<string>(
      selectedModelActiveTags.map((t: any) => String(t.tag_name || '').toLowerCase().trim())
    );
    return recommendedTags.filter((opt: string) => !selected.has(String(opt).toLowerCase().trim()));
  }, [recommendedTags, selectedModelActiveTags]);
  const isDuplicateTag = React.useMemo(() => {
    const ti = tagInput.trim().toLowerCase();
    if (!ti) return false;
    return selectedModelActiveTags.some((t: any) => String(t.tag_name || '').toLowerCase().trim() === ti);
  }, [tagInput, selectedModelActiveTags]);
  const removeTag = async (tagId: string) => {
    try {
      const token = await getAccessTokenSilently();
      const r = await fetch(`${BACKEND_URL}/api/tags/${tagId}/remove`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!r.ok) return;
      setUserModels((prev: any[]) =>
        prev.map((m: any) =>
          m.id === tagTargetModelId
            ? {
                ...m,
                model_tags: (m.model_tags || []).map((t: any) => (t.id === tagId ? { ...t, status: 'removed' } : t))
              }
            : m
        )
      );
    } catch {}
  };
  const updateTagColor = async (tagId: string, newColor: string, tagName: string) => {
    try {
      const token = await getAccessTokenSilently();
      const r = await fetch(`${BACKEND_URL}/api/tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tag_color: newColor })
      });
      if (!r.ok) return;
      // Propagate color to ALL tags with the same name across all models
      setUserModels((prev: any[]) =>
        prev.map((m: any) => ({
          ...m,
          model_tags: (m.model_tags || []).map((t: any) =>
            t.tag_name === tagName ? { ...t, tag_color: newColor } : t
          )
        }))
      );
    } catch {}
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const parseValue = (value: any, property: string) => {
    if (value === 'N/A') return null;

    switch (property) {
      case 'irr':
        return value ? parseFloat(value.replace('%', '')) : null;
      case 'moic':
        return value ? parseFloat(value.replace('x', '')) : null;
      case 'created_at':
        return typeof value === 'number' ? value : (value ? new Date(value).getTime() : null);
      case 'version_count':
        return typeof value === 'number' ? value : null;
      default:
        return value;
    }
  };

  const sortedModels = React.useMemo(() => {
    return [...filteredModels].sort((a, b) => {
      const sortKey = orderBy === 'created_at' ? 'created_at_raw' : orderBy;
      const aValue = parseValue(a[sortKey], orderBy);
      const bValue = parseValue(b[sortKey], orderBy);

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return order === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredModels, order, orderBy]);

  const handleEdit = async (modelId: string) => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`${BACKEND_URL}/api/user_models/${modelId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();
      const versionId = data?.version_id;
      if (versionId) {
        navigate(`/edit-model/${versionId}`);
      } else {
        navigate(`/models/${modelId}`);
      }
    } catch {
      navigate(`/models/${modelId}`);
    }
  };

  const requestDelete = (modelId: string, modelName?: string) => {
    setPendingDeleteId(modelId);
    setPendingDeleteName(modelName || null);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const token = await getAccessTokenSilently();
      await fetch(`${BACKEND_URL}/api/user_models/${pendingDeleteId}/active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: false })
      });
      setUserModels((prev: any[]) => prev.map((m: any) => m.id === pendingDeleteId ? { ...m, active: false } : m));
    } catch (e) {
      console.error('Failed to deactivate model', e);
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
      setPendingDeleteName(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName(null);
  };

  const renderCta = () => {
    const title = eligibleForTrial ? 'Ready to Create Models?' : 'Welcome Back';
    const body = eligibleForTrial
      ? 'Start your 14‑day free trial to create and view models.'
      : 'Renew your subscription to view past models or create new ones.';
    const button = eligibleForTrial ? 'Start 14‑Day Free Trial' : 'Renew Subscription';
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220 }}>
        <Paper sx={{ p: 4, maxWidth: 640, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>{body}</Typography>
          <Button variant="contained" onClick={() => navigate('/settings')}>{button}</Button>
          {eligibleForTrial && (
            <Box sx={{ mt: 1.5 }}>
              <Button variant="text" size="small" onClick={() => { setPromoError(''); setPromoCode(''); setPromoOpen(true); }}>
                Promo code? Click here
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  const showModelsUi = !needsOnboarding && isSubActive;
  const isFiltering = (tagFilter.length > 0 || searchText.trim().length > 0) && filteredModels.length !== models.length;

  return (
    <>
      {/* Command bar — full-width, flush with sidebar and top */}
      {showModelsUi && models.length > 0 && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          height: (t: any) => t.spacing(APP_TOP_BAR_HEIGHT),
          backgroundColor: colors.navy,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexWrap: 'nowrap',
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', mr: 0.5 }}>
            Your Models
          </Typography>
          <Box sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
              {models.length} deal{models.length === 1 ? '' : 's'}
            </Typography>
          </Box>
          {isFiltering && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
              Showing {filteredModels.length}
            </Typography>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Search input */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.18)',
            borderRadius: `${theme.shape.borderRadius}px`,
            px: 1.5,
            height: 36,
            minWidth: 160,
            maxWidth: 220,
            '&:focus-within': { backgroundColor: 'rgba(255,255,255,0.28)' },
          }}>
            <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, mr: 0.75 }} />
            <InputBase
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{
                color: '#fff',
                fontSize: '0.8125rem',
                flex: 1,
                height: 36,
                '& ::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 },
              }}
            />
          </Box>

          {/* Tag filter */}
          <Box sx={{ minWidth: 180, maxWidth: 240 }}>
            <Autocomplete
              multiple
              size="small"
              options={allTags}
              value={tagFilter}
              onChange={(_e, val) => setTagFilter(val as string[])}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: '#fff',
                      height: 22,
                      fontSize: '0.7rem',
                      '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder={tagFilter.length === 0 ? "Filter tags" : ""}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      color: '#fff',
                      fontSize: '0.8125rem',
                      height: 36,
                      py: '0px !important',
                      '& fieldset': { border: 'none' },
                      '& input::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 },
                    },
                  }}
                />
              )}
            />
          </Box>

          {/* Sort dropdown */}
          <Select
            value={`${orderBy}_${order}`}
            onChange={(e) => {
              const [field, dir] = (e.target.value as string).split('_');
              setOrderBy(field);
              setOrder(dir as 'asc' | 'desc');
            }}
            size="small"
            startAdornment={<SortIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, mr: 0.5 }} />}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              color: '#fff',
              fontSize: '0.8125rem',
              height: 36,
              minWidth: 140,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.7)' },
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
            }}
            MenuProps={{
              PaperProps: {
                sx: { mt: 0.5, '& .MuiMenuItem-root': { fontSize: '0.8125rem' } }
              }
            }}
          >
            <MenuItem value="created_at_desc">Newest first</MenuItem>
            <MenuItem value="created_at_asc">Oldest first</MenuItem>
            <MenuItem value="name_asc">Name A–Z</MenuItem>
            <MenuItem value="name_desc">Name Z–A</MenuItem>
            <MenuItem value="irr_desc">IRR (high–low)</MenuItem>
            <MenuItem value="irr_asc">IRR (low–high)</MenuItem>
            <MenuItem value="moic_desc">MOIC (high–low)</MenuItem>
            <MenuItem value="moic_asc">MOIC (low–high)</MenuItem>
          </Select>

          {/* View toggles */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setView('cards')}
              sx={{
                color: '#fff',
                backgroundColor: view === 'cards' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                width: 36,
                height: 36,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <ViewModuleIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setView('table')}
              sx={{
                color: '#fff',
                backgroundColor: view === 'table' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                width: 36,
                height: 36,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <ViewListIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Create Model button */}
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/create-model')}
            sx={{
              backgroundColor: colors.blue,
              color: '#fff',
              fontWeight: 600,
              px: 2,
              height: 36,
              whiteSpace: 'nowrap',
              '&:hover': { backgroundColor: colors.blueDark },
            }}
          >
            + Create Model
          </Button>
        </Box>
      )}

      <Container maxWidth={false} sx={{ mt: showModelsUi && models.length > 0 ? 3 : { xs: 2, md: 6 }, mx: 'auto', px: { xs: 1.5, sm: 3 } }}>
        {/* Onboarding gate */}
        {needsOnboarding && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
            {onboardingStep === 1 ? (
              <OnboardingStepOne
                initialData={onboardingData || {}}
                onSkip={() => setNeedsOnboarding(false)}
                onNext={(d) => { setOnboardingData({ ...(onboardingData || {}), ...d }); setOnboardingStep(2); }}
              />
            ) : (
              <OnboardingStepTwo
                initialData={onboardingData || { assetTypeFocus: [], typicalDealSize: '', geographicFocus: '', referralSource: '', emailUpdates: false }}
                onSkip={() => setNeedsOnboarding(false)}
                onComplete={(d) => handleOnboardingComplete({ ...(onboardingData || {}), ...d })}
              />
            )}
          </Box>
        )}

        {subLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!subLoading && !needsOnboarding && !isSubActive && renderCta()}

        {showModelsUi && models.length == 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
            <Paper sx={{ p: 4, maxWidth: 640, textAlign: 'center', mx: 'auto' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                No models found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                You haven't created any models yet. Click below to get started!
              </Typography>
              <Button variant="contained" onClick={() => navigate('/create-model')}>
                Create Model
              </Button>
            </Paper>
          </Box>
        )}

        {showModelsUi && models.length > 0 && (view === 'cards' ? (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {sortedModels.map((model: any, index: number) => {
            const firstTag = model.tags && model.tags.length > 0 ? model.tags[0] : null;
            const accentColor = firstTag ? getTagColor(firstTag.name, firstTag.color) : colors.grey[300];
            return (
            <Paper
              key={index}
              sx={{
                width: '100%',
                maxWidth: '320px',
                minWidth: '250px',
                mb: 2,
                borderRadius: `${theme.shape.borderRadius}px`,
                border: `1px solid ${colors.grey[300]}`,
                boxShadow: theme.shadows[1],
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[2],
                },
                '& .model-actions': {
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'opacity 200ms ease, visibility 200ms ease',
                },
                '&:hover .model-actions': {
                  opacity: 1,
                  visibility: 'visible',
                }
              }}
            >
              {/* Top accent bar */}
              <Box sx={{ height: 4, backgroundColor: accentColor }} />

              {/* Card body */}
              <Box sx={{ p: 2.5, pb: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Name */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '1rem',
                    lineHeight: 1.3,
                    mb: 0.5,
                  }}
                >
                  {model.name}
                </Typography>

                {/* Location + Model type on same row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                  <LocationOnIcon sx={{ fontSize: 14, color: colors.grey[400] }} />
                  <Typography variant="body2" sx={{ color: colors.grey[600], fontSize: '0.8rem', flex: 1 }}>
                    {model.location}
                  </Typography>
                  {model.model_type && (
                    <Box sx={{
                      px: 1.25,
                      py: 0.25,
                      borderRadius: 1,
                      border: `1px solid ${colors.grey[300]}`,
                      backgroundColor: colors.white,
                      flexShrink: 0,
                    }}>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem', color: colors.grey[700], whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {model.model_type}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Tag chips */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', flex: 1 }}>
                  {model.tags && model.tags.length > 0 ? (
                    model.tags.map((tag: any, i: number) => {
                      const tc = getTagColor(tag.name, tag.color);
                      return (
                        <Box
                          key={tag.id || i}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 10,
                            backgroundColor: `${tc}14`,
                            border: `1px solid ${tc}30`,
                          }}
                        >
                          <Box sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            backgroundColor: tc,
                            flexShrink: 0,
                          }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: colors.grey[700], lineHeight: 1 }}>
                            {tag.name}
                          </Typography>
                        </Box>
                      );
                    })
                  ) : null}
                  <Tooltip title="Edit Tags">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); openAddTag(model.id); }}
                      sx={{
                        width: 24,
                        height: 24,
                        border: `1.5px dashed ${colors.grey[300]}`,
                        borderRadius: '50%',
                        p: 0,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: colors.blueTint,
                        },
                      }}
                    >
                      <AddIcon sx={{ fontSize: 14, color: colors.grey[400] }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Bottom metrics row */}
              <Box sx={{
                display: 'flex',
                borderTop: `1px solid ${colors.grey[300]}`,
                mt: 2,
              }}>
                <Box sx={{ flex: 1, py: 1.5, textAlign: 'center', borderRight: `1px solid ${colors.grey[300]}` }}>
                  <Typography variant="caption" sx={{ color: colors.grey[400], fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    IRR
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem', color: colors.blue, lineHeight: 1.3 }}>
                    {model.irr}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, py: 1.5, textAlign: 'center', borderRight: `1px solid ${colors.grey[300]}` }}>
                  <Typography variant="caption" sx={{ color: colors.grey[400], fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    MOIC
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem', color: colors.blue, lineHeight: 1.3 }}>
                    {model.moic}
                  </Typography>
                </Box>
              </Box>

              {/* Hover overlay with View / Edit / Delete */}
              <Box
                className="model-actions"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1.5,
                  backgroundColor: colors.navy,
                  borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
                }}
              >
                <Button
                  size="small"
                  onClick={() => navigate(`/models/${model.id}`)}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    px: 0,
                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  View Model
                </Button>
                <Box sx={{ flex: 1 }} />
                <IconButton aria-label="edit" size="small" onClick={() => handleEdit(model.id)} sx={{ color: '#fff', p: 0.5 }}>
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton aria-label="delete" size="small" onClick={() => requestDelete(model.id, model.name)} sx={{ color: '#fff', p: 0.5 }}>
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Paper>
            );
          })}
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            border: `1px solid ${colors.grey[300]}`,
            boxShadow: theme.shadows[1],
            overflowX: 'auto',
            width: '100%'
          }}
        >
          <Table
            sx={{
              minWidth: { xs: 900, md: 0 },
              '& thead th': {
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.grey[600],
                backgroundColor: colors.grey[100],
                borderBottom: `1px solid ${colors.grey[300]}`,
                py: 1.5,
                whiteSpace: 'nowrap',
              },
              '& tbody td': {
                borderBottom: `1px solid ${colors.grey[300]}`,
                py: 1.5,
                whiteSpace: 'nowrap',
              },
              '& tbody tr:hover': {
                backgroundColor: colors.blueTint,
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 160 }}>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'location'}
                    direction={orderBy === 'location' ? order : 'asc'}
                    onClick={() => handleRequestSort('location')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'model_type'}
                    direction={orderBy === 'model_type' ? order : 'asc'}
                    onClick={() => handleRequestSort('model_type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'irr'}
                    direction={orderBy === 'irr' ? order : 'asc'}
                    onClick={() => handleRequestSort('irr')}
                  >
                    IRR
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'moic'}
                    direction={orderBy === 'moic' ? order : 'asc'}
                    onClick={() => handleRequestSort('moic')}
                  >
                    MOIC
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'created_at'}
                    direction={orderBy === 'created_at' ? order : 'asc'}
                    onClick={() => handleRequestSort('created_at')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  Tags
                </TableCell>
                <TableCell sx={{ width: 100 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedModels.map((model: any, index: number) => (
                <TableRow
                  key={index}
                  sx={{
                    cursor: 'pointer',
                    '& .row-actions': {
                      opacity: 0,
                      visibility: 'hidden',
                      transition: 'opacity 120ms ease, visibility 120ms ease'
                    },
                    '&:hover .row-actions': {
                      opacity: 1,
                      visibility: 'visible'
                    }
                  }}
                  onClick={() => navigate(`/models/${model.id}`)}
                >
                  <TableCell sx={{ fontWeight: 600, color: colors.grey[900] }}>{model.name}</TableCell>
                  <TableCell sx={{ color: colors.grey[700] }}>{model.location}</TableCell>
                  <TableCell>
                    {model.model_type ? (
                      <Box sx={{
                        display: 'inline-block',
                        px: 1.25,
                        py: 0.25,
                        borderRadius: 1,
                        border: `1px solid ${colors.grey[300]}`,
                        backgroundColor: colors.grey[100],
                      }}>
                        <Typography variant="caption" sx={{ fontSize: '0.72rem', color: colors.grey[700], fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {model.model_type}
                        </Typography>
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.blue }}>{model.irr}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.blue }}>{model.moic}</TableCell>
                  <TableCell sx={{ color: colors.grey[700] }}>{model.created_date}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'nowrap', alignItems: 'center' }}>
                      {model.tags && model.tags.length > 0 ? model.tags.map((tag: any, i: number) => {
                        const tc = getTagColor(tag.name, tag.color);
                        return (
                          <Box
                            key={tag.id || i}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.25,
                              borderRadius: 10,
                              backgroundColor: `${tc}14`,
                              border: `1px solid ${tc}30`,
                              flexShrink: 0,
                            }}
                          >
                            <Box sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: tc,
                              flexShrink: 0,
                            }} />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: colors.grey[700], lineHeight: 1, whiteSpace: 'nowrap' }}>
                              {tag.name}
                            </Typography>
                          </Box>
                        );
                      }) : null}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ width: 100 }}>
                    <Box className="row-actions" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.25 }}>
                        <Tooltip title="View">
                          <IconButton aria-label="view" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/models/${model.id}`); }}>
                            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton aria-label="edit" size="small" onClick={(e) => { e.stopPropagation(); handleEdit(model.id); }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton aria-label="delete" size="small" color="error" onClick={(e) => { e.stopPropagation(); requestDelete(model.id, model.name); }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ))}

      <Dialog open={confirmOpen} onClose={handleCancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to remove model{pendingDeleteName ? ` "${pendingDeleteName}"` : ''}?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>Remove</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={promoOpen} onClose={() => setPromoOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enter Promo Code</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Promo code"
            type="text"
            fullWidth
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            disabled={promoSubmitting}
          />
          {promoError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {promoError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoOpen(false)} disabled={promoSubmitting}>Cancel</Button>
          <Button
            variant="contained"
            disabled={promoSubmitting || !promoCode.trim()}
            onClick={async () => {
              try {
                setPromoSubmitting(true);
                setPromoError('');
                const token = await getAccessTokenSilently({
                  authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
                });
                const r = await fetch(`${BACKEND_URL}/api/billing/start-promo-subscription`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  credentials: 'include',
                  body: JSON.stringify({ promo_code: promoCode.trim() })
                });
                if (!r.ok) {
                  let msg = 'Unable to apply promo.';
                  try {
                    const d = await r.json();
                    msg = d?.error || msg;
                  } catch {}
                  setPromoError(msg);
                  return;
                }
                setPromoOpen(false);
                navigate('/settings?from=promo');
              } catch (e: any) {
                setPromoError('Something went wrong. Please try again.');
              } finally {
                setPromoSubmitting(false);
              }
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={tagDialogOpen} onClose={closeAddTag} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Edit Tags</DialogTitle>
        <DialogContent>
          {/* Add new tag section */}
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Add a Tag
          </Typography>
          <Autocomplete
            freeSolo
            options={filteredRecommendedTags}
            value={tagInput}
            onInputChange={(_e, v) => setTagInput(v || '')}
            renderInput={(params) => (
              <TextField {...params} autoFocus margin="dense" label="Tag name" type="text" fullWidth size="small" />
            )}
          />
          {isDuplicateTag && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              This tag is already added to this model.
            </Typography>
          )}

          {/* Color palette */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, mb: 0.75, display: 'block' }}>
            Choose a color
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
            {COLOR_PALETTE.map((c) => (
              <Box
                key={c}
                onClick={() => setTagColor(c)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: c,
                  cursor: 'pointer',
                  border: tagColor === c ? '3px solid' : '2px solid transparent',
                  borderColor: tagColor === c ? colors.navy : 'transparent',
                  outline: tagColor === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 1,
                  transition: 'transform 100ms ease',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              />
            ))}
          </Box>

          {/* Preview + Add button */}
          {tagInput.trim() && !isDuplicateTag && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 10,
                backgroundColor: `${tagColor}14`,
                border: `1px solid ${tagColor}30`,
              }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: tagColor, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: colors.grey[700], lineHeight: 1 }}>
                  {tagInput.trim()}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={submitAddTag}
                disabled={!tagInput.trim() || !tagTargetModelId || isDuplicateTag}
                sx={{ ml: 'auto', textTransform: 'none', fontWeight: 600 }}
              >
                Add Tag
              </Button>
            </Box>
          )}

          {/* Divider */}
          <Box sx={{ borderTop: `1px solid ${colors.grey[300]}`, mt: 1, pt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Current Tags
            </Typography>
            {selectedModelActiveTags.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedModelActiveTags.map((t: any) => {
                  const currentColor = getTagColor(t.tag_name, t.tag_color);
                  return (
                    <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Color dot — clickable to cycle through palette */}
                      <Tooltip title="Change color">
                        <Box
                          onClick={() => {
                            const idx = COLOR_PALETTE.indexOf(currentColor);
                            const nextColor = COLOR_PALETTE[(idx + 1) % COLOR_PALETTE.length];
                            updateTagColor(t.id, nextColor, t.tag_name);
                          }}
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: currentColor,
                            cursor: 'pointer',
                            flexShrink: 0,
                            border: `2px solid ${currentColor}50`,
                            '&:hover': { transform: 'scale(1.2)', transition: 'transform 100ms ease' },
                          }}
                        />
                      </Tooltip>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {t.tag_name}
                      </Typography>
                      <IconButton size="small" onClick={() => removeTag(t.id)} sx={{ p: 0.25 }}>
                        <DeleteIcon sx={{ fontSize: 16, color: colors.grey[400] }} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No tags yet</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddTag}>Done</Button>
        </DialogActions>
      </Dialog>
      </Container>
    </>
  );
};

export default Home;
