import React, { useEffect, useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Alert
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminModelTypes from './pages/AdminModelTypes';
import CreateModelType from './pages/CreateModelType';
import ModelTypeDetail from './pages/ModelTypeDetail';

import './App.css';
import CreateModel from './pages/CreateModel';
import { UserProvider,useUser } from './context/UserContext';
import ModelDetails from './pages/ModelDetails';
import Home from './pages/Home';
import { UserModelsProvider } from './context/UserModelsContext';
import { BACKEND_URL } from './utils/constants';
import AppRoutes from './AppRoutes';
import TermsModal from './components/TermsModal';
import artLogo from './assets/logo_art.png';
import { NavBar } from './components/NavBar';

function App() {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently
  } = useAuth0();

  const [backendMessage, setBackendMessage] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorOpen, setAuthErrorOpen] = useState<boolean>(false);

  // On load, show any persisted auth error message (saved before logout redirect)
  useEffect(() => {
    const persisted = sessionStorage.getItem('uw_auth_error_message');
    if (persisted) {
      setAuthError(persisted);
      setAuthErrorOpen(true);
      sessionStorage.removeItem('uw_auth_error_message');
    }
  }, []);

  // Capture Auth0 redirect errors and clear local auth
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      const desc = params.get('error_description');
      if (err && desc) {
        const decoded = decodeURIComponent(desc);
        setAuthError(decoded);
        setAuthErrorOpen(true);
        // Trigger a one-time logout to clear Auth0 session to prevent auto-login loops
        const alreadyLoggedOut = sessionStorage.getItem('uw_auth_error_logged_out') === '1';
        if (!alreadyLoggedOut) {
          // Persist the message so we can show it after returning to a clean URL
          sessionStorage.setItem('uw_auth_error_message', decoded);
          sessionStorage.setItem('uw_auth_error_logged_out', '1');
          try {
            // Mirror NavBar logout behavior (no federated), return to clean origin
            logout({ logoutParams: { returnTo: window.location.origin } });
          } catch {}
        }
      }
    } catch {}
  }, [logout]);
  useEffect(() => {
    const fetchUser = async () => {

      if (!user?.email) {
        console.error("No email found in user object");
        return;
      }
  
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            scope: "openid profile email"
          }
        });

        const res = await fetch(BACKEND_URL + "/api/check_user", {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-User-Email': user.email  // Send email in a custom header
          },
          credentials: 'include',
          mode: 'cors'
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch');
        }
        const data = await res.json();
        setBackendMessage(data.message);

        // After user is ensured, check user_info for terms acceptance
        try {
          const infoRes = await fetch(BACKEND_URL + "/api/user_info", {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-User-Email': user.email },
            credentials: 'include',
            mode: 'cors'
          });
          if (infoRes.ok) {
            const info = await infoRes.json();
            const accepted = Boolean(info && info.accepted_terms_and_conditions);
            if (!accepted) setTermsOpen(true);
          }
        } catch {}
      } catch (err) {
        console.error("Error calling backend:", err);
        // logout(); // Log the user out if the request fails
      }
    };
  
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, getAccessTokenSilently, user, logout]);


  const adminEmails = process.env.REACT_APP_ADMIN_EMAILS?.split(',') || [];

  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ mt: 10, p: 4, textAlign: 'center' }}>
          <Typography variant="h6">Loading...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #eef2f7 0%, #f7f9fc 100%)',
          px: { xs: 2, sm: 3 }
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', sm: 440, md: 520 },
            mx: 'auto',
            p: { xs: 2.5, sm: 3, md: 4 },
            borderRadius: { xs: 2, sm: 3 },
            textAlign: 'center',
            // Paper-like layout on small screens; liquid-glass on md+
            background: {
              xs: '#ffffff',
              sm: '#ffffff',
              md: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.40) 100%)'
            },
            border: {
              xs: '1px solid rgba(231, 235, 243, 1)',
              sm: '1px solid rgba(231, 235, 243, 1)',
              md: '1px solid rgba(255,255,255,0.55)'
            },
            boxShadow: { xs: 'none', sm: 'none', md: '0 20px 40px rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255,255,255,0.35)' },
            backdropFilter: { xs: 'none', sm: 'none', md: 'blur(12px) saturate(140%)' },
            WebkitBackdropFilter: { xs: 'none', sm: 'none', md: 'blur(12px) saturate(140%)' },
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: {
                xs: 'none',
                sm: 'none',
                md: 'radial-gradient(220px 160px at 10% -10%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(260px 200px at 110% -10%, rgba(255,255,255,0.20), transparent 60%)'
              }
            }
          }}
        >

          

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img src={artLogo} alt="UnderwritRE" style={{ height: 156 }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              mb: 1.25,
              fontWeight: 800,
              letterSpacing: 0.3,
              fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' }
            }}
          >
            Log in to access underwrit<span style={{ color: '#0364c9' }}>re</span>
          </Typography>
          <Typography variant="body2" sx={{ mb: { xs: 2, sm: 2.5, md: 3 }, color: 'text.secondary', fontSize: { xs: 14, sm: 15 } }}>
            Financial Real Estate Underwriting
          </Typography>
          <Button
            variant="contained"
            startIcon={<LockOpenIcon />}
            onClick={() =>
              loginWithRedirect({
                authorizationParams: {
                  prompt: 'login',    // force showing the Universal Login screen
                  max_age: 0          // ignore any existing SSO session
                }
              })
            }
            sx={{
              fontWeight: 800,
              textTransform: 'none',
              fontSize: { xs: '0.95rem', sm: '1rem' },
              py: { xs: 1, sm: 1.15, md: 1.25 },
              borderRadius: 2,
              boxShadow: { xs: 'none', sm: 'none', md: '0 10px 20px rgba(25,118,210,0.25)' }
            }}
            fullWidth
          >
            Log in with Email or Google
          </Button>
          <Box sx={{ mt: 1.75 }}>
            <Button
              variant="outlined"
              onClick={() =>
                loginWithRedirect({
                  authorizationParams: { screen_hint: 'signup' }
                })
              }
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                py: { xs: 0.9, sm: 1.0, md: 1.1 },
                borderRadius: 2,
                borderColor: 'rgba(25,118,210,0.35)'
              }}
              fullWidth
            >
              Don't have an account? Sign up
            </Button>
          </Box>
        </Box>
        {authErrorOpen && authError && (
          <Box sx={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', px: 2 }}>
            <Alert
              severity="warning"
              onClose={() => setAuthErrorOpen(false)}
              sx={{ width: '100%', maxWidth: 960 }}
            >
              {authError}
            </Alert>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <UserProvider>
      <UserModelsProvider>
        <Router>
          {isAuthenticated && <NavBar />}
          {isAuthenticated && (<Box sx={{ height: 64 }} />)}
          <AppRoutes />
          {authErrorOpen && authError && (
            <Box sx={{ mt: 2, mb: 3, px: 2, display: 'flex', justifyContent: 'center' }}>
              <Alert
                severity="warning"
                onClose={() => setAuthErrorOpen(false)}
                sx={{ width: '100%', maxWidth: 960 }}
              >
                {authError}
              </Alert>
            </Box>
          )}
          <TermsModal
            open={isAuthenticated && termsOpen}
            onCancel={() => setTermsOpen(false)}
            onAccept={async () => {
              try {
                const token = await getAccessTokenSilently({
                  authorizationParams: { audience: process.env.REACT_APP_AUTH0_AUDIENCE, scope: 'openid profile email' }
                });
                await fetch(BACKEND_URL + "/api/user_info", {
                  method: 'PUT',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-User-Email': user?.email || '' } as any,
                  credentials: 'include',
                  body: JSON.stringify({
                    accepted_terms_and_conditions: true,
                    accepted_terms_and_conditions_date: new Date().toISOString()
                  })
                });
              } catch {}
              setTermsOpen(false);
            }}
          />
        </Router>
      </UserModelsProvider>
    </UserProvider>
  );
}

export default App;