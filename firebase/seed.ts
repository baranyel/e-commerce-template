import {
  collection,
  addDoc,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "./config";
import { Product } from "../types";

const DUMMY_PRODUCTS: Omit<Product, "id">[] = [
  {
    title: "Etiyopya Yirgacheffe",
    description:
      "Çiçeksi notalar ve hafif asidite ile ferahlatıcı bir deneyim.",
    price: 350,
    currency: "TRY",
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop",
    ],
    category: "coffee",
    stock: 50,
    isFeatured: true,
    createdAt: Date.now(),
  },
  {
    title: "Kolombiya Supremo",
    description:
      "Yoğun gövde, karamel ve fındık notalarıyla klasik bir lezzet.",
    price: 320,
    currency: "TRY",
    images: [
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1000&auto=format&fit=crop",
    ],
    category: "coffee",
    stock: 40,
    isFeatured: true,
    createdAt: Date.now(),
  },
  {
    title: "V60 Dripper Seramik",
    description: "Profesyonel demleme için seramik V60 dripper.",
    price: 450,
    currency: "TRY",
    images: [
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=1000&auto=format&fit=crop",
    ],
    category: "equipment",
    stock: 15,
    isFeatured: false,
    createdAt: Date.now(),
  },
  {
    title: "Guatemala Antigua",
    description: "Baharatlı ve dumanlı notalar, volkanik toprakların hediyesi.",
    price: 380,
    currency: "TRY",
    images: [
      "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=1000&auto=format&fit=crop",
    ],
    category: "coffee",
    stock: 25,
    isFeatured: false,
    createdAt: Date.now(),
  },
];

export const seedDatabase = async () => {
  try {
    // Önce mevcut ürünleri kontrol et (tekrar tekrar eklemeyelim)
    const querySnapshot = await getDocs(collection(db, "products"));
    if (!querySnapshot.empty) {
      console.log("Veritabanı zaten dolu, ekleme yapılmadı.");
      return;
    }

    // Batch işlemi ile toplu ekleme
    const batch = writeBatch(db);

    DUMMY_PRODUCTS.forEach((product) => {
      const newDocRef = doc(collection(db, "products"));
      batch.set(newDocRef, { ...product, id: newDocRef.id });
    });

    await batch.commit();
    console.log("✅ Sahte ürünler başarıyla yüklendi!");
    alert("Ürünler yüklendi! Sayfayı yenileyin.");
  } catch (error) {
    console.error("Veri yüklenirken hata:", error);
    alert("Veri yükleme hatası!");
  }
};
