import { WidgetInfo } from "@/types/widgetType";


import { evalInInspectedWindow } from "./devtoolsEval";

export const fetchWidgets = async (selectedDomNodeSelector: string | null, setValue: (data: WidgetInfo[]) => void) => {
    const [evalResult] = await evalInInspectedWindow(`window.__SERENITY_DEVTOOLS__.getWidgets(${JSON.stringify(selectedDomNodeSelector)})`);
    const dataString = evalResult as string;
    
    if (!dataString) {
      return; 
    }

    const data = JSON.parse(dataString) as WidgetInfo[];
    setValue(data);
};
