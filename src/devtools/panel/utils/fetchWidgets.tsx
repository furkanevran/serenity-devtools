import { WidgetInfo } from "@/types/widgetType";
import { devtools } from "webextension-polyfill";


export const fetchWidgets = async (selectedDomNodeSelector: string | null, setValue: (data: WidgetInfo[]) => void) => {
    const dataString = await devtools.inspectedWindow.eval(`window.__SERENITY_DEVTOOLS__.getWidgets(${JSON.stringify(selectedDomNodeSelector)})`) as unknown as string;
    const data = JSON.parse(dataString) as WidgetInfo[];
    setValue(data);
};
