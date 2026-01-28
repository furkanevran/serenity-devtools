import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { WidgetListItem } from "./WidgetListItem";
import { fetchWidgets } from "../utils/fetchWidgets";
import { SelectedWidgetContext } from "../utils/SelectedWidgetContext";
import { onMessage, removeMessageListener, sendMessage } from "../utils/port";
import { WidgetInfo } from "@/types/widgetType";
import { MessageValue } from "@/types/messageTypes";

const findActiveWidget = (
  data: WidgetInfo[],
  uniqueName?: string,
): WidgetInfo | null => {
  if (!uniqueName) return null;
  const active = data.find((widget) => widget.uniqueName === uniqueName);
  if (active) return active;

  for (const widget of data) {
    const child = findActiveWidget(widget.children, uniqueName);
    if (child) return child;
  }

  return null;
};

// Flatten the widget tree into a list for keyboard navigation
const flattenWidgets = (widgets: WidgetInfo[], showOnlyVisible: boolean): WidgetInfo[] => {
  const result: WidgetInfo[] = [];
  for (const widget of widgets) {
    if (!showOnlyVisible || widget.isVisible) {
      result.push(widget);
      result.push(...flattenWidgets(widget.children, showOnlyVisible));
    }
  }
  return result;
};

export function WidgetList() {
  const [data, setData] = useState<WidgetInfo[]>([]);
  const { selectedWidget, setSelectedWidget, changeSelectedWidget, showOnlyVisible } = useContext(
    SelectedWidgetContext,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    fetchWidgets(selectedWidget?.domNodeSelector ?? null, setData);
    const timer = setInterval(
      fetchWidgets,
      500,
      selectedWidget?.domNodeSelector ?? null,
      setData,
    );
    return () => clearInterval(timer);
  }, [selectedWidget]);

  useEffect(() => {
    const activeWidget = findActiveWidget(data, selectedWidget?.uniqueName);
    if (selectedWidget && !activeWidget) {
      setSelectedWidget(null);
    } else if (activeWidget && activeWidget !== selectedWidget) {
      setSelectedWidget(activeWidget);
    } else if (!selectedWidget && !restoredRef.current && data.length > 0) {
      // Restore last selected widget on initial load
      const storedUniqueName = localStorage.getItem("lastSelectedUniqueName");
      console.log("Attempting to restore widget:", storedUniqueName, "data.length:", data.length);
      if (storedUniqueName) {
        const lastWidget = findActiveWidget(data, storedUniqueName);
        console.log("Found last widget:", lastWidget);
        if (lastWidget) {
          restoredRef.current = true; // Only mark restored if we found the widget
          setSelectedWidget(lastWidget);
          setTimeout(() => {
            const element = containerRef.current?.querySelector(`[data-unique-name="${CSS.escape(storedUniqueName)}"]`);
            console.log("Scrolling to element:", element);
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      } else {
        restoredRef.current = true; // No stored widget, mark as restored
      }
    }

    const handleInspected = (message: MessageValue<"inspected">) => {
      if (!message.uniqueName) return;

      const widget = findActiveWidget(data, message.uniqueName);
      if (!widget) return;

      setSelectedWidget(widget);
      
      setTimeout(() => {
        const element = containerRef.current?.querySelector(`[data-unique-name="${CSS.escape(message.uniqueName)}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 0);
    };

    onMessage("inspected", handleInspected);
    return () => removeMessageListener("inspected", handleInspected);
  }, [data, selectedWidget]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    
    e.preventDefault();
    const flatList = flattenWidgets(data, showOnlyVisible);
    if (flatList.length === 0) return;

    const currentIndex = selectedWidget 
      ? flatList.findIndex(w => w.domNodeSelector === selectedWidget.domNodeSelector)
      : -1;

    let newIndex: number;
    if (e.key === "ArrowDown") {
      newIndex = currentIndex < flatList.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : flatList.length - 1;
    }

    const newWidget = flatList[newIndex];
    sendMessage({ name: "highlight", selector: newWidget.domNodeSelector });
    changeSelectedWidget(newWidget);
  }, [data, selectedWidget, showOnlyVisible, changeSelectedWidget]);

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto focus:outline-none" 
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {data.map((widget) => (
        <WidgetListItem key={widget.name} widget={widget} />
      ))}
    </div>
  );
}
