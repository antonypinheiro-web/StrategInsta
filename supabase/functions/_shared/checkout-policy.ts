export function validateCheckoutRedirect(value: unknown, allowedOrigins: string[]): string {
  if (typeof value !== 'string') throw new Error('URL de retorno obrigatoria');
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || !allowedOrigins.includes(url.origin) ||
      url.pathname !== '/app') {
    throw new Error('URL de retorno nao autorizada');
  }
  return url.href;
}
