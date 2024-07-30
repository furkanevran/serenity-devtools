
import { WidgetInfo } from "@/types/widgetType";
import { sendMessage } from "../utils/port";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useContext, useState } from "react";
import { SelectedWidgetContext } from "../utils/SelectedWidgetContext";

export function WidgetListItem({ widget }: { widget: WidgetInfo}) {
    const [collapsed, setCollapsed] = useState(false);
    const {selectedWidget, changeSelectedWidget} = useContext(SelectedWidgetContext);
    const isSelected = selectedWidget?.domNodeSelector === widget.domNodeSelector;

    return (
        <div className={`p-2 cursor-pointer border-l-2 border-blue-900 ${isSelected ? "bg-blue-600" : ""}`}
            onMouseEnter={() => sendMessage({ name: "highlight", selector: widget.domNodeSelector })}
            onMouseLeave={() => sendMessage({ name: "unhighlight" })}
        >
            <div className="flex flex-row items-center gap-1">
                {widget.children.length > 0 && (collapsed ? <FaChevronRight onClick={() => setCollapsed(false)} /> : <FaChevronDown onClick={() => setCollapsed(true)} />)}
                <p className="w-full h-full" onClick={() => changeSelectedWidget(widget)}>{widget.displayName}</p>
            </div>

            {!collapsed && widget.children.length > 0 && <div className={`ml-2 ${isSelected ? "bg-blue-900" : ""}`}>
                {widget.children.map((child) => (
                    <WidgetListItem key={child.domNodeSelector} widget={child} />
                ))}</div>}

        </div>
    );
}
