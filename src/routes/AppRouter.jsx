import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../auth/ProtectedRoute";

import Login from "../pages/Authentication/Login";
import RecuperarPassword from "../pages/Authentication/RecuperarPassword";
import NuevaPassword from "../pages/Authentication/NuevaPassword";
import MiPerfil from "../pages/Authentication/MiPerfil";

import Dashboard from "../pages/Dashboards/Dashboard_Inicio";

import Usuarios from "../pages/Manage/Usuarios/Gest_Usuarios";
import CrearUsuario from "../pages/Manage/Usuarios/CrearUsuario";

import Empleados from "../pages/Manage/Empleados/Gest_Empleados";
import CrearEmpleado from "../pages/Manage/Empleados/CrearEmpleado";
import DetalleEmpleado from "../pages/Manage/Empleados/DetalleEmpleado";

import Gest_Roles from "../pages/Manage/Organizacion/Roles/Gest_Roles";
import CrearRol from "../pages/Manage/Organizacion/Roles/CrearRol";
import Gest_Cargos from "../pages/Manage/Organizacion/Cargos/Gest_Cargos";
import CrearCargo from "../pages/Manage/Organizacion/Cargos/CrearCargo";
import Gest_Departamentos from "../pages/Manage/Organizacion/Departamentos/Gest_Departamentos";
import CrearDepartamento from "../pages/Manage/Organizacion/Departamentos/CrearDepartamento";

import Inventario from "../pages/Manage/Inventario/Gest_Inventario.jsx";
import CrearProducto from "../pages/Manage/Inventario/CrearProducto.jsx";
import DetalleProducto from "../pages/Manage/Inventario/DetalleProducto.jsx";
import Gest_Comentarios_Producto from "../pages/Manage/Inventario/Gest_Comentarios_Producto.jsx";

import Categorias from "../pages/Manage/Inventario/Gest_Categorias";
import CrearCategoria from "../pages/Manage/Inventario/CrearCategoria";

import Sugerencias from "../pages/Manage/Gest_Sugerencias";

import Configuraciones from "../pages/Manage/GestionSistema/Gest_Configuraciones";
import Auditorias from "../pages/Manage/GestionSistema/Auditorias";
import Reportes from "../pages/Manage/GestionSistema/Gest_Reportes";

import Creditos from "../pages/Manage/Creditos/Gest_Creditos";
import RevisionCredito from "../pages/Manage/Creditos/Gest_Revision";
import DetalleCredito from "../pages/Manage/Creditos/DetalleCredito";

import Reclamos from "../pages/Manage/Reclamos/Gest_Reclamos.jsx";
import RevisionReclamo from "../pages/Manage/Reclamos/Gest_Revision.jsx";

import GuiasyAyudas from "../pages/GuiasyAyudas";
import DashboardContainer from "../pages/Dashboards/DashboardContainer.jsx";

export default function AppRouter() {
  const TODOS_WEB = [
    "ADMINISTRADOR",
    "ACREDITADOR",
    "ANALISTA",
    "GESTOR DE INVENTARIO",
    "MODERADOR",
  ];

  const ADMIN_ONLY = ["ADMINISTRADOR"];

  return (
    <Routes>
      {/* --- RUTAS PÚBLICAS --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-password" element={<RecuperarPassword />} />
      <Route path="/nueva-contrasena" element={<NuevaPassword />} />

      {/* --- RUTAS PROTEGIDAS --- */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* 1. General */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={TODOS_WEB}>
              <DashboardContainer />
            </ProtectedRoute>
          }
        />
        <Route
          path="perfil"
          element={
            <ProtectedRoute allowedRoles={TODOS_WEB}>
              <MiPerfil />
            </ProtectedRoute>
          }
        />

        {/* 2. Administración y Moderación (Usuarios compartidos) */}
        <Route
          path="usuarios"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRADOR", "MODERADOR"]}>
              <Usuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="usuarios/nuevo"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRADOR", "MODERADOR"]}>
              <CrearUsuario />
            </ProtectedRoute>
          }
        />

        {/* 3. Gestión de Empleados */}
        <Route
          path="empleados"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <Empleados />
            </ProtectedRoute>
          }
        />
        <Route
          path="empleados/nuevo"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <CrearEmpleado />
            </ProtectedRoute>
          }
        />
        <Route
          path="empleados/editar/:id"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <CrearEmpleado />
            </ProtectedRoute>
          }
        />
        <Route
          path="empleados/detalle/:id"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <DetalleEmpleado />
            </ProtectedRoute>
          }
        />

        {/* 4. Gestión de Departamentos */}
        <Route
          path="departamentos"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <Gest_Departamentos />
            </ProtectedRoute>
          }
        />
        <Route
          path="departamentos/nuevo"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <CrearDepartamento />
            </ProtectedRoute>
          }
        />
        <Route
          path="departamentos/editar/:id"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <CrearDepartamento />
            </ProtectedRoute>
          }
        />

        {/* 5. Gestión de Cargos */}
        <Route
          path="cargos"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <Gest_Cargos />
            </ProtectedRoute>
          }
        />
        <Route
          path="cargos/nuevo"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <CrearCargo />
            </ProtectedRoute>
          }
        />
        <Route
          path="cargos/editar/:id"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <CrearCargo />
            </ProtectedRoute>
          }
        />

        {/* 6. Gestión de Roles */}
        <Route
          path="roles"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <Gest_Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="roles/nuevo"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <CrearRol />
            </ProtectedRoute>
          }
        />
        <Route
          path="roles/editar/:id"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <CrearRol />
            </ProtectedRoute>
          }
        />

        {/* 7. Gestión de Stock */}
        <Route
          path="inventario"
          element={
            <ProtectedRoute allowedRoles={["GESTOR DE INVENTARIO"]}>
              <Inventario />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventario/nuevo"
          element={
            <ProtectedRoute allowedRoles={["GESTOR DE INVENTARIO"]}>
              <CrearProducto />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventario/editar/:id"
          element={
            <ProtectedRoute allowedRoles={["GESTOR DE INVENTARIO"]}>
              <CrearProducto />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventario/detalle/:id"
          element={
            <ProtectedRoute allowedRoles={["GESTOR DE INVENTARIO"]}>
              <DetalleProducto />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventario/comentarios/:id"
          element={
            <ProtectedRoute allowedRoles={["GESTOR DE INVENTARIO"]}>
              <Gest_Comentarios_Producto />
            </ProtectedRoute>
          }
        />
        <Route
          path="categorias"
          element={
            <ProtectedRoute allowedRoles={["GESTOR DE INVENTARIO"]}>
              <Categorias />
            </ProtectedRoute>
          }
        />
        <Route
          path="categorias/nuevo"
          element={
            <ProtectedRoute allowedRoles={["GESTOR DE INVENTARIO"]}>
              <CrearCategoria />
            </ProtectedRoute>
          }
        />
        <Route
          path="categorias/editar/:id"
          element={
            <ProtectedRoute allowedRoles={["GESTOR DE INVENTARIO"]}>
              <CrearCategoria />
            </ProtectedRoute>
          }
        />

        {/* 8. Acreditaciones */}
        <Route
          path="creditos"
          element={
            <ProtectedRoute allowedRoles={["ACREDITADOR"]}>
              <Creditos />
            </ProtectedRoute>
          }
        />
        <Route
          path="creditos/revision/:id"
          element={
            <ProtectedRoute allowedRoles={["ACREDITADOR"]}>
              <RevisionCredito />
            </ProtectedRoute>
          }
        />
        <Route
          path="creditos/detalle/:id"
          element={
            <ProtectedRoute allowedRoles={["ACREDITADOR"]}>
              <DetalleCredito />
            </ProtectedRoute>
          }
        />
        <Route
          path="reclamos"
          element={
            <ProtectedRoute allowedRoles={["ACREDITADOR"]}>
              <Reclamos />
            </ProtectedRoute>
          }
        />
        <Route
          path="reclamos/revision/:id"
          element={
            <ProtectedRoute allowedRoles={["ACREDITADOR"]}>
              <RevisionReclamo />
            </ProtectedRoute>
          }
        />

        {/* 9. Gestión de Sistema (Analista y Administrador) */}
        <Route
          path="configuraciones"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <Configuraciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="auditorias"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRADOR", "ANALISTA"]}>
              <Auditorias />
            </ProtectedRoute>
          }
        />
        <Route
          path="reportes"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRADOR", "ANALISTA"]}>
              <Reportes />
            </ProtectedRoute>
          }
        />

        {/* 10. Comunidad (Moderador) */}
        <Route
          path="sugerencias"
          element={
            <ProtectedRoute allowedRoles={["MODERADOR"]}>
              <Sugerencias />
            </ProtectedRoute>
          }
        />
        <Route
          path="guias"
          element={
            <ProtectedRoute allowedRoles={["MODERADOR"]}>
              <GuiasyAyudas />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* --- RUTA 404 --- */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
            <h1 className="text-6xl font-extrabold text-[#020817] mb-4">404</h1>
            <p className="text-gray-500 font-medium">
              Página no encontrada o en construcción 🚧
            </p>
          </div>
        }
      />
    </Routes>
  );
}