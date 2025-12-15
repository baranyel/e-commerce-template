import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useLoading } from "../context/LoadingContext";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { showLoading, hideLoading } = useLoading(); // Destructure here

  // Password Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "1060679330394-grtbngtlmodrru1nfcguuj2aotbbcum3.apps.googleusercontent.com",
    iosClientId: "", // Add if needed
    androidClientId: "" // Add if needed
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token, access_token } = response.params;
      const credential = id_token 
        ? GoogleAuthProvider.credential(id_token) 
        : GoogleAuthProvider.credential(null, access_token);

      if (credential) {
         setLoading(true);
         signInWithCredential(auth, credential)
          .catch((error) => handleError(error))
          .finally(() => setLoading(false));
      }
    }
  }, [response]);

  const handleError = (error: any) => {
      let msg = t('auth.errors.general');
      if (error.code === 'auth/email-already-in-use') msg = t('auth.errors.emailInUse');
      else if (error.code === 'auth/invalid-email') msg = t('auth.errors.invalidEmail');
      else if (error.code === 'auth/weak-password') msg = t('auth.errors.weakPassword');
      else if (error.code === 'auth/user-not-found') msg = t('auth.errors.userNotFound');
      else if (error.code === 'auth/wrong-password') msg = t('auth.errors.wrongPassword');
      
      Toast.show({ type: "error", text1: t('common.error'), text2: msg });
  };

  const handleAuth = async () => {
    if (!email || !password) {
        Toast.show({ type: "error", text1: t('common.error'), text2: t('admin.fillAllFields') });
        return;
    }

    setLoading(true);
    showLoading(); // Show Curtain

    try {
      if (isRegistering) {
        // 1. Create Auth User
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Create Firestore Document
        await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            email: email,
            role: "customer",
            createdAt: Date.now(),
            addressTitle: "",
            city: "",
            district: "",
            fullAddress: "",
            phone: ""
        });

        Toast.show({ type: "success", text1: t('common.success'), text2: t('auth.createAccount') });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Delay to show animation
      setTimeout(() => {
          hideLoading();
      }, 1500);

    } catch (error: any) {
      hideLoading(); // Hide immediately on error
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
      if (!resetEmail) {
          Toast.show({ type: "error", text1: t('common.error'), text2: t('auth.errors.invalidEmail') });
          return;
      }
      setResetLoading(true);
      try {
          await sendPasswordResetEmail(auth, resetEmail);
          setShowResetModal(false);
          Toast.show({ type: "success", text1: t('common.success'), text2: t('auth.emailSent') });
      } catch (error: any) {
          handleError(error);
      } finally {
          setResetLoading(false);
      }
  };

  return (
    <View className="flex-1 bg-gray-50">
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-center px-6"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View className="bg-white p-8 rounded-2xl shadow-lg">
                    {/* Header */}
                    <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
                        {isRegistering ? t('auth.createAccount') : t('auth.login')}
                    </Text>
                    <Text className="text-gray-500 text-center mb-8">
                        Lupin Coffee Co.
                    </Text>

                    {/* Inputs */}
                    <View className="space-y-4">
                        <TextInput
                            placeholder={t('auth.email')}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            className="w-full bg-gray-100 p-4 rounded-xl text-gray-700 border border-gray-200"
                        />
                        <View>
                            <TextInput
                                placeholder={t('auth.password')}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                className="w-full bg-gray-100 p-4 rounded-xl text-gray-700 border border-gray-200"
                            />
                            {!isRegistering && (
                                <TouchableOpacity onPress={() => setShowResetModal(true)} className="absolute right-0 -bottom-6">
                                    <Text className="text-amber-900 text-xs font-bold p-2">
                                        {t('auth.forgotPassword')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        onPress={handleAuth}
                        disabled={loading}
                        className="w-full bg-amber-900 p-4 rounded-xl mt-10 active:bg-amber-800 shadow-sm"
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white text-center font-bold text-lg">
                                {isRegistering ? t('auth.register') : t('auth.login')}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* OR Separator */}
                    <View className="flex-row items-center my-6">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="mx-4 text-gray-400 text-sm">{t('auth.or')}</Text>
                        <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    {/* Google Button */}
                    <TouchableOpacity
                        onPress={() => promptAsync()}
                        className="flex-row items-center justify-center bg-white border border-gray-300 p-4 rounded-xl"
                    >
                        <Ionicons name="logo-google" size={20} color="#4b5563" style={{ marginRight: 8 }} />
                        <Text className="text-gray-700 font-semibold text-base">
                            {t('auth.googlecontinue')}
                        </Text>
                    </TouchableOpacity>

                    {/* Toggle Mode */}
                    <TouchableOpacity
                        onPress={() => setIsRegistering(!isRegistering)}
                        className="mt-6"
                    >
                        <Text className="text-center text-gray-600">
                            {isRegistering ? t('auth.haveAccount') : t('auth.noAccount')}{" "}
                            <Text className="text-amber-900 font-bold">
                                {isRegistering ? t('auth.login') : t('auth.register')}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>

        {/* Password Reset Modal */}
        <Modal
            animationType="fade"
            transparent={true}
            visible={showResetModal}
            onRequestClose={() => setShowResetModal(false)}
        >
            <View className="flex-1 justify-center items-center bg-black/50 px-6">
                <View className="bg-white p-6 rounded-2xl w-full max-w-sm shadowed-lg">
                    <Text className="text-xl font-bold text-gray-900 mb-2">{t('auth.resetTitle')}</Text>
                    <Text className="text-gray-500 mb-4 text-sm">{t('auth.resetDesc')}</Text>
                    
                    <TextInput
                        placeholder={t('auth.email')}
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        autoCapitalize="none"
                        className="w-full bg-gray-100 p-3 rounded-lg text-gray-700 border border-gray-200 mb-4"
                    />

                    <View className="flex-row justify-end space-x-3">
                        <TouchableOpacity 
                            onPress={() => setShowResetModal(false)}
                            className="px-4 py-2"
                        >
                            <Text className="text-gray-500 font-bold">{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={handlePasswordReset}
                            disabled={resetLoading}
                            className="bg-amber-900 px-4 py-2 rounded-lg"
                        >
                            {resetLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text className="text-white font-bold">{t('auth.sendResetLink')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    </View>
  );
}
