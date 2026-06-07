(function() {
    const TARGET_URL = '/api/v2/instalaciones/por-instalador';

    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function(method, url) {
        this._url = url;
        return open.apply(this, arguments);
    };

    XHR.send = function() {
        this.addEventListener('readystatechange', function() {
            if (this.readyState === 4 && this._url && this._url.includes(TARGET_URL)) {
                if (this.status >= 200 && this.status < 300) {
                    try {
                        if (this.responseText && this.responseText.length > 0) {
                            const json = JSON.parse(this.responseText);
                            window.dispatchEvent(new CustomEvent('WOW_DATA_INTERCEPTED', { detail: json }));
                        }
                    } catch (e) {
                        console.error("❌ Error parseando JSON de XHR. Longitud:", this.responseText?.length);
                    }
                }
            }
        });
        return send.apply(this, arguments);
    };

    const { fetch: originalFetch } = window;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;

        if (url && url.includes(TARGET_URL)) {
            const clone = response.clone();
            clone.json().then(json => {
                window.dispatchEvent(new CustomEvent('WOW_DATA_INTERCEPTED', { detail: json }));
            }).catch(() => {});
        }
        return response;
    };
})();