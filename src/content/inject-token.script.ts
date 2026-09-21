// src/content/inject-token.ts (dentro de tu proyecto de extensión)
(async () => {
  const { sgcToken } = await chrome.storage.local.get(['sgcToken']);
  if (sgcToken) {
    localStorage.setItem('sgcToken', sgcToken as string);
    console.log('[Extensión] Token inyectado en localhost');
  }
})();