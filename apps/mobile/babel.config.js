const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["nativewind/babel", { tailwindConfig: path.resolve(__dirname, 'tailwind.config.js') }],
    ],
  };
};
