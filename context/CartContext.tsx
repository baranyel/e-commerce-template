import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, CartItem } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext"; // Auth bilgisini almamız lazım
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import Toast from "react-native-toast-message";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalPrice: number;
  totalItems: number;
  isCartOpen: boolean;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth(); // Kullanıcı giriş yapmış mı?
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. DİNLEYİCİ: Kullanıcı değiştiğinde veya Sepet güncellendiğinde çalışır
  useEffect(() => {
    let unsubscribe: () => void;

    const syncCart = async () => {
      if (user) {
        // --- SENARYO A: Kullanıcı Giriş Yapmış (FIREBASE) ---
        const cartRef = doc(db, "carts", user.uid);

        // Firestore'u canlı dinle (Web/Mobil Eşitlemesi burada oluyor)
        unsubscribe = onSnapshot(cartRef, (docSnap) => {
          if (docSnap.exists()) {
            setCart(docSnap.data().items as CartItem[]);
          } else {
            setCart([]); // Sepet dökümanı yoksa boştur
          }
        });
      } else {
        // --- SENARYO B: Misafir Kullanıcı (LOCAL STORAGE) ---
        const savedCart = await AsyncStorage.getItem("cart");
        if (savedCart) setCart(JSON.parse(savedCart));
      }
      setLoading(false);
    };

    syncCart();

    // Temizlik: Kullanıcı değişirse eski dinleyiciyi kapat
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Yardımcı Fonksiyon: Veriyi duruma göre kaydet (Firebase veya Local)
  const saveCart = async (newCart: CartItem[]) => {
    if (user) {
      // Firebase'e yaz
      const cartRef = doc(db, "carts", user.uid);
      await setDoc(cartRef, { items: newCart }, { merge: true });
    } else {
      // Locale yaz (ve State'i manuel güncelle)
      setCart(newCart);
      await AsyncStorage.setItem("cart", JSON.stringify(newCart));
    }
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addToCart = async (product: Product) => {
    // Stok Kontrolü
    if (product.stock <= 0) {
      Toast.show({ type: "error", text1: "Hata", text2: "Stok tükenmiş." });
      return;
    }

    // Yeni sepeti hesapla
    let newCart = [...cart];
    const existingItemIndex = newCart.findIndex(
      (item) => item.id === product.id
    );

    if (existingItemIndex > -1) {
      // Ürün zaten var
      const existingItem = newCart[existingItemIndex];

      if (existingItem.quantity + 1 > product.stock) {
        Toast.show({
          type: "error",
          text1: "Stok Sınırı",
          text2: `En fazla ${product.stock} adet alabilirsiniz.`,
        });
        // Sepeti yine de açalım ki görsün
        setIsCartOpen(true);
        return;
      }

      newCart[existingItemIndex].quantity += 1;
    } else {
      // Yeni ürün
      newCart.push({ ...product, quantity: 1 });
    }

    // Kaydet ve Sepeti Aç
    await saveCart(newCart);
    setIsCartOpen(true); // <-- Sepet açılmama sorununun kesin çözümü

    Toast.show({
      type: "success",
      text1: "Sepete Eklendi",
      text2: `${product.title} eklendi.`,
      visibilityTime: 1500,
    });
  };

  const removeFromCart = async (productId: string) => {
    const newCart = cart.filter((item) => item.id !== productId);
    await saveCart(newCart);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    // Stok kontrolü için o anki ürünü bul
    const currentItem = cart.find((item) => item.id === productId);

    // Stok kontrolü (Sadece artırırken)
    if (currentItem && quantity > currentItem.quantity) {
      if (quantity > currentItem.stock) {
        Toast.show({
          type: "error",
          text1: "Stok Yetersiz",
          text2: "Maksimum stoğa ulaşıldı.",
        });
        return;
      }
    }

    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }

    const newCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    );
    await saveCart(newCart);
  };

  const clearCart = async () => {
    await saveCart([]);
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
        isCartOpen,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
