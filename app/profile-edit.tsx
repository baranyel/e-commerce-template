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
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { UserProfile } from "../types";
import Toast from "react-native-toast-message";
import AddressSelector from "../components/AddressSelector";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, userProfile } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    city: "",
    district: "",
    fullAddress: "",
    phone: "",
  });

  const colorScheme = useColorScheme();

  // Renk Ayarları
  // Dış taraf (Boşluklar): Açık modda Gri (#F3F4F6), Koyu modda Tam Siyah
  const outerBackgroundColor = colorScheme === "dark" ? "#000000" : "#f5f5f5";

  // İç taraf (İçerik): Açık modda Beyaz, Koyu modda Koyu Gri/Siyah
  const innerBackgroundColor = Colors[colorScheme ?? "light"].background;
  // Mevcut verileri doldur
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

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        // ... veriler aynı ...
        addressTitle: form.title,
        city: form.city,
        district: form.district,
        fullAddress: form.fullAddress,
        phone: form.phone,
      } as Partial<UserProfile>);

      // TOAST BİLDİRİMİ
      Toast.show({
        type: "success",
        text1: "Güncellendi",
        text2: "Adres bilgileriniz başarıyla kaydedildi. ✅",
      });

      // Hemen geri atabiliriz veya biraz bekleyebiliriz
      setTimeout(() => router.back(), 1000);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: "Güncelleme yapılamadı.",
      });
    } finally {
      setLoading(false);
    }
  };

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
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-gray-100">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">
              {t("profile.editAddress")}
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <ScrollView className="p-4">
              <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Text className="text-gray-500 mb-1 ml-1 text-xs font-bold uppercase">
                  {t("checkout.addressTitle")}
                </Text>
                <TextInput
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                  className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4"
                  placeholder="Ev, İş..."
                />

                <View className="flex-row space-x-3 mb-4">
                  <AddressSelector
                    selectedCity={form.city}
                    selectedDistrict={form.district}
                    onCityChange={(city) => setForm({ ...form, city })}
                    onDistrictChange={(district) =>
                      setForm({ ...form, district })
                    }
                  />
                </View>

                <Text className="text-gray-500 mb-1 ml-1 text-xs font-bold uppercase">
                  {t("checkout.fullAddress")}
                </Text>
                <TextInput
                  value={form.fullAddress}
                  onChangeText={(text) =>
                    setForm({ ...form, fullAddress: text })
                  }
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4 h-24"
                  textAlignVertical="top"
                />

                <Text className="text-gray-500 mb-1 ml-1 text-xs font-bold uppercase">
                  {t("checkout.phone")}
                </Text>
                <TextInput
                  value={form.phone}
                  onChangeText={(text) => setForm({ ...form, phone: text })}
                  keyboardType="phone-pad"
                  className="bg-gray-50 p-3 rounded-xl border border-gray-200"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View className="p-4 bg-white border-t border-gray-100 shadow-lg safe-area-bottom">
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className="bg-amber-900 p-4 rounded-xl flex-row justify-center items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg mr-2">
                    {t("profile.saveChanges")}
                  </Text>
                  <Ionicons name="save-outline" size={22} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
