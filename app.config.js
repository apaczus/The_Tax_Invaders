// Pozwala zbudować wersję web pod podścieżką (np. GitHub Pages: EXPO_BASE_URL=/The_Tax_Invaders).
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...(config.experiments ?? {}), baseUrl: process.env.EXPO_BASE_URL ?? "" },
});
