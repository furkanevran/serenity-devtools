export type MessageTypes = {
    "init": {
        tabId?: number;
    };
    "stop-inspecting": unknown;
    "deactivated": unknown;
    "activated": unknown;
    "start-inspecting": unknown;
    "inspect": {
        selector: string;
    };
    "highlight": {
        selector: string;
    };
    "unhighlight": unknown;
    "open-source": {
        selector: string;
        path?: (string | number)[];
    };
    "save-as-global-variable": {
        selector: string;
        explicitName?: string;
        noConsole?: boolean;
    };
    "open-source-response": {
        tempVarName: string;
        path?: (string | number)[];
    };
    "inspected": {
        uniqueName: string;
    };
};

export type MessageKeys = keyof MessageTypes;
export type MessageValue<T extends MessageKeys> = { name: T } & MessageTypes[T];

export type MessageValues = {
    [K in MessageKeys]: MessageValue<K>;
}[MessageKeys];

export type MessageHandler<T> = (message: MessageValue<T>) => void;
export type MessageHandlers = Partial<{
    [K in MessageKeys]: MessageHandler<K>[];
}>;

export type WindowMessageValues = {
    namespace: "is.serenity.devtools" | "is.serenity.devtools/window-script";
} & MessageValues;