import { Widget } from "./WidgetList";


export function WidgetListItem({ widget, selectedUniqueName, setActive }: 
    { widget: Widget; selectedUniqueName: string | null; setActive: (widget: Widget) => void }) {

    return (
        <div className={`p-2 cursor-pointer ${selectedUniqueName === widget.name ? "bg-blue-500" : ""}`}
            style={{ marginLeft: widget.level * 10 }}
            onClick={() => setActive(widget)}>
            {widget.widgetName}
        </div>
    );
}
