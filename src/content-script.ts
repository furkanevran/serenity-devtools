import browser from 'webextension-polyfill';

let bridgeConnection: browser.Runtime.Port | null = null;
const messageQueue: any[] = [];

console.log('content-script loaded');

const connect = function connectToBackgroundScript() {
    bridgeConnection = browser.runtime.connect({
        name: 'window-script'
    });

    bridgeConnection.postMessage({
        name: 'init'
    });

    bridgeConnection.onMessage.addListener((message) => {
        window.postMessage({ ...message, namespace: 'is.serenity.devtools/window-script' }, '*');
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
    if (event.source !== window || event.data?.namespace !== 'is.serenity.devtools') {
        return;
    }

    if (!bridgeConnection) {
        messageQueue.push(event.data);
        return;
    }

    bridgeConnection.postMessage(event.data);
});

window.addEventListener('beforeunload', () => {
    bridgeConnection?.postMessage({
        name: 'stop-inspecting'
    });
});

connect();
