
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function AccessControl({ roles = [] }) {
    const { ready, isAuthenticated, roles: UserRoles } = useAuth();
    const location = useLocation();

    if (!ready) return null;

    const hasRole = roles.length == 0 || roles.some(role => UserRoles.includes(role));

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!hasRole) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

