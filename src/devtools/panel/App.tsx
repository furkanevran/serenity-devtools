import { useEffect, useState } from "react";
import { Panel } from "./components/Panel";
import { createRoot } from "react-dom/client";
import { devtools } from "webextension-polyfill";
import { FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { DevtoolsContextProvider } from "./utils/SelectedWidgetContext";

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root element not found');
}

function App() {
    const [hasSerenity, setHasSerenity] = useState<null | boolean>(null);

    useEffect(() => {
        if (hasSerenity !== null) {
            return;
        }

        let timeout: number;
        let retryCount = 10;

        const checkSerenity = async () => {
            if (retryCount <= 0) {
                setHasSerenity(false);
                return;
            }

            const [serenityAvailable] = await devtools.inspectedWindow.eval(`typeof window.Serenity !== "undefined"`);
            if (serenityAvailable) {
                setHasSerenity(true);
                return;
            }

            setHasSerenity(null);
            retryCount--;
            timeout = setTimeout(checkSerenity, 300);
        };

        checkSerenity();
        return () => clearTimeout(timeout);
    }, [hasSerenity]);

    useEffect(() => {
        const navigatedEventListener = () => {
            setHasSerenity(null);
        };

        devtools.network.onNavigated.addListener(navigatedEventListener);
        return () => devtools.network.onNavigated.removeListener(navigatedEventListener);
    }, []);

    return (
        <DevtoolsContextProvider>
            {hasSerenity ? <Panel /> : (<div className="select-none w-100 h-full flex flex-col justify-center items-center">
                {hasSerenity === false && (<>
                    <h1 className="text-red-600 text-xl flex items-center gap-2 justify-center"><FaExclamationTriangle />  Serenity not found</h1>
                </>)}
                {hasSerenity === null && (<>
                    <h1 className="animate-pulse text-xl flex items-center gap-2 justify-center"><FaSpinner className="animate-spin" />  Checking...</h1>
                    <span className="text-gray-500 text-sm">Checking if Serenity is present</span>
                </>)}
            </div>)}
        </DevtoolsContextProvider>);
}

const root = createRoot(container);
root.render(<App />);
