import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native"; // Styled bileşenler yerine normallerini kullanıyoruz
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "../firebase/config"; // Dosya konumuna göre ../ sayısı değişebilir dikkat et
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    // iosClientId: "...",
    // androidClientId: "..."
    webClientId:
      "1060679330394-grtbngtlmodrru1nfcguuj2aotbbcum3.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      // Hem id_token hem access_token'ı çekmeye çalışalım
      const { id_token, access_token } = response.params;

      let credential;

      // Eğer id_token geldiyse onu kullan (En sağlamı budur)
      if (id_token) {
        credential = GoogleAuthProvider.credential(id_token);
      }
      // Yok eğer access_token geldiyse onu kullan (Web'de genelde bu gelir)
      else if (access_token) {
        // Access token ikinci parametre olarak verilir, ilki null olmalı
        credential = GoogleAuthProvider.credential(null, access_token);
      }

      if (credential) {
        signInWithCredential(auth, credential)
          .then(() => {
            // Başarılı giriş
            // Yönlendirmeyi _layout yapacak
          })
          .catch((error) => {
            Alert.alert("Giriş Hatası", error.message);
            console.error(error);
          });
      }
    }
  }, [response]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Başarılı", "Hesap oluşturuldu");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Router replace yapmıyoruz, _layout otomatik algılayacak
    } catch (error: any) {
      Alert.alert("Hata", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // StyledView YERİNE View className="..." kullanıyoruz
    <View className="flex-1 justify-center bg-gray-50 px-6">
      <View className="bg-white p-8 rounded-2xl shadow-lg">
        <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
          {isRegistering ? "Hesap Oluştur" : "Giriş Yap"}
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          Lupin Coffee dünyasına katıl
        </Text>

        <View className="space-y-4">
          <TextInput
            placeholder="E-posta Adresi"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            className="w-full bg-gray-100 p-4 rounded-xl text-gray-700 border border-gray-200"
          />
          <TextInput
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="w-full bg-gray-100 p-4 rounded-xl text-gray-700 border border-gray-200 mt-4"
          />
        </View>

        <TouchableOpacity
          onPress={handleAuth}
          disabled={loading}
          className="w-full bg-amber-900 p-4 rounded-xl mt-6 active:bg-amber-800"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              {isRegistering ? "Kayıt Ol" : "Giriş Yap"}
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-[1px] bg-gray-200" />
          <Text className="mx-4 text-gray-400 text-sm">veya</Text>
          <View className="flex-1 h-[1px] bg-gray-200" />
        </View>

        <TouchableOpacity
          onPress={() => promptAsync()}
          className="flex-row items-center justify-center bg-white border border-gray-300 p-4 rounded-xl"
        >
          <Text className="text-gray-700 font-semibold text-base">
            Google ile Devam Et
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsRegistering(!isRegistering)}
          className="mt-6"
        >
          <Text className="text-center text-gray-600">
            {isRegistering ? "Zaten hesabın var mı? " : "Hesabın yok mu? "}
            <Text className="text-amber-900 font-bold">
              {isRegistering ? "Giriş Yap" : "Kayıt Ol"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
