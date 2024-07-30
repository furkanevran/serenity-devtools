import { WidgetInfo } from "@/types/widgetType";
import { createContext, useState } from "react";


export type SelectedWidgetType = {
    selectedWidget: WidgetInfo | null;
    setSelectedWidget: (widget: WidgetInfo | null) => void;
    changeSelectedWidget: (widget: WidgetInfo | null) => void;
}

export const SelectedWidgetContext = createContext<SelectedWidgetType>({ selectedWidget: null, setSelectedWidget: () => { }, changeSelectedWidget: () => { } });

export function SelectedWidgetContextProvider({ children }: { children: React.ReactNode }) {
    const [selectedWidget, setSelectedWidget] = useState<WidgetInfo | null>(null);

    const setActive = (widget: WidgetInfo | null) => {
        if (selectedWidget?.domNodeSelector === widget?.domNodeSelector || !widget) {
            setSelectedWidget(null);
            return;
        }

        setSelectedWidget(widget);
    }

    return (
        <SelectedWidgetContext.Provider value={{ selectedWidget, setSelectedWidget, changeSelectedWidget: setActive }}>
            {children}
        </SelectedWidgetContext.Provider>
    );
}
