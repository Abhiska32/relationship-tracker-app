import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import { app } from "./config";

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  await signInWithPopup(auth, provider);
}

export async function signOutUser() {
  await signOut(auth);
}