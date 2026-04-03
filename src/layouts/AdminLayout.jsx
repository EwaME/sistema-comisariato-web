import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    /* Ajustamos el padding: en móvil 0 para que no haya huecos, en desktop p-3 */
    <div className="h-screen bg-[#f0eeeb] flex p-0 md:p-3 gap-0 overflow-hidden">
      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-9999 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}

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
        {/* NAVBAR */}
        <Navbar setIsMobileOpen={setIsMobileOpen} />

        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* CONTENIDO */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
