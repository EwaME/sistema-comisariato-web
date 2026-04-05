import { doc, getDoc, updateDoc, collection, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { registrarAuditoria } from "./auditoriasService";

const CONFIG_DOC = () => doc(db, "configuraciones", "config_global");

export const obtenerConfiguracion = async () => {
    const snap = await getDoc(CONFIG_DOC());
    if (snap.exists()) return snap.data();
    throw new Error("No se encontró la configuración global.");
};

export const actualizarConfiguracion = async (datos) => {
    await updateDoc(CONFIG_DOC(), datos);
    
    await registrarAuditoria(
        "EDICIÓN", 
        "Configuración Global", 
        "Se actualizaron los parámetros generales del sistema", 
        "config_global"
    );

    return true;
};

export const obtenerPlazos = async () => {
    const colRef = collection(db, "configuraciones", "config_global", "plazos");
    const snap = await getDocs(colRef);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.plazoMeses - b.plazoMeses);
};

export const agregarPlazo = async (plazoMeses) => {
    const colRef = collection(db, "configuraciones", "config_global", "plazos");
    const snap = await getDocs(colRef);
    
    // CORRECCIÓN: Encontrar el número más alto en lugar de usar length
    let maxNum = 0;
    snap.docs.forEach(d => {
        const parts = d.id.split('-');
        if (parts.length === 2 && !isNaN(parts[1])) {
            maxNum = Math.max(maxNum, parseInt(parts[1], 10));
        }
    });

    const numero = maxNum + 1;
    const plazoId = `PLZ-${String(numero).padStart(2, '0')}`;
    const docRef = doc(db, "configuraciones", "config_global", "plazos", plazoId);
    
    await setDoc(docRef, { plazoId, plazoMeses, fechaCreacion: new Date() });
    
    await registrarAuditoria(
        "CREACIÓN", 
        "Configuración - Plazos", 
        `Se agregó un nuevo plazo de crédito: ${plazoMeses} meses`, 
        plazoId
    );

    return { id: plazoId, plazoId, plazoMeses };
};

export const eliminarPlazo = async (plazoId) => {
    const docRef = doc(db, "configuraciones", "config_global", "plazos", plazoId);
    await deleteDoc(docRef);

    await registrarAuditoria(
        "ELIMINACIÓN", 
        "Configuración - Plazos", 
        `Se eliminó un plazo de crédito del sistema`, 
        plazoId
    );
};

export const obtenerGarantias = async () => {
    const colRef = collection(db, "configuraciones", "config_global", "garantias");
    const snap = await getDocs(colRef);
    return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
            const valA = a.diasCobertura || (a.mesesCobertura * 30);
            const valB = b.diasCobertura || (b.mesesCobertura * 30);
            return valA - valB;
        });
};

export const agregarGarantia = async (datos) => {
    const colRef = collection(db, "configuraciones", "config_global", "garantias");
    const snap = await getDocs(colRef);
    
    // CORRECCIÓN: Igual que con los plazos, evitar bugs al borrar
    let maxNum = 0;
    snap.docs.forEach(d => {
        const parts = d.id.split('-');
        if (parts.length === 2 && !isNaN(parts[1])) {
            maxNum = Math.max(maxNum, parseInt(parts[1], 10));
        }
    });

    const numero = maxNum + 1;
    const garantiaId = `GAR-${String(numero).padStart(2, '0')}`;
    const docRef = doc(db, "configuraciones", "config_global", "garantias", garantiaId);
    
    await setDoc(docRef, { garantiaId, ...datos });

    await registrarAuditoria(
        "CREACIÓN", 
        "Configuración - Garantías", 
        `Se agregó una nueva política de garantía al sistema`, 
        garantiaId
    );

    return { id: garantiaId, garantiaId, ...datos };
};

export const eliminarGarantia = async (garantiaId) => {
    const docRef = doc(db, "configuraciones", "config_global", "garantias", garantiaId);
    await deleteDoc(docRef);

    await registrarAuditoria(
        "ELIMINACIÓN", 
        "Configuración - Garantías", 
        `Se eliminó una política de garantía del sistema`, 
        garantiaId
    );
};