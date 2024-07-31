import { useContext, useEffect, useState } from "react";
import { WidgetListItem } from "./WidgetListItem";
import { fetchWidgets } from "../utils/fetchWidgets";
import { SelectedWidgetContext } from "../utils/SelectedWidgetContext";
import { onMessage, removeMessageListener } from "../utils/port";
import { WidgetInfo } from "@/types/widgetType";
import { MessageValue } from "@/types/messageTypes";

const findActiveWidget = (data: WidgetInfo[], uniqueName?: string): WidgetInfo | null => {
    if (!uniqueName) return null;
    const active = data.find((widget) => widget.uniqueName === uniqueName);
    if (active)
        return active;

    for (const widget of data) {
        const child = findActiveWidget(widget.children, uniqueName);
        if (child)
            return child;
    }

    return null;
}

export function WidgetList() {
    const [data, setData] = useState<WidgetInfo[]>([]);
    const { selectedWidget, setSelectedWidget } = useContext(SelectedWidgetContext);

    useEffect(() => {
        fetchWidgets(selectedWidget?.domNodeSelector ?? null, setData);
        const timer = setInterval(fetchWidgets, 500, selectedWidget?.domNodeSelector ?? null, setData);
        return () => clearInterval(timer);
    }, [selectedWidget]);

    useEffect(() => {
        const activeWidget = findActiveWidget(data, selectedWidget?.uniqueName);
        if (selectedWidget && !activeWidget) {
            setSelectedWidget(null);
        } else if (activeWidget) {
            setSelectedWidget(activeWidget);
        }

        const handleInspected = (message: MessageValue<"inspected">) => {
            if (!message.uniqueName)
                return;

            const widget = findActiveWidget(data, message.uniqueName);
            if (!widget)
                return;

            setSelectedWidget(widget);
        }

        onMessage("inspected", handleInspected);
        return () => removeMessageListener("inspected", handleInspected);
    }, [data]);

    return (
        <div className="h-100 overflow-y-auto">
            {
                data.map((widget) => (
                    <WidgetListItem key={widget.name} widget={widget} />
                ))
            }</div>
    )
}

