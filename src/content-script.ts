import browser from 'webextension-polyfill';

// const connection = browser.runtime.connect({
//     name: 'content-script',
// });

// connection.onMessage.addListener((message) => {
//     console.log('content-script message', message);
// });

// connection.postMessage({
//     name: 'init'
// });

let bridgeConnection: browser.Runtime.Port | null = null;
const messageQueue: any[] = [];

const connect = function connectToBackgroundScript() {
    bridgeConnection = browser.runtime.connect({
        name: 'window-script'
    });

    bridgeConnection.postMessage({
        name: 'init'
    });

    bridgeConnection.onMessage.addListener((message) => {
        window.postMessage({ ...message, namespace: 'com.serenity.devtools/window-script' }, '*');
    });

    bridgeConnection.onDisconnect.addListener(() => {
        console.log('bridgeConnection disconnected, reconnecting...');
        connect();
    });

    console.log('bridgeConnection connected, flushing messageQueue.... ', messageQueue.length);

    for (let msgIdx = 0; msgIdx < messageQueue.length; msgIdx++) {
        if (!bridgeConnection) {
            break;
        }

        const message = messageQueue[msgIdx];
        bridgeConnection.postMessage(message);
        messageQueue.splice(msgIdx--, 1);
    }
}

window.addEventListener('message', async (event) => {
    if (event.source !== window || event.data?.namespace !== 'com.serenity.devtools') {
        return;
    }

    if (!bridgeConnection) {
        messageQueue.push(event.data);
        return;
    }

    bridgeConnection.postMessage(event.data);
});

connect();
