import { Navigate, Outlet } from 'react-router-dom';
import React, { useEffect } from 'react';

const ProtectedRoute = ({ isAuthenticated }) => {

  if (!isAuthenticated) {
    // 'replace' prevents the user from hitting 'back' to the locked page
    return <Navigate to="/login" replace />;
  }

  // Outlet renders the child routes defined in your App.js
  return <Outlet />;
};

export default ProtectedRoute;
