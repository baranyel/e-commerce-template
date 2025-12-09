import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Storage fonksiyonları
import { db, storage } from "../../firebase/config";
import * as ImagePicker from "expo-image-picker"; // Resim seçici
import { Ionicons } from "@expo/vector-icons";

export default function AddProductScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // Resim yükleniyor mu?

  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "coffee",
    description: "",
    imageUrl: "",
    stock: "10",
  });

  // 1. Galeriden Resim Seçme Fonksiyonu
  const pickImage = async () => {
    // İzin iste
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Sadece resimler
      allowsEditing: true, // Kırpma izni ver
      aspect: [4, 3], // 4:3 oranında kırp
      quality: 0.8, // Kalite %80 olsun (çok yer kaplamasın)
    });

    if (!result.canceled) {
      // Seçilen resmi yükle
      await uploadImage(result.assets[0].uri);
    }
  };

  // 2. Firebase Storage'a Yükleme Fonksiyonu (Blob İşlemi)
  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      // Resmi "Blob" formatına çevir (Telefondaki dosyayı veriye çevirme)
      const response = await fetch(uri);
      const blob = await response.blob();

      // Dosya ismi oluştur (benzersiz olsun diye tarih ekliyoruz)
      const filename = `products/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      // Yükle
      await uploadBytes(storageRef, blob);

      // Yüklenen resmin linkini al
      const downloadURL = await getDownloadURL(storageRef);

      // Formu güncelle
      setForm({ ...form, imageUrl: downloadURL });
      console.log("Resim yüklendi:", downloadURL);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Hata", "Resim yüklenirken bir sorun oluştu.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.price)
      return Alert.alert("Hata", "Başlık ve Fiyat zorunlu.");
    if (!form.imageUrl)
      return Alert.alert("Hata", "Lütfen bir resim yükleyin veya link girin.");

    setSubmitting(true);
    try {
      await addDoc(collection(db, "products"), {
        title: form.title,
        price: parseFloat(form.price),
        currency: "TRY",
        category: form.category,
        description: form.description,
        stock: parseInt(form.stock) || 0,
        images: [form.imageUrl],
        isFeatured: false,
        createdAt: Date.now(),
      });

      Alert.alert("Harika", "Ürün başarıyla eklendi!", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Hata", "Ürün eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-gray-500 mb-2 font-bold">Ürün Adı</Text>
      <TextInput
        onChangeText={(text) => setForm({ ...form, title: text })}
        className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4"
        placeholder="Örn: Kenya AA"
      />

      <View className="flex-row space-x-4">
        <View className="flex-1">
          <Text className="text-gray-500 mb-2 font-bold">Fiyat</Text>
          <TextInput
            onChangeText={(text) => setForm({ ...form, price: text })}
            keyboardType="numeric"
            className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4"
            placeholder="350"
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

      <Text className="text-gray-500 mb-2 font-bold">Kategori</Text>
      <TextInput
        value={form.category}
        onChangeText={(text) => setForm({ ...form, category: text })}
        className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4"
        placeholder="coffee veya equipment"
      />

      {/* --- RESİM YÜKLEME ALANI (GÜNCELLENDİ) --- */}
      <Text className="text-gray-500 mb-2 font-bold">Ürün Görseli</Text>

      <View className="flex-row items-center space-x-2 mb-2">
        {/* Buton */}
        <TouchableOpacity
          onPress={pickImage}
          disabled={uploadingImage}
          className="bg-amber-100 px-4 py-3 rounded-xl flex-row items-center"
        >
          {uploadingImage ? (
            <ActivityIndicator color="#78350f" />
          ) : (
            <Ionicons name="camera" size={20} color="#78350f" />
          )}
          <Text className="text-amber-900 font-bold ml-2">
            {uploadingImage ? "Yükleniyor..." : "Resim Seç"}
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-400 text-xs">veya</Text>

        {/* Manuel URL Girişi (Yedek) */}
        <TextInput
          value={form.imageUrl}
          onChangeText={(text) => setForm({ ...form, imageUrl: text })}
          className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs"
          placeholder="https://..."
        />
      </View>

      {/* Önizleme */}
      {form.imageUrl ? (
        <View className="mb-4 relative">
          <Image
            source={{ uri: form.imageUrl }}
            className="w-full h-48 rounded-xl bg-gray-100 object-cover"
          />
          <TouchableOpacity
            onPress={() => setForm({ ...form, imageUrl: "" })}
            className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
      ) : null}

      <Text className="text-gray-500 mb-2 font-bold">Açıklama</Text>
      <TextInput
        onChangeText={(text) => setForm({ ...form, description: text })}
        multiline
        numberOfLines={3}
        className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6 h-24"
      />

      <TouchableOpacity
        onPress={handleCreate}
        disabled={submitting || uploadingImage} // Resim yüklenirken basamasın
        className={`p-4 rounded-xl items-center mb-10 ${
          submitting || uploadingImage ? "bg-gray-400" : "bg-green-700"
        }`}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-lg">Ürünü Yayınla</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
