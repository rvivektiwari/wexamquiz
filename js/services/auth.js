import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from "../config/firebase-config.js";

export const AuthService = {
    loginWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            throw error;
        }
    },

    loginWithEmail: async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            throw error;
        }
    },

    registerWithEmail: async (email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            throw error;
        }
    },

    resetPassword: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            throw error;
        }
    },

    observeAuth: (callback) => {
        onAuthStateChanged(auth, callback);
    },

    updateUserProfile: async (user, { displayName, photoURL }) => {
        try {
            await updateProfile(user, { displayName, photoURL });
            return user;
        } catch (error) {
            throw error;
        }
    },

    reauthenticate: async (user, password) => {
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
        } catch (error) {
            throw error;
        }
    },

    updateUserPassword: async (user, newPassword) => {
        try {
            await updatePassword(user, newPassword);
        } catch (error) {
            throw error;
        }
    }
};
