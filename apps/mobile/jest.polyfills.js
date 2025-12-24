// Polyfills for React Native in Jest environment
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate = global.clearImmediate || ((id) => global.clearTimeout(id));
