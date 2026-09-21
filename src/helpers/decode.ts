export function decodeJWT(token : string) {
  const [header, payload] = token.split('.');

  const decode = (str : string) => {
    const normalized = str
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

    return JSON.parse(atob(padded));
  };

  return { header: decode(header), payload: decode(payload) };
}