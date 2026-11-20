// Minimal CRACO config for standalone CRA (no monorepo paths).
module.exports = {
  webpack: {
    configure: (webpackConfig) => webpackConfig,
  },
};
