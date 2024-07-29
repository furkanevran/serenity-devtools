import {  MessageHandler, MessageHandlers, MessageKeys, MessageValues } from "@/utils/messageTypes";
import { devtools, runtime, Runtime} from "webextension-polyfill";

let devtoolsPanelConnection: Runtime.Port | null = null;
const messageQueue: MessageValues[] = [];
const listeners: MessageHandlers = {};

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

    devtoolsPanelConnection.onMessage.addListener((message: MessageValues) => {
        console.log('devtoolsPanelConnection message', message);

        if (message.name && listeners[message.name]) {
            listeners[message.name]!(message as any);
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

export const send = function sendMessageToBackgroundScript(message: MessageValues) {
    if (!devtoolsPanelConnection) {
        messageQueue.push(message);
        return;
    }

    console.log('sending message', message);
    devtoolsPanelConnection.postMessage(message);
}

export const onMessage = <T extends MessageKeys>(name: T, callback: MessageHandler<T>) => {
    listeners[name as MessageKeys] = callback as any;
}

devtools.network.onNavigated.addListener(() => {
    connect();
});
