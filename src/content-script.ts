import browser from 'webextension-polyfill';
import { MessageValues, WindowMessageValues } from './types/messageTypes';

let bridgeConnection: browser.Runtime.Port | null = null;
const messageQueue: WindowMessageValues[] = [];

const connect = function connectToBackgroundScript() {
    bridgeConnection = browser.runtime.connect({
        name: 'window-script'
    });

    bridgeConnection.postMessage({
        name: 'init',
    } satisfies MessageValues);

    bridgeConnection.onMessage.addListener((message) => {
        window.postMessage({ ...message, namespace: 'is.serenity.devtools/window-script' }, '*');
    });

    bridgeConnection.onDisconnect.addListener(() => {
        connect();
    });

    for (let msgIdx = 0; msgIdx < messageQueue.length; msgIdx++) {
        if (!bridgeConnection) {
            break;
        }

        const message = messageQueue[msgIdx];
        bridgeConnection.postMessage(message);
        messageQueue.splice(msgIdx--, 1);
    }
}

window.addEventListener('message', async (event: MessageEvent<WindowMessageValues>) => {
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
    } satisfies MessageValues);
});

connect();
