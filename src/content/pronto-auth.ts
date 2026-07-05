function getToken() {
  const token: string | null = localStorage.getItem('token');

  if (token) {
    chrome.storage.local.set({ geoprontoToken: token }, () => {
      console.log("[WOW Extension] Token capturado exitosamente.");
    });
  } else {
    console.warn("[WOW Extension] No se encontró el token en esta iteración.");
  }
}

getToken();
