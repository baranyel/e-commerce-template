import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
Toast;

interface CategorySelectorProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

interface Category {
  id: string;
  name: string;
}

export default function CategorySelector({
  selectedCategory,
  onSelect,
}: CategorySelectorProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Yeni Ekleme Modu
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);

  // 1. Kategorileri Canlı Dinle
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      setCategories(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 2. Yeni Kategori Ekleme
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingLoading(true);

    try {
      // İsmi küçük harfe çevirip kaydedelim mi? Yoksa olduğu gibi mi?
      // Olduğu gibi kaydedelim (Case Sensitive)
      const docRef = await addDoc(collection(db, "categories"), {
        name: newCategoryName.trim(),
        createdAt: Date.now(),
      });

      // Eklendikten sonra otomatik seç
      onSelect(newCategoryName.trim());

      setIsAdding(false);
      setNewCategoryName("");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: "Kategori eklenemedi.",
      });
    } finally {
      setAddingLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="small" color="#78350f" />;

  return (
    <View className="mb-4">
      <Text className="text-gray-500 mb-2 font-bold">
        {t("admin.category")}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row mb-2"
      >
        {/* Mevcut Kategoriler */}
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.name)}
            className={`mr-2 px-4 py-2 rounded-full border ${
              selectedCategory === cat.name
                ? "bg-amber-900 border-amber-900"
                : "bg-white border-gray-200"
            }`}
          >
            <Text
              className={`font-bold ${
                selectedCategory === cat.name ? "text-white" : "text-gray-600"
              }`}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Ekleme Butonu (En sonda) */}
        {!isAdding && (
          <TouchableOpacity
            onPress={() => setIsAdding(true)}
            className="px-3 py-2 rounded-full bg-gray-100 border border-gray-200 flex-row items-center"
          >
            <Ionicons name="add" size={16} color="black" />
            <Text className="text-xs font-bold ml-1">{t("admin.add")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Yeni Kategori Input Alanı (Açılırsa) */}
      {isAdding && (
        <View className="flex-row items-center mt-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <TextInput
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder={t("admin.categoryName")}
            className="flex-1 mr-2 p-1"
            autoFocus
          />
          <TouchableOpacity
            onPress={handleAddCategory}
            disabled={addingLoading}
            className="bg-green-600 p-2 rounded-lg mr-2"
          >
            {addingLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="checkmark" size={18} color="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsAdding(false)}
            className="bg-gray-300 p-2 rounded-lg"
          >
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
