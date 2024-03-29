import { devtools, runtime } from 'webextension-polyfill';

const RETRY_INTERVAL = 300;
let retryCount = 10;
let hasSerenity: boolean = false;

const checkSerenity = async () => {
    return new Promise<void>((resolve) => {
        const check =  async () => {
            const [serenityAvailable] = await devtools.inspectedWindow.eval(`typeof window.Serenity !== "undefined"`);
            if (serenityAvailable) {
                document.body.innerHTML = "<h1>Serenity is present</h1>";
                hasSerenity = true;
                resolve();
                return;
            }

            document.body.innerHTML = "<h1>Error</h1>";
            document.body.innerHTML += `<p class="text-red-600">Serenity is not present</p>`;
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
        // setTimeout(async () => {
        //     const [serenityAvailable] = await devtools.inspectedWindow.eval(`typeof window.Serenity !== "undefined"`);
        //     if (serenityAvailable) {
        //         document.body.innerHTML = "<h1>Serenity is present</h1>";
        //         hasSerenity = true;
        //         resolve();
        //         return;
        //     }

        //     document.body.innerHTML = "<h1>Error</h1>";
        //     document.body.innerHTML += `<p class="text-red-600">Serenity is not present</p>`;
        //     hasSerenity = false;

        //     if (retryCount <= 0) {
        //         resolve();
        //         return;
        //     }

        //     retryCount--;
        //     await checkSerenity();
        //     resolve();
        // }, RETRY_INTERVAL);
    });
}

const init = async () => {
    retryCount = 10;
    await checkSerenity();
    if (!hasSerenity) {
        document.body.innerHTML += "<h1>fail</h1>";
        return;
    }

    document.body.innerHTML += "<h1>aaa</h1>";

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

    document.body.innerHTML += "<h1>" + devtools.inspectedWindow.tabId + "</h1>";
}

devtools.network.onNavigated.addListener(async () => {
    window.location.reload();
});

runtime.onInstalled.addListener(async () => {
    window.location.reload();
});

(async () => {
    await init();
    document.body.innerHTML += "<h1>init</h1>";
})();

console.log('panel.ts');
// (async () => {
//     const hasSerenity = await sendMessage("hasSerenity", false);
//     console.log('hasSerenity', hasSerenity);

//     if (hasSerenity) {
//         document.body.innerHTML = "<h1>Serenity is present</h1>";
//     } else {
//         document.body.innerHTML = "<h1>Serenity is not present</h1>";
//     }
// })();