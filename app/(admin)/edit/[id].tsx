import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import CategorySelector from "../../../components/CategorySelector"; // Yol ../../../ olabilir dikkat
import { Product } from "../../../types";
import Toast from "react-native-toast-message";

export default function EditProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State'leri
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    description: "",
    imageUrl: "", // Şimdilik URL olarak alacağız (Resim yükleme ayrıca Storage gerektirir)
    stock: "",
  });

  // Mevcut Veriyi Çek
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Product;
          setForm({
            title: data.title,
            price: data.price.toString(),
            category: data.category,
            description: data.description,
            imageUrl: data.images[0] || "",
            stock: data.stock.toString(),
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Hata",
            text2: "Ürün bulunamadı!",
            visibilityTime: 2000,
          });
          router.back();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleUpdate = async () => {
    if (!form.title || !form.price) {
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: "Başlık ve Fiyat zorunludur.",
        visibilityTime: 2000,
      });
      return;
    }
    setSubmitting(true);

    try {
      const docRef = doc(db, "products", id as string);
      await updateDoc(docRef, {
        title: form.title,
        price: parseFloat(form.price),
        category: form.category,
        description: form.description,
        stock: parseInt(form.stock) || 0,
        images: [form.imageUrl], // Tek resim URL'si güncelliyoruz
      });

      Toast.show({
        type: "success",
        text1: "Başarılı! 🎉",
        text2: "Ürün güncellendi.",
        visibilityTime: 2000, // 2 saniye ekranda kalsın
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Başarısız! ❌",
        text2: "Ürün güncellenirken bir sorun oluştu.",
        visibilityTime: 2000, // 2 saniye ekranda kalsın
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <ActivityIndicator size="large" className="mt-10" color="#78350f" />;

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-gray-500 mb-2 font-bold">Ürün Adı</Text>
      <TextInput
        value={form.title}
        onChangeText={(text) => setForm({ ...form, title: text })}
        className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4"
      />

      <View className="flex-row justify-between space-x-4">
        <View className="flex-1">
          <Text className="text-gray-500 mb-2 font-bold">Fiyat (TL)</Text>
          <TextInput
            value={form.price}
            onChangeText={(text) => setForm({ ...form, price: text })}
            keyboardType="numeric"
            className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4"
          />
        </View>
        <View className="flex-1">
          <Text className="text-gray-500 mb-2 font-bold">Stok</Text>
          <TextInput
            value={form.stock}
            onChangeText={(text) => setForm({ ...form, stock: text })}
            keyboardType="numeric"
            className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4"
          />
        </View>
      </View>

      <CategorySelector
        selectedCategory={form.category}
        onSelect={(category) => setForm({ ...form, category })}
      />

      <Text className="text-gray-500 mb-2 font-bold">Resim URL</Text>
      <TextInput
        value={form.imageUrl}
        onChangeText={(text) => setForm({ ...form, imageUrl: text })}
        className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4 text-xs"
        placeholder="https://..."
      />

      <Text className="text-gray-500 mb-2 font-bold">Açıklama</Text>
      <TextInput
        value={form.description}
        onChangeText={(text) => setForm({ ...form, description: text })}
        multiline
        numberOfLines={4}
        className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6 h-24"
        textAlignVertical="top"
      />

      <TouchableOpacity
        onPress={handleUpdate}
        disabled={submitting}
        className="bg-amber-900 p-4 rounded-xl items-center mb-10"
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-lg">
            Değişiklikleri Kaydet
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
