import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Container, Box, Typography, Paper, Divider, Button, Alert } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { BACKEND_URL } from '../utils/constants';
import { useUser } from '../context/UserContext';
import { useLocation } from 'react-router-dom';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PK as string);

function EmbeddedCheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { getAccessTokenSilently } = useAuth0();
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
        body: JSON.stringify({ payment_method: setupIntent?.payment_method })
      });
      if (!resp.ok) throw new Error('Failed to start subscription');
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

const Settings = () => {
  const { isLoading, getAccessTokenSilently } = useAuth0();
  const { user: appUser, isAuthenticated } = useUser();
  const location = useLocation();

  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [showPayment, setShowPayment] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");
  const [subJustStarted, setSubJustStarted] = React.useState(false);

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
            'X-User-Email': appUser.email
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

  const beginSignup = async () => {
    setMessage("");
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

          {message && <Alert severity="warning" sx={{ mb: 2 }}>{message}</Alert>}

          {/* Actions */}
          {!showPayment && !isLoading && !subLoading && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {(canStartTrial || isCanceled) && (
                <Button variant="contained" onClick={beginSignup}>{isCanceled ? 'Restart subscription' : 'Start 14‑day free trial'}</Button>
              )}
              {(canManage || subJustStarted) && (
                <Button variant="outlined" onClick={openPortal}>Manage billing</Button>
              )}
            </Box>
          )}

          {showPayment && clientSecret && (
            <Box sx={{ mt: 2 }}>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckoutForm onSuccess={() => { setShowPayment(false); setMessage('Subscription started!'); setSubJustStarted(true); openPortal(); }} />
              </Elements>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Settings;
