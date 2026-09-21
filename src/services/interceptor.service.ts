import { Logger } from "../log/logger";

export class InterceptorService {

    public static inject() {
        Logger.setContext('INTERCEPTOR');
        Logger.info('Injecting interceptor script into the page...');
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('assets/interceptor.js');
        script.dataset.extensionId = chrome.runtime.id;
        (document.head || document.documentElement).appendChild(script);
    }
}