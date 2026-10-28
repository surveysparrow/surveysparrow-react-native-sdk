// One optional require per module: bare Metro drops a missing optional dep from the map and shifts later indices.
let mod: any = null;
try {
  mod = require('@sentry/react-native');
} catch {
  mod = null;
}

export default mod;
