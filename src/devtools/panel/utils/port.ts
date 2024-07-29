import { devtools, runtime, Runtime} from "webextension-polyfill";

let devtoolsPanelConnection: Runtime.Port | null = null;
const messageQueue: any[] = [];
const listeners: Record<string, (message: any) => void> = {};

const connect = function connectToBackgroundScript() {
    if (devtoolsPanelConnection) {
        devtoolsPanelConnection.disconnect();
    }

    devtoolsPanelConnection = runtime.connect({
        name: 'panel',
    });

    devtoolsPanelConnection.postMessage({
        name: 'init',
        tabId: devtools.inspectedWindow.tabId,
    });

    devtoolsPanelConnection.onDisconnect.addListener(() => {
        devtoolsPanelConnection = null;
        console.log('devtoolsPanelConnection disconnected, reconnecting...');
        connect();
    });

    devtoolsPanelConnection.onMessage.addListener((message) => {
        console.log('devtoolsPanelConnection message', message);

        if (message.name && listeners[message.name]) {
            listeners[message.name](message);
        }
    });

    console.log('devtoolsPanelConnection connected, flushing messageQueue.... ', messageQueue.length);

    for (let msgIdx = 0; msgIdx < messageQueue.length; msgIdx++) {
        if (!devtoolsPanelConnection) {
            break;
        }

        devtoolsPanelConnection.postMessage(messageQueue[msgIdx]);
        messageQueue.splice(msgIdx--, 1);
    }
}

connect();

export const send = function sendMessageToBackgroundScript(message: any) {
    if (!devtoolsPanelConnection) {
        messageQueue.push(message);
        return;
    }

    console.log('sending message', message);
    devtoolsPanelConnection.postMessage(message);
}

export const onMessage = (name: string, callback: (message: any) => void) => {
    listeners[name] = callback;
}

devtools.network.onNavigated.addListener(() => {
    connect();
});

// devtools.network.onNavigated.addListener(() => {
//     devtoolsPanelConnection?.postMessage({
//         name: 'init',
//         tabId: devtools.inspectedWindow.tabId,
//     });
// });