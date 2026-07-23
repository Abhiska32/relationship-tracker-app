import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { auth } from "./auth";

import { app } from "./config";

export const db = getFirestore(app);

const SETTINGS_PATH = "spaces/demo-space";
const SETTINGS_DOC = doc(db, "spaces", "demo-space");

export interface AppSettings {
  partnerName: string;
  startDate: string;
  partnerBirthday: string;
}

function logFirestoreRequest(operation: "read" | "write") {
  const currentUser = auth.currentUser;

  console.log(`[Firestore] settings ${operation}`, {
    projectId: app.options.projectId,
    path: SETTINGS_PATH,
    currentAuthenticatedUser: currentUser,
    uid: currentUser?.uid ?? null,
    email: currentUser?.email ?? null,
    authCurrentUserIsNull: currentUser === null,
  });

  if (!currentUser) {
    throw new Error(
      `Cannot ${operation} ${SETTINGS_PATH} before Firebase Auth has an authenticated user.`
    );
  }
}

export async function loadSettings(): Promise<AppSettings | null> {
  logFirestoreRequest("read");

  const snapshot = await getDoc(SETTINGS_DOC);

  console.log("[Firestore] settings read result", {
    projectId: app.options.projectId,
    path: SETTINGS_PATH,
    exists: snapshot.exists(),
  });

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as AppSettings;
}

export async function saveSettings(data: AppSettings) {
  logFirestoreRequest("write");

  await setDoc(SETTINGS_DOC, data, { merge: true });

  console.log("[Firestore] settings write complete", {
    projectId: app.options.projectId,
    path: SETTINGS_PATH,
  });
}
