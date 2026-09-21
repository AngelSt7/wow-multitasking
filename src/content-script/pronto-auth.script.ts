import { Logger } from "../log/logger";

function getToken() {
  
  const token: string | null = localStorage.getItem('token');
    Logger.setContext('PRONTO-AUTH');

  if (token) {
    chrome.storage.local.set({ geoprontoToken: token }, () => {
      Logger.info("Token sucesfully stored in chrome.storage.local.");
    });
  } else {
    Logger.warn("Not found token in localStorage. Please log in to Pronto first.");
  }
}

getToken();
