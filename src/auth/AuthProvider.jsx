import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); 
    const [loading, setLoading] = useState(true);

    const getUserDataFromFirestore = async (email) => {
        try {
            const docRef = doc(db, "usuarios", email.toLowerCase());
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data(); 
            }
            return null;
        } catch (error) {
            console.error("Error obteniendo datos:", error);
            return null;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                const dbUser = await getUserDataFromFirestore(currentUser.email);
                
                if(dbUser) {
                    setRole(dbUser.rol || "Usuario");
                    setUser({ ...currentUser, name: dbUser.nombre || currentUser.email });
                } else {
                    setRole("Usuario");
                    setUser({ ...currentUser, name: currentUser.email });
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, role, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);