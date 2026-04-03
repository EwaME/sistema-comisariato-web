import React, { useState } from "react";
import {
  Search,
  Bell,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate, useLocation, Link } from "react-router-dom";
import VideoPopover from "./VideoPopover";

export default function Navbar({ setIsMobileOpen }) {
  const [showLogout, setShowLogout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const pathnames = location.pathname.split("/").filter((x) => x);
  const rutasNoClickeables = ["detalle", "editar"];

  const formatearNombre = (texto) => {
    const decodificado = decodeURIComponent(texto);
    return (
      decodificado.charAt(0).toUpperCase() +
      decodificado.slice(1).replace(/-/g, " ")
    );
  };

  return (
    /* ESTILO APLICADO: Margen, Glassmorphism, Bordes definidos y redondeado suave */
    <div className="mx-3 mt-3 bg-white/10 backdrop-blur-xl border border-gray-200 rounded-xl h-16 px-4 md:px-6 flex items-center justify-between sticky top-3 z-30">
      <div className="flex items-center gap-4 text-sm font-medium">
        <button
          className="md:hidden p-2 -ml-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* BREADCRUMBS DINÁMICOS */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            to="/"
            className="text-gray-400 hover:text-[#020817] transition-colors"
          >
            General
          </Link>

          {pathnames.length === 0 ? (
            <>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-[#7C3AED] flex items-center gap-2 font-bold">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </span>
            </>
          ) : (
            pathnames.map((name, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
              const isLast = index === pathnames.length - 1;
              const esNoClickeable = rutasNoClickeables.includes(
                name.toLowerCase(),
              );

              return (
                <React.Fragment key={name}>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  {isLast ? (
                    <span className="text-[#7C3AED] font-bold">
                      {formatearNombre(name)}
                    </span>
                  ) : esNoClickeable ? (
                    <span className="text-gray-400 font-medium">
                      {formatearNombre(name)}
                    </span>
                  ) : (
                    <Link
                      to={routeTo}
                      className="text-gray-400 hover:text-[#020817] transition-colors"
                    >
                      {formatearNombre(name)}
                    </Link>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden sm:flex items-center gap-4 text-gray-400">
          <Search className="w-5 h-5 hover:text-gray-600 cursor-pointer transition-colors" />
          <div className="relative">
            <Bell className="w-5 h-5 hover:text-gray-600 cursor-pointer transition-colors" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>

          {/* Integración del VideoPopover manteniendo el estilo */}
          <VideoPopover
            open={showHelp}
            onOpenChange={setShowHelp}
            videoSrc="/videos/prueba.mp4"
            title="Guía Rápida"
            description="Aprende a navegar por el panel y gestionar tus reportes."
            trigger={
              <button className="outline-none">
                <HelpCircle className="w-5 h-5 hover:text-gray-600 cursor-pointer transition-colors" />
              </button>
            }
          />
        </div>

        <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

        <div className="relative">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-white/20 p-2 rounded-lg transition-colors"
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
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-lg border border-white/50">
              🦖
            </div>
          </div>

          {showLogout && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50">
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
