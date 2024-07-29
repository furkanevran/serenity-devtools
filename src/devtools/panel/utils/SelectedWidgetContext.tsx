import { createContext, useState } from "react";
import { Widget } from "./fetchWidgets"

export type SelectedWidgetType = {
    selectedWidget: Widget | null;
    setSelectedWidget: (widget: Widget | null) => void;
}

export const SelectedWidgetContext = createContext<SelectedWidgetType>({ selectedWidget: null, setSelectedWidget: () => { } });

export function SelectedWidgetContextProvider({ children }: { children: React.ReactNode }) {
    const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);

    return (
        <SelectedWidgetContext.Provider value={{ selectedWidget, setSelectedWidget }}>
            {children}
        </SelectedWidgetContext.Provider>
    );
}
