import { Widget, WidgetInfo } from "@/types/widgetType";
import { createContext, useState } from "react";
import { sendMessage } from "./port";

export type SelectedWidgetType = {
    selectedWidget: WidgetInfo | Widget | null;
    setSelectedWidget: (widget: WidgetInfo | null) => void;
    changeSelectedWidget: (widget: WidgetInfo | null) => void;
    showOnlyVisible: boolean;
    setShowOnlyVisible: (value: boolean) => void;
}

export const SelectedWidgetContext = createContext<SelectedWidgetType>({
    selectedWidget: null,
    setSelectedWidget: () => { },
    changeSelectedWidget: () => { },
    showOnlyVisible: false,
    setShowOnlyVisible: () => { }
});

export function DevtoolsContextProvider({ children }: { children: React.ReactNode }) {
    const [selectedWidget, setSelectedWidget] = useState<WidgetInfo | null>(null);
    const [showOnlyVisible, setShowOnlyVisible] = useState(false);

    const setActive = (widget: WidgetInfo | null) => {
        if (selectedWidget?.domNodeSelector === widget?.domNodeSelector || !widget) {
            setSelectedWidget(null);
            return;
        }

        setSelectedWidget(widget);
        sendMessage({ name: "save-as-global-variable", selector: widget.domNodeSelector, explicitName: "$$0", noConsole: true });
    }

    return (
        <SelectedWidgetContext.Provider value={{ selectedWidget, setSelectedWidget, showOnlyVisible, setShowOnlyVisible, changeSelectedWidget: setActive }}>
            {children}
        </SelectedWidgetContext.Provider>
    );
}
