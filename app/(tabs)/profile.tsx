import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "../../i18n/i18n";
import { useRouter } from "expo-router";

// Dil Seçenekleri (Bayraklar ve Kodlar)
const LANGUAGES = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
];

export default function ProfileScreen() {
  const { user, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Modal Görünürlüğü
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    await AsyncStorage.setItem("language", langCode);
    setModalVisible(false); // Seçim yapınca modalı kapat
  };

  const handleAdminAccess = () => {
    if (isAdmin) {
      router.push("/(admin)/dashboard");
    } else {
      Alert.alert(t("common.error"), t("profile.unauthorized"));
    }
  };

  // Şu anki dili bul (Bayrağını göstermek için)
  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-4">
        {/* Profil Başlığı */}
        <View className="items-center mb-8 mt-4">
          <View className="w-24 h-24 bg-amber-200 rounded-full items-center justify-center mb-4 shadow-sm">
            <Text className="text-4xl">☕</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            {user?.displayName || user?.email || t("profile.guest")}
          </Text>
          <Text className="text-gray-500">{user?.email}</Text>

          {isAdmin && (
            <View className="bg-amber-100 px-3 py-1 rounded-full mt-2 border border-amber-200">
              <Text className="text-amber-800 text-xs font-bold uppercase">
                {t("profile.adminAccount")}
              </Text>
            </View>
          )}
        </View>

        {/* Menü Grupları */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Admin Paneli */}
          {isAdmin && (
            <TouchableOpacity
              onPress={handleAdminAccess}
              className="flex-row items-center p-4 border-b border-gray-100 bg-amber-50"
            >
              <View className="w-8 h-8 rounded-full bg-amber-900 items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={18} color="white" />
              </View>
              <Text className="flex-1 font-bold text-amber-900 text-base">
                {t("adminPanel")}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#78350f" />
            </TouchableOpacity>
          )}

          {/* Siparişlerim */}
          <TouchableOpacity
            onPress={() => router.push("/orders")}
            className="flex-row items-center p-4 border-b border-gray-100"
          >
            <Ionicons
              name="cube-outline"
              size={22}
              color="#4b5563"
              className="mr-3"
            />
            <Text className="flex-1 text-gray-700 text-base ml-3">
              {t("orders.title")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Favorilerim */}
          <TouchableOpacity
            onPress={() => router.push("/favorites")}
            className="flex-row items-center p-4 border-b border-gray-100"
          >
            <Ionicons
              name="heart-outline"
              size={22}
              color="#4b5563"
              className="mr-3"
            />
            <Text className="flex-1 text-gray-700 text-base ml-3">
              {t("favorites.title")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Adres Bilgilerim */}
          <TouchableOpacity
            onPress={() => router.push("/profile-edit")}
            className="flex-row items-center p-4 border-b border-gray-100"
          >
            <Ionicons
              name="location-outline"
              size={22}
              color="#4b5563"
              className="mr-3"
            />
            <Text className="flex-1 text-gray-700 text-base ml-3">
              {t("profile.myAddresses")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* --- YENİ DİL SEÇİM BUTONU --- */}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="flex-row items-center p-4 justify-between border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <Ionicons
                name="language-outline"
                size={22}
                color="#4b5563"
                className="mr-3"
              />
              <Text className="text-gray-700 text-base ml-3">
                {t("language")}
              </Text>
            </View>

            {/* Mevcut Dilin Bayrağı ve İsmi */}
            <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full">
              <Text className="text-lg mr-2">{currentLang.flag}</Text>
              <Text className="text-gray-600 font-bold text-xs">
                {currentLang.name}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color="#6b7280"
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Çıkış Butonu */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-white p-4 rounded-xl shadow-sm border border-red-100"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="ml-2 text-red-500 font-bold text-base">
            {t("logout")}
          </Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-400 text-xs mt-8">
          v1.0.0 • Lupin Coffee App
        </Text>
      </ScrollView>

      {/* --- DİL SEÇİM MODALI --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-white w-[80%] rounded-2xl p-4 shadow-xl">
            <Text className="text-center font-bold text-lg mb-4 text-gray-800">
              {t("language")}
            </Text>

            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => changeLanguage(lang.code)}
                className={`flex-row items-center p-4 border-b border-gray-100 ${
                  i18n.language === lang.code ? "bg-amber-50 rounded-xl" : ""
                }`}
              >
                <Text className="text-2xl mr-4">{lang.flag}</Text>
                <Text
                  className={`flex-1 text-base ${
                    i18n.language === lang.code
                      ? "font-bold text-amber-900"
                      : "text-gray-700"
                  }`}
                >
                  {lang.name}
                </Text>
                {i18n.language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color="#78350f" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mt-4 p-2 items-center"
            >
              <Text className="text-gray-500 font-bold">
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
