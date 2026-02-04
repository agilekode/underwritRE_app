import React from 'react';
import { AppLayout } from './AppLayout';
import { useLayout } from '../context/LayoutContext';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const { hideMainSidebar } = useLayout();
  
  if (hideMainSidebar) {
    // Render children without AppLayout wrapper (during model creation stepper)
    return <>{children}</>;
  }
  
  // Render children inside AppLayout for all other cases
  return <AppLayout>{children}</AppLayout>;
};