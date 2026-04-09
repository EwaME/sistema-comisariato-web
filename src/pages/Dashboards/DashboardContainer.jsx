import React from "react";
import { useAuth } from "../../auth/AuthProvider";
import DashboardAcreditador from "./Dashboard_Acreditador";
import DashboardAnalistaGlobal from "./Dashboard_Inicio";
import DashboardInventario from "./Dashboard_Gestor_Inventario";
import DashboardModerador from "./Dashboard_Moderador";
import { Loader2 } from "lucide-react";

const DashboardContainer = () => {
  const { user, role, loading } = useAuth();

  const checkAccess = (allowedRoles) => {
    if (!role) return false;
    const userRoles = Array.isArray(role) ? role : [role];
    return userRoles.some((r) => allowedRoles.includes(r));
  };
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF]">
        <Loader2
          className="animate-spin text-purple-600 mb-4"
          size={32}
          strokeWidth={1}
        />
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-light">
          Sincronizando Credenciales...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FF]">
        <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 font-light">
          Sesión no válida o expirada.
        </p>
      </div>
    );
  }

  return (
    <>
      {checkAccess(["ACREDITADOR"]) && <DashboardAcreditador />}{" "}
      {checkAccess(["ADMINISTRADOR", "ANALISTA"]) && (
        <DashboardAnalistaGlobal />
      )}
      {checkAccess(["GESTOR DE INVENTARIO"]) && <DashboardInventario />}
      {checkAccess(["MODERADOR"]) && <DashboardModerador />}
      {!checkAccess([
        "MODERADOR",
        "GESTOR DE INVENTARIO",
        "ACREDITADOR",
        "ADMINISTRADOR",
        "ANALISTA",
      ]) && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF] p-8">
          <h2 className="text-xl text-[#020817] font-light italic mb-2">
            Acceso Restringido
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-light text-center max-w-xs">
            Tu cuenta ({user.email}) no tiene un rol asignado para visualizar
            este panel.
          </p>
        </div>
      )}
    </>
  );

  //   switch (role) {
  //     case checkAccess(["ACREDITADOR"]):
  //       return ;

  //     case checkAccess(["ANALISTA", "ADMINISTRADOR"]):
  //       return <DashboardAnalistaGlobal />;

  //     default:
  //       return (

  //       );
  //   }
};

export default DashboardContainer;
