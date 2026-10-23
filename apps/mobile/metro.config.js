// Metro tự nhận diện monorepo pnpm (node-linker=hoisted) từ SDK 52+.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
