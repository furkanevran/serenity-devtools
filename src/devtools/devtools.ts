const globalAny: any = globalThis;
const browser: any = typeof globalAny.browser === 'undefined' ? globalAny.chrome : globalAny.browser ;

console.log('devtools.ts');

browser.devtools.panels.create(
    "Serenity",
    "devtools/devtools.png",
    "devtools/panel/panel.html",
    function () {
        console.log('Panel created');
    }
);