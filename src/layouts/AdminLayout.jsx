import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
    // Estado para encoger el menú en la PC (solo iconos)
    const [isCollapsed, setIsCollapsed] = useState(false);
    // Estado para mostrar/ocultar el menú en celular
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex relative">
            
            {/* Overlay negro para cuando abres el menú en el celular */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                ></div>
            )}

            <Sidebar 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />
            
            {/* El contenedor principal se ajusta dependiendo del menú */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
                isCollapsed ? 'md:ml-20' : 'md:ml-64'
            }`}> 
                <Navbar setIsMobileOpen={setIsMobileOpen} />
                <main className="flex-1 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}