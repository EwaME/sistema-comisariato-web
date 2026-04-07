import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

export const useInactividad = (tiempoLimite = 9000000) => {
  const navigate = useNavigate();
  const auth = getAuth();
  const timeoutRef = useRef(null);

  const cerrarSesionInactividad = async () => {
    if (auth.currentUser) {
      try {
        await signOut(auth);
        navigate("/login", {
          state: {
            mensajeInactividad:
              "Tu sesión expiró por inactividad. Por favor, ingresá de nuevo.",
          },
        });
      } catch (error) {
        console.error("Error al cerrar sesión por inactividad", error);
      }
    }
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(cerrarSesionInactividad, tiempoLimite);
  };

  useEffect(() => {
    const eventos = [
      "mousemove",
      "mousedown",
      "keypress",
      "touchmove",
      "scroll",
      "click",
    ];

    resetTimer();

    eventos.forEach((evento) => window.addEventListener(evento, resetTimer));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      eventos.forEach((evento) =>
        window.removeEventListener(evento, resetTimer),
      );
    };
  }, []);
};
