import type { Widget } from "../utils/fetchWidgets";


export function WidgetListItem({ widget, isSelected, setActive }: 
    { widget: Widget; isSelected: boolean; setActive: (widget: Widget) => void }) {

    return (
        <div className={`p-2 cursor-pointer ${isSelected ? "bg-blue-500" : ""}`}
            style={{ marginLeft: widget.level * 10 }}
            onClick={() => setActive(widget)}>
            {widget.displayName}
        </div>
    );
}
