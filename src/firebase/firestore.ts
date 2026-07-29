import {
  collection,
  deleteDoc,
  getFirestore,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { auth } from "./auth";

import { app } from "./config";

export const db = getFirestore(app);

const SETTINGS_PATH = "spaces/demo-space";
const SETTINGS_DOC = doc(db, "spaces", "demo-space");
const MEMORIES_PATH = "spaces/demo-space/memories";
const MEMORIES_COLLECTION = collection(db, "spaces", "demo-space", "memories");
const JOURNEY_PATH = "spaces/demo-space/journey";
const JOURNEY_COLLECTION = collection(db, "spaces", "demo-space", "journey");
const CART_PATH = "spaces/demo-space/cart";
const CART_COLLECTION = collection(db, "spaces", "demo-space", "cart");

export interface AppSettings {
  partnerName: string;
  startDate: string;
  partnerBirthday: string;
}

export interface Memory {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
}

export interface JourneyItem {
  id: string;
  date: string;
  title: string;
  description: string;
  emoji: string;
}

export interface CartItem {
  id: string;
  imageUrl: string;
  name: string;
  category: string;
  description: string;
  urls: string[];
  createdAt: string;
}

function getCartCategory(category: unknown) {
  return typeof category === "string" && category.trim()
    ? category.trim()
    : "General";
}

function logFirestoreRequest(operation: string, path: string, label: string) {
  const currentUser = auth.currentUser;

  console.log(`[Firestore] ${label} ${operation}`, {
    projectId: app.options.projectId,
    path,
    currentAuthenticatedUser: currentUser,
    uid: currentUser?.uid ?? null,
    email: currentUser?.email ?? null,
    authCurrentUserIsNull: currentUser === null,
  });

  if (!currentUser) {
    throw new Error(
      `Cannot ${operation} ${path} before Firebase Auth has an authenticated user.`
    );
  }
}

export async function loadSettings(): Promise<AppSettings | null> {
  logFirestoreRequest("read", SETTINGS_PATH, "settings");

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
  logFirestoreRequest("write", SETTINGS_PATH, "settings");

  await setDoc(SETTINGS_DOC, data, { merge: true });

  console.log("[Firestore] settings write complete", {
    projectId: app.options.projectId,
    path: SETTINGS_PATH,
  });
}

export async function loadMemories(): Promise<Memory[]> {
  logFirestoreRequest("loading memories", MEMORIES_PATH, "memories");

  const snapshot = await getDocs(query(MEMORIES_COLLECTION, orderBy("date", "desc")));
  const memories = snapshot.docs.map((memoryDoc) => ({
    ...(memoryDoc.data() as Omit<Memory, "id">),
    id: memoryDoc.id,
  }));

  console.log("[Firestore] loaded memories", {
    projectId: app.options.projectId,
    path: MEMORIES_PATH,
    count: memories.length,
  });

  return memories;
}

export async function saveMemory(memory: Memory) {
  const path = `${MEMORIES_PATH}/${memory.id}`;

  logFirestoreRequest("saving memory", path, "memories");

  await setDoc(doc(MEMORIES_COLLECTION, memory.id), memory, { merge: true });

  console.log("[Firestore] saved memory", {
    projectId: app.options.projectId,
    path,
    id: memory.id,
  });
}

export async function deleteMemory(id: string) {
  const path = `${MEMORIES_PATH}/${id}`;

  logFirestoreRequest("deleting memory", path, "memories");

  await deleteDoc(doc(MEMORIES_COLLECTION, id));

  console.log("[Firestore] deleted memory", {
    projectId: app.options.projectId,
    path,
    id,
  });
}

export async function loadJourney(): Promise<JourneyItem[]> {
  logFirestoreRequest("loading journey", JOURNEY_PATH, "journey");

  const snapshot = await getDocs(query(JOURNEY_COLLECTION, orderBy("date", "asc")));
  const journey = snapshot.docs.map((journeyDoc) => ({
    ...(journeyDoc.data() as Omit<JourneyItem, "id">),
    id: journeyDoc.id,
  }));

  console.log("[Firestore] loaded journey", {
    projectId: app.options.projectId,
    path: JOURNEY_PATH,
    count: journey.length,
  });

  return journey;
}

export async function saveMilestone(milestone: JourneyItem) {
  const path = `${JOURNEY_PATH}/${milestone.id}`;

  logFirestoreRequest("saving milestone", path, "journey");

  await setDoc(doc(JOURNEY_COLLECTION, milestone.id), milestone, { merge: true });

  console.log("[Firestore] saved milestone", {
    projectId: app.options.projectId,
    path,
    id: milestone.id,
  });
}

export async function deleteMilestone(id: string) {
  const path = `${JOURNEY_PATH}/${id}`;

  logFirestoreRequest("deleting milestone", path, "journey");

  await deleteDoc(doc(JOURNEY_COLLECTION, id));

  console.log("[Firestore] deleted milestone", {
    projectId: app.options.projectId,
    path,
    id,
  });
}

export async function loadCartItems(): Promise<CartItem[]> {
  logFirestoreRequest("loading cart", CART_PATH, "cart");

  const snapshot = await getDocs(query(CART_COLLECTION, orderBy("createdAt", "desc")));
  const cartItems = snapshot.docs.map((cartDoc) => {
    const data = cartDoc.data() as Omit<CartItem, "id">;

    return {
      ...data,
      id: cartDoc.id,
      category: getCartCategory(data.category),
      urls: Array.isArray(data.urls) ? data.urls : [],
    };
  });

  console.log("[Firestore] loaded cart", {
    projectId: app.options.projectId,
    path: CART_PATH,
    count: cartItems.length,
  });

  return cartItems;
}

export async function saveCartItem(item: CartItem) {
  const path = `${CART_PATH}/${item.id}`;

  logFirestoreRequest("saving cart item", path, "cart");

  await setDoc(doc(CART_COLLECTION, item.id), item, { merge: true });

  console.log("[Firestore] saved cart item", {
    projectId: app.options.projectId,
    path,
    id: item.id,
  });
}

export async function deleteCartItem(id: string) {
  const path = `${CART_PATH}/${id}`;

  logFirestoreRequest("deleting cart item", path, "cart");

  await deleteDoc(doc(CART_COLLECTION, id));

  console.log("[Firestore] deleted cart item", {
    projectId: app.options.projectId,
    path,
    id,
  });
}
