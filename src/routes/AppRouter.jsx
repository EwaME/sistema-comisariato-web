import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../auth/ProtectedRoute';

// Un componente de prueba rápido para tu Dashboard
const Dashboard = () => <div className="p-8 text-2xl font-bold">¡Bienvenido al Dashboard del Comisariato!</div>;

export default function AppRouter() {
    return (
        <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/login" element={<Login />} />

        {/* RUTAS PROTEGIDAS (Solo entrás si pasás por el ProtectedRoute) */}
        <Route 
            path="/" 
            element={
            <ProtectedRoute>
                <AdminLayout />
            </ProtectedRoute>
            }
        >
            {/* Todo lo que esté aquí adentro se mostrará dentro del Layout */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
        </Route>

        {/* RUTA 404 */}
        <Route path="*" element={<div>Página no encontrada</div>} />
        </Routes>
    );
}