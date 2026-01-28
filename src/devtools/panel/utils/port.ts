import { MessageHandler, MessageHandlers, MessageKeys, MessageValues } from "@/types/messageTypes";
import { evalInInspectedWindow } from "./devtoolsEval";

let devtoolsPanelConnection: chrome.runtime.Port | null = null;
const messageQueue: MessageValues[] = [];
const listeners: MessageHandlers = {};

const connect = function connectToBackgroundScript() {
    if (devtoolsPanelConnection) {
        devtoolsPanelConnection.disconnect();
    }

    devtoolsPanelConnection = chrome.runtime.connect({
        name: 'panel',
    });

    devtoolsPanelConnection.postMessage({
        name: 'init',
        tabId: chrome.devtools.inspectedWindow.tabId,
    });

    devtoolsPanelConnection.onDisconnect.addListener(() => {
        devtoolsPanelConnection = null;
        console.log('devtoolsPanelConnection disconnected, reconnecting...');
        connect();
    });

    devtoolsPanelConnection.onMessage.addListener((msg: unknown) => {
        const message = msg as MessageValues;
        console.log('devtoolsPanelConnection message', message);

        if (message.name === "open-source-response" || message.name === "run-function-response") {
            
            if (message.name === "open-source-response") {
                const expr = `inspect(window.${message.tempVarName}${!message.path?.length ? ".constructor" : ""}); delete window.${message.tempVarName};`;
                console.log("Evaluating inspect:", expr);
                evalInInspectedWindow(expr);
                return;
            }
            
            let pathStr = '';
            if (message.path?.length) {
                pathStr = message.path.reduce((acc, val) => acc + `[${JSON.stringify(val)}]`, '') as string;
            }

            if (message.name === "run-function-response") {
                const expr = `console.log(${JSON.stringify(pathStr)}, window.${message.tempVarName}()); delete window.${message.tempVarName};`;
                evalInInspectedWindow(expr);
            }
        }

        if (message.name && listeners && listeners[message.name] && listeners[message.name]!.length > 0) {
            listeners[message.name]!.forEach((listener) => listener(message as any));
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

export const sendMessage = function sendMessageToBackgroundScript(message: MessageValues) {
    if (!devtoolsPanelConnection) {
        console.log('devtoolsPanelConnection not connected, adding to queue', message);
        messageQueue.push(message);
        return;
    }

    console.log('sending message', message);
    devtoolsPanelConnection.postMessage({ ...message, tabId: chrome.devtools.inspectedWindow.tabId });
}

export const onMessage = <T extends MessageKeys>(name: T, callback: MessageHandler<T>) => {
    if (!listeners[name]) {
        listeners[name] = [];
    }

    listeners[name as MessageKeys]!.push(callback as MessageHandler<MessageKeys>);
}

export const removeMessageListener = <T extends MessageKeys>(name: T, callback: MessageHandler<T>) => {
    if (!listeners[name]) {
        return;
    }

    // @ts-expect-error - TS doesn't like the type conversion here
    listeners[name as MessageKeys] = listeners[name as MessageKeys]!.filter((listener) => listener !== callback as MessageHandler<MessageKeys>);
}

chrome.devtools.network.onNavigated.addListener(() => {
    connect();
});
