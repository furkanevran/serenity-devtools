import { useContext, useEffect, useState } from "react";
import { WidgetDetails } from "./WidgetDetails";
import { WidgetList } from "./WidgetList";
import { FaStopCircle, FaPlayCircle } from "react-icons/fa";
import { onMessage, sendMessage } from "../utils/port";
import { SelectedWidgetContext } from "../utils/SelectedWidgetContext";

export function Panel() {
    const [isInspecting, setIsInspecting] = useState(false);
    const { selectedWidget, showOnlyVisible, setShowOnlyVisible } = useContext(SelectedWidgetContext);

    useEffect(() => {
        onMessage("stop-inspecting", (_message) => {
            setIsInspecting(false);
        });

        onMessage("inspected", () => {
            setIsInspecting(false);
        });
    }, []);

    useEffect(() => {
        if (isInspecting) {
            sendMessage({ name: "start-inspecting" });
            return;
        }

        sendMessage({ name: "stop-inspecting" });
    }, [isInspecting]);

    return <>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsInspecting(val => !val)}
                className={`p-2 text-white flex items-center gap-1 py-1 px-2 ${isInspecting ? "bg-red-500" : "bg-blue-500"}`}>
                {isInspecting ? <FaStopCircle /> : <FaPlayCircle />} {isInspecting ? "Stop" : "Start"} Inspecting</button>

            <button onClick={() => setShowOnlyVisible(!showOnlyVisible)}
                className={`p-2 text-white flex items-center gap-1 py-1 px-2 ${showOnlyVisible ? "bg-blue-500" : "bg-gray-500"}`}>Only Show Visible</button>
        </div>

        <div className={`grid grid-flow-col grid-cols-${selectedWidget ? "2" : "1"} h-full flex-shrink-1 overflow-y-auto`}>
            <WidgetList />
            {selectedWidget && <WidgetDetails />}
        </div>
    </>;
}
