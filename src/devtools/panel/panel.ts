import { devtools, runtime } from 'webextension-polyfill';
import { JsonViewer } from './json-viewer';

const RETRY_INTERVAL = 300;
let retryCount = 10;
let hasSerenity: boolean = false;

const checkSerenity = async () => {
    return new Promise<void>((resolve) => {
        const check = async () => {
            const [serenityAvailable] = await devtools.inspectedWindow.eval(`typeof window.Serenity !== "undefined"`);
            if (serenityAvailable) {
                document.body.innerHTML = "<h1>Serenity is present</h1>";
                hasSerenity = true;
                resolve();
                return;
            }

            document.body.innerHTML += `<p class="text-red-600 select-none">Serenity is not present</p>`;
            hasSerenity = false;

            if (retryCount <= 0) {
                resolve();
                return;
            }

            retryCount--;
            setTimeout(check, RETRY_INTERVAL);
            resolve();
        }

        check();
    });
}

type Widget = {
    widgetData: any;
    widgetName: string;
    name?: string;
    children: Widget[];
}

const escapeHtml = (unsafe: string) => {
    return unsafe.replace(/[&<"']/g, (m) => {
        m === "&" && (m = "&amp;");
        m === "<" && (m = "&lt;");
        m === '"' && (m = "&quot;");
        m === "'" && (m = "&#039;");
        return m;
    });
}

const unescapeHtml = (safe: string) => {
    return safe.replace(/&amp;|&lt;|&quot;|&#039;/g, (m) => {
        m === "&amp;" && (m = "&");
        m === "&lt;" && (m = "<");
        m === "&quot;" && (m = '"');
        m === "&#039;" && (m = "'");
        return m;
    });
};

let selectedDomSelector: string | null = null;
let data: Widget[] = [];
const jsonViewer = new JsonViewer();

const devtoolsPanelConnection = runtime.connect({
    name: 'panel',
});

document.body.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) {
        return;
    }

    const targetDiv = event.target.closest<HTMLElement>('[data-dom-selector]');
    if (!targetDiv) {
        return;
    }

    const domSelector = targetDiv.getAttribute('data-dom-selector');
    if (!domSelector) {
        return;
    }

    if (event.target.classList.contains('inspect-button')) {
        devtools.inspectedWindow.eval(`inspect($$('${unescapeHtml(domSelector)}')[0])`);
        return;
    }

    if (event.target.classList.contains('save-as-temp-variable-button')) {
        devtoolsPanelConnection.postMessage({
            name: 'saveAsTempVariable',
            selector: unescapeHtml(domSelector)
        });
        return;
    }

    if (targetDiv.classList.contains('left-part')) {
        selectedDomSelector = domSelector;
        targetDiv.classList.add('bg-blue-950');
        jsonViewer.expandedPaths = [];
        jsonViewer.setData(["Loading..."]);
    }
});



const init = async () => {
    devtoolsPanelConnection.postMessage({
        name: 'init',
        tabId: devtools.inspectedWindow.tabId,
    });

    retryCount = 10;
    await checkSerenity();
    if (!hasSerenity) {
        return;
    }

    setInterval(async () => {
        data = JSON.parse((await devtools.inspectedWindow.eval(`window.__SERENITY_DEVTOOLS__.getWidgets()`)) as unknown as string);
        const stack: { widget: Widget, level: number }[] = data.map((widget) => ({ widget: widget, level: 1 }));

        let newHtml = `<div class="grid grid-cols-2 gap-4"><div class="border p-2 m-2 overflow-auto" style="padding-left: 0px;">`;
        let selectedWidget: Widget | null = null;

        while (stack.length) {
            const { widget, level } = stack.shift()!;
            const isSelected = widget.widgetData.domNodeSelector === selectedDomSelector;
            if (isSelected) {
                selectedWidget = widget;
            }

            newHtml += `<div class="border p-2 m-2 left-part${isSelected ? ' bg-blue-950' : ''}" style="padding-left: ${level * 30}px;" data-dom-selector="${escapeHtml(widget.widgetData.domNodeSelector)}">`;
            newHtml += `<h1>${escapeHtml(widget.widgetName)} ${escapeHtml(widget.name ?? '')}</h1>`;
            newHtml += `<p>${escapeHtml(widget.widgetData.domNodeSelector)}</p>`;
            newHtml += `<button class="inspect-button">Inspect</button>`;
            newHtml += "</div>";

            widget.children?.toReversed().forEach((child) => {
                stack.unshift({ widget: child, level: level + 1 });
            });
        }

        newHtml += "</div>";

        if (selectedWidget) {
            newHtml += `<div class="border p-2 m-2 ps-0" data-dom-selector="${escapeHtml(selectedWidget.widgetData.domNodeSelector)}">`;
            newHtml += `<div class="sticky top-0 overflow-hidden">`;
            newHtml += `<h1>${escapeHtml(selectedWidget.widgetName)} ${escapeHtml(selectedWidget.name ?? '')}</h1>`;
            newHtml += `<button class="inspect-button block">Inspect</button>`;
            newHtml += `<button class="save-as-temp-variable-button block">Save as temp variable</button>`;
            newHtml += `<div id="json-viewer" class="border p-2 m-2 overflow-auto"></div>`;
            jsonViewer.setRoot(null);
            jsonViewer.setData(selectedWidget.widgetData);
            newHtml += "</div></div>";
        }

        newHtml += "</div>";

        document.body.innerHTML = newHtml;
        const jsonViewerDiv = document.getElementById('json-viewer');
        jsonViewer.setRoot(jsonViewerDiv);
    }, 1000);
}

devtools.network.onNavigated.addListener(async () => {
    window.location.reload();
});

runtime.onInstalled.addListener(async () => {
    window.location.reload();
});

(async () => {
    await init();
})();

