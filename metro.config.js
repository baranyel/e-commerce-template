const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Web tarafı için gerekli kütüphane yönlendirmesi
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve("stream-browserify"),
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // CSS desteğini açıkça belirtelim
  isCSSEnabled: true,
});
