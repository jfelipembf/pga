module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.resolve = webpackConfig.resolve || {};
            webpackConfig.resolve.fallback = {
                ...(webpackConfig.resolve.fallback || {}),
                fs: false,
                util: false,
                crypto: false,
                path: false,
                os: false,
                stream: false,
                buffer: false,
            };
            return webpackConfig;
        },
    },
};
