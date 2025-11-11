export function isUrlLike(text) {
  if (URL.canParse(text)) {
    return true;
  }

  if (text.includes(" ")) {
    return false;
  }

  // It's a path
  return text.startsWith("./") || text.startsWith("/") ||
    text.startsWith("#") || text.startsWith("?");
}
