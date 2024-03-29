import { devtools, runtime } from 'webextension-polyfill';

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

const init = async () => {
    retryCount = 10;
    await checkSerenity();
    if (!hasSerenity) {
        return;
    }

    const devtoolsPanelConnection = runtime.connect({
        name: 'panel',
    });

    devtoolsPanelConnection.onMessage.addListener((message) => {
        console.log('panel message', message);
        document.body.innerHTML += `<h1>${JSON.stringify(message)}</h1>`;
    });

    devtoolsPanelConnection.postMessage({
        name: 'init',
        tabId: devtools.inspectedWindow.tabId,
    });

    setInterval(async () => {
        document.body.innerHTML = '';
        const data: Widget[] = JSON.parse((await devtools.inspectedWindow.eval(`window.__SERENITY_DEVTOOLS__.getWidgets()`)) as unknown as string);
        const queue: { widget: Widget, level: number }[] = data.map((widget) => ({ widget: widget, level: 1 }));

        while (queue.length) {
            const { widget, level } = queue.shift()!;

            const widgetElement = document.createElement('div');
            widgetElement.className = 'border p-2 m-2';
            widgetElement.style.paddingLeft = `${level * 10}px`;
            widgetElement.innerHTML = `<h1>${widget.widgetName} ${widget.name ?? ''}</h1>`;
            widgetElement.addEventListener('click', () => {
                // devtoolsPanelConnection.postMessage({
                //     name: 'inspect',
                //     selector: widget.widgetData.domNodeSelector,
                // });
                devtools.inspectedWindow.eval(`inspect($$('${widget.widgetData.domNodeSelector}')[0])`);
            });
            document.body.appendChild(widgetElement);

            widget.children?.forEach((child) => {
                queue.push({ widget: child, level: level + 1 });
            });
        }
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

