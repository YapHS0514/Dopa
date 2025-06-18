const appJson = require('./app.json');

module.exports = ({ config }) => {
  return {
    ...appJson.expo,
    plugins: [
      ...appJson.expo.plugins,
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 33,
            "targetSdkVersion": 33,
            "buildToolsVersion": "33.0.0"
          },
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ],
    android: {
      ...appJson.expo.android,
      package: "com.dopa.app"
    },
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: "com.dopa.app"
    }
  };
}; 