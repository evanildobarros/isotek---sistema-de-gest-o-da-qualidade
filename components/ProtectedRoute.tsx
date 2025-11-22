import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('isotek_token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
