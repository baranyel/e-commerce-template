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

export interface Attribute {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'range';
  isHierarchical: boolean;
  isActive: boolean;
}

export interface Term {
  id: string;
  attributeId: string;
  name: string;
  parentId: string | null;
  path: string[]; // Ancestor IDs for easy querying
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string; // TRY, USD
  images: string[]; // Resim URL'leri
  category: string; // Kahve, Ekipman vs.
  attributes?: Record<string, string>; // { attributeId: termId }
  stock: number;
  isFeatured: boolean; // Ana sayfada öne çıkan ürün mü?
  isActive?: boolean;   // Ürün yayında mı?
  createdAt: number;
}

export interface CartItem extends Product {
  quantity: number;
}
