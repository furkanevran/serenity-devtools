import { MessageHandler, MessageHandlers, MessageKeys, MessageValues } from "@/types/messageTypes";
import { devtools, runtime, Runtime } from "webextension-polyfill";

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

        if (message.name === "open-source-response" || message.name === "run-function-response") {
            
            if (message.name === "open-source-response") {
                devtools.inspectedWindow.eval(`inspect(window.${message.tempVarName}${!message.path?.length ? ".constructor" : ""}); delete window.${message.tempVarName};`);
                return;
            }
            
            let pathStr = '';
            if (message.path?.length) {
                pathStr = message.path.reduce((acc, val) => acc + `[${JSON.stringify(val)}]`, '') as string;
            }

            if (message.name === "run-function-response")
                devtools.inspectedWindow.eval(`console.log(${JSON.stringify(pathStr)}, window.${message.tempVarName}()); delete window.${message.tempVarName};`);
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
        messageQueue.push(message);
        return;
    }

    console.log('sending message', message);
    devtoolsPanelConnection.postMessage(message);
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

devtools.network.onNavigated.addListener(() => {
    connect();
});
