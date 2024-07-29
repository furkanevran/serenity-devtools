import type { Widget } from "../utils/fetchWidgets";
import { sendMessage } from "../utils/port";


export function WidgetListItem({ widget, isSelected, setActive }: 
    { widget: Widget; isSelected: boolean; setActive: (widget: Widget) => void }) {

    return (
        <div className={`p-2 cursor-pointer ${isSelected ? "bg-blue-500" : ""}`}
        onMouseEnter={() => sendMessage({name: "highlight", selector: widget.widgetData.domNodeSelector})}
        onMouseLeave={() => sendMessage({name: "unhighlight"})}
            style={{ marginLeft: widget.level * 10 }}
            onClick={() => setActive(widget)}>
            {widget.displayName}
        </div>
    );
}
