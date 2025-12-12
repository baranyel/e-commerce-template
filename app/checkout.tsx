import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next"; // i18n
import { UserProfile } from "../types";
import Toast from "react-native-toast-message";
import AddressSelector from "../components/AddressSelector";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

export default function CheckoutScreen() {
  const router = useRouter();
  const { t } = useTranslation(); // Çeviri kancası
  const { cart, totalPrice, clearCart } = useCart();
  const { user, userProfile } = useAuth(); // Profil verisini çekiyoruz

  const [loading, setLoading] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false); // Sözleşme onayı
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true); // Adresi kaydetme isteği

  const colorScheme = useColorScheme();

  // Renk Ayarları
  // Dış taraf (Boşluklar): Açık modda Gri (#F3F4F6), Koyu modda Tam Siyah
  const outerBackgroundColor = colorScheme === "dark" ? "#000000" : "#f5f5f5";

  // İç taraf (İçerik): Açık modda Beyaz, Koyu modda Koyu Gri/Siyah
  const innerBackgroundColor = Colors[colorScheme ?? "light"].background;

  // Form State
  const [form, setForm] = useState({
    title: "",
    city: "",
    district: "",
    fullAddress: "",
    phone: "",
  });

  // 1. Sayfa Açılınca Profilden Adresi Doldur (Auto-Fill)
  useEffect(() => {
    if (userProfile) {
      setForm({
        title: userProfile.addressTitle || "",
        city: userProfile.city || "",
        district: userProfile.district || "",
        fullAddress: userProfile.fullAddress || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  const handleOrder = async () => {
    // 1. Validasyonlar (Aynen kalsın)
    if (!form.fullAddress || !form.city || !form.phone) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("checkout.fillAll"),
      });
      return;
    }

    if (!kvkkAccepted) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("checkout.acceptKvkk"),
      });
      return;
    }

    setLoading(true);

    try {
      // 2. Profil Güncelleme (Aynen kalsın)
      if (saveAddressToProfile && user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          addressTitle: form.title,
          city: form.city,
          district: form.district,
          fullAddress: form.fullAddress,
          phone: form.phone,
        } as Partial<UserProfile>);
      }

      // --- SİPARİŞ OLUŞTURMA (BATCH) ---
      const batch = writeBatch(db);

      const orderNumber = Math.floor(
        100000000 + Math.random() * 900000000
      ).toString();

      // Doküman referansını önceden alıyoruz ki ID elimizde olsun
      const newOrderRef = doc(collection(db, "orders"));

      const orderData = {
        id: newOrderRef.id,
        userId: user?.uid || "guest",
        userEmail: user?.email || "guest",
        items: cart,
        totalAmount: totalPrice,
        currency: "TRY",
        status: "Sipariş Alındı", // Kullanıcıya güzel görünsün diye Türkçeleştirdim
        address: form,
        createdAt: Date.now(),
        orderNumber: orderNumber,
      };

      batch.set(newOrderRef, orderData);

      // Stok düşme işlemleri
      cart.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        batch.update(productRef, {
          stock: increment(-item.quantity),
        });
      });

      // İşlemi tamamla (Firebase'e yaz)
      await batch.commit();

      // --- KRİTİK KISIM BAŞLIYOR ---

      // 1. Önce sepeti temizle
      await clearCart();

      // 2. Kullanıcıya bildirimi çak (Toast Layout'ta olduğu için sayfa değişse de görünür)
      Toast.show({
        type: "success",
        text1: "Siparişiniz Onaylandı! 🚀",
        text2: `Sipariş No: #${orderNumber}`,
        visibilityTime: 4000, // Biraz uzun kalsın okusunlar
      });

      // 3. VE GOOOOL: Direkt detay sayfasına ışınla
      // replace kullanıyoruz ki "Geri" tuşu Checkout'a değil Anasayfaya/Profile dönsün.
      router.replace(`/order-details/${newOrderRef.id}` as any);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("checkout.orderFailed"),
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500 mb-4">Sepetiniz boş.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-amber-900 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: outerBackgroundColor }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1200,
          alignSelf: "center",
          // Web'de kenarlarda gölge olsun istersen bunu açabilirsin:
          // shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
        }}
      >
        {" "}
        <SafeAreaView className="flex-1 bg-gray-50">
          {/* Header */}
          <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-gray-100">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">
              {t("checkout.title")}
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {/* Adres Formu */}
              <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="location-outline" size={20} color="#78350f" />
                  <Text className="font-bold text-gray-800 ml-2 text-lg">
                    {t("checkout.deliveryAddress")}
                  </Text>
                </View>

                <TextInput
                  placeholder={t("checkout.addressTitle")}
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                  className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
                />

                <AddressSelector
                  selectedCity={form.city}
                  selectedDistrict={form.district}
                  onCityChange={(city) => setForm({ ...form, city })}
                  onDistrictChange={(district) =>
                    setForm({ ...form, district })
                  }
                />

                <TextInput
                  placeholder={t("checkout.fullAddress")}
                  value={form.fullAddress}
                  onChangeText={(text) =>
                    setForm({ ...form, fullAddress: text })
                  }
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3 h-24"
                  textAlignVertical="top"
                />

                <TextInput
                  placeholder={t("checkout.phone")}
                  value={form.phone}
                  onChangeText={(text) => setForm({ ...form, phone: text })}
                  keyboardType="phone-pad"
                  className="bg-gray-50 p-3 rounded-xl border border-gray-200"
                />

                {/* Adresi Kaydet Switch */}
                {user && (
                  <View className="flex-row items-center mt-4 pt-4 border-t border-gray-100 justify-between">
                    <Text className="text-gray-600 text-xs flex-1 mr-2">
                      {t("checkout.saveAddress")}
                    </Text>
                    <Switch
                      value={saveAddressToProfile}
                      onValueChange={setSaveAddressToProfile}
                      trackColor={{ false: "#e5e7eb", true: "#78350f" }}
                    />
                  </View>
                )}
              </View>

              {/* Sözleşmeler (KVKK) */}
              <View className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
                <Text className="font-bold text-gray-800 mb-2">
                  {t("checkout.contracts")}
                </Text>
                <TouchableOpacity
                  onPress={() => setKvkkAccepted(!kvkkAccepted)}
                  className="flex-row items-start"
                >
                  <View
                    className={`w-6 h-6 rounded border mr-3 items-center justify-center ${
                      kvkkAccepted
                        ? "bg-amber-900 border-amber-900"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {kvkkAccepted && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text className="text-gray-600 text-xs flex-1 leading-5">
                    {t("checkout.kvkkText")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sipariş Özeti */}
              <View className="bg-white p-4 rounded-xl shadow-sm mb-20 border border-gray-100">
                <Text className="font-bold text-gray-800 mb-3 text-lg">
                  {t("checkout.orderSummary")}
                </Text>
                {cart.map((item) => (
                  <View key={item.id} className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 flex-1" numberOfLines={1}>
                      {item.quantity}x {item.title}
                    </Text>
                    <Text className="text-gray-800 font-bold">
                      {item.price * item.quantity} TL
                    </Text>
                  </View>
                ))}
                <View className="h-[1px] bg-gray-200 my-3" />
                <View className="flex-row justify-between">
                  <Text className="font-bold text-gray-900 text-lg">
                    {t("checkout.total")}
                  </Text>
                  <Text className="font-bold text-amber-900 text-lg">
                    {totalPrice} TL
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Alt Bar */}
          <View className="p-4 bg-white border-t border-gray-100 shadow-lg safe-area-bottom">
            <TouchableOpacity
              onPress={handleOrder}
              disabled={loading}
              className={`p-4 rounded-xl flex-row justify-center items-center ${
                loading ? "bg-gray-400" : "bg-green-700"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg mr-2">
                    {t("checkout.completeOrder")}
                  </Text>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
