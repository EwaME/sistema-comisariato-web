// src/services/usuariosService.js
import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { db, app } from "../firebase/firebase"; 

const coleccion = "usuarios";

// Utilidad: Genera el usuario (3 letras nombre + 3 letras apellido + 5 dígitos DNI)
// Le puse valores por defecto (="") para que no crashee si viene algo vacío
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

// Se llama automáticamente al crear un Empleado Nuevo
export const crearUsuarioBaseEmpleado = async (empleadoData) => {
    const emailUsuario = empleadoData.correo || empleadoData.correoContacto;
    if (!emailUsuario) return null; 

    const usuarioRef = doc(db, coleccion, emailUsuario.toLowerCase()); 
    
    // VALIDACIÓN IMPORTANTE: Si ya existe, no lo sobreescribimos
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
        rol: ['EMPLEADO'], // ROL FIJO E INAMOVIBLE
        estado: 'ACTIVO', 
        plataforma: 'APP MÓVIL', 
        passwordChanged: false, 
        fechaRegistro: new Date(),
        fechaModificacion: new Date(),
        fotoUrl: empleadoData.fotoUrl || "" // Guardamos foto si la hay
    };

    await setDoc(usuarioRef, nuevoUsuario);
    return nuevoUsuario;
};

// Se llama desde CrearUsuario (Asignar Portal Web) o GestUsuarios (Cambiar Rol)
export const asignarRolWebYAuth = async (empleadoData, nuevoRolAdicional) => {
    const emailUsuario = (empleadoData.correo || empleadoData.id).toLowerCase();
    const usuarioRef = doc(db, coleccion, emailUsuario);
    
    const usernameGen = generarUsuarioTemp(empleadoData.nombres || empleadoData.nombre, empleadoData.apellidos || "", empleadoData.dni || empleadoData.id || ""); 
    const rolesFinales = nuevoRolAdicional === 'EMPLEADO' ? ['EMPLEADO'] : ['EMPLEADO', nuevoRolAdicional];

    // Traemos la data previa si existe para no borrar nada importante
    const docSnap = await getDoc(usuarioRef);
    const dataPrevia = docSnap.exists() ? docSnap.data() : {};

    // Inyectamos TODOS los campos necesarios por si se está creando desde 0 aquí
    await setDoc(usuarioRef, {
        uid: emailUsuario,
        empleadoId: dataPrevia.empleadoId || empleadoData.empleadoId || empleadoData.id || "",
        nombre: dataPrevia.nombre || empleadoData.nombre || `${empleadoData.nombres || ''} ${empleadoData.apellidos || ''}`.trim(),
        correo: emailUsuario,
        usuario: dataPrevia.usuario || usernameGen, // Respeta el autogenerado previo
        rol: rolesFinales,
        estado: dataPrevia.estado || 'ACTIVO', // Respeta si estaba inactivo
        plataforma: 'WEB Y MÓVIL', 
        passwordChanged: dataPrevia.passwordChanged !== undefined ? dataPrevia.passwordChanged : false,
        fechaRegistro: dataPrevia.fechaRegistro || new Date(),
        fechaModificacion: new Date(),
        fotoUrl: empleadoData.fotoUrl || dataPrevia.fotoUrl || "" 
    }, { merge: true }); 

    // 2. MAGIA: Crear en Firebase Auth usando una App Secundaria para NO desloguear al Admin
    try {
        const secondaryApp = initializeApp(app.options, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        
        // La contraseña temporal es el mismo "usuario" 
        const pwdTemp = dataPrevia.usuario || usernameGen;
        await createUserWithEmailAndPassword(secondaryAuth, emailUsuario, pwdTemp);
        await signOut(secondaryAuth); 
        
    } catch (error) {
        if (error.code !== 'auth/email-already-in-use') {
            console.error("Error en Auth:", error);
            throw error;
        }
    }
    
    return true;
};

export const actualizarUsuario = async (idUsuario, datosActualizados) => {
    try {
        const docRef = doc(db, coleccion, idUsuario);
        await updateDoc(docRef, { ...datosActualizados, fechaModificacion: new Date() });
        return true;
    } catch (error) {
        throw error;
    }
};