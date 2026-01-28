declare let chrome: any;

export const evalInInspectedWindow = (expression: string): Promise<[any, any]> => {
    return new Promise((resolve) => {
        // Try using the Chrome API directly if available, as it's the source of truth
        if (typeof chrome !== 'undefined' && chrome.devtools && chrome.devtools.inspectedWindow) {
             chrome.devtools.inspectedWindow.eval(expression, (result: any, exceptionInfo: any) => {
                 resolve([result, exceptionInfo]);
             });
             return;
        }

        // If chrome is not available, we can't really do anything without the polyfill
        resolve([null, { isError: true, description: "Chrome DevTools API not found" }]);
    });
};
