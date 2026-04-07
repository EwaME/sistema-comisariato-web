import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

import { useInactividad } from "../hooks/useInactividad";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useInactividad();

  return (
    <div className="h-screen bg-[#f0eeeb] flex p-0 md:p-3 gap-0 overflow-hidden">
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

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