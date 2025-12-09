module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel", // <-- Bunu buraya (presets içine) ekliyoruz
    ],
    plugins: [
      "react-native-reanimated/plugin", // Bu her zaman en sonda kalmalı
    ],
  };
};
