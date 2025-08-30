module.exports = function override(config, env) {
  // Set publicPath and publicUrl based on environment variables
  // REACT_APP_PUBLIC_PATH: For webpack publicPath (asset loading)
  // REACT_APP_PUBLIC_URL: For React's PUBLIC_URL (similar to Vite's base)
  // Default to original config values if not set
  
  const publicPath = process.env.REACT_APP_PUBLIC_PATH || config.output.publicPath;
  
  // Normalize publicPath - ensure it starts and ends with '/'
  const normalizedPublicPath = publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
  const finalPublicPath = normalizedPublicPath.endsWith('/') ? normalizedPublicPath : `${normalizedPublicPath}/`;
  
  // Set webpack publicPath for asset loading
  config.output.publicPath = finalPublicPath;
  
  console.log(`Setting publicPath to: ${finalPublicPath}`);

  const sourceMapLoaderRule = config.module.rules.find(
    (rule) => rule.oneOf
  ).oneOf.find(
    (rule) => rule.enforce === 'pre' && rule.use && rule.use.includes('source-map-loader')
  );

  if (sourceMapLoaderRule) {
    sourceMapLoaderRule.exclude = /node_modules/;
  }

  return config;
};
