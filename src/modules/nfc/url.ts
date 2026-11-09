/**
 * Accept only the private invitation URL shape issued by MOMENTUS.
 * This is a local parser for the NFC feasibility prototype; it does not
 * validate the invitation or authorize an event operation.
 */
export function isMomentusInvitationUrl(value: string, origin: string): boolean {
  try {
    const url = new URL(value.trim());
    const expectedOrigin = new URL(origin).origin;
    return (
      url.origin === expectedOrigin &&
      url.pathname === "/invite" &&
      url.search === "" &&
      url.hash.length === 65 &&
      /^[0-9a-f]{64}$/i.test(url.hash.slice(1))
    );
  } catch {
    return false;
  }
}
