import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Product } from "../../types";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

export default function ProductsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter((p) => p.title.toLowerCase().includes(lower))
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const toggleStatus = async (id: string, currentStatus: boolean | undefined) => {
    const newStatus = !currentStatus; // undefined defaults to false here if toggled (but undefined usually means active for old products)
    // Actually, better logic: if undefined, treat as true. So new status is false.
    // If true, new status is false. If false, new status is true.
    
    // Let's rely on the boolean flip, handling undefined as true for initial display but saving explicit boolean.
    // However, the function receives the raw value.
    const effectiveStatus = currentStatus === undefined ? true : currentStatus;
    
    try {
      await updateDoc(doc(db, "products", id), {
        isActive: !effectiveStatus,
      });
      Toast.show({
        type: "success",
        text1: t("common.success"),
        text2: t("admin.adminProducts.statusUpdated"),
      });
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: t("common.error") });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t("adminDashboard.deleteTitle") || "Delete Product",
      t("adminDashboard.deleteMsg") || "Are you sure you want to delete this product?",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        {
          text: t("common.delete") || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "products", id));
              Toast.show({
                 type: "success",
                 text1: t("common.success") || "Success",
                 text2: t("common.deleted") || "Product deleted"
              });
            } catch (error) {
              console.error(error);
              Toast.show({ type: "error", text1: t("common.error") });
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const isActive = item.isActive === undefined ? true : item.isActive;

    return (
      <View className="flex-row items-center bg-white p-3 mb-2 rounded-xl shadow-sm border border-gray-100">
        <Image
          source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
          className="w-16 h-16 rounded-lg bg-gray-100"
        />
        <View className="flex-1 ml-3">
          <Text className="text-gray-800 font-bold text-sm" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-amber-700 font-bold text-xs mt-0.5">
            {item.price} {item.currency}
          </Text>
          <View className="flex-row items-center mt-1">
             <View className={`w-2 h-2 rounded-full mr-1 ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
             <Text className="text-xs text-gray-400">
                {isActive ? t('admin.adminProducts.active') : t('admin.adminProducts.inactive')}
             </Text>
          </View>
        </View>

        <View className="items-end gap-2">
            <Switch
                trackColor={{ false: "#767577", true: "#d97706" }} // Amber-600
                thumbColor={isActive ? "#f59e0b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => toggleStatus(item.id, item.isActive)}
                value={isActive}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
            <View className="flex-row gap-3">
                  <TouchableOpacity onPress={() => router.push(`/(admin)/edit/${item.id}`)}>
                    <Ionicons name="create-outline" size={20} color="#4b5563" />
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                 </TouchableOpacity>
            </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
      {/* Search & Content - Header Removed */}
      <View className="flex-1 px-4 pt-4">
        {/* Search */}
        <View className="bg-white rounded-xl px-3 py-3 mb-4 flex-row items-center shadow-sm border border-gray-100">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder={t("admin.adminProducts.search") || "Search products..."}
            className="flex-1 ml-2 text-gray-800"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
            <ActivityIndicator size="large" color="#d97706" className="mt-10" />
        ) : (
            <FlatList
                data={filteredProducts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text className="text-center text-gray-400 mt-10">{t('admin.adminProducts.empty')}</Text>
                }
            />
        )}
      </View>
    </SafeAreaView>
  );
}
