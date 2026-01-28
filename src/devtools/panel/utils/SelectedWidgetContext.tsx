import { Widget, WidgetInfo } from "@/types/widgetType";
import { createContext, useState } from "react";
import { sendMessage } from "./port";

export type SelectedWidgetType = {
    selectedWidget: WidgetInfo | Widget | null;
    setSelectedWidget: (widget: WidgetInfo | null) => void;
    changeSelectedWidget: (widget: WidgetInfo | null) => void;
    showOnlyVisible: boolean;
    setShowOnlyVisible: (value: boolean) => void;
    lastSelectedUniqueName: string | null;
}

export const SelectedWidgetContext = createContext<SelectedWidgetType>({
    selectedWidget: null,
    setSelectedWidget: () => { },
    changeSelectedWidget: () => { },
    showOnlyVisible: localStorage.getItem("showOnlyVisible") === "true",
    setShowOnlyVisible: (value: boolean) => { localStorage.setItem("showOnlyVisible", value.toString()); },
    lastSelectedUniqueName: localStorage.getItem("lastSelectedUniqueName")
});

export function DevtoolsContextProvider({ children }: { children: React.ReactNode }) {
    const [selectedWidget, setSelectedWidgetState] = useState<WidgetInfo | null>(null);
    const [showOnlyVisible, setShowOnlyVisible] = useState(() => localStorage.getItem("showOnlyVisible") === "true");
    const [lastSelectedUniqueName] = useState(() => localStorage.getItem("lastSelectedUniqueName"));

    const setSelectedWidget = (widget: WidgetInfo | null) => {
        setSelectedWidgetState(widget);
        if (widget) {
            localStorage.setItem("lastSelectedUniqueName", widget.uniqueName);
        }
    };

    const setActive = (widget: WidgetInfo | null) => {
        if (selectedWidget?.domNodeSelector === widget?.domNodeSelector || !widget) {
            setSelectedWidget(null);
            sendMessage({ name: "unhighlight" });
            return;
        }

        setSelectedWidget(widget);
        sendMessage({ name: "save-as-global-variable", selector: widget.domNodeSelector, explicitName: "$$0", noConsole: true });
    }

    const setOnlyVisible = (value: boolean) => {
        setShowOnlyVisible(value);
        localStorage.setItem("showOnlyVisible", value.toString());
    }

    return (
        <SelectedWidgetContext.Provider value={{ selectedWidget, setSelectedWidget, showOnlyVisible, setShowOnlyVisible: setOnlyVisible, changeSelectedWidget: setActive, lastSelectedUniqueName }}>
            {children}
        </SelectedWidgetContext.Provider>
    );
}
