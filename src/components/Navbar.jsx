import React, { useState } from "react";
import { Search, Bell, HelpCircle, LayoutDashboard, LogOut, Menu, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider'; 
import { useNavigate, useLocation, Link } from "react-router-dom"; 

export default function Navbar({ setIsMobileOpen }) {
    const [showLogout, setShowLogout] = useState(false);
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

    const pathnames = location.pathname.split('/').filter((x) => x);

    // Palabras que NO queremos que sean links para evitar el error 404
    const rutasNoClickeables = ['detalle', 'editar'];

    const formatearNombre = (texto) => {
        const decodificado = decodeURIComponent(texto); 
        return decodificado.charAt(0).toUpperCase() + decodificado.slice(1).replace(/-/g, ' ');
    };

    return (
        <div className="bg-white/80 backdrop-blur-md h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
            
            <div className="flex items-center gap-4 text-sm font-medium">
                <button 
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setIsMobileOpen(true)}
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* BREADCRUMBS DINÁMICOS */}
                <div className="hidden sm:flex items-center gap-2">
                    <Link to="/" className="text-gray-400 hover:text-[#020817] transition-colors">
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
                            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                            const isLast = index === pathnames.length - 1;
                            
                            // Verificamos si esta palabra está en la lista negra de clicks
                            const esNoClickeable = rutasNoClickeables.includes(name.toLowerCase());

                            return (
                                <React.Fragment key={name}>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                    {isLast ? (
                                        // Último elemento: Morado y sin link
                                        <span className="text-[#7C3AED] font-bold">
                                            {formatearNombre(name)}
                                        </span>
                                    ) : esNoClickeable ? (
                                        // Elemento intermedio "prohibido": Texto gris normal, SIN link
                                        <span className="text-gray-400 font-medium">
                                            {formatearNombre(name)}
                                        </span>
                                    ) : (
                                        // Elemento intermedio válido (Ej: Empleados): Link normal
                                        <Link to={routeTo} className="text-gray-400 hover:text-[#020817] transition-colors">
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
                    <HelpCircle className="w-5 h-5 hover:text-gray-600 cursor-pointer transition-colors" />
                </div>
                
                <div className="hidden sm:block h-6 w-px bg-gray-200"></div>

                <div className="relative">
                    <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors"
                        onClick={() => setShowLogout(!showLogout)}
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-[#020817]">Edward Maradiaga</p>
                            <p className="text-[11px] text-[#7C3AED] font-medium">Administrador</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-lg shadow-sm">
                            🦖
                        </div>
                    </div>

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