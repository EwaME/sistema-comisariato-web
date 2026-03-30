// Archivo de inicialización de Firebase
// Se utiliza para conectar la app React con los servicios de Firebase

// Importa la funcion principal para inicializar Firebase
import { initializeApp } from "firebase/app";
// Importa el servicio de autenticacion
import { getAuth } from "firebase/auth";
// Importa el servicio de Firestore
import { getFirestore } from "firebase/firestore";

/* Configuración de Firebase
    Debes reemplazar estos valores con los de tu proyecto de Firebase
    Puedes obtenerlos en la consola de Firebase, desde descripcion general, en general
    Primero el mío
*/
const firebaseConfig = {
    apiKey: "AIzaSyC6-R06FdoD1pTsyZkkHQAa-DVEfQVjlyY",
    authDomain: "comisariato-unicah-2026.firebaseapp.com",
    projectId: "comisariato-unicah-2026",
    storageBucket: "comisariato-unicah-2026.firebasestorage.app",
    messagingSenderId: "1034222970379",
    appId: "1:1034222970379:web:fa8a85b5aa805333b6890e"
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);

// Inicializa el servicio de autenticacion 
export const auth = getAuth(app);
// Inicializa el servicio de Firestore
export const db = getFirestore(app);

// App secundaria SOLO para crear usuarios sin cerrar sesión del admin
const appSecundaria = initializeApp(firebaseConfig, "appSecundaria");
export const authSecundaria = getAuth(appSecundaria);