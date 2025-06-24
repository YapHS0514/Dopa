const appJson = require('./app.json');

module.exports = ({ config }) => {
  return {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      package: "com.dopa.boltexponativewind"
    },
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: "com.dopa.boltexponativewind"
    }
  };
}; 