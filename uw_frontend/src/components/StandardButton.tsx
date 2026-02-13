import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { colors } from '../theme';

/**
 * PrimaryButton
 * 
 * The main call-to-action button (e.g., "Next", "Save", "Submit").
 * Uses the brand blue color.
 * 
 * Usage:
 *   <PrimaryButton onClick={handleNext}>
 *     Next
 *   </PrimaryButton>
 */

interface ExtendedButtonProps extends ButtonProps {
  /** Show loading spinner */
  loading?: boolean;
}

export const PrimaryButton: React.FC<ExtendedButtonProps> = ({
  children,
  loading = false,
  disabled,
  startIcon,
  ...props
}) => {
  return (
    <Button
      variant="contained"
      color="primary"
      disabled={disabled || loading}
      startIcon={loading ? undefined : startIcon}
      {...props}
      sx={{
        minWidth: 120,
        fontWeight: 600,
        ...props.sx,
      }}
    >
      {loading ? (
        <>
          <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

/**
 * SecondaryButton
 * 
 * A secondary action button (e.g., "Previous", "Cancel").
 * Uses an outlined style.
 * 
 * Usage:
 *   <SecondaryButton onClick={handleCancel}>
 *     Cancel
 *   </SecondaryButton>
 */

export const SecondaryButton: React.FC<ExtendedButtonProps> = ({
  children,
  loading = false,
  disabled,
  startIcon,
  ...props
}) => {
  return (
    <Button
      variant="outlined"
      disabled={disabled || loading}
      startIcon={loading ? undefined : startIcon}
      {...props}
      sx={{
        minWidth: 100,
        color: colors.grey[700],
        borderColor: colors.grey[300],
        '&:hover': {
          borderColor: colors.grey[600],
          backgroundColor: colors.grey[50],
        },
        ...props.sx,
      }}
    >
      {loading ? (
        <>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

/**
 * TextButton
 * 
 * A minimal button for tertiary actions (e.g., "Skip", "Learn More").
 * 
 * Usage:
 *   <TextButton onClick={handleSkip}>
 *     Skip for now
 *   </TextButton>
 */

export const TextButton: React.FC<ButtonProps> = ({
  children,
  ...props
}) => {
  return (
    <Button
      variant="text"
      {...props}
      sx={{
        color: colors.grey[600],
        '&:hover': {
          backgroundColor: 'transparent',
          color: colors.grey[900],
        },
        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
};

/**
 * DangerButton
 * 
 * A button for destructive actions (e.g., "Delete", "Remove").
 * 
 * Usage:
 *   <DangerButton onClick={handleDelete}>
 *     Delete Model
 *   </DangerButton>
 */

export const DangerButton: React.FC<ExtendedButtonProps> = ({
  children,
  loading = false,
  disabled,
  startIcon,
  ...props
}) => {
  return (
    <Button
      variant="contained"
      color="error"
      disabled={disabled || loading}
      startIcon={loading ? undefined : startIcon}
      {...props}
      sx={{
        minWidth: 100,
        fontWeight: 600,
        ...props.sx,
      }}
    >
      {loading ? (
        <>
          <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

/**
 * IconButton
 * 
 * A button that's just an icon (e.g., edit, delete, info).
 * 
 * Usage:
 *   <IconButton onClick={handleEdit}>
 *     <EditIcon />
 *   </IconButton>
 */

export { IconButton } from '@mui/material';