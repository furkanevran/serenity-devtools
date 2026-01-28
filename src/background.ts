
const connections = new Map<number, chrome.runtime.Port[]>(); // per tabId

(async () => {
    let activeTabId: number = (await new Promise<chrome.tabs.Tab[]>((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, resolve)))?.[0]?.id ?? 0;
    
    chrome.tabs.onActivated.addListener((activeInfo) => {
        connections.get(activeTabId)?.forEach((port) => {
            port.postMessage({
                name: 'deactivated'
            });
        });

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

    chrome.runtime.onInstalled.addListener(async () => {
        const manifest = chrome.runtime.getManifest();

        if (manifest.content_scripts) {
            for (const cs of manifest.content_scripts) {
                if (!cs.matches) continue;
                
                chrome.tabs.query({ url: cs.matches }, (tabs: chrome.tabs.Tab[]) => {
                    for (const tab of tabs) {
                         if (tab.id && cs.js) {
                            chrome.scripting.executeScript({
                                files: cs.js,
                                target: { tabId: tab.id, allFrames: cs.all_frames },
                                injectImmediately: cs.run_at === 'document_start',
                            });
                         }
                    }
                });
            }
        }
    });

    chrome.runtime.onConnect.addListener((port) => {
        const anyPort = port as any;
        
        const resetTimer = () => {
            if (anyPort._timer) clearTimeout(anyPort._timer);
            anyPort._timer = setTimeout(() => disconnect(port), 250000); // 4+ minutes
        }
        
        resetTimer();

        const deleteTimer = () => {
            if (!anyPort._timer)
                return;

            clearTimeout(anyPort._timer);
            delete anyPort._timer;
        }

        const extensionListener = (message: any, port: chrome.runtime.Port) => {
            resetTimer();
            console.log("background", message, port, activeTabId);
            const tabId = message.tabId ?? port.sender?.tab?.id ?? activeTabId;

            if (message.name === "init") {
                connections.set(tabId, [...(connections.get(tabId)?.filter(x => port != x) || []), port]);
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

        function disconnect(port: chrome.runtime.Port) {
            port.onMessage.removeListener(extensionListener);
            port.onDisconnect.removeListener(disconnect);

            deleteTimer();
            port.disconnect();

            for (const [tabId, ports] of connections.entries()) {
                connections.set(tabId, ports.filter(p => p !== port));
            }
        }

        port.onMessage.addListener(extensionListener);

        port.onDisconnect.addListener((port) => disconnect(port));
    });
})();