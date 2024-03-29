import { devtools } from 'webextension-polyfill';

const RETRY_INTERVAL = 300;
let retryCount = 10;
let hasSerenity: boolean = false;

const checkSerenity = async () => {
    const [serenityAvailable] = await devtools.inspectedWindow.eval(`typeof window.Serenity !== "undefined"`);
    if (serenityAvailable) {
        document.body.innerHTML = "<h1>Serenity is present</h1>";
        hasSerenity = true;
        return;
    }

    document.body.innerHTML = "<h1>Error</h1>";
    document.body.innerHTML += `<p class="text-red-600">Serenity is not present</p>`;
    hasSerenity = false;

    if (retryCount <= 0) {
        return;
    }

    retryCount--;
    window.setTimeout(checkSerenity, RETRY_INTERVAL);
}

const init = async () => {
    retryCount = 10;
    await checkSerenity();
    if (!hasSerenity)
        return;
}

devtools.network.onNavigated.addListener(async () => {
    init();
});

init();

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