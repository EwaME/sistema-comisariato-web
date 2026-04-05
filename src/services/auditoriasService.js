import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { onSnapshot } from "firebase/firestore";

const coleccion = "actividad_logs";

export const registrarAuditoria = async (accion, modulo, descripcion, idReferencia) => {
    try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        let correo = "Sistema";
        let nombreUsuario = "Sistema Automático";
        let rolUsuario = "SISTEMA";

        if (currentUser && currentUser.email) {
            correo = currentUser.email.toLowerCase();
            const userDoc = await getDoc(doc(db, "usuarios", correo));
            if (userDoc.exists()) {
                const data = userDoc.data();
                nombreUsuario = data.nombre || "Usuario Web";
                rolUsuario = data.rol && data.rol.length > 0 ? data.rol[0] : "EMPLEADO";
            }
        }

        const docRef = await addDoc(collection(db, coleccion), {
            accion: accion,
            correo: correo,
            descripcion: descripcion,
            fechaAccion: serverTimestamp(),
            idReferencia: idReferencia || "N/A",
            logId: "", 
            modulo: modulo,
            nombreUsuario: nombreUsuario,
            rolUsuario: rolUsuario, 
            fecha: new Date().toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }),
            hora: new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });

        const shortId = docRef.id.substring(0, 6).toUpperCase();
        await updateDoc(docRef, {
            logId: `LOG-${shortId}`
        });

    } catch (error) {
        console.error("Error en auditoría:", error);
    }
};

export const obtenerAuditorias = async () => {
    try {
        const q = query(collection(db, coleccion), orderBy("fechaAccion", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        throw error;
    }
};

export const obtenerRolesAuditoria = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "roles"));
        return querySnapshot.docs.map(doc => doc.id); 
    } catch (error) {
        throw error;
    }
};

export const escucharAuditorias = (callback) => {
    const q = query(collection(db, "actividad_logs"), orderBy("fechaAccion", "desc"));
    
    return onSnapshot(q, (querySnapshot) => {
        const auditorias = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(auditorias);
    }, (error) => {
        console.error("Error al escuchar auditorías en tiempo real:", error);
    });
};