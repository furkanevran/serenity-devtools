chrome.devtools.panels.create(
    "Serenity",
    "devtools/devtools.png",
    "devtools/panel/panel.html",
    (p: any) => {
        if (!p) {
            return;
        }

        p.onShown.addListener(() => {
            console.log('panel shown');
        });

        p.onHidden.addListener(() => {
            console.log('panel hidden');
        });
    }
);