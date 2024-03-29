import { setNamespace } from "webext-bridge/window";
setNamespace("Serenity.DevTools");

// onMessage("hasSerenity", async () => {
//     console.log('hasSerenity');
//     return typeof (window as any).Serenity !== "undefined";
// });

// setInterval(() => {
//     sendMessage("hasSerenity", typeof (window as any).Serenity !== "undefined");
// }, 100);

console.log('page.ts');