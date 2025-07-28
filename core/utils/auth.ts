export function checkBasicAuthorization(
  authorization: string,
  users: Record<string, string>,
): boolean {
  const match = authorization.match(/^Basic\s+(.*)$/);
  if (match) {
    const [user, pw] = atob(match[1]).split(":");
    for (const [u, p] of Object.entries(users)) {
      if (user === u && pw == p) {
        return true;
      }
    }
  }

  return false;
}
