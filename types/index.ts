export type UserRole = "admin" | "customer";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: number;
  phone?: string;
  addressTitle?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string; // TRY, USD
  images: string[]; // Resim URL'leri
  category: string; // Kahve, Ekipman vs.
  stock: number;
  isFeatured: boolean; // Ana sayfada öne çıkan ürün mü?
  createdAt: number;
}

export interface CartItem extends Product {
  quantity: number;
}
