import browser from 'webextension-polyfill';
console.log('content-script.ts', typeof (globalThis as any)["Serenity"]);

const connection = browser.runtime.connect({
    name: 'content-script',
});

connection.onMessage.addListener((message) => {
    console.log('content-script message', message);
});

connection.postMessage({
    name: 'init'
});

const windowConnection = browser.runtime.connect({
    name: 'window-script',
});

windowConnection.postMessage({
    name: 'init'
});

windowConnection.onMessage.addListener((message) => {
    window.postMessage({...message, namespace: 'com.serenity.devtools'}, '*');
});

window.addEventListener('message', async (event) => {
    if (event.source !== window || event.data?.namespace !== 'com.serenity.devtools') {
        return;
    }

    windowConnection.postMessage(event.data);
});
