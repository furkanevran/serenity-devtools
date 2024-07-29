import { useEffect, useState } from "react";
import { WidgetDetails } from "./WidgetDetails";
import { WidgetList } from "./WidgetList";
import { FaStopCircle, FaPlayCircle } from "react-icons/fa";
import { onMessage } from "../utils/port";

export function Panel() {
    const [isInspecting, setIsInspecting] = useState(false);
    const [selectedUniqueName, setSelectedUniqueName] = useState<string | null>(null);

    useEffect(() => {
        onMessage("stop-inspecting", (_message) => {
            setIsInspecting(false);
        });
    }, []);

    return <>
        <div>
            <button onClick={() => setIsInspecting(val => !val)}
                className={`p-2 text-white flex items-center gap-1 py-1 px-2 ${isInspecting ? "bg-red-500" : "bg-blue-500"}`}>
                {isInspecting ? <FaStopCircle /> : <FaPlayCircle />} {isInspecting ? "Stop" : "Start"} Inspecting</button>
        </div>

        <div className={`grid grid-flow-col grid-cols-${selectedUniqueName ? "2" : "1"} h-full flex-shrink-1 overflow-y-auto`}>
            <WidgetList selectedUniqueName={selectedUniqueName} setSelectedUniqueName={setSelectedUniqueName} />
            {selectedUniqueName && <WidgetDetails uniqueName={selectedUniqueName!} />}
        </div>
    </>;
}
