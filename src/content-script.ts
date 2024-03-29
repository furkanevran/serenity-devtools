import page from "url:./page.ts";
import { allowWindowMessaging } from "webext-bridge/content-script"

allowWindowMessaging("Serenity.DevTools");

console.log('content-script.ts');

const script = document.createElement("script");
script.src = page;
document.documentElement.appendChild(script);
