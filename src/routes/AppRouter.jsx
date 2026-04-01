import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../auth/ProtectedRoute";

import Login from "../pages/Authentication/Login";
import RecuperarPassword from "../pages/Authentication/RecuperarPassword";
import NuevaPassword from "../pages/Authentication/NuevaPassword";

import Dashboard from "../pages/Dashboards/Dashboard_Inicio";

import Usuarios from "../pages/Manage/Usuarios/Gest_Usuarios";
import CrearUsuario from "../pages/Manage/Usuarios/CrearUsuario";

import Empleados from "../pages/Manage/Empleados/Gest_Empleados";
import CrearEmpleado from "../pages/Manage/Empleados/CrearEmpleado";
import DetalleEmpleado from "../pages/Manage/Empleados/DetalleEmpleado";

import Gest_Roles from '../pages/Manage/Roles/Gest_Roles';
import CrearRol from '../pages/Manage/Roles/CrearRol';

import Gest_Cargos from '../pages/Manage/Cargos/Gest_Cargos';
import CrearCargo from '../pages/Manage/Cargos/CrearCargo';

import Gest_Departamentos from '../pages/Manage/Departamentos/Gest_Departamentos';
import CrearDepartamento from '../pages/Manage/Departamentos/CrearDepartamento';

import Inventario from '../pages/Manage/Inventario/Gest_Inventario.jsx';
import CrearProducto from '../pages/Manage/Inventario/CrearProducto.jsx';
import DetalleProducto from '../pages/Manage/Inventario/DetalleProducto.jsx';
import Gest_Comentarios_Producto from "../pages/Manage/Inventario/Gest_Comentarios_Producto.jsx";

import Categorias from '../pages/Manage/Inventario/Gest_Categorias';
import CrearCategoria from "../pages/Manage/Inventario/CrearCategoria";

import Sugerencias from '../pages/Manage/Gest_Sugerencias';

import Configuraciones from "../pages/Manage/Gest_Configuraciones";

import Creditos from "../pages/Manage/Creditos/Gest_Creditos";
import RevisionCredito from "../pages/Manage/Creditos/Gest_Revision";
import DetalleCredito from "../pages/Manage/Creditos/DetalleCredito";

import Reclamos from "../pages/Manage/Gest_Reclamos";
import Reportes from "../pages/Manage/Gest_Reportes";
import GuiasyAyudas from "../pages/GuiasyAyudas";

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

                {/* 3. Gestión de Empleados */}
                <Route path="empleados" element={<Empleados />} />
                <Route path="empleados/nuevo" element={<CrearEmpleado />} />
                <Route path="empleados/editar/:id" element={<CrearEmpleado />} />
                <Route path="empleados/detalle/:id" element={<DetalleEmpleado />} />
                <Route path="configuraciones" element={<Configuraciones />} /> 

                {/* 4. Gestión de Departamentos */}
                <Route path="/departamentos" element={<Gest_Departamentos />} />
                <Route path="/departamentos/nuevo" element={<CrearDepartamento />} />
                <Route path="/departamentos/editar/:id" element={<CrearDepartamento />} />

                {/* 5. Gestión de Cargos */}
                <Route path="/cargos" element={<Gest_Cargos />} />
                <Route path="/cargos/nuevo" element={<CrearCargo />} />
                <Route path="/cargos/editar/:id" element={<CrearCargo />} />

                {/* 5. Gestión de Roles */}
                <Route path="/roles" element={<Gest_Roles />} />
                <Route path="/roles/nuevo" element={<CrearRol />} />
                <Route path="/roles/editar/:id" element={<CrearRol />} />

                {/* 6. Gestión de Stock */}
                <Route path="inventario" element={<Inventario />} /> 
                <Route path="inventario/nuevo" element={<CrearProducto />} />
                <Route path="inventario/editar/:id" element={<CrearProducto />} />
                <Route path="inventario/detalle/:id" element={<DetalleProducto />} />
                <Route path="inventario/comentarios/:id" element={<Gest_Comentarios_Producto />} />

                <Route path="categorias" element={<Categorias />} /> 
                <Route path="categorias/nuevo" element={<CrearCategoria />} />
                <Route path="categorias/editar/:id" element={<CrearCategoria />} />

                {/* 7. Acreditaciones */}
                <Route path="creditos" element={<Creditos />} />
                <Route path="creditos/revision/:id" element={<RevisionCredito />} />
                <Route path="creditos/detalle/:id" element={<DetalleCredito />} />
                <Route path="reclamos" element={<Reclamos />} />

                {/* 8. Análisis */}
                <Route path="reportes" element={<Reportes />} /> 

                {/* 9. Comunidad */}
                <Route path="sugerencias" element={<Sugerencias />} />
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
