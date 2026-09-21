import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate, Link, useLocation } from "react-router-dom";
// Agregamos Loader2 a las importaciones
import { Mail, Eye, EyeOff, AlertTriangle, Info, Loader2 } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { getAuth, signOut } from "firebase/auth";
import { registrarAuditoria } from "../../services/auditoriasService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [mensajeNav, setMensajeNav] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const mensajeGuardado = sessionStorage.getItem('mensajeLogin');
    if (mensajeGuardado) {
      setMensajeNav(JSON.parse(mensajeGuardado));
      sessionStorage.removeItem('mensajeLogin');
    } 
    else if (location.state?.mensajeAlerta) {
      setMensajeNav({
        texto: location.state.mensajeAlerta,
        tipo: location.state.tipoAlerta || "info"
      });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensajeNav(null); 
    setLoading(true);

    try {
      await login(email, password);

      const q = query(collection(db, "usuarios"), where("correo", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        if (userData.estado === "INACTIVO") {
          const auth = getAuth();
          await signOut(auth);

          await registrarAuditoria(
            "ACCESO DENEGADO",
            "Autenticación",
            "Intento de inicio de sesión de usuario INACTIVO",
            email,
          );

          setError("Acceso denegado: Tu cuenta ha sido inhabilitada.");
          setLoading(false); // Solo apagamos el loading si hay un error
          return;
        }

        await registrarAuditoria(
          "INICIO DE SESIÓN",
          "Autenticación",
          "Usuario inició sesión correctamente",
          email,
        );

        if (userData.passwordChanged === false) {
          navigate("/perfil", {
            state: {
              mensajeObligatorio:
                "Por seguridad, debes cambiar tu contraseña temporal antes de continuar.",
            },
          });
        } else {
          navigate("/");
        }
        // Nota: NO apagamos el loading aquí. Dejamos que el componente se desmonte cargando.
      } else {
        await registrarAuditoria(
          "INICIO DE SESIÓN",
          "Autenticación",
          "Login exitoso, pero sin registro en colección usuarios",
          email,
        );
        navigate("/");
      }
    } catch (err) {
      await registrarAuditoria(
        "ERROR DE ACCESO",
        "Autenticación",
        `Intento de login fallido. Código: ${err.code}`,
        email,
      );

      if (err.code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError("Ocurrió un error al intentar ingresar.");
      }
      setLoading(false); // Si hay un fallo de Firebase Auth, apagamos el loading
    }
    // Quitamos el bloque 'finally { setLoading(false) }' para evitar el parpadeo
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] relative">
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

      {/* --- COLUMNA IZQUIERDA --- */}
      <div className="hidden md:flex w-1/2  sm:p-4 ">
        <div
          className="relative w-full h-full flex flex-col justify-center p-12 lg:p-20 overflow-hidden"
          style={{
            backgroundImage: "url('/backLogin.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div className="z-10 relative">
            <h1 className="text-4xl lg:text-5xl font-medium text-white leading-tight mb-6">
              Gestionando el futuro
              <br />
              de la{" "}
              <span className="text-[#7C3AED] font-bold">
                eficiencia
                <br />
                de nuestro equipo.
              </span>
            </h1>
            <div className="w-10 h-0.5 bg-[#7C3AED] rounded-full mb-5" />
            <p className="text-[#64748B] text-sm lg:text-base max-w-md leading-relaxed">
              Plataforma centralizada para la gestión de inventario, nómina y
              proveedores con la precisión de un curador experto.
            </p>
          </div>
        </div>
      </div>

      {/* --- COLUMNA DERECHA --- */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] flex flex-col items-center">
          
          {/* AQUÍ ESTÁ EL AVISO DE SESIÓN EXPIRADA / CONFIGURACIÓN GUARDADA */}
          {mensajeNav && (
            <div className={`w-full mb-6 p-4 rounded-2xl flex items-start gap-3 border shadow-sm
              ${mensajeNav.tipo === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 
                mensajeNav.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
                'bg-blue-50 border-blue-200 text-blue-800'}`}
            >
              <div className="shrink-0 mt-0.5">
                {mensajeNav.tipo === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {mensajeNav.texto}
              </p>
            </div>
          )}

          <div className="w-full bg-white rounded-[1rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200 p-8 sm:p-10 pt-16">
            <div className="relative z-10 mb-[1rem] w-full flex items-center justify-center">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center "
                style={{ background: "#020817" }}
              >
                <img
                  src="/candado3d.png"
                  alt="Candado"
                  className="w-[7rem] h-[7rem] object-contain rotate-[25deg]"
                  style={{ marginTop: "-0.5rem" }}
                />
              </div>
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#020817] mb-2">
                Bienvenido de nuevo
              </h2>
              <p className="text-[13px] text-[#64748B]">
                Ingresa tus credenciales para acceder al portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Link
                  to="/recuperar-password"
                  className="text-[11px] text-[#7C3AED] font-bold hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100 text-center font-medium">
                  {error}
                </div>
              )}

              {/* Botoón de Login Actualizado con Spinner */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 bg-[#020817] text-white text-[13px] font-bold tracking-wide py-4 rounded-xl transition-all mt-4 
                  ${loading ? "opacity-90 cursor-wait bg-gray-800" : "hover:bg-black"}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
                    <span>VERIFICANDO...</span>
                  </>
                ) : (
                  "INICIAR SESIÓN"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}