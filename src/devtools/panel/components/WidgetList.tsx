import { useContext, useEffect, useState } from "react";
import { WidgetListItem } from "./WidgetListItem";
import { fetchWidgets, Widget } from "../utils/fetchWidgets";
import { SelectedWidgetContext } from "../utils/SelectedWidgetContext";
import { onMessage, removeMessageListener } from "../utils/port";
import { MessageValue } from "@/utils/messageTypes";

export function WidgetList() {
    const [data, setData] = useState<Widget[]>([]);
    const { selectedWidget, setSelectedWidget } = useContext(SelectedWidgetContext);

    const setActive = (widget: Widget) => {
        if (selectedWidget?.widgetData.domNodeSelector === widget.widgetData.domNodeSelector) {
            setSelectedWidget(null);
            return;
        }

        setSelectedWidget(widget);
    }

    useEffect(() => {
        fetchWidgets(setData);
        const timer = setInterval(fetchWidgets, 1000, setData);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const activeWidget = data.find((widget) => widget.widgetData.domNodeSelector === selectedWidget?.widgetData.domNodeSelector);
        if (selectedWidget && !activeWidget) {
            setSelectedWidget(null);
        } else if (activeWidget) {
            setSelectedWidget(activeWidget);
        }

        const handleInspected = (message: MessageValue<"inspected">) => {
            if (!message.uniqueName) return;
            const widget = data.find((widget) => widget.widgetData.uniqueName === message.uniqueName);
            if (!widget) return;
            setSelectedWidget(widget);
        }

        onMessage("inspected", handleInspected);
        return () => removeMessageListener("inspected", handleInspected);
    }, [data]);

    return (
        <div className="h-100 overflow-y-auto">{
            data.map((widget) => (
                <WidgetListItem key={widget.name} widget={widget}
                    isSelected={widget.widgetData.domNodeSelector === selectedWidget?.widgetData.domNodeSelector} setActive={setActive} />
            ))
        }</div>
    )
}

