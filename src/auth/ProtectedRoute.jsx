// src/auth/ProtectedRoute.jsx
import { useAuth } from "./AuthProvider"; // O como exportes tu contexto
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Cargando...</div>; // Evita que te mande al login mientras Firebase responde

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}