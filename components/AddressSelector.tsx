import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TURKEY_DATA } from "../data/turkey";
import { useTranslation } from "react-i18next";

interface AddressSelectorProps {
  selectedCity: string;
  selectedDistrict: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
}

export default function AddressSelector({
  selectedCity,
  selectedDistrict,
  onCityChange,
  onDistrictChange,
}: AddressSelectorProps) {
  const { t } = useTranslation();

  // Modal Kontrolleri
  const [modalType, setModalType] = useState<"city" | "district" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const cityList = Object.keys(TURKEY_DATA);
  const districtList = selectedCity ? TURKEY_DATA[selectedCity] : [];

  // Arama filtreleme
  const filteredData = useMemo(() => {
    const data = modalType === "city" ? cityList : districtList;
    if (!searchQuery) return data;
    return data?.filter((item) =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [modalType, searchQuery, cityList, districtList]);

  const handleSelect = (item: string) => {
    if (modalType === "city") {
      onCityChange(item);
      onDistrictChange(""); // Şehir değişince ilçeyi sıfırla
    } else {
      onDistrictChange(item);
    }
    closeModal();
  };

  const closeModal = () => {
    setModalType(null);
    setSearchQuery("");
  };

  return (
    <View className="flex-row space-x-3 mb-3">
      {/* ŞEHİR SEÇİM BUTONU */}
      <View className="flex-1">
        <TouchableOpacity
          onPress={() => setModalType("city")}
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex-row justify-between items-center"
        >
          <Text className={selectedCity ? "text-gray-800" : "text-gray-400"}>
            {selectedCity || "İl Seçiniz"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="gray" />
        </TouchableOpacity>
      </View>

      {/* İLÇE SEÇİM BUTONU */}
      <View className="flex-1">
        <TouchableOpacity
          onPress={() => {
            if (!selectedCity) {
              alert("Lütfen önce il seçiniz.");
              return;
            }
            setModalType("district");
          }}
          className={`bg-gray-50 p-3 rounded-xl border border-gray-200 flex-row justify-between items-center ${
            !selectedCity ? "opacity-50" : ""
          }`}
        >
          <Text
            className={selectedDistrict ? "text-gray-800" : "text-gray-400"}
          >
            {selectedDistrict || "İlçe Seçiniz"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="gray" />
        </TouchableOpacity>
      </View>

      {/* SEÇİM MODALI */}
      <Modal
        visible={modalType !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white p-4">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              {modalType === "city" ? "İl Seçiniz" : "İlçe Seçiniz"}
            </Text>
            <TouchableOpacity
              onPress={closeModal}
              className="p-2 bg-gray-100 rounded-full"
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Arama Çubuğu */}
          <View className="bg-gray-100 p-3 rounded-xl flex-row items-center mb-4">
            <Ionicons name="search" size={20} color="gray" />
            <TextInput
              placeholder="Ara..."
              className="flex-1 ml-2"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={false}
            />
          </View>

          {/* Liste */}
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                className="p-4 border-b border-gray-100"
              >
                <Text className="text-lg text-gray-700">{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="text-center text-gray-400 mt-10">
                Sonuç bulunamadı.
              </Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
}
