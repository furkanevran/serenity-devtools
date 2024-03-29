console.log('window-script.ts', typeof (globalThis as any)["Serenity"]);

// postmessage
window.postMessage({
    name: 'init',
    namespace: 'com.serenity.devtools',
});


setInterval(() => {
    window.postMessage({
        name: 'test',
        namespace: 'com.serenity.devtools',
    });
}, 1000);