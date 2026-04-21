module.exports = function (api) {
  api.cache(true);
  // nativewind/babel also registers @babel/plugin-transform-react-jsx; stacking it with
  // babel-preset-expo duplicates __self/__source (automatic JSX runtime).
  const { plugins: nativewindPlugins } = require('nativewind/babel')();
  const [interopPlugin, , workletsPlugin] = nativewindPlugins;

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          reanimated: false,
        },
      ],
    ],
    plugins: [interopPlugin, workletsPlugin],
  };
};
