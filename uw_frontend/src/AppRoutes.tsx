import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminModelTypes from './pages/AdminModelTypes';
import CreateModelType from './pages/CreateModelType';
import ModelTypeDetail from './pages/ModelTypeDetail';
import CreateModel from './pages/CreateModel';
import ModelDetails from './pages/ModelDetails';
import Home from './pages/Home';
import { useUser } from './context/UserContext';
import EditModel from './pages/EditModel';
import Settings from './pages/Settings';
import { useAuth0 } from '@auth0/auth0-react';
import { BACKEND_URL } from './utils/constants';
import UserMgmt from './pages/UserMgmt';
import UserIssues from './pages/UserIssues';


const AppRoutes: React.FC = () => {
  const { user } = useUser();
  const adminEmails = process.env.REACT_APP_ADMIN_EMAILS?.split(',') || [];
  return (
    <Routes>
      <Route path="/admin/model-types/create-new-model" element={<CreateModelType />} />
      {adminEmails.includes(user?.email || '') && (
        <>
          <Route path="/admin/model-types/:id" element={<ModelTypeDetail />} />
          <Route path="/admin/model-types" element={<AdminModelTypes />} />
          <Route path="/admin/users" element={<UserMgmt />} />
        </>
      )}
      {/* Always register issues route to avoid 'No routes matched' warning; gate access inline */}
      <Route
        path="/admin/issues"
        element={adminEmails.includes(user?.email || '') ? <UserIssues /> : <Navigate to="/" replace />}
      />
      <Route path="/" element={<Home />} />
      <Route path="/create-model" element={<CreateModel />} />
      <Route path="/models/:id" element={<ModelDetails />} />
      <Route path="/edit-model/:id" element={<EditModel />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default AppRoutes;