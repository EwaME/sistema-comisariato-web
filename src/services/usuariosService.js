import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { db, app } from "../firebase/firebase"; 
import { registrarAuditoria } from "./auditoriasService";

const coleccion = "usuarios";

export const generarUsuarioTemp = (nombres = "", apellidos = "", dni = "") => {
    const pNombre = nombres.trim().split(' ')[0].substring(0, 3).toLowerCase();
    const pApellido = apellidos.trim().split(' ')[0].substring(0, 3).toLowerCase();
    const numDni = String(dni).replace(/\D/g, '').slice(-5);
    return `${pNombre}${pApellido}${numDni}`;
};

export const obtenerUsuarios = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        throw error;
    }
};

export const crearUsuarioBaseEmpleado = async (empleadoData) => {
    const emailUsuario = empleadoData.correo || empleadoData.correoContacto;
    if (!emailUsuario) return null; 

    const usuarioRef = doc(db, coleccion, emailUsuario.toLowerCase()); 
    
    const docSnap = await getDoc(usuarioRef);
    if (docSnap.exists()) {
        console.log("El usuario ya existe, se omite la creación base.");
        return docSnap.data(); 
    }

    const usernameGen = generarUsuarioTemp(empleadoData.nombres, empleadoData.apellidos, empleadoData.dni);
    
    const nuevoUsuario = {
        uid: emailUsuario.toLowerCase(),
        empleadoId: empleadoData.empleadoId || empleadoData.id, 
        nombre: `${empleadoData.nombres} ${empleadoData.apellidos}`.trim(),
        correo: emailUsuario.toLowerCase(),
        usuario: usernameGen, 
        rol: ['EMPLEADO'],
        estado: 'ACTIVO', 
        plataforma: 'APP MÓVIL', 
        passwordChanged: false, 
        fechaRegistro: new Date(),
        fechaModificacion: new Date(),
        fotoUrl: empleadoData.fotoUrl || "" 
    };

    await setDoc(usuarioRef, nuevoUsuario);

    await registrarAuditoria(
        "CREACIÓN", 
        "Gestión de Usuarios", 
        `Se generó usuario base para: ${nuevoUsuario.nombre}`, 
        emailUsuario.toLowerCase()
    );

    return nuevoUsuario;
};

export const asignarRolWebYAuth = async (empleadoData, nuevoRolAdicional) => {
    const emailUsuario = (empleadoData.correo || empleadoData.id).toLowerCase();
    const usuarioRef = doc(db, coleccion, emailUsuario);
    
    const usernameGen = generarUsuarioTemp(empleadoData.nombres || empleadoData.nombre, empleadoData.apellidos || "", empleadoData.dni || empleadoData.id || ""); 
    const rolesFinales = nuevoRolAdicional === 'EMPLEADO' ? ['EMPLEADO'] : ['EMPLEADO', nuevoRolAdicional];

    const docSnap = await getDoc(usuarioRef);
    const dataPrevia = docSnap.exists() ? docSnap.data() : {};

    await setDoc(usuarioRef, {
        uid: emailUsuario,
        empleadoId: dataPrevia.empleadoId || empleadoData.empleadoId || empleadoData.id || "",
        nombre: dataPrevia.nombre || empleadoData.nombre || `${empleadoData.nombres || ''} ${empleadoData.apellidos || ''}`.trim(),
        correo: emailUsuario,
        usuario: dataPrevia.usuario || usernameGen, 
        rol: rolesFinales,
        estado: dataPrevia.estado || 'ACTIVO', 
        plataforma: 'WEB Y MÓVIL', 
        passwordChanged: dataPrevia.passwordChanged !== undefined ? dataPrevia.passwordChanged : false,
        fechaRegistro: dataPrevia.fechaRegistro || new Date(),
        fechaModificacion: new Date(),
        fotoUrl: empleadoData.fotoUrl || dataPrevia.fotoUrl || "" 
    }, { merge: true }); 

    try {
        const secondaryApp = initializeApp(app.options, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        
        const pwdTemp = dataPrevia.usuario || usernameGen;
        await createUserWithEmailAndPassword(secondaryAuth, emailUsuario, pwdTemp);
        await signOut(secondaryAuth); 
        
    } catch (error) {
        if (error.code !== 'auth/email-already-in-use') {
            console.error("Error en Auth:", error);
            throw error;
        }
    }
    
    await registrarAuditoria(
        "EDICIÓN", 
        "Gestión de Usuarios", 
        `Se habilitó acceso Web y se asignó rol ${nuevoRolAdicional} al correo: ${emailUsuario}`, 
        emailUsuario
    );

    return true;
};

export const actualizarUsuario = async (idUsuario, datosActualizados) => {
    try {
        const docRef = doc(db, coleccion, idUsuario);
        await updateDoc(docRef, { ...datosActualizados, fechaModificacion: new Date() });
        
        await registrarAuditoria(
            "EDICIÓN", 
            "Gestión de Usuarios", 
            `Se actualizaron los datos básicos del usuario`, 
            idUsuario
        );

        return true;
    } catch (error) {
        throw error;
    }
};

export const cambiarEstadoUsuario = async (idUsuario, nuevoEstado) => {
    try {
        const docRef = doc(db, coleccion, idUsuario);
        await updateDoc(docRef, { 
            estado: nuevoEstado, 
            fechaModificacion: new Date() 
        });

        const esInactivo = nuevoEstado.toUpperCase() === 'INACTIVO';
        
        const tipoAccion = esInactivo ? 'ELIMINACIÓN' : 'ACTIVACIÓN';
        const mensaje = esInactivo 
            ? 'Se suspendió el acceso al sistema y App móvil' 
            : 'Se reactivó el acceso al sistema y App móvil';

        await registrarAuditoria(
            tipoAccion, 
            "Gestión de Usuarios", 
            mensaje, 
            idUsuario
        );

        return true;
    } catch (error) {
        console.error("Error al cambiar estado de usuario:", error);
        throw error;
    }
};

export const obtenerUsuarioPorId = async (idDocumento) => {
    try {
        const docRef = doc(db, coleccion, idDocumento);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error al obtener usuario:", error);
        throw error;
    }
};