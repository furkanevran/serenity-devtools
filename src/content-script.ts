import browser from "webextension-polyfill";
import page from "url:./page.ts";

console.log('content-script.ts');

const script = document.createElement("script");
script.src = page;
document.documentElement.appendChild(script);
