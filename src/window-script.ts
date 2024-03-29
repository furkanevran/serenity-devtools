const Serenity = (globalThis as any)["Serenity"];
console.log('window-script.ts', typeof Serenity);

if (Serenity) {
    window.postMessage({
        name: 'init',
        namespace: 'com.serenity.devtools',
    });

    window.addEventListener('message', (event) => {
        if (event.source !== window || event.data?.namespace !== 'com.serenity.devtools') {
            return;
        }

        console.log('window-script.ts', event.data);
    });
}

