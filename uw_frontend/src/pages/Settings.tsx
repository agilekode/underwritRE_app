import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Box, Typography, Paper, Divider, Button, Alert, Tooltip } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { BACKEND_URL } from '../utils/constants';
import { useUser, PlanTier } from '../context/UserContext';
import { useLocation } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PK as string);

function EmbeddedCheckoutForm({ onSuccess, tier }: { onSuccess: () => void; tier: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { getAccessTokenSilently } = useAuth0();
  const { refreshUser } = useUser();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error, setupIntent } = await stripe.confirmSetup({ elements, redirect: 'if_required' });
    if (error) {
      setError(error.message || 'Payment authorization failed.');
      setSubmitting(false);
      return;
    }
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
      });
      const resp = await fetch(`${BACKEND_URL}/api/billing/start-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          payment_method: setupIntent?.payment_method,
          tier: tier
        })
      });
      if (!resp.ok) throw new Error('Failed to start subscription');
      await refreshUser();
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to start subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
      <PaymentElement />
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" disabled={submitting || !stripe || !elements}>
        {submitting ? 'Starting…' : 'Confirm and start'}
      </Button>
    </form>
  );
}

const formatEpoch = (epoch?: number | null) => {
  if (!epoch) return '';
  try {
    return new Date(epoch * 1000).toLocaleDateString();
  } catch {
    return '';
  }
};

const formatMoney = (amount?: number | null, currency?: string | null, interval?: string | null) => {
  if (!amount) return '';
  const money = (amount / 100).toLocaleString(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() });
  return interval ? `${money} / ${interval}` : money;
};

const TIERS_FEATURES = {
  freemium: [
    'Basic Investment Models',
    'Standard Financial Analysis',
    'Single Version Support',
    '1 Property Image',
  ],
  pro: [
    'Everything in Freemium',
    'Advanced Model Types (Mixed-Use & Retail/Industrial)',
    'Deal Version Comparison',
    'Full Image Gallery',
    'Priority Email Support',
    'No Branding on PDFs'
  ],
  max: [
    'Everything in Pro',
    'Ground-up Development Models',
    'Custom Table Mappings',
    'White-label PDF Reports',
    'Company Branding Integration',
    'Dedicated Support'
  ]
};

const Settings = () => {
  const { isLoading, getAccessTokenSilently } = useAuth0();
  const { user: appUser, isAuthenticated, refreshUser } = useUser();
  const location = useLocation();
  const pricingRef = React.useRef<HTMLDivElement>(null);
  const paymentRef = React.useRef<HTMLDivElement>(null);

  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [showPayment, setShowPayment] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");
  const [successMessage, setSuccessMessage] = React.useState<string>("");
  const [subJustStarted, setSubJustStarted] = React.useState(false);
  const [selectedTier, setSelectedTier] = React.useState<PlanTier>("pro");
  const [highlightedTier, setHighlightedTier] = React.useState<string | null>(null);

  const [subDetails, setSubDetails] = React.useState<any | null>(null);
  const [subLoading, setSubLoading] = React.useState(false);

  const [companyInfo, setCompanyInfo] = React.useState<any | null>(null);
  const [companyLoading, setCompanyLoading] = React.useState<boolean>(false);
  const [companyEditing, setCompanyEditing] = React.useState<boolean>(false);
  const [companyDraft, setCompanyDraft] = React.useState<{ company_name?: string; company_email?: string; company_phone_number?: string; company_logo_url?: string }>({});
  const [companySaving, setCompanySaving] = React.useState<boolean>(false);

  const status: string | null = (appUser?.subscription_status ?? null) as any;
  const currentPeriodEnd: number | null = (appUser?.current_period_end ?? null) as any;
  const stripeCustomerId: string | null = (appUser?.stripe_customer_id ?? null) as any;

  const fetchSubscription = React.useCallback(async () => {
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
      if (!r.ok) {
        setSubDetails(null);
        return;
      }
      const d = await r.json();
      setSubDetails(d);
    } catch {
      setSubDetails(null);
    } finally {
      setSubLoading(false);
    }
  }, [getAccessTokenSilently]);

  React.useEffect(() => {
    // Always attempt to fetch subscription; backend can resolve by user regardless
    fetchSubscription();
  }, [stripeCustomerId, fetchSubscription]);

  // If coming from promo flow, temporarily hide the "Start trial" button until fetch completes
  React.useEffect(() => {
    const qs = new URLSearchParams(location.search);
    if (qs.get('from') === 'promo') {
      setSubJustStarted(true);
      fetchSubscription();
    }
    const upgrade = qs.get('upgrade');
    if (upgrade && ['pro', 'max'].includes(upgrade.toLowerCase())) {
      const tier = upgrade.toLowerCase();
      setHighlightedTier(tier);
      setSelectedTier(tier as PlanTier);
      
      setTimeout(() => {
        pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [location.search, fetchSubscription]);

  // Fetch Company Info
  React.useEffect(() => {
    const run = async () => {
      if (!appUser?.email) {
        setCompanyInfo(null);
        return;
      }
      try {
        setCompanyLoading(true);
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
        });
        const r = await fetch(`${BACKEND_URL}/api/company_info`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Email': appUser?.email || ''
          },
          credentials: 'include'
        });
        if (!r.ok) {
          setCompanyInfo(null);
          return;
        }
        const d = await r.json();
        if (d && d.exists) {
          setCompanyInfo(d);
          setCompanyDraft({
            company_name: d.company_name || '',
            company_email: d.company_email || '',
            company_phone_number: d.company_phone_number || '',
            company_logo_url: d.company_logo_url || ''
          });
        } else {
          setCompanyInfo(null);
          setCompanyDraft({
            company_name: '',
            company_email: '',
            company_phone_number: '',
            company_logo_url: ''
          });
        }
      } catch {
        setCompanyInfo(null);
      } finally {
        setCompanyLoading(false);
      }
    };
    run();
  }, [appUser?.email, getAccessTokenSilently]);

  const beginSignup = async (tier?: PlanTier) => {
    const targetTier = tier || selectedTier;
    if (tier) setSelectedTier(tier);
    setMessage("");
    setSuccessMessage("");
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
    });
    const r = await fetch(`${BACKEND_URL}/api/billing/setup-intent`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    if (!r.ok) {
      setMessage('Could not initialize payment.');
      return;
    }
    const d = await r.json();
    setClientSecret(d.clientSecret);
    setShowPayment(true);
    setTimeout(() => {
      paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTier(e.target.value as PlanTier);
    if (showPayment) {
      setShowPayment(false);
      setClientSecret(null);
    }
  };

  const openPortal = async () => {
    setMessage("");
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
    });
    const r = await fetch(`${BACKEND_URL}/api/billing/portal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    if (!r.ok) {
      setMessage('Could not open billing portal.');
      return;
    }
    const d = await r.json();
    window.location.href = d.url;
  };

  const canManage = !!stripeCustomerId || (status && status !== 'canceled');
  const canStartTrial = (!status || status === 'incomplete_expired') && !subJustStarted && (subDetails?.eligible_for_trial !== false);
  const effectiveStatus: string | null = (subDetails?.status || status || null) as any;
  const isCanceled = effectiveStatus === 'canceled';

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: 1000, width: '100%', mt: 4, backgroundColor: 'white', p: 2, borderRadius: 2 }}>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your account settings and preferences.
        </Typography>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
            Personal Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your personal details here.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography variant="body1">{isAuthenticated ? (appUser?.email || 'Unknown') : 'Not signed in'}</Typography>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
            Company Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {companyLoading ? (
            <Typography variant="body2" color="text.secondary">Loading company information…</Typography>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
                {!companyEditing ? (
                  <Button variant="outlined" size="small" onClick={() => setCompanyEditing(true)}>Edit</Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={companySaving}
                      onClick={async () => {
                        try {
                          setCompanySaving(true);
                          const token = await getAccessTokenSilently({
                            authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
                          });
                          const r = await fetch(`${BACKEND_URL}/api/company_info`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                              'X-User-Email': appUser?.email || ''
                            },
                            credentials: 'include',
                            body: JSON.stringify(companyDraft)
                          });
                          if (r.ok) {
                            setCompanyEditing(false);
                            // refresh
                            const refreshed = await fetch(`${BACKEND_URL}/api/company_info`, {
                              method: 'GET',
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'X-User-Email': appUser?.email || ''
                              },
                              credentials: 'include'
                            });
                            const d = await refreshed.json();
                            setCompanyInfo(d && d.exists ? d : null);
                          }
                        } finally {
                          setCompanySaving(false);
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setCompanyEditing(false);
                        setCompanyDraft({
                          company_name: companyInfo?.company_name || '',
                          company_email: companyInfo?.company_email || '',
                          company_phone_number: companyInfo?.company_phone_number || '',
                          company_logo_url: companyInfo?.company_logo_url || ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '220px 1fr', rowGap: 1.25, columnGap: 2 }}>
                <Typography variant="body2" color="text.secondary">Company Name</Typography>
                {companyEditing ? (
                  <input
                    value={companyDraft.company_name || ''}
                    onChange={(e) => setCompanyDraft((s) => ({ ...s, company_name: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6 }}
                  />
                ) : (
                  <Typography variant="body1">{companyInfo?.company_name || '—'}</Typography>
                )}

                <Typography variant="body2" color="text.secondary">Company Email</Typography>
                {companyEditing ? (
                  <input
                    value={companyDraft.company_email || ''}
                    onChange={(e) => setCompanyDraft((s) => ({ ...s, company_email: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6 }}
                  />
                ) : (
                  <Typography variant="body1">{companyInfo?.company_email || '—'}</Typography>
                )}

                <Typography variant="body2" color="text.secondary">Company Phone Number</Typography>
                {companyEditing ? (
                  <input
                    value={companyDraft.company_phone_number || ''}
                    onChange={(e) => setCompanyDraft((s) => ({ ...s, company_phone_number: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #e0e0e0', borderRadius: 6 }}
                  />
                ) : (
                  <Typography variant="body1">{companyInfo?.company_phone_number || '—'}</Typography>
                )}

                <Typography variant="body2" color="text.secondary">Company Logo</Typography>
                <Box>
                  {companyInfo?.company_logo_url ? (
                    <Box sx={{ mb: 1 }}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <img src={companyInfo.company_logo_url} style={{ maxHeight: 56, maxWidth: 240, objectFit: 'contain' }} />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No logo uploaded</Typography>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={!companyEditing}
                    onChange={async (e) => {
                      const inputEl = e.currentTarget as HTMLInputElement;
                      const file = inputEl.files?.[0];
                      if (!file) return;
                      if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
                        // reset and ignore unsupported types
                        if (inputEl) inputEl.value = '';
                        return;
                      }
                      try {
                        const token = await getAccessTokenSilently({
                          authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE }
                        });
                        const fd = new FormData();
                        fd.append('file', file);
                        const r = await fetch(`${BACKEND_URL}/api/company_logo/upload`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'X-User-Email': appUser?.email || ''
                          },
                          credentials: 'include',
                          body: fd
                        });
                        if (r.ok) {
                          const d = await r.json();
                          setCompanyInfo((s: any | null) => ({ ...(s || {}), company_logo_url: d.url, exists: true }));
                          setCompanyDraft((s: any) => ({ ...(s || {}), company_logo_url: d.url }));
                        }
                      } catch {
                        // ignore for now
                      } finally {
                        if (inputEl) inputEl.value = '';
                      }
                    }}
                  />
                </Box>
              </Box>
            </>
          )}
        </Paper>

        <Box ref={pricingRef} sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Plan & Billing
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 3,
              mb: 4
            }}
          >
            {(['freemium', 'pro', 'max'] as PlanTier[]).map((tierId) => {
              const isCurrent = (appUser?.plan_tier || 'freemium') === tierId;
              const isPro = tierId === 'pro';
              const isMax = tierId === 'max';
              const isFreemium = tierId === 'freemium';
              const priceText = isFreemium ? '$0' : isPro ? '$20' : '$50';
              const tierName = tierId.charAt(0).toUpperCase() + tierId.slice(1);
              const isDowngrade = (appUser?.plan_tier === 'max' && (tierId === 'pro' || tierId === 'freemium')) || 
                                 (appUser?.plan_tier === 'pro' && tierId === 'freemium');
              const isWait = highlightedTier === tierId;

                    const isTrialEligible = isPro && canStartTrial;

                    return (
                      <Paper
                        key={tierId}
                        variant="outlined"
                        sx={{
                          p: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          borderRadius: 3,
                          borderColor: isWait ? 'primary.main' : 'divider',
                          borderWidth: isWait ? 2 : 1,
                          transition: 'all 0.3s ease',
                          boxShadow: isWait ? 4 : 0,
                          backgroundColor: 'white',
                          zIndex: isWait ? 2 : 1,
                          '&:hover': {
                            boxShadow: 2,
                            transform: 'translateY(-4px)',
                          },
                        }}
                      >
                        {isCurrent && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              bgcolor: 'success.main',
                              color: 'white',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 2,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          >
                            Current Plan
                          </Box>
                        )}
                        {isTrialEligible && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: isCurrent ? 120 : 12,
                              bgcolor: 'primary.main',
                              color: 'white',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 2,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}
                          >
                            14-Day Free Trial
                          </Box>
                        )}
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, textTransform: 'capitalize' }}>
                          {tierName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>{priceText}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>/mo</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ flexGrow: 1, mb: 3 }}>
                          {TIERS_FEATURES[tierId as keyof typeof TIERS_FEATURES].map((f, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.25 }}>
                              <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18, mr: 1, mt: 0.25 }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>{f}</Typography>
                            </Box>
                          ))}
                        </Box>
                        {isCurrent ? (
                          <Button variant="outlined" color="success" disabled fullWidth sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                            Current Plan
                          </Button>
                        ) : isDowngrade ? (
                          <Tooltip title="Downgrades are currently handled via support.">
                            <span>
                              <Button variant="outlined" disabled fullWidth sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                                Downgrade
                              </Button>
                            </span>
                          </Tooltip>
                        ) : (
                          <Box>
                            <Button
                              variant={isWait || isTrialEligible ? 'contained' : 'outlined'}
                              onClick={() => beginSignup(tierId)}
                              fullWidth
                              sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                textTransform: 'none',
                                py: 1,
                                boxShadow: isWait ? 2 : 0
                              }}
                            >
                              {isFreemium ? 'Switch to Freemium' : (isTrialEligible ? 'Start 14-day Free Trial' : `Upgrade to ${tierName}`)}
                            </Button>
                            {isTrialEligible && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                                No charge until trial ends
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>
                    );
            })}
          </Box>
        </Box>


        {((appUser?.plan_tier && appUser.plan_tier !== 'freemium') || showPayment) && (
          <Paper variant="outlined" sx={{ p: 3, mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
              Subscription and Payment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

          {/* Row-based summary */}
          <Box sx={{ mb: 2 }}>
            {subLoading ? (
              <Typography variant="body2" color="text.secondary">Loading subscription…</Typography>
            ) : (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr',
                rowGap: 1.25,
                columnGap: 2
              }}>
                {subDetails?.status && (
                  <>
                    <Typography variant="body2" color="text.secondary">Tier</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{subDetails?.plan_tier || '—'}</Typography>

                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="body1">{subDetails?.status || status || '—'}</Typography>
                  </>
                )}

                {(subDetails?.amount || subDetails?.currency || subDetails?.interval) && (
                  <>
                    <Typography variant="body2" color="text.secondary">Price</Typography>
                    <Typography variant="body1">{formatMoney(subDetails?.amount, subDetails?.currency, subDetails?.interval)}</Typography>
                  </>
                )}

                {!!subDetails?.start_date && (
                  <>
                    <Typography variant="body2" color="text.secondary">Started</Typography>
                    <Typography variant="body1">{formatEpoch(subDetails.start_date)}</Typography>
                  </>
                )}

                {(subDetails?.trial_start || subDetails?.trial_end) && (
                  <>
                    <Typography variant="body2" color="text.secondary">Trial</Typography>
                    <Typography variant="body1">{`${formatEpoch(subDetails?.trial_start)} — ${formatEpoch(subDetails?.trial_end)}`}</Typography>
                  </>
                )}

                {(subDetails?.current_period_start || subDetails?.current_period_end) && (
                  <>
                    <Typography variant="body2" color="text.secondary">Current period</Typography>
                    <Typography variant="body1">{`${formatEpoch(subDetails?.current_period_start)} — ${formatEpoch(subDetails?.current_period_end)}`}</Typography>
                  </>
                )}

                {!!currentPeriodEnd && !subDetails?.current_period_end && (
                  <>
                    <Typography variant="body2" color="text.secondary">Renews</Typography>
                    <Typography variant="body1">{formatEpoch(currentPeriodEnd)}</Typography>
                  </>
                )}

                {typeof subDetails?.cancel_at_period_end === 'boolean' && (
                  <>
                    <Typography variant="body2" color="text.secondary">Cancel at period end</Typography>
                    <Typography variant="body1">{subDetails.cancel_at_period_end ? 'Yes' : 'No'}</Typography>
                  </>
                )}

                {(subDetails?.payment_method_brand || subDetails?.payment_method_last4) && (
                  <>
                    <Typography variant="body2" color="text.secondary">Payment method</Typography>
                    <Typography variant="body1">{`${subDetails?.payment_method_brand || ''} ${subDetails?.payment_method_last4 ? '• • • • ' + subDetails.payment_method_last4 : ''}`.trim()}</Typography>
                  </>
                )}

                {(subDetails?.hosted_invoice_url || subDetails?.invoice_pdf) && (
                  <>
                    <Typography variant="body2" color="text.secondary">Latest invoice</Typography>
                    <Typography variant="body1">
                      {subDetails?.hosted_invoice_url ? (
                        <a href={subDetails.hosted_invoice_url} target="_blank" rel="noreferrer">View invoice</a>
                      ) : subDetails?.invoice_pdf ? (
                        <a href={subDetails.invoice_pdf} target="_blank" rel="noreferrer">Download PDF</a>
                      ) : '—'}
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>

          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
          {message && <Alert severity="warning" sx={{ mb: 2 }}>{message}</Alert>}

          {/* Actions */}
          {!showPayment && !isLoading && !subLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(canStartTrial || isCanceled) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <select
                    value={selectedTier}
                    onChange={handleTierChange}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}
                  >
                    <option value="freemium">Freemium ($0/mo)</option>
                    <option value="pro">Pro ($20/mo)</option>
                    <option value="max">Max ($50/mo)</option>
                  </select>
                  <Button variant="contained" onClick={() => beginSignup()}>
                    {isCanceled ? 'Restart subscription' : 'Start 14‑day free trial'}
                  </Button>
                </Box>
              )}
              {(canManage || subJustStarted) && (
                <Button variant="outlined" onClick={openPortal} sx={{ alignSelf: 'flex-start' }}>
                  Manage billing
                </Button>
              )}
            </Box>
          )}

          {showPayment && clientSecret && (
            <Box ref={paymentRef} sx={{ mt: 2, maxWidth: 600 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Checkout for {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier
                </Typography>
                <Button size="small" onClick={() => setShowPayment(false)}>Cancel</Button>
              </Box>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckoutForm
                  tier={selectedTier}
                  onSuccess={() => {
                    setShowPayment(false);
                    setSuccessMessage('Successfully upgraded! Your plan has been updated.');
                    setSubJustStarted(true);
                    fetchSubscription();
                  }}
                />
              </Elements>
            </Box>
          )}
        </Paper>
        )}
      </Box>
    </Container>
  );
};

export default Settings;
