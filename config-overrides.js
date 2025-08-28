module.exports = function override(config, env) {
  // Set publicPath based on environment variable
  // Default to '/test/seating/' if not set
  const publicPath = process.env.REACT_APP_PUBLIC_PATH || config.output.publicPath;
  
  // Ensure publicPath starts and ends with '/'
  const normalizedPublicPath = publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
  const finalPublicPath = normalizedPublicPath.endsWith('/') ? normalizedPublicPath : `${normalizedPublicPath}/`;
  
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
