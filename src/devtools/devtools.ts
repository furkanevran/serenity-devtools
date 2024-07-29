import browser from 'webextension-polyfill';

(async () => {
    const p = await browser.devtools.panels.create(
        "Serenity",
        "devtools/devtools.png",
        "devtools/panel/panel.html",
    );

    p.onShown.addListener(() => {
        console.log('panel shown');
    });

    p.onHidden.addListener(() => {
        console.log('panel hidden');
    });
})();