import { db } from "../firebase/config";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Attribute, Term } from "../types";

// ================= ATTRIBUTES =================

const attributesRef = collection(db, "attributes");

export const getAttributes = async (): Promise<Attribute[]> => {
  const q = query(attributesRef, orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Attribute[];
};

export const addAttribute = async (
  data: Omit<Attribute, "id">
): Promise<string> => {
  const docRef = await addDoc(attributesRef, data);
  return docRef.id;
};

export const updateAttribute = async (
  id: string,
  data: Partial<Attribute>
): Promise<void> => {
  const docRef = doc(db, "attributes", id);
  await updateDoc(docRef, data);
};

export const deleteAttribute = async (id: string): Promise<void> => {
  const docRef = doc(db, "attributes", id);
  await deleteDoc(docRef);
};

// ================= TERMS =================

const termsRef = collection(db, "terms");

export const getTerms = async (attributeId: string): Promise<Term[]> => {
  const q = query(
    termsRef,
    where("attributeId", "==", attributeId)
  );
  const snapshot = await getDocs(q);
  const terms = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Term[];

  return terms.sort((a, b) => a.name.localeCompare(b.name));
};

export const addTerm = async (
  data: Omit<Term, "id" | "path">
): Promise<string> => {
  let path: string[] = [];

  if (data.parentId) {
    const parentDocRef = doc(db, "terms", data.parentId);
    const parentDoc = await getDoc(parentDocRef);
    if (parentDoc.exists()) {
      const parentData = parentDoc.data() as Term;
      // Path = Parent's path + Parent's ID
      path = [...(parentData.path || []), data.parentId];
    }
  }

  const docRef = await addDoc(termsRef, {
    ...data,
    path,
  });
  return docRef.id;
};

export const updateTerm = async (
  id: string,
  data: Partial<Term>
): Promise<void> => {
  const docRef = doc(db, "terms", id);
  await updateDoc(docRef, data);
};

export const deleteTerm = async (id: string): Promise<void> => {
  const docRef = doc(db, "terms", id);
  await deleteDoc(docRef);
};
