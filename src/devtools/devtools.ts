import browser from 'webextension-polyfill';

(async () => {
    await browser.devtools.panels.create(
        "Serenity",
        "devtools/devtools.png",
        "devtools/panel/panel.html",
    );
})();