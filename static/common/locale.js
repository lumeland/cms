const locale = new Map();

export async function setLocale(lang) {
  const url = new URL(`./locale/${lang}.json`, import.meta.url);
  const response = await fetch(url);
  const entries = await response.json();

  locale.clear();
  for (const [key, value] of Object.entries(entries)) {
    locale.set(key, value);
  }
}

export function t(key, data) {
  const text = locale.get(key);
  if (!text) {
    console.log(`Missing translation for: ${key}`);
    return key;
  }

  return data ? replace(text, data) : text;
}

function replace(text, data) {
  for (const [key, value] of Object.entries(data)) {
    text = text.replaceAll(`{${key}}`, value);
  }
  return text;
}
