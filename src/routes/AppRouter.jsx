import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../auth/ProtectedRoute';

import Login from '../pages/Authentication/Login';
import RecuperarPassword from '../pages/Authentication/RecuperarPassword';
import NuevaPassword from '../pages/Authentication/NuevaPassword';

import Dashboard from '../pages/Dashboards/Dashboard_Inicio';

import Usuarios from '../pages/Manage/Gest_Usuarios';

import Empleados from '../pages/Manage/Empleados/Gest_Empleados';
import CrearEmpleado from '../pages/Manage/Empleados/CrearEmpleado';
import DetalleEmpleado from '../pages/Manage/Empleados/DetalleEmpleado';

import Configuraciones from '../pages/Manage/Gest_Configuraciones';
import Inventario from '../pages/Manage/Gest_Inventario';
import Categorias from '../pages/Manage/Gest_Categorias';
import Creditos from '../pages/Manage/Gest_Creditos';
import Sugerencias from '../pages/Manage/Gest_Sugerencias';
import GuiasyAyudas from '../pages/GuiasyAyudas';
import Reclamos from '../pages/Manage/Gest_Reclamos'; 
import Reportes from '../pages/Manage/Gest_Reportes';
import Comentarios from '../pages/Manage/Gest_Comentarios';

export default function AppRouter() {
    return (
        <Routes>
            {/* --- RUTA PÚBLICA --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            <Route path="/nueva-contrasena" element={<NuevaPassword />} />

            {/* --- RUTAS PROTEGIDAS (Requieren inicio de sesión) --- */}
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                {/* Redirección por defecto al entrar a la raíz "/" */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* 1. General */}
                <Route path="dashboard" element={<Dashboard />} />

                {/* 2. Administración */}
                <Route path="usuarios" element={<Usuarios />} />

                <Route path="empleados" element={<Empleados />} />
                <Route path="empleados/nuevo" element={<CrearEmpleado />} />
                <Route path="empleados/editar/:id" element={<CrearEmpleado />} />
                <Route path="empleados/detalle/:id" element={<DetalleEmpleado />} />
                <Route path="configuraciones" element={<Configuraciones />} /> 

                {/* 3. Gestión de Stock */}
                <Route path="inventario" element={<Inventario />} /> 
                <Route path="categorias" element={<Categorias />} /> 

                {/* 4. Acreditaciones */}
                <Route path="creditos" element={<Creditos />} /> 
                <Route path="reclamos" element={<Reclamos />} /> 

                {/* 5. Análisis */}
                <Route path="reportes" element={<Reportes />} /> 

                {/* 6. Comunidad */}
                <Route path="sugerencias" element={<Sugerencias />} />
                <Route path="comentarios" element={<Comentarios />} />
                <Route path="guias" element={<GuiasyAyudas />} />
            </Route>

            {/* --- RUTA 404 (Si el usuario escribe una URL que no existe) --- */}
            <Route 
                path="*" 
                element={
                    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
                        <h1 className="text-6xl font-extrabold text-[#020817] mb-4">404</h1>
                        <p className="text-gray-500 font-medium">Página no encontrada o en construcción 🚧</p>
                    </div>
                } 
            />
        </Routes>
    );
}