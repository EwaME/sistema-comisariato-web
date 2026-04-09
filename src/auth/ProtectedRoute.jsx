import { useAuth } from "./AuthProvider"; 
import { Navigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react"; 

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF]">
                <div className="text-[#7C3AED] font-bold tracking-widest uppercase text-sm animate-pulse">
                    Verificando accesos...
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && role) {
        const userRoles = Array.isArray(role) ? role : [role];
        
        const hasPermission = userRoles.some(r => allowedRoles.includes(r));

        if (!hasPermission) {
            return (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FF] p-4">
                    <div className="bg-red-50 p-6 rounded-full mb-6">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-[#020817] mb-3">Acceso Denegado</h2>
                    <p className="text-gray-500 font-medium text-center max-w-sm">
                        No tenés los permisos necesarios para ver este módulo. Si creés que es un error, contactá al administrador.
                    </p>
                </div>
            );
        }
    }

    return children;
}