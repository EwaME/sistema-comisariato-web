import React, { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserSquare,
  Settings,
  Archive,
  Tags,
  Receipt,
  AlertCircle,
  BarChart3,
  Edit3,
  MessageSquare,
  BookOpen,
  PanelLeftClose,
  PanelRightClose,
  X,
  Factory,
  Building2, 
  Briefcase, 
  Shield,
  ShieldCheck,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { obtenerUsuarioPorId } from "../services/usuariosService";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const scrollTimeout = useRef(null);
  const profileMenuRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.email) {
        try {
          const userData = await obtenerUsuarioPorId(user.email);
          if (userData) {
            setDbUser(userData);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleScroll = () => {
    setIsScrolling(true);
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  const renderMenuItem = (Icon, label, to) => (
    <li>
      <NavLink
        to={to}
        title={isCollapsed ? label : ""}
        className={({ isActive }) =>
          `flex items-center gap-3 py-3 rounded-[1rem] text-[13px] font-medium transition-all
          ${
            isActive
              ? "bg-[#020817] text-white shadow-md shadow-gray-200/50"
              : "text-gray-500 hover:bg-gray-50 hover:text-[#020817]"
          }
          ${isCollapsed ? "justify-center w-12 mx-auto" : "px-4"}`
        }
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        <span
          className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? "hidden" : "block"}`}
        >
          {label}
        </span>
      </NavLink>
    </li>
  );

  return (
    <div
      className={`bg-[#F0F0F0] h-screen flex flex-col fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out
      ${isCollapsed ? "w-20" : "w-64"}
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}
    >
      <div
        className={`p-6 flex items-center h-20 shrink-0 ${isCollapsed ? "justify-center flex-col gap-2" : "justify-between"}`}
      >
        <div
          className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="bg-[#020817] text-white p-2 rounded-lg shrink-0">
            <Factory className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap transition-opacity duration-300">
              <h1 className="text-[15px] font-extrabold text-[#020817] leading-tight">
                Comisariato
              </h1>
              <p className="text-[8px] text-gray-400 font-bold tracking-widest uppercase">
                Azucarera Cucayagua
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:flex p-1.5 text-purple-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors
            ${
              isCollapsed
                ? "absolute -right-3 top-6 bg-white border border-gray-200 shadow-sm rounded-full"
                : "border border-gray-100 bg-white"
            }`}
        >
          {isCollapsed ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <button
          className="md:hidden text-gray-400 hover:text-black absolute right-4 top-6"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto py-2 overflow-x-hidden
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:duration-300
          ${
            isScrolling && !isCollapsed
              ? "[&::-webkit-scrollbar-thumb]:bg-[#020817]"
              : "[&::-webkit-scrollbar-thumb]:bg-transparent"
          }
          ${isCollapsed ? "scrollbar-hide" : ""}
        `}
      >
        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">
              General
            </p>
          )}
          <ul className="space-y-1 px-4">
            {renderMenuItem(LayoutDashboard, "Dashboard", "/dashboard")}
          </ul>
        </div>

        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">
              Administración
            </p>
          )}
          <ul className="space-y-1 px-4">
            {renderMenuItem(Users, "Usuarios", "/usuarios")}
            {renderMenuItem(UserSquare, "Empleados", "/empleados")}
          </ul>
        </div>

        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">
              Organización
            </p>
          )}
          <ul className="space-y-1 px-4">
            {renderMenuItem(Building2, "Departamentos", "/departamentos")}
            {renderMenuItem(Briefcase, "Cargos", "/cargos")}
            {renderMenuItem(Shield, "Roles", "/roles")}
          </ul>
        </div>

        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">
              Gestión de Stock
            </p>
          )}
          <ul className="space-y-1 px-4">
            {renderMenuItem(Archive, "Inventario", "/inventario")}
            {renderMenuItem(Tags, "Categorías", "/categorias")}
          </ul>
        </div>

        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">
              Acreditaciones
            </p>
          )}
          <ul className="space-y-1 px-4">
            {renderMenuItem(Receipt, "Créditos", "/creditos")}
            {renderMenuItem(AlertCircle, "Reclamos", "/reclamos")}
          </ul>
        </div>

        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">
              Análisis y Gestión
            </p>
          )}
          <ul className="space-y-1 px-4">
            {renderMenuItem(BarChart3, "Reportes", "/reportes")}
            {renderMenuItem(Settings, "Configuraciones", "/configuraciones")}
            {renderMenuItem(ShieldCheck, "Auditorías", "/auditorias")}
          </ul>
        </div>

        <div className="mb-6">
          {!isCollapsed && (
            <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">
              Comunidad
            </p>
          )}
          <ul className="space-y-1 px-4">
            {renderMenuItem(Edit3, "Sugerencias", "/sugerencias")}
            {renderMenuItem(MessageSquare, "Comentarios", "/comentarios")}
            {renderMenuItem(BookOpen, "Guías", "/guias")}
          </ul>
        </div>
      </div>

      <div className="relative p-4 shrink-0 mb-2 mt-2" ref={profileMenuRef}>
        {!isCollapsed && (
          <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-2">
            Cuenta
          </p>
        )}
        <div
          className={`flex items-center gap-3 cursor-pointer hover:bg-gray-200/50 p-2 rounded-xl transition-colors
            ${isCollapsed ? "justify-center w-full p-0" : "px-2"}`}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-white">
            {dbUser?.fotoUrl ? (
                <img src={dbUser.fotoUrl} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
                <span className="text-lg">🦖</span>
            )}
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap transition-opacity duration-300">
              <p className="text-[13px] font-bold text-[#020817]">
                {dbUser?.nombre ? `${dbUser.nombre.split(" ")[0]} ${dbUser.nombre.split(" ")[1] || ""}` : "Cargando..."}
              </p>
              <p className="text-[10px] text-[#7C3AED] font-bold capitalize">
                {dbUser?.rol ? dbUser.rol[1]?.toLowerCase() || dbUser.rol[0]?.toLowerCase() : "..."}
              </p>
            </div>
          )}
        </div>

        {showProfileMenu && (
          <div className={`absolute bottom-full mb-2 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 z-50
            ${isCollapsed ? "left-4 w-48" : "left-4 right-4 w-auto"}`}
          >
            <button
              onClick={() => {
                  navigate("/perfil");
                  setShowProfileMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50"
            >
              <User className="w-4 h-4 text-gray-500" />
              Mi Perfil
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3 mt-1"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}