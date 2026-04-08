import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

import { useInactividad } from "../hooks/useInactividad";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { timeLeft, showWarning, resetTimer } = useInactividad();

  return (
    <div className="h-screen bg-[#f0eeeb] flex p-0 md:p-3 gap-0 overflow-hidden">
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ================= MODAL DEL RELOJ DE INACTIVIDAD ================= */}
      {showWarning && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#020817]/40 backdrop-blur-md cursor-pointer"
          onClick={resetTimer} 
        >
          {/* El contenedor principal, onClick stopPropagation para que clics adentro no reseteen si no quieres, 
              pero como pediste que se cierre al presionar en CUALQUIER lado, puedes quitar el e.stopPropagation().
              Lo dejé quitado para que cualquier clic cierre el modal y reseteé el timer. */}
          <div className="bg-[#f2f4f7] rounded-[1.5rem] p-6 shadow-2xl flex flex-col items-center gap-2 border border-white">
            <p className="text-[12px] font-black tracking-widest uppercase text-[#8A91A6] mb-2">
              Tu sesión está por expirar
            </p>
            
            <div className="flex items-center gap-1">
              <div className="bg-[#EAE4F5] px-3 py-1 rounded-xl">
                {/* Agregamos font-mono para que los números simulen un reloj digital */}
                <span className="font-mono text-7xl font-light text-[#020817]">
                  {timeLeft ? timeLeft.split(":")[0] : "00"}
                </span>
              </div>
              <span className="font-mono text-6xl text-[#020817] mb-2 animate-pulse">:</span>
              <div className="bg-transparent px-3 py-1 rounded-xl">
                <span className="font-mono text-7xl font-light text-[#020817]">
                  {timeLeft ? timeLeft.split(":")[1] : "00"}
                </span>
              </div>
            </div>

            <p className="text-[11px] font-medium text-[#A0A7BA] mt-3">
              Toca la pantalla para continuar trabajando
            </p>
          </div>
        </div>
      )}
      {/* ================================================================ */}

      <div
        className={`flex-1 flex flex-col min-h-0 bg-[#F8F9FF] transition-all duration-300 ease-in-out
          md:rounded-2xl md:border md:border-gray-200 
          ${
            isCollapsed
              ? "md:ml-[calc(5rem-0.75rem)]"
              : "md:ml-[calc(16rem-0.75rem)]"
          }
        `}
      >
        <Navbar setIsMobileOpen={setIsMobileOpen} />

        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}