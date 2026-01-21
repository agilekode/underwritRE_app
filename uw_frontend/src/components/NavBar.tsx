import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Menu, MenuItem, IconButton, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import AccountCircle from '@mui/icons-material/AccountCircle';
import FeedbackIcon from '@mui/icons-material/Feedback';
import Settings from '@mui/icons-material/Settings';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL } from '../utils/constants';
import { useUser } from '../context/UserContext';
import textLogo from '../assets/text-logo.png';

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, getAccessTokenSilently } = useAuth0();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [adminAnchor, setAdminAnchor] = useState<null | HTMLElement>(null);
  const [helpMessage, setHelpMessage] = useState<string>('');
  const { user } = useUser()
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  // Get admin emails from environment variable
  const adminEmails = process.env.REACT_APP_ADMIN_EMAILS?.split(',') || [];
  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.38))',
        backdropFilter: 'blur(10px) saturate(140%)',
        WebkitBackdropFilter: 'blur(10px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.45)',
        color: 'black',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(320px 180px at 10% -10%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(380px 240px at 120% 0%, rgba(255,255,255,0.22), transparent 65%)'
        }
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'black', fontWeight: 'bold' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.3,
              fontSize: {
                xs: '1.25rem',  // ~20px on phones
                sm: '1.5rem',   // ~24px small tablets
                md: '1.75rem',  // ~28px
                lg: '2rem'      // ~32px desktops
              }
            }}
          >
            underwrit<span style={{ color: '#0364c9' }}>re</span>
          </Typography>
            {/* <img src={textLogo} alt="underwritRE" style={{ height: 28, display: 'block', marginTop: "8px" }} /> */}
          </Link>
        </Typography>
        
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setHelpOpen(true);
            if (/(create-model|edit-model)/i.test(location.pathname)) {
              const stepNum = (window as any).__uwCurrentStep ?? '(unknown)';
              const stepTitle = (window as any).__uwStepTitle ?? '(unknown)';
            }
          }}
          sx={{ mr: 1, textTransform: 'none' }}
        >
          Submit Feedback
        </Button>
        {adminEmails.includes(user?.email || '') && (
          <>
            <IconButton
              color="inherit"
              aria-label="admin menu"
              onClick={(e) => setAdminAnchor(e.currentTarget)}
              sx={{ color: 'black', mr: 1 }}
            >
              <AdminPanelSettings />
            </IconButton>
            <Menu
              anchorEl={adminAnchor}
              open={Boolean(adminAnchor)}
              onClose={() => setAdminAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{ mt: 1 }}
            >
              <MenuItem onClick={() => { setAdminAnchor(null); navigate('/admin/model-types'); }}>Admin Dashboard</MenuItem>
              <MenuItem onClick={() => { setAdminAnchor(null); navigate('/admin/users'); }}>User MGMT</MenuItem>
              <MenuItem onClick={() => { setAdminAnchor(null); navigate('/admin/issues'); }}>Feedback</MenuItem>
            </Menu>
          </>
        )}
        <div>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{ color: 'black' }}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            sx={{
              mt: 1,
              '& .MuiPaper-root': {
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                minWidth: '200px',
              },
            }}
          >
            <MenuItem disabled sx={{ '&.Mui-disabled': { color: 'black', opacity: 1 } }}>
              <Typography sx={{ fontWeight: 'bold', color: 'black' }}>My Account</Typography>
            </MenuItem>
            <Divider />
            {/* <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
              <AccountCircle sx={{ mr: 1 }} /> Profile
            </MenuItem> */}
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              <Settings sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Log out</MenuItem>
          </Menu>
        </div>
      </Toolbar>
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Feedback</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please use this form to submit feedback, or explain any issue or question you may be having.
          </Typography>
          <TextField
            value={helpMessage}
            onChange={(e) => setHelpMessage(e.target.value)}
            multiline
            minRows={4}
            fullWidth
            placeholder="Describe your issue or question here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const token = await getAccessTokenSilently();
                const body = {
                  page: location.pathname,
                  subsection: (window as any).__uwStepTitle || '',
                  issue: helpMessage || ''
                };
                await fetch(`${BACKEND_URL}/api/issues`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  credentials: 'include',
                  body: JSON.stringify(body)
                });
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to submit issue', e);
              } finally {
                setHelpOpen(false);
                setHelpMessage('');
              }
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
} 