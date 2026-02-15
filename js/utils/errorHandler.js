export const ErrorHandler = {
    handle: (error) => {
        console.error("ErrorHandler Caught:", error);

        let message = "An unexpected error occurred. Please try again.";
        const code = error.code;

        // Firebase Auth Errors
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            message = "Incorrect email or password.";
        } else if (code === 'auth/email-already-in-use') {
            message = "This email is already registered. Try logging in.";
        } else if (code === 'auth/weak-password') {
            message = "Password should be at least 6 characters.";
        } else if (code === 'auth/invalid-email') {
            message = "Please enter a valid email address.";
        } else if (code === 'auth/network-request-failed') {
            message = "Network error. Please check your internet connection.";
        } else if (code === 'auth/popup-closed-by-user') {
            message = "Sign-in cancelled.";
        } else if (code === 'auth/too-many-requests') {
            message = "Too many failed attempts. Please try again later.";
        } else if (code === 'auth/unauthorized-domain') {
            message = "Domain not authorized. Check Firebase Console settings.";
        }

        return message;
    }
};
