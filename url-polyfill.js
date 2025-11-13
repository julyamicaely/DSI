// Polyfill for URL.canParse (Node.js < 18.17.0)
if (!URL.canParse) {
  URL.canParse = function(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}
