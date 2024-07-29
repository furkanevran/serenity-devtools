import { devtools } from "webextension-polyfill";

export type Widget = {
    widgetData: any & { domNodeSelector: string };
    widgetName: string;
    name: string | null;
    displayName: string;
    level: number;
    children: Widget[];
}

export const fetchWidgets = async (setValue: (data: Widget[]) => void) => {
    // TODO: aggregate widgets into a flat map with the level on the window script
    const dataString = await devtools.inspectedWindow.eval(`window.__SERENITY_DEVTOOLS__.getWidgets()`) as unknown as string;
    const data = JSON.parse(dataString) as Widget[];
    const stack: { widget: Widget; level: number; parentIdPrefix: string; }[] = data.map((widget) => ({ widget: widget, level: 1, parentIdPrefix: '' })
    );

    const newData: Widget[] = [];

    while (stack.length > 0) {
        const { widget, level, parentIdPrefix } = stack.shift()!;
        const currParentIdPrefix = parentIdPrefix && "#" + parentIdPrefix;
        widget.displayName ??= widget.widgetName;

        if (widget.widgetData.domNodeSelector.startsWith(currParentIdPrefix)) {
            widget.displayName = widget.widgetData.domNodeSelector.replace(currParentIdPrefix, '');
        }

        widget.children?.toReversed().forEach((child) => {
            stack.unshift({ widget: child, level: level + 1, parentIdPrefix: widget.widgetData.idPrefix ?? currParentIdPrefix });
        });

        widget.level = level;
        newData.push(widget);
    }

    setValue(newData);
};
