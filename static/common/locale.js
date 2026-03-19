const locale = new Map();

export async function setLocale(lang) {
  const { default: entries } = await import(
    `./locale/${lang}.json`,
    { with: { type: "json" } }
  );

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
