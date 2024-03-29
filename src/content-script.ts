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

connection.postMessage({
    name: 'ping'
});

connection.postMessage({
    name: 'my-active-tab-id'
});

connection.postMessage({
    name: 'listener-count'
});


window.addEventListener('message', async (event) => {
    if (event.source !== window || event.data?.namespace !== 'com.serenity.devtools') {
        return;
    }

    connection.postMessage(event.data);
});
