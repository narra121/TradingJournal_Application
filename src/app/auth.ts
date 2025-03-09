//  @/app/auth.ts  (This is a simplified example, adapt to your Firebase setup)

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, // Rename to avoid conflict
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  User,
  UserCredential,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
} from "firebase/auth";
import { FirebaseError, initializeApp } from "firebase/app";
import { app } from "./firebase";

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, provider);
    // The signed-in user info.
    return result.user;
  } catch (error: any) {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData?.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);

    console.error(
      "Google Sign-In Error:",
      errorCode,
      errorMessage,
      email,
      credential
    );
    throw error; // Re-throw the error to be handled by the caller.
  }
};
export const sendEmailVerification = async (user: User): Promise<void> => {
  try {
    await firebaseSendEmailVerification(user);
  } catch (error) {
    console.error("Email Verification Error", error);
    throw error;
  }
};

export const signInWithEmailPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await firebaseSignInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential;
  } catch (error) {
    console.error("Email/Password Sign-In Error", error);
    throw error; // Important: Re-throw to be caught in the component
  }
};

export const registerWithEmailPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential;
  } catch (error) {
    console.error("Email/Password Registration Error", error);
    throw error;
  }
};

export const linkGoogleAccount = async (user: User): Promise<User> => {
  try {
    const credential = GoogleAuthProvider.credentialFromError({
      code: "auth/trigger-google-sign-in",
      message: "Trigger Google Sign-In",
    } as FirebaseError); // This will trigger a Google Sign-In
    if (!credential) throw new Error("Google credential is null");
    const result = await linkWithCredential(user, credential);
    return result.user;
  } catch (linkError: any) {
    if (linkError.code === "auth/popup-closed-by-user") {
      // User closed the popup, don't treat as a fatal error
      console.log("Google popup closed by user.");
      throw linkError;
    } else if (linkError.code === "auth/credential-already-in-use") {
      // Handle account already linked to other
      throw linkError;
    } else {
      console.error("Error linking Google account:", linkError);
      throw linkError; // Re-throw other errors
    }
  }
};

export const linkEmailAccount = async (
  user: User,
  email: string,
  password: string
): Promise<User> => {
  try {
    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(user, credential);
    return result.user;
  } catch (error: any) {
    if (error.code === "auth/credential-already-in-use") {
      // Handle account already linked to other
      throw error;
    } else {
      console.error("Error linking Email account:", error);
      throw error; // Re-throw other errors
    }
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign-Out Error", error);
    throw error;
  }
};
