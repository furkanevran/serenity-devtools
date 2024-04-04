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

const unescapeHtml = (safe: string | null) => {
    if (!safe) {
        return null;
    }

    return safe.replace(/&amp;|&lt;|&quot;|&#039;/g, (m) => {
        m === "&amp;" && (m = "&");
        m === "&lt;" && (m = "<");
        m === "&quot;" && (m = '"');
        m === "&#039;" && (m = "'");
        return m;
    });
};

let selectUniqueId: string | null = null;
const flatData: Widget[] = [];
const jsonViewer = new JsonViewer();

const devtoolsPanelConnection = runtime.connect({
    name: 'panel',
});

document.body.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) {
        return;
    }

    const targetDiv = event.target.closest<HTMLElement>('[data-unique-name]');
    if (!targetDiv) {
        return;
    }

    const uniqueName = unescapeHtml(targetDiv.getAttribute('data-unique-name'));
    if (!uniqueName) {
        return;
    }
    console.log("clicked uniqueName", uniqueName);

    if (event.target.classList.contains('inspect-button')) {
        const selectedWidget = flatData.find((widget) => widget.widgetData.uniqueName === uniqueName);
        if (!selectedWidget)
            return;

        devtools.inspectedWindow.eval(`inspect($$('${selectedWidget.widgetData.domNodeSelector}')[0])`);
        return;
    }

    if (event.target.classList.contains('save-as-temp-variable-button')) {
        const selectedWidget = flatData.find((widget) => widget.widgetData.uniqueName === uniqueName);
        if (!selectedWidget)
            return;

        devtoolsPanelConnection.postMessage({
            name: 'saveAsTempVariable',
            selector: selectedWidget.widgetData.domNodeSelector,
        });
        return;
    }

    if (targetDiv.classList.contains('widget-item')) {
        if (selectUniqueId) {
            console.log("removing active class from", selectUniqueId);
            const selectedDiv = document.querySelector(`[data-unique-name="${selectUniqueId}"]`);
            if (selectedDiv)
                selectedDiv.classList.remove('active');
        }
        selectUniqueId = uniqueName;
        targetDiv.classList.add('active');
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
        const data = JSON.parse((await devtools.inspectedWindow.eval(`window.__SERENITY_DEVTOOLS__.getWidgets()`)) as unknown as string) as Widget[];
        const stack: { widget: Widget, level: number, activeChild: boolean, parentSelector?: string }[] = data.map((widget) =>
            ({ widget: widget, level: 1, activeChild: false })
        );

        let newHtml = `<div class="grid grid-cols-2 gap-4"><div class="overflow-auto p-2 left-part">`;
        let selectedWidget: Widget | null = null;

        while (stack.length) {
            const { widget, level, activeChild, parentSelector } = stack.shift()!;
            const isSelected = widget.widgetData.uniqueName === selectUniqueId;
            if (isSelected) {
                selectedWidget = widget;
            }

            newHtml += `<div class="` +
                (isSelected ? 'active ' : '') +
                (activeChild ? 'active-child ' : '')
                + `widget-item" style="padding-left: ${((level - 1) * 15) + 7}px;" data-unique-name="${escapeHtml(widget.widgetData.uniqueName)}">`;
            newHtml += `<h1>${escapeHtml(widget.widgetName)} ${escapeHtml(widget.name ?? '')}</h1>`;
            newHtml += "</div>";

            widget.children?.toReversed().forEach((child) => {
                stack.unshift({ widget: child, level: level + 1, activeChild: activeChild || isSelected, parentSelector: widget.widgetData.domNodeSelector });
            });

            if (flatData.some((w) => w.widgetData.domNodeSelector === widget.widgetData.domNodeSelector)) {
                if (parentSelector) {
                    widget.widgetData.domNodeSelector = parentSelector + " " + widget.widgetData.domNodeSelector;
                }
            }

            flatData.push(widget);
        }

        newHtml += "</div>";

        if (selectedWidget) {
            newHtml += `<div class="border p-2 m-2 ps-0" data-unique-name="${escapeHtml(selectedWidget.widgetData.uniqueName)}">`;
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

