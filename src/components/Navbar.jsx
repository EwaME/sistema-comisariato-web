import React, { useState } from "react";
import {
  Search,
  Bell,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";

import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import VideoPopover from "./VideoPopover";

export default function Navbar({ setIsMobileOpen }) {
  const [showLogout, setShowLogout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="mx-3 mt-3 bg-white/10 backdrop-blur-xl border border-gray-200 rounded-xl h-14 px-4 md:px-6 flex items-center justify-between sticky top-3 z-10 shadow-sm">
      {" "}
      {/* LADO IZQUIERDO: Breadcrumbs y Hamburguesa */}
      <div className="flex items-center gap-4 text-sm font-medium">
        {/* Botón Hamburguesa (Solo en Móvil) */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-gray-400">General</span>
          <span className="text-gray-300">›</span>
          <span className="text-[#7C3AED] flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </span>
        </div>
      </div>
      {/* Íconos y Perfil derecho */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden sm:flex items-center gap-4 text-gray-400">
          <Search className="w-5 h-5 hover:text-gray-600 cursor-pointer transition-colors" />
          <div className="relative">
            <Bell className="w-5 h-5 hover:text-gray-600 cursor-pointer transition-colors" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
          <VideoPopover
            open={showHelp}
            onOpenChange={setShowHelp}
            videoSrc="/videos/prueba.mp4"
            title="Guía Rápida"
            description="Aprende a navegar por el panel y gestionar tus reportes en menos de un minuto."
            trigger={
              <button className="outline-none">
                <HelpCircle className="w-5 h-5 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            }
          />
        </div>

        <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

        {/* CONTENEDOR DEL PERFIL */}
        <div className="relative">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors"
            onClick={() => setShowLogout(!showLogout)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#020817]">
                Edward Maradiaga
              </p>
              <p className="text-[11px] text-[#7C3AED] font-medium">
                Administrador
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-lg shadow-sm">
              🦖
            </div>
          </div>

          {/* MENÚ FLOTANTE DE CERRAR SESIÓN */}
          {showLogout && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
