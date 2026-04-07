import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { obtenerUsuarioPorId } from "../../services/usuariosService";
import { obtenerEmpleadoPorId } from "../../services/empleadosService";
import { registrarAuditoria } from "../../services/auditoriasService";
import { obtenerCreditosRecientesPorEmpleado } from "../../services/creditosService";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  .miperfil-root {
    font-family: 'DM Sans', sans-serif;
    background: #f5f6f7;
    color: #2c2f30;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
  .miperfil-root * { box-sizing: border-box; }

  /* ── Tokens ── */
  .miperfil-root {
    --primary: #702ae1;
    --primary-dim: #6411d5;
    --primary-container: #b28cff;
    --on-primary: #f8f0ff;
    --surface: #f5f6f7;
    --surface-low: #eff1f2;
    --surface-container: #e6e8ea;
    --surface-high: #e0e3e4;
    --surface-highest: #dadddf;
    --surface-lowest: #ffffff;
    --on-surface: #2c2f30;
    --on-surface-variant: #595c5d;
    --outline-variant: #abadae;
    --inverse-surface: #0c0f10;
    --error: #b41340;
  }

  /* ── Kinetic gradient ── */
  .kinetic-gradient { background: linear-gradient(135deg, #702ae1 0%, #b28cff 100%); }

  /* ── Card base ── */
  .k-card {
    background: var(--surface-lowest);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(44,47,48,.06);
    overflow: hidden;
    position: relative;
  }

  /* ── Dark finance card ── */
  .k-card-dark {
    background: var(--inverse-surface);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,.25);
    overflow: hidden;
    position: relative;
    color: #fff;
  }

  /* ── Section label ── */
  .k-label {
    font-size: 10px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--on-surface-variant);
    margin-bottom: 4px;
  }

  /* ── Status badges ── */
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-amber { background: #fef3c7; color: #b45309; }
  .badge-blue  { background: #dbeafe; color: #1d4ed8; }
  .badge-red   { background: #fee2e2; color: #b91c1c; }
  .badge-dot   { width: 6px; height: 6px; border-radius: 9999px; display: inline-block; }
  .dot-green   { background: #22c55e; }
  .dot-amber   { background: #f59e0b; }
  .dot-blue    { background: #3b82f6; }
  .dot-red     { background: #ef4444; }

  /* ── Chip ── */
  .k-chip { background: var(--surface-container); color: var(--on-surface-variant); padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }

  /* ── Table ── */
  .k-table { width: 100%; border-collapse: collapse; text-align: left; }
  .k-table thead th { padding-bottom: 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--on-surface-variant); border-bottom: 1px solid var(--surface-high); }
  .k-table tbody tr { border-bottom: 1px solid var(--surface-low); transition: background .15s; }
  .k-table tbody tr:last-child { border-bottom: none; }
  .k-table tbody tr:hover { background: var(--surface-low); }
  .k-table tbody td { padding: 14px 0; }

  /* ── Password input ── */
  .k-input {
    width: 100%;
    background: var(--surface-low);
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: var(--on-surface);
    outline: none;
    transition: box-shadow .2s;
  }
  .k-input:focus { box-shadow: 0 0 0 2px rgba(112,42,225,.35); }
  .k-input::placeholder { color: var(--outline-variant); }

  /* ── Buttons ── */
  .k-btn-primary {
    background: var(--on-surface);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 14px 0;
    font-size: 14px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    cursor: pointer;
    transition: background .2s, transform .1s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .k-btn-primary:hover { background: #000; }
  .k-btn-primary:active { transform: scale(.97); }
  .k-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

  .k-btn-secondary {
    background: var(--surface-low);
    color: var(--on-surface);
    border: none;
    border-radius: 12px;
    padding: 12px 22px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background .2s;
  }
  .k-btn-secondary:hover { background: var(--surface-high); }

  .k-btn-gradient {
    background: linear-gradient(135deg, #702ae1 0%, #b28cff 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 12px 22px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(112,42,225,.30);
    transition: opacity .2s, transform .1s;
  }
  .k-btn-gradient:active { transform: scale(.97); }

  .k-btn-logout {
    background: #fee2e2;
    color: #b91c1c;
    border: none;
    border-radius: 12px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: background .2s;
    flex-shrink: 0;
  }
  .k-btn-logout:hover { background: #fecaca; }

  /* ── Strength bar ── */
  .strength-bar { height: 6px; background: var(--surface-container); border-radius: 9999px; overflow: hidden; }
  .strength-fill { height: 100%; border-radius: 9999px; transition: width .4s ease, background .4s ease; }

  /* ── Alert banner ── */
  .k-alert-warning {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    border-radius: 0 12px 12px 0;
    padding: 14px 18px;
    display: flex; align-items: flex-start; gap: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,.05);
  }

  /* ── Message feedback ── */
  .k-msg-error   { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .k-msg-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }

  /* ── Icon circle ── */
  .k-icon-circle { width: 40px; height: 40px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(112,42,225,.10); color: var(--primary); }

  /* ── Decorative corner blob ── */
  .corner-blob { position: absolute; top: 0; right: 0; width: 96px; height: 96px; background: rgba(112,42,225,.05); border-bottom-left-radius: 100px; margin-right: -32px; margin-top: -32px; transition: transform .3s; pointer-events: none; }
  .k-card:hover .corner-blob { transform: scale(1.5); }

  /* ── Halo glow behind header ── */
  .header-halo::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(112,42,225,.05);
    filter: blur(120px);
    border-radius: 9999px;
    transform: translateY(-50%);
    z-index: 0;
    pointer-events: none;
  }

  /* ── Footer support bar ── */
  .k-footer-bar {
    background: var(--surface-low);
    border-radius: 16px;
    padding: 28px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
    margin-top: 24px;
  }

  /* ── Material icon helper ── */
  .mso { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 20px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-smoothing: antialiased; font-variation-settings: 'FILL' 1; }

  /* ── Loading screen ── */
  .k-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--surface); gap: 12px; }

  /* ── Bento grid ── */
  .k-bento { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
  @media (max-width: 768px) { .k-bento > * { grid-column: span 12 !important; } }
  .k-col-4  { grid-column: span 4; }
  .k-col-8  { grid-column: span 8; }
  .k-col-12 { grid-column: span 12; }

  /* ── Password input wrapper ── */
  .k-pwd-wrap { position: relative; }
  .k-pwd-wrap .k-input { padding-right: 44px; }
  .k-pwd-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--on-surface-variant); display: flex; align-items: center; }
  .k-pwd-toggle:hover { color: var(--on-surface); }

  /* ── Headline font ── */
  h1, h2, h3, .font-headline { font-family: 'Plus Jakarta Sans', sans-serif; }
`;

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getBadgeClass(estado) {
  switch (estado) {
    case "APROBADO":
      return "badge badge-green";
    case "PENDIENTE":
      return "badge badge-amber";
    case "PAGADO":
      return "badge badge-blue";
    case "RECHAZADO":
      return "badge badge-red";
    default:
      return "badge badge-amber";
  }
}
function getDotClass(estado) {
  switch (estado) {
    case "APROBADO":
      return "badge-dot dot-green";
    case "PENDIENTE":
      return "badge-dot dot-amber";
    case "PAGADO":
      return "badge-dot dot-blue";
    case "RECHAZADO":
      return "badge-dot dot-red";
    default:
      return "badge-dot dot-amber";
  }
}

function calcularFortaleza(pwd) {
  let score = 0;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}
function getFortalezaUI(score, pwd) {
  if (!pwd.length)
    return { texto: "Sin ingresar", color: "#abadae", width: "0%" };
  if (score <= 1) return { texto: "Débil", color: "#ef4444", width: "25%" };
  if (score === 2) return { texto: "Regular", color: "#f59e0b", width: "50%" };
  if (score === 3) return { texto: "Buena", color: "#34d399", width: "75%" };
  return { texto: "Fuerte", color: "#059669", width: "100%" };
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function MiPerfil() {
  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const mensajeObligatorio = location.state?.mensajeObligatorio;

  const [cargando, setCargando] = useState(true);
  const [usuarioData, setUsuarioData] = useState(null);
  const [empleadoData, setEmpleadoData] = useState(null);
  const [historialCreditos, setHistorialCreditos] = useState([]);

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);

  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [pwdConfirmar, setPwdConfirmar] = useState("");

  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [procesando, setProcesando] = useState(false);

  // Inject global styles once
  useEffect(() => {
    const id = "kinetic-perfil-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = GLOBAL_STYLES;
      document.head.appendChild(style);
    }
    return () => {};
  }, []);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!auth.currentUser) return;
      try {
        const email = auth.currentUser.email;
        const dataUsuario = await obtenerUsuarioPorId(email);
        if (dataUsuario) {
          setUsuarioData(dataUsuario);
          if (dataUsuario.empleadoId) {
            const dataEmp = await obtenerEmpleadoPorId(dataUsuario.empleadoId);
            if (dataEmp) {
              setEmpleadoData(dataEmp);
              const creditosDb = await obtenerCreditosRecientesPorEmpleado(
                dataEmp.empleadoId,
              );
              const creditosFormateados = creditosDb.map((c) => {
                let fechaStr = "Fecha desconocida";
                if (c.fechaRegistro) {
                  const date = c.fechaRegistro.toDate
                    ? c.fechaRegistro.toDate()
                    : new Date(c.fechaRegistro);
                  fechaStr = date.toLocaleDateString("es-HN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                }
                return {
                  id: c.id,
                  producto: c.nombreProducto || "Producto",
                  fecha: fechaStr,
                  monto: c.totalCredito || 0,
                  estado: c.estado?.toUpperCase() || "DESCONOCIDO",
                };
              });
              setHistorialCreditos(creditosFormateados);
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, [auth.currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const scorePwd = calcularFortaleza(pwdNueva);
  const uiFortaleza = getFortalezaUI(scorePwd, pwdNueva);

  const handleActualizarPwd = async (e) => {
    e.preventDefault();
    setMensaje({ texto: "", tipo: "" });
    if (scorePwd < 4) {
      setMensaje({
        texto: "La nueva contraseña no cumple los requisitos.",
        tipo: "error",
      });
      return;
    }
    if (pwdNueva !== pwdConfirmar) {
      setMensaje({ texto: "Las contraseñas no coinciden.", tipo: "error" });
      return;
    }
    setProcesando(true);
    try {
      const credencial = EmailAuthProvider.credential(
        auth.currentUser.email,
        pwdActual,
      );
      await reauthenticateWithCredential(auth.currentUser, credencial);
      await updatePassword(auth.currentUser, pwdNueva);
      const emailMinuscula = auth.currentUser.email.toLowerCase();
      const usuarioRef = doc(db, "usuarios", emailMinuscula);
      await updateDoc(usuarioRef, {
        passwordChanged: true,
        fechaModificacion: new Date(),
      });
      await registrarAuditoria(
        "EDICIÓN",
        "Seguridad",
        "Cambio de contraseña exitoso",
        auth.currentUser.email,
      );
      setPwdActual("");
      setPwdNueva("");
      setPwdConfirmar("");
      setMensaje({
        texto: "¡Contraseña actualizada! Cerrando sesión por seguridad...",
        tipo: "exito",
      });
      setTimeout(async () => {
        await signOut(auth);
        navigate("/login");
      }, 2500);
    } catch (error) {
      console.error(error);
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setMensaje({
          texto: "La contraseña actual es incorrecta.",
          tipo: "error",
        });
      } else {
        setMensaje({
          texto: "Error al actualizar. Intenta más tarde.",
          tipo: "error",
        });
      }
    } finally {
      setProcesando(false);
    }
  };

  /* ── LOADING ── */
  if (cargando) {
    return (
      <div className="k-loading miperfil-root">
        <Loader2
          style={{
            width: 32,
            height: 32,
            color: "var(--primary)",
            animation: "spin 1s linear infinite",
          }}
        />
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--on-surface-variant)",
          }}
        >
          Sincronizando datos de perfil...
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const fotoUrl =
    empleadoData?.fotoUrl ||
    `https://ui-avatars.com/api/?name=${empleadoData?.nombres?.charAt(0)}+${empleadoData?.apellidos?.charAt(0)}&background=f8fafc&color=7C3AED&size=150`;

  return (
    <div
      className="miperfil-root"
      style={{
        padding: "48px 32px 64px",
        maxWidth: 1200,
        margin: "0 auto",
        backgroundColor: "#F8F9FF",
      }}
    >
      {mensajeObligatorio && (
        <div className="k-alert-warning" style={{ marginBottom: 28 }}>
          <AlertTriangle
            style={{
              color: "#f59e0b",
              width: 20,
              height: 20,
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#92400e",
                marginBottom: 2,
              }}
            >
              Acción Requerida
            </p>
            <p style={{ fontSize: 13, color: "#b45309" }}>
              {mensajeObligatorio}
            </p>
          </div>
        </div>
      )}

      {/* ── CONTEXTUAL HEADER ── */}
      <div
        className="header-halo"
        style={{ position: "relative", marginBottom: 48 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 24,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Avatar + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 50,
                overflow: "hidden",
                boxShadow: "0 0 0 4px #fff, 0 8px 24px rgba(0,0,0,.12)",
                flexShrink: 0,
              }}
            >
              <img
                src={fotoUrl}
                alt="Perfil"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  background: "#f1f5f9",
                }}
              />
            </div>
            <div>
              <span
                style={{
                  background: "rgba(112,42,225,.10)",
                  color: "var(--primary)",
                  padding: "3px 12px",
                  borderRadius: 9999,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".12em",
                  display: "inline-block",
                  marginBottom: 6,
                }}
              >
                {empleadoData?.cargo || "Empleado"}
              </span>
              <h1
                className="font-headline"
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  color: "var(--on-surface)",
                  margin: 0,
                }}
              >
                {empleadoData?.nombres} {empleadoData?.apellidos}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--on-surface-variant)",
                  marginTop: 4,
                }}
              >
                Employee ID:{" "}
                <span style={{ color: "var(--on-surface)" }}>
                  {empleadoData?.empleadoId}
                </span>
              </p>
            </div>
          </div>
          {/* Header Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button className="k-btn-secondary">Descargar Reporte</button>
            <button className="k-btn-logout" onClick={handleLogout}>
              <LogOut size={15} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID ── */}
      <div className="k-bento">
        {/* ── CONTACT CARD ── */}
        <div className="k-card k-col-4" style={{ padding: 32 }}>
          <div className="corner-blob" />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <div className="k-icon-circle">
              <span className="mso">contact_mail</span>
            </div>
            <h3
              className="font-headline"
              style={{ fontSize: 17, fontWeight: 700, margin: 0 }}
            >
              Contacto
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <p className="k-label">DNI Personal</p>
              <p style={{ fontWeight: 600, color: "var(--on-surface)" }}>
                {empleadoData?.dni}
              </p>
            </div>
            <div>
              <p className="k-label">Correo Electrónico</p>
              <p style={{ fontWeight: 600, color: "var(--on-surface)" }}>
                {empleadoData?.correo}
              </p>
            </div>
            <div>
              <p className="k-label">Número de Teléfono</p>
              <p style={{ fontWeight: 600, color: "var(--on-surface)" }}>
                {empleadoData?.telefono}
              </p>
            </div>
          </div>
        </div>

        {/* ── CORPORATE CARD ── */}
        <div className="k-card k-col-4" style={{ padding: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <div className="k-icon-circle">
              <span className="mso">corporate_fare</span>
            </div>
            <h3
              className="font-headline"
              style={{ fontSize: 17, fontWeight: 700, margin: 0 }}
            >
              Corporativo
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <p className="k-label">Departamento</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                  }}
                />
                <p
                  style={{
                    fontWeight: 600,
                    color: "var(--on-surface)",
                    margin: 0,
                  }}
                >
                  {empleadoData?.departamento}
                </p>
              </div>
            </div>
            <div>
              <p className="k-label">Fecha de Ingreso</p>
              <p style={{ fontWeight: 600, color: "var(--on-surface)" }}>
                {empleadoData?.fechaIngreso}
              </p>
            </div>
            <div>
              <p className="k-label">Acceso</p>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <span className="k-chip">
                  {usuarioData?.plataforma || "WEB"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FINANCE CARD ── */}
        <div className="k-card-dark k-col-4" style={{ padding: 32 }}>
          <div
            style={{
              position: "absolute",
              bottom: -40,
              right: -40,
              width: 160,
              height: 160,
              background: "var(--primary)",
              opacity: 0.2,
              filter: "blur(60px)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b28cff",
                flexShrink: 0,
              }}
            >
              <span className="mso">account_balance</span>
            </div>
            <h3
              className="font-headline"
              style={{
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                color: "#fff",
              }}
            >
              Finanzas Personales
            </h3>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              position: "relative",
            }}
          >
            <div
              style={{
                padding: 16,
                background: "rgba(255,255,255,.05)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.10)",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Salario Base
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#fff",
                  margin: 0,
                }}
              >
                L.{" "}
                {empleadoData?.salario?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div
              style={{
                padding: 16,
                background: "rgba(178,140,255,.10)",
                borderRadius: 12,
                border: "1px solid rgba(178,140,255,.20)",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "#b28cff",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Límite Aprobado (30%)
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#b28cff",
                  margin: 0,
                }}
              >
                L.{" "}
                {empleadoData?.limiteCredito?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* ── CREDIT HISTORY TABLE ── */}
        <div className="k-card k-col-8" style={{ padding: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="k-icon-circle">
                <span className="mso">history_edu</span>
              </div>
              <h3
                className="font-headline"
                style={{ fontSize: 17, fontWeight: 700, margin: 0 }}
              >
                Historial de Crédito
              </h3>
            </div>
          </div>

          {historialCreditos.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="k-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "right" }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {historialCreditos.map((c, i) => (
                    <tr key={i}>
                      <td>
                        <p
                          style={{
                            fontWeight: 700,
                            color: "var(--on-surface)",
                            margin: "0 0 2px",
                          }}
                        >
                          {c.producto}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--on-surface-variant)",
                            margin: 0,
                          }}
                        >
                          {c.fecha}
                        </p>
                      </td>
                      <td>
                        <span className={getBadgeClass(c.estado)}>
                          <span className={getDotClass(c.estado)} />
                          {c.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontWeight: 700,
                            color: "var(--on-surface)",
                            margin: 0,
                          }}
                        >
                          L.{" "}
                          {c.monto.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 0",
                gap: 12,
              }}
            >
              <span
                className="mso"
                style={{
                  fontSize: 40,
                  color: "var(--outline-variant)",
                  fontVariationSettings: "'FILL' 0",
                }}
              >
                history_edu
              </span>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--on-surface-variant)",
                }}
              >
                Sin registros de créditos aún.
              </p>
            </div>
          )}
        </div>

        {/* ── SECURITY CARD ── */}
        <div className="k-card k-col-4" style={{ padding: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <div className="k-icon-circle">
              <span className="mso">shield_person</span>
            </div>
            <h3
              className="font-headline"
              style={{ fontSize: 17, fontWeight: 700, margin: 0 }}
            >
              Actualiza tus credenciales
            </h3>
          </div>

          <form
            onSubmit={handleActualizarPwd}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <div>
              <label
                className="k-label"
                style={{ display: "block", marginBottom: 8 }}
              >
                Contraseña Actual
              </label>
              <div className="k-pwd-wrap">
                <input
                  className="k-input"
                  type={mostrarActual ? "text" : "password"}
                  placeholder="••••••••"
                  value={pwdActual}
                  onChange={(e) => setPwdActual(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="k-pwd-toggle"
                  onClick={() => setMostrarActual(!mostrarActual)}
                >
                  {mostrarActual ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label
                className="k-label"
                style={{ display: "block", marginBottom: 8 }}
              >
                Nueva Contraseña
              </label>
              <div className="k-pwd-wrap">
                <input
                  className="k-input"
                  type={mostrarNueva ? "text" : "password"}
                  placeholder="Ingresa una contraseña segura"
                  value={pwdNueva}
                  onChange={(e) => setPwdNueva(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="k-pwd-toggle"
                  onClick={() => setMostrarNueva(!mostrarNueva)}
                >
                  {mostrarNueva ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Strength Bar */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  className="k-label"
                  style={{ margin: 0, color: "var(--primary)" }}
                >
                  Fuerza
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: uiFortaleza.color,
                  }}
                >
                  {uiFortaleza.texto}
                </span>
              </div>
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: uiFortaleza.width,
                    background: uiFortaleza.color,
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="k-label"
                style={{ display: "block", marginBottom: 8 }}
              >
                Confirmar Contraseña
              </label>
              <input
                className="k-input"
                type="password"
                placeholder="••••••••"
                value={pwdConfirmar}
                onChange={(e) => setPwdConfirmar(e.target.value)}
                required
              />
            </div>

            {mensaje.texto && (
              <div
                className={
                  mensaje.tipo === "error" ? "k-msg-error" : "k-msg-success"
                }
              >
                {mensaje.tipo === "exito" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
                {mensaje.texto}
              </div>
            )}

            <button
              className="k-btn-primary"
              type="submit"
              disabled={procesando || !pwdActual || !pwdNueva || !pwdConfirmar}
              style={{ marginTop: 4 }}
            >
              {procesando ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <ShieldCheck size={18} />
              )}
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
      {/* end bento */}

      <div className="k-footer-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            className="kinetic-gradient"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <span className="mso">support_agent</span>
          </div>
          <div>
            <p
              style={{
                fontWeight: 700,
                color: "var(--on-surface)",
                margin: "0 0 2px",
              }}
            >
              ¿Necesitas ayuda con tu cuenta?
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--on-surface-variant)",
                margin: 0,
              }}
            >
              Nuestros asistentes de soporte están disponibles 24/7
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <p className="k-label" style={{ margin: "0 0 2px" }}>
              Linea de Soporte
            </p>
            <p
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "var(--primary)",
                margin: 0,
              }}
            >
              +504 3250-5304
            </p>
          </div>
          <button
            style={{
              background: "#fff",
              color: "var(--on-surface)",
              border: "1px solid var(--surface-high)",
              borderRadius: 9999,
              padding: "12px 28px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,.07)",
              transition: "box-shadow .2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.12)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.07)")
            }
          >
            Contactar a soporte
          </button>
        </div>
      </div>
    </div>
  );
}
