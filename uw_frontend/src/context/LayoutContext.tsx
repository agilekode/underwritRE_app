import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
  hideMainSidebar: boolean;
  setHideMainSidebar: (hide: boolean) => void;
  modelCreationStarted: boolean;
  setModelCreationStarted: (started: boolean) => void;
  selectedModelTypeId: string;
  setSelectedModelTypeId: (id: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hideMainSidebar, setHideMainSidebar] = useState(false);
  const [modelCreationStarted, setModelCreationStarted] = useState(false);
  const [selectedModelTypeId, setSelectedModelTypeId] = useState('');

  return (
    <LayoutContext.Provider value={{
      hideMainSidebar,
      setHideMainSidebar,
      modelCreationStarted,
      setModelCreationStarted,
      selectedModelTypeId,
      setSelectedModelTypeId
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};