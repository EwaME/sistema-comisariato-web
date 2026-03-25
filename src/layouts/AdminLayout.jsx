import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar />
            
            <main className="xl:ml-68">
                <Navbar />
                <div className="p-4">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}