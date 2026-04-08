import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { obtenerConfiguracion } from "../services/configuracionesService";

export const useInactividad = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  
  const limiteRef = useRef(15 * 60 * 1000); 
  const tiempoExpiracionRef = useRef(Date.now() + limiteRef.current);

  const [timeLeft, setTimeLeft] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const cerrarSesionInactividad = async () => {
    if (auth.currentUser) {
      try {
        sessionStorage.setItem('mensajeLogin', JSON.stringify({
          texto: "Tu sesión expiró por inactividad. Por favor, ingresa de nuevo.",
          tipo: "warning"
        }));

        await signOut(auth);
        navigate("/login"); 
      } catch (error) {
        console.error("Error al cerrar sesión por inactividad", error);
      }
    }
  };

  const resetTimer = () => {
    setShowWarning(false);
    tiempoExpiracionRef.current = Date.now() + limiteRef.current;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(cerrarSesionInactividad, limiteRef.current);
  };

  const actualizarContador = () => {
    const ahora = Date.now();
    const tiempoRestanteMs = tiempoExpiracionRef.current - ahora;

    if (tiempoRestanteMs <= 0) {
      setTimeLeft("00:00");
      return;
    }

    const minutos = Math.floor(tiempoRestanteMs / 60000);
    const segundos = Math.floor((tiempoRestanteMs % 60000) / 1000);

    const formatoMinutos = String(minutos).padStart(2, '0');
    const formatoSegundos = String(segundos).padStart(2, '0');
    setTimeLeft(`${formatoMinutos}:${formatoSegundos}`);

    const umbralAviso = 2 * 60 * 1000; 
    
    if (tiempoRestanteMs <= umbralAviso && tiempoRestanteMs > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  useEffect(() => {
    const cargarTiempoDesdeFirebase = async () => {
      try {
        const config = await obtenerConfiguracion();
        if (config && config.tiempoInactividad) {
          limiteRef.current = config.tiempoInactividad * 60 * 1000;
          resetTimer(); 
        }
      } catch (error) {
        console.error("Error al cargar el tiempo de inactividad global:", error);
      }
    };

    cargarTiempoDesdeFirebase();

    const eventos = [
      "mousemove",
      "mousedown",
      "keypress",
      "touchmove",
      "scroll",
      "click",
    ];

    resetTimer();
    
    intervalRef.current = setInterval(actualizarContador, 1000);

    eventos.forEach((evento) => window.addEventListener(evento, resetTimer));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      eventos.forEach((evento) =>
        window.removeEventListener(evento, resetTimer)
      );
    };
  }, []);

  return { timeLeft, showWarning, resetTimer };
};