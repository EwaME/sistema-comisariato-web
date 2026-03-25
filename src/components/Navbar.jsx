import { useAuth } from "../auth/AuthProvider";
import { FiLogOut, FiMenu, FiBell } from "react-icons/fi";

export default function Navbar() {
    const { logout } = useAuth();

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
            
            {/* Sección Izquierda: Título y menú móvil */}
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <FiMenu size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight">Panel de Control</h1>
                    <p className="text-xs text-gray-500 font-medium">Portal Administrativo</p>
                </div>
            </div>

            {/* Sección Derecha: Notificaciones y Perfil/Logout */}
            <div className="flex items-center gap-4">
                
                {/* Botón de notificaciones de adorno */}
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative">
                    <FiBell size={20} />
                    <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                {/* Info del usuario (Oculto en celulares pequeños) */}
                <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-700">Admin</p>
                </div>

                {/* Botón de Cerrar Sesión Mejorado */}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm"
                    title="Cerrar sesión"
                >
                    <span className="hidden sm:inline">Cerrar Sesión</span>
                    <FiLogOut size={18} />
                </button>
            </div>
            
        </nav>
    );
}


// import {useAuth} from "../auth/AuthProvider";
// 
// export default function Navbar() {
//     const { logout } = useAuth();
// 
//     return (
//         <button
//             onClick={logout}
//             className="bg-red-500 text-white px-4 py-2 rounded"
//         >
//             Cerrar sesión
//         </button>
//     );
// }