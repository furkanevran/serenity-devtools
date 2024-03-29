import browser from 'webextension-polyfill';
import type { Runtime } from 'webextension-polyfill';

const connections = new Map<number, Runtime.Port[]>(); // per tabId

(async () => {
    let activeTabId: number = (await browser.tabs.query({ active: true, currentWindow: true }))?.[0]?.id ?? 0;
    browser.tabs.onActivated.addListener((activeInfo) => {
        activeTabId = activeInfo?.tabId;
        if (!activeTabId) {
            return;
        }

        connections.get(activeTabId)?.forEach((port) => {
            port.postMessage({
                name: 'activated'
            });
        });
    });

    browser.runtime.onInstalled.addListener(async () => {
        const manifest = browser.runtime.getManifest();

        for (const cs of manifest.content_scripts!) {
            for (const tab of await browser.tabs.query({ url: cs.matches })) {
                browser.scripting.executeScript({
                    files: cs.js,
                    target: { tabId: tab.id!, allFrames: cs.all_frames },
                    injectImmediately: cs.run_at === 'document_start',
                });
            }
        }
    });

    browser.runtime.onConnect.addListener((port) => {
        const extensionListener = (message: any, port: Runtime.Port) => {
            const tabId = message.tabId ?? port.sender?.tab?.id ?? activeTabId;

            if (message.name === "init") {
                connections.set(tabId, [...(connections.get(tabId) || []), port]);
                return;
            }

            if (message.name === "ping") {
                port.postMessage({
                    name: 'pong',
                });
                return;
            }

            if (message.name === "my-active-tab-id") {
                port.postMessage({
                    name: 'my-active-tab-id',
                    tabId: activeTabId,
                });
                return;
            }

            if (message.name === "listener-count") {
                port.postMessage({
                    name: 'listener-count',
                    count: connections.get(tabId)?.length,
                });
                return;
            }

            connections.get(tabId)?.forEach((target) => {
                if ((port.name !== target.name && !message.destination) || message.destination === target.name) {
                    target.postMessage(message);
                }
            });
        }

        port.onMessage.addListener(extensionListener);

        port.onDisconnect.addListener((port) => {
            port.onMessage.removeListener(extensionListener);

            const tabId = [...connections.entries()].find(([_, ports]) => ports.includes(port))?.[0];
            if (tabId) {
                connections.set(tabId, connections.get(tabId)?.filter(p => p !== port) || []);
            }
        });
    });
})();