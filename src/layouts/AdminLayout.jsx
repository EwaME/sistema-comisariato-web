import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="h-screen bg-[#f0eeeb] flex p-3 gap-0 overflow-hidden">
      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR — fuera del card, sobre el fondo crudo */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* MAIN CARD — envuelve navbar + contenido */}
      <div
        className={`flex-1 flex flex-col min-h-0 bg-[#F8F9FF] rounded-2xl border border-gray-200 transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "md:ml-[calc(5rem-0.75rem)]"
            : "md:ml-[calc(16rem-0.75rem)]"
        }`}
      >
        {/* NAVBAR dentro del card, con su propio margen y blur */}
        <Navbar setIsMobileOpen={setIsMobileOpen} />

        {/* CONTENIDO */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
