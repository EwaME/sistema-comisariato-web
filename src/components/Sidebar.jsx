import React from "react";
import { NavLink } from "react-router-dom"; 
import { 
    LayoutDashboard, Users, UserSquare, Settings, Archive, 
    Tags, Receipt, AlertCircle, BarChart3, Edit3, MessageSquare, BookOpen,
    PanelLeftClose, PanelRightClose, X, Factory
} from 'lucide-react';

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
    
    // Función de apoyo para renderizar los items
    const renderMenuItem = (Icon, label, to) => (
        <li>
            <NavLink 
                to={to} 
                title={isCollapsed ? label : ""} // Muestra tooltip cuando está cerrado
                className={({ isActive }) => `flex items-center gap-3 py-3 rounded-[1rem] text-[13px] font-medium transition-all
                ${isActive 
                    ? 'bg-[#020817] text-white shadow-md shadow-gray-200/50' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#020817]'
                } 
                ${isCollapsed ? 'justify-center w-12 mx-auto' : 'px-4'}`} // Ajuste de ancho cuando está colapsado
            >
                <Icon className="w-[18px] h-[18px] shrink-0" /> 
                {/* Ocultamos el texto, pero evitamos que rompa la caja */}
                <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
                    {label}
                </span>
            </NavLink>
        </li>
    );

    return (
        <div className={`bg-white h-screen border-r border-gray-100 flex flex-col fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-20' : 'w-64'} 
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            
            {/* LOGO Y TÍTULO + BOTÓN COLAPSAR */}
            <div className={`p-6 flex items-center h-20 shrink-0 ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
                
                <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="bg-[#020817] text-white p-2 rounded-lg shrink-0">
                        <Factory className="w-5 h-5" />
                    </div>
                    {!isCollapsed && (
                        <div className="whitespace-nowrap transition-opacity duration-300">
                            <h1 className="text-[15px] font-extrabold text-[#020817] leading-tight">Comisariato</h1>
                            <p className="text-[8px] text-gray-400 font-bold tracking-widest uppercase">Azucarera Cucayagua</p>
                        </div>
                    )}
                </div>
                
                {/* BOTÓN DE COLAPSAR: Ahora SIEMPRE se muestra en PC */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`hidden md:flex p-1.5 text-purple-400 hover:text-black hover:bg-gray-50 rounded-md transition-colors 
                        ${isCollapsed ? 'absolute -right-3 top-6 bg-white border border-gray-200 shadow-sm rounded-full' : 'border border-gray-100'}`}
                >
                    {isCollapsed ? <PanelRightClose className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>

                {/* Botón para cerrar en móvil */}
                <button className="md:hidden text-gray-400 hover:text-black absolute right-4 top-6" onClick={() => setIsMobileOpen(false)}>
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* CONTENEDOR DEL MENÚ CON SCROLL */}
            <div className="flex-1 overflow-y-auto py-2 overflow-x-hidden scrollbar-hide">
                
                <div className="mb-6">
                    {!isCollapsed && <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">General</p>}
                    <ul className="space-y-1 px-4">
                        {renderMenuItem(LayoutDashboard, "Dashboard", "/dashboard")}
                    </ul>
                </div>

                <div className="mb-6">
                    {!isCollapsed && <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">Administración</p>}
                    <ul className="space-y-1 px-4">
                        {renderMenuItem(Users, "Usuarios", "/usuarios")}
                        {renderMenuItem(UserSquare, "Empleados", "/empleados")}
                        {renderMenuItem(Settings, "Configuraciones", "/configuraciones")}
                    </ul>
                </div>

                <div className="mb-6">
                    {!isCollapsed && <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">Gestión de Stock</p>}
                    <ul className="space-y-1 px-4">
                        {renderMenuItem(Archive, "Inventario", "/inventario")}
                        {renderMenuItem(Tags, "Categorías", "/categorias")}
                    </ul>
                </div>

                <div className="mb-6">
                    {!isCollapsed && <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">Acreditaciones</p>}
                    <ul className="space-y-1 px-4">
                        {renderMenuItem(Receipt, "Créditos", "/creditos")}
                        {renderMenuItem(AlertCircle, "Reclamos", "/reclamos")}
                    </ul>
                </div>

                <div className="mb-6">
                    {!isCollapsed && <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">Análisis</p>}
                    <ul className="space-y-1 px-4">
                        {renderMenuItem(BarChart3, "Reportes", "/reportes")}
                    </ul>
                </div>

                <div className="mb-6">
                    {!isCollapsed && <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-6">Comunidad</p>}
                    <ul className="space-y-1 px-4">
                        {renderMenuItem(Edit3, "Sugerencias", "/sugerencias")}
                        {renderMenuItem(MessageSquare, "Comentarios", "/comentarios")}
                        {renderMenuItem(BookOpen, "Guías", "/guias")}
                    </ul>
                </div>
            </div>

            {/* PERFIL INFERIOR */}
            <div className={`p-4 shrink-0 mb-2 mt-2 border-t border-gray-50 ${isCollapsed ? 'flex justify-center' : ''}`}>
                {!isCollapsed && <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-2">Cuenta</p>}
                
                {/* Contenedor Flex para el perfil, forzando un ancho manejable si se colapsa */}
                <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : 'px-2'}`}>
                    
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <span className="text-lg">🦖</span> 
                    </div>
                    
                    {!isCollapsed && (
                        <div className="whitespace-nowrap transition-opacity duration-300">
                            <p className="text-[13px] font-bold text-[#020817]">Edward Maradiaga</p>
                            <p className="text-[10px] text-[#7C3AED] font-bold">Administrador</p>
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
}