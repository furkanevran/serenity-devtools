
import { WidgetInfo } from "@/types/widgetType";
import { sendMessage } from "../utils/port";
import { useContext, useState } from "react";
import { SelectedWidgetContext } from "../utils/SelectedWidgetContext";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

export function WidgetListItem({ widget }: { widget: WidgetInfo }) {
    const [collapsed, setCollapsed] = useState(false);
    const { selectedWidget, changeSelectedWidget, showOnlyVisible } = useContext(SelectedWidgetContext);
    const isSelected = selectedWidget?.domNodeSelector === widget.domNodeSelector;

    return (
        <div className={`ms-1 cursor-pointer border-l-2 transition-colors border-blue-900 ${isSelected ? "bg-blue-600" : ""} ${widget.isVisible ? "border-green-500" : ""}`}
            onMouseEnter={() => sendMessage({ name: "highlight", selector: widget.domNodeSelector })}
            onMouseLeave={() => sendMessage({ name: "unhighlight" })}
        >
            {(!showOnlyVisible || widget.isVisible) && (
                <div className="flex flex-row items-center ms-2">
                    {widget.children.length > 0 && (collapsed ? <FaChevronRight onClick={() => setCollapsed(false)} /> : <FaChevronDown onClick={() => setCollapsed(true)} />)}
                    <p className="w-full h-full p-2" onClick={() => changeSelectedWidget(widget)}>{widget.displayName}
                        {widget.name && widget.displayName !== widget.name && <span className="text-gray-400"> ({widget.name})</span>}
                    </p>
                </div>
            )}

            {!collapsed && widget.children.length > 0 && <div className={`ml-2 ${isSelected ? "bg-blue-900" : ""}`}>
                {widget.children.map((child) => (
                    <WidgetListItem key={child.domNodeSelector} widget={child} />
                ))}</div>}

        </div>
    );
}
