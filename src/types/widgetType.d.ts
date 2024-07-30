export type WidgetInfo = {
    uniqueName: string;
    domNodeSelector: string;
    displayName: string;
    name: string;
    typeName: string;
    children: WidgetInfo[];
    parentIdPrefix: string;
}

export type Widget = {
    widgetData: Record<string, unknown>;
} & WidgetInfo;