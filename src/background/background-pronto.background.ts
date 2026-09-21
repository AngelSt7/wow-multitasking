import { Logger } from '../log/logger';
import { ProntoService } from '../services/pronto.service';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const action = message.action || message.type;

  switch (action) {
  case 'open_whatsapp': {
    if (!message.phone) return false;
    const cleanPhone = String(message.phone).replace(/\D/g, '');
    const customText = message.message ? `&text=${encodeURIComponent(message.message)}` : '';
    const targetUrl = `https://web.whatsapp.com/send?phone=51${cleanPhone}${customText}`;

    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, (tabs) => {
      if (tabs && tabs.length > 0 && tabs[0].id !== undefined) {
        const wspTab = tabs[0];
        const tabId = wspTab.id!;

        chrome.tabs.update(tabId, { active: true }, (tab) => {
          if (tab?.windowId) {
            chrome.windows.update(tab.windowId, { focused: true });
          }
        });

        chrome.scripting.executeScript({
          target: { tabId },
          args: [targetUrl],
          func: (url) => {
            const link = document.createElement('a');
            link.href = url;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            link.remove();
          }
        });

      } else {
        chrome.tabs.create({ url: targetUrl });
      }
    });
    return false;
  }

    case 'GET_PRONTO_TASKS': {
      Logger.setContext('PRONTO-TASKS');
      ProntoService.getTasks()
        .then((response) => {
          if (response.success) {
            Logger.info('Pronto tasks fetched successfully.');
            sendResponse({ success: true, data: response.data });
          } else {
            Logger.error('Error fetching Pronto tasks');
            sendResponse({ success: false, error: response.error });
          }
        })
        .catch((error: Error) => {
          Logger.error(`Critical error fetching Pronto tasks: ${error.message}`);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    case 'GET_SESSION_DATA': {
      chrome.storage.local.get(null, (items) => {
        sendResponse({ data: items });
      });
      return true;
    }

    case 'GET_USER_NAME': {
      chrome.storage.local.get(['sNombres'], (items) => {
        sendResponse({ name: items.sNombres ?? 'Desconocido' });
      });
      return true;
    }

    case 'APPLY_SESSION_DATA': {
      if (message.data && typeof message.data === 'object') {
        chrome.storage.local.set(message.data, () => {
          sendResponse({ ok: true });
        });
      } else {
        sendResponse({ ok: false, error: 'No data provided' });
      }
      return true;
    }

    default:
      return false;
  }
});