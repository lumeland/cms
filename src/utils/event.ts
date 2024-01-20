export function dispatch<T>(name: string, detail: T): T | false {
  const event = new CustomEvent(`cms:${name}`, {
    cancelable: true,
    detail,
  });

  if (dispatchEvent(event)) {
    return event.detail;
  }

  return false;
}
