const { session } = require("electron");

// Allow loading of local file
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      "Content-Security-Policy": ["default-src 'self' data:"],
    },
  });
});
