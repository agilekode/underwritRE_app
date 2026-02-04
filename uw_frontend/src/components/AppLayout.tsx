import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Typography, Divider, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import HomeIcon from '@mui/icons-material/Home';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FeedbackIcon from '@mui/icons-material/Feedback';
import LogoutIcon from '@mui/icons-material/Logout';
import { useUser } from '../context/UserContext';
import { colors } from '../theme';

const SIDEBAR_WIDTH = 240;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth0();
  const { user } = useUser();
  
  // Get admin emails from environment variable
  const adminEmails = process.env.REACT_APP_ADMIN_EMAILS?.split(',') || [];
  const isAdmin = adminEmails.includes(user?.email || '');

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  const navItems = [
    { label: 'Your Models', icon: <HomeIcon />, path: '/' },
    { label: 'Create Model', icon: <AddCircleOutlineIcon />, path: '/create-model' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ...(isAdmin ? [{ label: 'Admin', icon: <AdminPanelSettingsIcon />, path: '/admin/model-types' }] : []),
    { label: 'Submit Feedback', icon: <FeedbackIcon />, path: '/feedback' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Dark Left Sidebar */}
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
        }}
      >
        {/* Logo Section */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography
            variant="h1"
            sx={{
            color: colors.white,
            fontWeight: 600,
            letterSpacing: 0.5,
            }}
        >
            underwrit<span style={{ color: colors.blue }}>re</span>
        </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* Main Navigation */}
        <List sx={{ flex: 1, px: 2, py: 2 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 1,
                    color: colors.white,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.08)',
                    },
                    ...(isActive && {
                      bgcolor: colors.blue,
                      '&:hover': {
                        bgcolor: colors.blueDark,
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.9375rem',
                      color: colors.white,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* Bottom Navigation */}
        <List sx={{ px: 2, py: 2 }}>
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 1,
                    color: colors.white,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.08)',
                    },
                    ...(isActive && {
                      bgcolor: 'rgba(255,255,255,0.12)',
                    }),
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      color: colors.white,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* User Profile Section */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid rgba(255,255,255,0.12)`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: colors.blue,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  color: colors.white,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.email?.split('@')[0] || 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.75rem',
                }}
              >
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            fullWidth
            sx={{
              mt: 1,
              color: colors.white,
              justifyContent: 'flex-start',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            Log out
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: `${SIDEBAR_WIDTH}px`,
          minHeight: '100vh',
          bgcolor: colors.grey[100],
        }}
      >
        {children}
      </Box>
    </Box>
  );
};