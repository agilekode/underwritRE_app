import React from 'react';
import { Box, Card, CardContent, CardHeader, Typography, Paper, BoxProps } from '@mui/material';
import { colors } from '../theme';

/**
 * PageContainer
 * 
 * The outer wrapper for page content. Provides consistent padding and max width.
 * 
 * Usage:
 *   <PageContainer>
 *     <PageHeader title="Property Details" />
 *     ...rest of page content
 *   </PageContainer>
 */

export const PageContainer: React.FC<BoxProps> = ({ children, sx = {}, ...props }) => {
  return (
    <Box
      {...props}
      sx={{
        width: '100%',
        maxWidth: 1400,
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, md: 4 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

/**
 * PageHeader
 * 
 * Standardized page title with optional subtitle and actions.
 * 
 * Usage:
 *   <PageHeader 
 *     title="General Property Assumptions"
 *     subtitle="Enter basic property details"
 *     action={<PrimaryButton>Save</PrimaryButton>}
 *   />
 */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h2" sx={{ mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
};

/**
 * Section
 * 
 * A visual grouping for related content with an optional header.
 * 
 * Usage:
 *   <Section title="Income Details">
 *     <StandardInput label="Annual Rent" />
 *     <StandardInput label="Other Income" />
 *   </Section>
 */

interface SectionProps extends BoxProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ 
  title, 
  subtitle, 
  action, 
  children, 
  sx = {},
  ...props 
}) => {
  return (
    <Box
      {...props}
      sx={{
        mb: 4,
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 1,
            borderBottom: `1px solid ${colors.grey[300]}`,
          }}
        >
          <Box>
            {title && (
              <Typography variant="h4" sx={{ mb: subtitle ? 0.5 : 0 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
      )}
      {children}
    </Box>
  );
};

/**
 * FormRow
 * 
 * A horizontal row for form fields with consistent spacing.
 * 
 * Usage:
 *   <FormRow>
 *     <StandardInput label="First Name" />
 *     <StandardInput label="Last Name" />
 *   </FormRow>
 */

export const FormRow: React.FC<BoxProps> = ({ children, sx = {}, ...props }) => {
  return (
    <Box
      {...props}
      sx={{
        display: 'flex',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        '& > *': {
          flex: 1,
          minWidth: 0,
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

/**
 * ContentCard
 * 
 * A card for grouping related content with elevation and padding.
 * 
 * Usage:
 *   <ContentCard title="Property Information">
 *     <StandardInput label="Address" />
 *     <StandardInput label="City" />
 *   </ContentCard>
 */

interface ContentCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({ 
  title, 
  subtitle,
  action, 
  children,
  noPadding = false,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${colors.grey[300]}`,
        borderRadius: 2,
        mb: 3,
      }}
    >
      {(title || action) && (
        <CardHeader
          title={title}
          subheader={subtitle}
          action={action}
          sx={{
            borderBottom: `1px solid ${colors.grey[300]}`,
            '& .MuiCardHeader-title': {
              fontSize: '1.125rem',
              fontWeight: 600,
            },
          }}
        />
      )}
      <CardContent
        sx={{
          p: noPadding ? 0 : 3,
          '&:last-child': {
            pb: noPadding ? 0 : 3,
          },
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * InfoBox
 * 
 * A highlighted box for showing calculated values or important information.
 * 
 * Usage:
 *   <InfoBox label="Total Monthly Rent" value="$14,791.67" />
 */

interface InfoBoxProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'primary' | 'success' | 'error';
}

export const InfoBox: React.FC<InfoBoxProps> = ({ 
  label, 
  value,
  variant = 'default',
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: colors.blueTint,
          border: colors.blue,
          text: colors.navy,
        };
      case 'success':
        return {
          bg: colors.successBg,
          border: colors.success,
          text: colors.success,
        };
      case 'error':
        return {
          bg: colors.errorBg,
          border: colors.error,
          text: colors.error,
        };
      default:
        return {
          bg: colors.grey[50],
          border: colors.grey[300],
          text: colors.grey[900],
        };
    }
  };

  const colorScheme = getColors();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: colorScheme.bg,
        border: `1px solid ${colorScheme.border}`,
        borderRadius: 2,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: colors.grey[600],
          mb: 0.5,
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          color: colorScheme.text,
          fontWeight: 700,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
};

/**
 * EmptyState
 * 
 * A component to show when there's no data (e.g., no models created yet).
 * 
 * Usage:
 *   <EmptyState
 *     title="No models yet"
 *     message="Create your first model to get started"
 *     action={<PrimaryButton>Create Model</PrimaryButton>}
 *   />
 */

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  message, 
  action,
  icon,
}) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 2,
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: 2,
            color: colors.grey[400],
            '& > svg': {
              fontSize: '4rem',
            },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h4" sx={{ mb: 1, color: colors.grey[700] }}>
        {title}
      </Typography>
      {message && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>
      )}
      {action && <Box>{action}</Box>}
    </Box>
  );
};
