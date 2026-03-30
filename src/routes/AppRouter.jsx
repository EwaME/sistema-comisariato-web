import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../auth/ProtectedRoute';

import RecuperarPassword from '../pages/RecuperarPassword';
import NuevaPassword from '../pages/NuevaPassword';
import Dashboard from '../pages/Dashboard_Inicio';
import Usuarios from '../pages/Gest_Usuarios';

import Dashboard from '../pages/Dashboards/Dashboard_Inicio';

import Usuarios from '../pages/Manage/Usuarios/Gest_Usuarios';
import CrearUsuario from '../pages/Manage/Usuarios/CrearUsuario';

import Empleados from '../pages/Manage/Empleados/Gest_Empleados';
import CrearEmpleado from '../pages/Manage/Empleados/CrearEmpleado';
import DetalleEmpleado from '../pages/Manage/Empleados/DetalleEmpleado';

import Inventario from '../pages/Manage/Productos/Gest_Inventario';

import Configuraciones from '../pages/Manage/Gest_Configuraciones';

import Categorias from '../pages/Manage/Gest_Categorias';
import Creditos from '../pages/Manage/Gest_Creditos';
import Sugerencias from '../pages/Manage/Gest_Sugerencias';
import GuiasyAyudas from '../pages/GuiasyAyudas';
import Reclamos from '../pages/Gest_Reclamos'; 
import Reportes from '../pages/Gest_Reportes';
import Comentarios from '../pages/Gest_Comentarios';

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
                <Route path="usuarios/nuevo" element={<CrearUsuario />} />

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
                <Route path="guias" element={<GuiasyAyudas />} /> */
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