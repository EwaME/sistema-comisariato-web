import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Sidebar() {
    const { role, logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Error al salir:", error);
        }
    };

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="p-6 font-bold text-xl border-b text-blue-600">
                Argon Admin
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <Link className="block p-3 rounded-lg hover:bg-blue-50 transition" to="/">
                    🏠 Dashboard
                </Link>

                {role === "Administrador"? (
                    <div>
                        <Link className="block p-3 rounded-lg hover:bg-blue-50 transition" to="/usuarios">
                            👥 Gestión de Usuarios
                        </Link>
                    </div>
                ) : (
                    <div className="p-3 text-xs text-gray-400 italic">
                        Acceso restringido para usuarios y editores
                    </div>
                )}

                {/* 🛡️ ESTA ES LA MAGIA: Solo si el rol es Administrador */}
                {role === "Administrador" || role === "Editor" ? (
                    <div>
                        <Link className="block p-3 rounded-lg hover:bg-blue-50 transition" to="/empleados">
                            Empleados
                        </Link>
                    </div>
                ) : (
                    <div className="p-3 text-xs text-gray-400 italic">
                        Acceso restringido a usuarios
                    </div>
                )}
                
                <Link className="block p-3 rounded-lg hover:bg-blue-50 transition" to="/fuaaa">
                    Probar NOTFOUND
                </Link>

            </nav>

            <div className="p-4 border-t">
                <div className="mb-2 px-3">
                    <span className="text-xs font-bold uppercase text-gray-400">Nombre de Usuario:</span>
                    <p className="text-sm font-medium text-blue-600">{user?.name || "Cargando..."}</p>
                </div>
            </div>

            <div className="p-4 border-t">
                <div className="mb-2 px-3">
                    <span className="text-xs font-bold uppercase text-gray-400">Rol actual:</span>
                    <p className="text-sm font-medium text-blue-600">{role || "Cargando..."}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                >
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}