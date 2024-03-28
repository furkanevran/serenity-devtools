const globalAny: any = globalThis;
const browser: any = typeof globalAny.browser === 'undefined' ? globalAny.chrome : globalAny.browser ;

console.log('devtools.ts');

browser.devtools.panels.create(
    "Serenity",
    "devtools.png",
    "devtools.html",
    function (panel: any) {
        console.log('Panel created');
    }
);