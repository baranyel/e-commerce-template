import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/config";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { useTranslation } from "react-i18next";
import { getAttributes, getTerms } from "../../services/attributeService";
import { Attribute, Term } from "../../types";

export default function AddProductScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Data State
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [termsMap, setTermsMap] = useState<Record<string, Term[]>>({}); // attrId -> terms
  const [loadingAttributes, setLoadingAttributes] = useState(true);

  // Form State
  const [form, setForm] = useState({
    title: "",
    price: "",
    description: "",
    imageUrl: "",
    stock: "10",
  });
  
  // Selected Attributes: { [attributeId]: termId }
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Tree Modal State
  const [treeModalVisible, setTreeModalVisible] = useState(false);
  const [activeAttributeId, setActiveAttributeId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const attrs = await getAttributes();
      setAttributes(attrs.filter(a => a.isActive));
      
      const tMap: Record<string, Term[]> = {};
      for (const attr of attrs) {
        if (attr.isActive) {
            const terms = await getTerms(attr.id);
            tMap[attr.id] = terms;
        }
      }
      setTermsMap(tMap);
    } catch (error) {
      console.error("Error fetching attributes", error);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `products/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setForm({ ...form, imageUrl: downloadURL });
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: error.message,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.price) {
      return Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("admin.fillAllFields"),
      });
    }

    setSubmitting(true);
    try {
      // Find term names for fallback category string (optional but good for debugging)
      let categoryString = "Uncategorized";
      // Try to find a term from a "Category" attribute if exists
      // This logic depends on what attribute is named "Category" or isHierarchical
      // For now, let's just use the first selected term's name or ignore.
      
      await addDoc(collection(db, "products"), {
        title: form.title,
        price: parseFloat(form.price),
        currency: "TRY",
        // Backward compatibility: save first selected attribute as category, or just empty
        category: "dynamic", 
        attributes: selectedAttributes,
        description: form.description,
        stock: parseInt(form.stock) || 0,
        images: [form.imageUrl],
        isFeatured: false,
        createdAt: Date.now(),
      });

      Toast.show({
        type: "success",
        text1: t("common.success"),
        text2: t("admin.successMessage"),
        visibilityTime: 1500,
      });

      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(admin)/dashboard");
        }
      }, 1500);
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: t("common.error") });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Tree Renderer for Modal ---
  const renderTreeNodes = (terms: Term[], parentId: string | null = null, level = 0) => {
     const nodes = terms.filter(t => t.parentId === parentId);
     return nodes.map(node => (
         <View key={node.id}>
             <TouchableOpacity 
                style={{ paddingLeft: level * 20 }}
                className={`p-3 border-b border-gray-100 flex-row items-center justify-between ${selectedAttributes[activeAttributeId!] === node.id ? 'bg-amber-50' : ''}`}
                onPress={() => {
                    if (activeAttributeId) {
                        setSelectedAttributes(prev => ({ ...prev, [activeAttributeId]: node.id }));
                        setTreeModalVisible(false);
                    }
                }}
             >
                 <Text className={`text-gray-800 ${selectedAttributes[activeAttributeId!] === node.id ? 'font-bold text-amber-900' : ''}`}>
                    {node.name}
                 </Text>
                 {selectedAttributes[activeAttributeId!] === node.id && (
                     <Ionicons name="checkmark" size={18} color="#78350f" />
                 )}
             </TouchableOpacity>
             {renderTreeNodes(terms, node.id, level + 1)}
         </View>
     ));
  };

  return (
    <ScreenWrapper>
       <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View className="pt-4 pb-6">
            <Text className="text-2xl font-bold text-gray-900">{t('admin.addProduct')}</Text>
        </View>

        {/* Card 1: Basic Info */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">{t('admin.productName')}</Text>
            <TextInput
                onChangeText={(text) => setForm({ ...form, title: text })}
                className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-800"
                placeholder={t('admin.productName')}
            />
            
            <View className="flex-row space-x-4 mt-4">
                <View className="flex-1">
                    <Text className="text-xs font-bold text-gray-400 uppercase mb-2">{t('admin.price')}</Text>
                    <TextInput
                        onChangeText={(text) => setForm({ ...form, price: text })}
                        keyboardType="numeric"
                        className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-800"
                        placeholder="0.00"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-xs font-bold text-gray-400 uppercase mb-2">{t('admin.stock')}</Text>
                    <TextInput
                        value={form.stock}
                        onChangeText={(text) => setForm({ ...form, stock: text })}
                        keyboardType="numeric"
                        className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-800"
                    />
                </View>
            </View>
        </View>

        {/* Card 2: Dynamic Attributes */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
             <Text className="text-xs font-bold text-gray-400 uppercase mb-3">{t('admin.dashboard.attributes') || "Attributes"}</Text>
             
             {loadingAttributes ? (
                 <ActivityIndicator />
             ) : (
                attributes.map(attr => {
                    const attrTerms = termsMap[attr.id] || [];
                    const selectedTermId = selectedAttributes[attr.id];
                    const selectedTerm = attrTerms.find(t => t.id === selectedTermId);

                    return (
                        <View key={attr.id} className="mb-4">
                            <Text className="text-gray-600 mb-1 font-medium">{attr.name}</Text>
                            
                            {attr.isHierarchical ? (
                                <TouchableOpacity 
                                    className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex-row justify-between items-center"
                                    onPress={() => {
                                        setActiveAttributeId(attr.id);
                                        setTreeModalVisible(true);
                                    }}
                                >
                                    <Text className={selectedTerm ? 'text-gray-900' : 'text-gray-400'}>
                                        {selectedTerm ? selectedTerm.name : `${t('admin.attribute.select')} ${attr.name}`}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color="gray" />
                                </TouchableOpacity>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                    {attrTerms.map(term => (
                                        <TouchableOpacity
                                            key={term.id}
                                            onPress={() => setSelectedAttributes(prev => ({ ...prev, [attr.id]: term.id }))}
                                            className={`mr-2 px-4 py-2 rounded-full border ${
                                                selectedAttributes[attr.id] === term.id
                                                ? "bg-amber-900 border-amber-900"
                                                : "bg-white border-gray-200"
                                            }`}
                                        >
                                            <Text className={selectedAttributes[attr.id] === term.id ? "text-white" : "text-gray-600"}>
                                                {term.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    );
                })
             )}
        </View>

        {/* Card 3: Image */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
             <Text className="text-xs font-bold text-gray-400 uppercase mb-3">{t('admin.image')}</Text>
             
             {form.imageUrl ? (
                <View className="mb-4 relative">
                    <Image
                        source={{ uri: form.imageUrl }}
                        className="w-full h-48 rounded-xl bg-gray-100 object-cover"
                    />
                    <TouchableOpacity
                        onPress={() => setForm({ ...form, imageUrl: "" })}
                        className="absolute top-2 right-2 bg-red-500 p-2 rounded-full shadow-md"
                    >
                        <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                </View>
             ) : (
                <View className="flex-row items-center space-x-2">
                    <TouchableOpacity
                        onPress={pickImage}
                        disabled={uploadingImage}
                        className="flex-1 bg-amber-50 h-32 border-2 border-dashed border-amber-200 rounded-xl items-center justify-center"
                    >
                        {uploadingImage ? (
                            <ActivityIndicator color="#78350f" />
                        ) : (
                            <>
                                <Ionicons name="camera" size={32} color="#78350f" />
                                <Text className="text-amber-900 font-bold mt-2 text-xs">{t('admin.pickImage')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
             )}

             <View className="flex-row items-center mt-3">
                 <View className="flex-1 h-[1px] bg-gray-100" />
                 <Text className="text-gray-400 text-xs px-2">{t('common.or')}</Text>
                 <View className="flex-1 h-[1px] bg-gray-100" />
             </View>

              <TextInput
                value={form.imageUrl}
                onChangeText={(text) => setForm({ ...form, imageUrl: text })}
                className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-500"
                placeholder="https://..."
              />
        </View>

        {/* Card 4: Description */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">{t('admin.description')}</Text>
            <TextInput
                onChangeText={(text) => setForm({ ...form, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-800 h-28"
                placeholder="..."
            />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
            onPress={handleCreate}
            disabled={submitting || uploadingImage}
            className={`p-4 rounded-xl items-center shadow-md mb-8 ${
            submitting || uploadingImage ? "bg-gray-300" : "bg-green-600"
            }`}
        >
            {submitting ? (
            <ActivityIndicator color="#fff" />
            ) : (
            <Text className="text-white font-bold text-lg">{t('admin.publish')}</Text>
            )}
        </TouchableOpacity>

        </ScrollView>
       </KeyboardAvoidingView>

       {/* TREE SELECTION MODAL */}
       <Modal visible={treeModalVisible} animationType="slide" transparent>
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl h-[80%] p-5 shadow-2xl">
                    <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-2">
                        <Text className="text-xl font-bold text-gray-800">
                             {t('admin.attribute.select')} {activeAttributeId && attributes.find(a => a.id === activeAttributeId)?.name}
                        </Text>
                        <TouchableOpacity onPress={() => setTreeModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView className="flex-1">
                        {activeAttributeId && termsMap[activeAttributeId] ? (
                            renderTreeNodes(termsMap[activeAttributeId])
                        ) : (
                            <ActivityIndicator />
                        )}
                        <View className="h-20" /> 
                    </ScrollView>
                </View>
            </View>
       </Modal>
    </ScreenWrapper>
  );
}

