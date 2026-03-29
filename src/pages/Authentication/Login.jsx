import React, { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, Lock } from "lucide-react";
import { Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setError("");

        console.log("1. Iniciando proceso de autenticación...");

        try {
            console.log("2. Llamando a Firebase...");
            await login(email, password);

            console.log("3. ¡Login exitoso! Redirigiendo...");
            navigate("/");
        } catch (err) {
            console.error("Error capturado:", err.code);
            if (err.code === 'auth/invalid-credential') {
                setError("Correo o contraseña incorrectos.");
            } else {
                setError("Ocurrió un error al intentar ingresar.");
            }
        }
    };

    return (
        // Fondo general de la página (gris súper clarito)
        <div className="min-h-screen flex bg-[#F8FAFC] relative">
            
            {/* ESTILO PARA MATAR EL AUTOFILL AMARILLO DE CHROME */}
            <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #F5F3FF inset !important;
                    -webkit-text-fill-color: #020817 !important;
                    border-radius: 0.75rem !important;
                }
            `}</style>

            {/* --- COLUMNA IZQUIERDA (Panel Oscuro) --- */}
            <div className="hidden md:flex w-1/2 p-4 sm:p-6 lg:p-8">
                <div className="relative w-full h-full bg-gradient-to-br from-[#020817] to-[#1c0836] rounded-[2.5rem] flex flex-col justify-center p-12 lg:p-20 overflow-hidden shadow-xl">
                    
                    {/* Recorte/Mordisco Superior Izquierdo */}
                    <div className="absolute -top-4 -left-4 w-20 h-20 bg-[#F8FAFC] rounded-br-[2.5rem] shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.1)]"></div>
                    
                    {/* Recorte/Mordisco Inferior Derecho */}
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#F8FAFC] rounded-tl-[2.5rem] shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1)]"></div>

                    <div className="z-10 relative">
                        {/* Texto calcado de tu imagen 1 */}
                        <h1 className="text-4xl lg:text-5xl font-medium text-white leading-tight mb-6">
                            Gestionando el futuro<br />
                            de la <span className="text-[#7C3AED] font-bold">eficiencia<br />
                            de nuestro equipo.</span>
                        </h1>
                        <p className="text-[#64748B] text-sm lg:text-base max-w-md leading-relaxed mt-4">
                            Plataforma centralizada para la gestión de inventario, nómina y proveedores con la precisión de un curador experto.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- COLUMNA DERECHA (Formulario) --- */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8">
                
                <div className="w-full max-w-[420px] flex flex-col items-center">
                    
                    {/* Ícono 3D Flotante Arriba */}
                    <div className="mb-6 z-10">
                        <div className="bg-[#020817] rounded-full p-4 shadow-xl flex items-center justify-center w-20 h-20 border-[6px] border-[#F8FAFC]">
                            <Lock className="w-8 h-8 text-[#7C3AED]" />
                        </div>
                    </div>

                    {/* Tarjeta Blanca del Formulario */}
                    <div className="w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-10 -mt-10 pt-16">
                        
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-[#020817] mb-2">Bienvenido de nuevo</h2>
                            <p className="text-[13px] text-[#64748B]">Ingresa tus credenciales para acceder al portal.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* INPUT CORREO */}
                            <div>
                                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type="email"
                                        className="w-full bg-[#F5F3FF] text-[#020817] text-sm border border-purple-50 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
                                        placeholder="nombre@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Mail className="absolute right-4 w-5 h-5 text-[#7C3AED]" />
                                </div>
                            </div>

                            {/* INPUT CONTRASEÑA */}
                            <div>
                                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">
                                    Contraseña
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-[#F5F3FF] text-[#020817] text-sm border border-purple-50 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 text-[#7C3AED] hover:text-[#020817] focus:outline-none transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* OLVIDASTE CONTRASEÑA */}
                            <div className="flex justify-end pt-1">
                                <Link to="/recuperar-password" className="text-[11px] text-[#7C3AED] font-bold hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {/* MENSAJE DE ERROR (Movido abajo como en tu imagen 2) */}
                            {error && (
                                <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100 text-center font-medium">
                                    {error}
                                </div>
                            )}

                            {/* BOTÓN DE LOGIN */}
                            <button
                                type="submit"
                                className="w-full bg-[#020817] text-white text-[13px] font-bold tracking-wide py-4 rounded-xl hover:bg-black transition-colors shadow-md mt-4"
                            >
                                INICIAR SESIÓN
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}