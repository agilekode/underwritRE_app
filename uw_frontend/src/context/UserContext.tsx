import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL } from '../utils/constants';

interface UserContextType {
  user: any;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.email) return;

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
            'X-User-Email': user.email
          },
          credentials: 'include',
          mode: 'cors'
        });
        if (res.ok) {
          const data = await res.json();
          // Prefer backend's canonical auth0_user_id for consistency across providers
          const userDetails = { ...user, ...data, sub: data?.auth0_user_id || (user as any)?.sub };
          setUserDetails(userDetails);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    if (isAuthenticated) {
      fetchUserDetails();
    }
  }, [isAuthenticated, getAccessTokenSilently, user]);

  return (
    <UserContext.Provider value={{ user: userDetails, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 