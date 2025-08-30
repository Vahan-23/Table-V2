module.exports = function override(config, env) {
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
