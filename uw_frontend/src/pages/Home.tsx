import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, Typography, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Tooltip, Autocomplete, Chip } from "@mui/material"
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUserModels } from '../context/UserModelsContext';
import { useUser } from '../context/UserContext';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL } from '../utils/constants';
import OnboardingStepOne from '../components/OnboardingStepOne';
import OnboardingStepTwo from '../components/OnboardingStepTwo';

const Home = () => {
  const { getAccessTokenSilently } = useAuth0();
  const { user } = useUser();
  const { userModels, setUserModels } = useUserModels();
  const [view, setView] = useState('cards');
  const [orderBy, setOrderBy] = useState<string>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
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
  const [tagFilter, setTagFilter] = useState<string[]>([]);

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
          // treat network or server errors as not blocking the app
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
          // console.log('subscription data', data);
          const status = data.status as string | undefined;
          setIsSubActive(status === 'active' || status === 'trialing');
          setEligibleForTrial(Boolean(data.eligible_for_trial));
        } else {
          // 404 path returns flags
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
      if (!user) return;  // Ensure user is defined
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
    .filter((m: any) => m.active !== false) // show only active
    .map((model: any) => ({
    id: model.id,  // Ensure the model ID is included
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
    irr: model.levered_irr ? `${model.levered_irr}` : 'N/A',
    moic: model.levered_moic ? `${model.levered_moic}` : 'N/A',
    version_count: model.version_count,
    model_type: model.model_type,
    tags: Array.isArray(model.model_tags) ? model.model_tags.map((t: any) => t.tag_name).filter(Boolean) : []
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

  const filteredModels = React.useMemo(() => {
    if (!tagFilter || tagFilter.length === 0) return models;
    const selected = tagFilter.map(t => String(t).toLowerCase().trim());
    return models.filter((m: any) => {
      const tagSet = new Set((m.tags || []).map((t: string) => String(t).toLowerCase().trim()));
      // require all selected tags to be present
      return selected.every(t => tagSet.has(t));
    });
  }, [models, tagFilter]);

  const openAddTag = (modelId: string) => {
    setTagTargetModelId(modelId);
    setTagInput('');
    setTagDialogOpen(true);
  };
  const closeAddTag = () => {
    setTagDialogOpen(false);
    setTagTargetModelId(null);
    setTagInput('');
  };
  const submitAddTag = async () => {
    if (!tagTargetModelId || !tagInput.trim()) return;
    try {
      const token = await getAccessTokenSilently();
      const r = await fetch(`${BACKEND_URL}/api/user_models/${tagTargetModelId}/tags`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tag_name: tagInput.trim() })
      });
      if (!r.ok) {
        return;
      }
      const created = await r.json();
      setUserModels((prev: any[]) =>
        prev.map((m: any) =>
          m.id === tagTargetModelId
            ? {
                ...m,
                model_tags: Array.isArray(m.model_tags) ? [...m.model_tags, created] : [created]
              }
            : m
        )
      );
      closeAddTag();
    } catch (e) {
      // swallow error for now; could add snackbar
      closeAddTag();
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

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const parseValue = (value: any, property: string) => {
    if (value === 'N/A') return null;

    switch (property) {
      case 'irr':
        // Remove % and convert to number
        return value ? parseFloat(value.replace('%', '')) : null;
      case 'moic':
        // Remove 'x' and convert to number
        return value ? parseFloat(value.replace('x', '')) : null;
      case 'created_at':
        return value ? new Date(value).getTime() : null;
      case 'version_count':
        return typeof value === 'number' ? value : null;
      default:
        return value;
    }
  };

  const sortedModels = React.useMemo(() => {
    return [...filteredModels].sort((a, b) => {
      const aValue = parseValue(a[orderBy], orderBy);
      const bValue = parseValue(b[orderBy], orderBy);

      // Handle null values (including 'N/A')
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string comparisons
      return order === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [models, order, orderBy]);

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
        // fallback to details if version not available
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
      // Optimistically update UI
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


  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 6 }, maxWidth: '1000px', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
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
      
      {showModelsUi && models.length > 0 && (
        <>
        <Box sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2.125rem' } }}
          >
            Your Models
          </Typography>
          {isSubActive && (
            <Button
              variant="contained"
              sx={{ fontWeight: 700, borderRadius: 2, alignSelf: { xs: 'stretch', sm: 'center' } }}
              fullWidth={{ xs: true, sm: false } as any}
              onClick={() => navigate('/create-model')}
            >
              Create Model
            </Button>
          )}
        </Box>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap'
        }}>
          <Typography variant="body1">
            Total Deals Underwritten: {models.length}<br />
            <span style={{ fontSize: '0.875rem', color: 'grey' }}>Showing {filteredModels.length} deal{filteredModels.length === 1 ? '' : 's'}</span>
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 220 }}>
              <Autocomplete
                multiple
                options={allTags}
                value={tagFilter}
                onChange={(_e, val) => setTagFilter(val as string[])}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Filter by tags" placeholder="Select tags" />
                )}
              />
            </Box>
            <Button variant={view === 'cards' ? 'contained' : 'outlined'} onClick={() => setView('cards')} sx={{ minWidth: 44, p: 1 }}>
              <ViewModuleIcon />
            </Button>
            <Button variant={view === 'table' ? 'contained' : 'outlined'} onClick={() => setView('table')} sx={{ minWidth: 44, p: 1 }}>
              <ViewListIcon />
            </Button>
          </Box>
        </Box>
        </>
      )}

      {showModelsUi && models.length > 0 && (view === 'cards' ? (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {filteredModels.map((model: any, index: number) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                width: '100%',
                maxWidth: '320px',
                minWidth: '250px',
                mb: 2,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.40) 100%)',
                backdropFilter: 'blur(10px) saturate(140%)',
                WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                border: '1px solid rgba(255,255,255,0.55)',
                boxShadow: '0 14px 32px rgba(31,38,135,0.12), inset 0 1px 0 rgba(255,255,255,0.35)',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background:
                    'radial-gradient(180px 140px at 10% -10%, rgba(255,255,255,0.35), transparent 60%), ' +
                    'radial-gradient(220px 180px at 110% 0%, rgba(255,255,255,0.18), transparent 60%)'
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 18px 40px rgba(31,38,135,0.18), inset 0 1px 0 rgba(255,255,255,0.4)'
                },
                '& .model-actions': {
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'opacity 120ms ease, visibility 120ms ease',
                },
                '&:hover .model-actions': {
                  opacity: 1,
                  visibility: 'visible',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {model.name}
                </Typography>
                <Box className="model-actions" sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                  <IconButton aria-label="edit" size="small" color="primary" onClick={() => handleEdit(model.id)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton aria-label="delete" size="small" color="error" onClick={() => requestDelete(model.id, model.name)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <LocationOnIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" color="textSecondary">
                  {model.location}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Created on {model.created_at}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Model Type: {model.model_type}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Versions: {model.version_count}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                IRR: {model.irr}
              </Typography>
              <Typography variant="h6">
                MOIC: {model.moic}
              </Typography>
              <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="textSecondary" sx={{ pr: 1, flex: 1, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {`Tags: ${model.tags && model.tags.length ? model.tags.join(', ') : 'None'}`}
                </Typography>
                <Tooltip title="Edit Tags">
                  <IconButton size="small" color="primary" onClick={() => openAddTag(model.id)}>
                    <LocalOfferOutlinedIcon fontSize="small" />
                    <AddCircleOutlineIcon fontSize="small" sx={{ ml: 0.25 }} />
                  </IconButton>
                </Tooltip>
              </Box>




              
              <Button
                variant="outlined"
                sx={{ mt: 2, borderRadius: 2, backdropFilter: 'blur(2px)', borderColor: 'rgba(25,118,210,0.35)' }}
                fullWidth
                onClick={() => navigate(`/models/${model.id}`)}
              >
                View Model
              </Button>
            </Paper>
          ))}
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.40) 100%)',
            backdropFilter: 'blur(10px) saturate(140%)',
            WebkitBackdropFilter: 'blur(10px) saturate(140%)',
            border: '1px solid rgba(255,255,255,0.55)',
            boxShadow: '0 16px 36px rgba(31,38,135,0.12), inset 0 1px 0 rgba(255,255,255,0.35)',
            borderRadius: 3,
            overflowX: 'auto',
            width: '100%'
          }}
        >
          <Table
            sx={{
              minWidth: { xs: 900, md: 0 },
              '& thead th': {
                fontWeight: 700,
                backgroundColor: 'rgba(255,255,255,0.22)'
              },
              '& tbody td': {
                borderBottom: '1px solid rgba(0,0,0,0.06)'
              },
              '& tbody tr:hover': {
                backgroundColor: 'rgba(255,255,255,0.35)'
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>
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
                    active={orderBy === 'created_at'}
                    direction={orderBy === 'created_at' ? order : 'asc'}
                    onClick={() => handleRequestSort('created_at')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <TableSortLabel
                    active={orderBy === 'model_type'}
                    direction={orderBy === 'model_type' ? order : 'asc'}
                    onClick={() => handleRequestSort('model_type')}
                  >
                    Model Type
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <TableSortLabel
                    active={orderBy === 'irr'}
                    direction={orderBy === 'irr' ? order : 'asc'}
                    onClick={() => handleRequestSort('irr')}
                  >
                    IRR
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <TableSortLabel
                    active={orderBy === 'moic'}
                    direction={orderBy === 'moic' ? order : 'asc'}
                    onClick={() => handleRequestSort('moic')}
                  >
                    MOIC
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <TableSortLabel
                    active={orderBy === 'version_count'}
                    direction={orderBy === 'version_count' ? order : 'asc'}
                    onClick={() => handleRequestSort('version_count')}
                  >
                    Versions
                  </TableSortLabel>
                </TableCell>
                <TableCell>{/* actions column header intentionally blank */}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedModels.map((model: any, index: number) => (
                <TableRow
                  key={index}
                  sx={{
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
                >
                  <TableCell>{model.name}</TableCell>
                  <TableCell>{model.location}</TableCell>
                  <TableCell>{model.created_at}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{model.model_type}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{model.irr}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{model.moic}</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{model.version_count}</TableCell>
                  <TableCell>
                    <Box className="row-actions" sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-start' }}>
                      <IconButton aria-label="edit" size="small" onClick={() => handleEdit(model.id)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="delete" size="small" color="error" onClick={() => requestDelete(model.id, model.name)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
        <DialogTitle>Edit Tags</DialogTitle>
        <DialogContent>
          <Autocomplete
            freeSolo
            options={filteredRecommendedTags}
            value={tagInput}
            onInputChange={(_e, v) => setTagInput(v || '')}
            renderInput={(params) => (
              <TextField {...params} autoFocus margin="dense" label="Tag" type="text" fullWidth />
            )}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Start typing to add a custom tag or choose from recommendations.
          </Typography>
          {isDuplicateTag && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              This tag is already added to this model.
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Current tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedModelActiveTags.length > 0 ? (
                selectedModelActiveTags.map((t: any) => (
                  <Chip
                    key={t.id}
                    size="small"
                    label={t.tag_name}
                    onDelete={() => removeTag(t.id)}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">None</Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddTag}>Cancel</Button>
          <Button variant="contained" onClick={submitAddTag} disabled={!tagInput.trim() || !tagTargetModelId || isDuplicateTag}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Home;   