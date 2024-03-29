import browser from 'webextension-polyfill';

const RETRY_INTERVAL = 300;
let retryCount = 10;
let hasSerenity: boolean = false;

const checkSerenity = async () => {
    const [serenityAvailable] = await browser.devtools.inspectedWindow.eval(`typeof window.Serenity !== "undefined"`);
    if (serenityAvailable) {
        document.body.innerHTML = "<h1>Success</h1>";
        hasSerenity = true;
        return;
    }

    document.body.innerHTML = "<h1>Error</h1>";
    document.body.innerHTML += `<p class="text-red-600">Serenity is not present</p>`;

    if (retryCount <= 0) {
        return;
    }

    retryCount--;
    window.setTimeout(checkSerenity, RETRY_INTERVAL);
}

const init = async () => {
    //get all dom nodes
    setInterval(async () => {
        const [nodeNames] = await browser.devtools.inspectedWindow.eval(`[...document.querySelectorAll('*')].map(x => Serenity.tryGetWidget(x)).filter(x => x).map(x => Serenity.getTypeFullName(Serenity.getInstanceType(x)))`);
        document.body.innerHTML = "";
        for (const name of nodeNames) {
            document.body.innerHTML += `<p>${name}</p>`;
        }
    }, 1000);
}


browser.devtools.network.onNavigated.addListener(async () => {
    retryCount = 10;
    await checkSerenity();
    if (!hasSerenity)
        return;

    await init();
});

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