import React, { createContext, useState, useContext, useEffect } from 'react';

const UserModelsContext = createContext<any>(null);

export const UserModelsProvider = ({ children }: { children: React.ReactNode }) => {
  const [userModels, setUserModels] = useState<any[]>([]);

  return (
    <UserModelsContext.Provider value={{ userModels, setUserModels }}>
      {children}
    </UserModelsContext.Provider>
  );
};

export const useUserModels = () => useContext(UserModelsContext); 