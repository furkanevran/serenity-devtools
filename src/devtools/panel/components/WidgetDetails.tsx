import { JSONTree, KeyPath } from 'react-json-tree';
import { SelectedWidgetContext } from '../utils/SelectedWidgetContext';
import { useContext } from 'react';
import { devtools } from 'webextension-polyfill';
import { sendMessage } from '../utils/port';
import { FaCode, FaCodeBranch, FaExternalLinkAlt, FaPlayCircle } from 'react-icons/fa';
import { Widget } from '@/types/widgetType';

const ActionButtonClass = "bg-blue-500 text-white p-2 w-full hover:bg-blue-600 active:bg-blue-700";

const renderJSONValue = (widget: Widget, raw: any, _value: unknown, ...keyPath: KeyPath) => {
    if (typeof raw === "string") {
        if (raw.startsWith("\"[Function: ") && raw.endsWith("]\"") && keyPath[keyPath.length - 2] === "widgetData") {
            return (<>
                <span onClick={() => sendMessage({ name: "open-source", selector: widget.domNodeSelector, path: keyPath.toReversed().slice(2) })}
                    className="text-blue-500 cursor-pointer">{raw.slice(1, -1)} <FaCode className="inline ms-1" /></span>
                <FaCodeBranch onClick={() => sendMessage({ name: "save-as-global-variable", selector: widget.domNodeSelector, path: keyPath.toReversed().slice(2) })}
                    className="inline ms-1 cursor-pointer" />
                {raw.endsWith("()]\"") && <FaPlayCircle
                    onClick={() => sendMessage({ name: "run-function", selector: widget.domNodeSelector, path: keyPath.toReversed().slice(2) })}
                    className="inline ms-1 cursor-pointer" />}</>);
        }

        if (raw.startsWith("\"[DOM Node]<") && raw.endsWith(">\""))
            return (<>
                <span onClick={() => devtools.inspectedWindow.eval(`inspect(document.querySelector('${raw.slice(12, -2)}'))`)}
                    className="text-yellow-500 cursor-pointer">
                    {raw.slice(1, -1)}
                    <FaExternalLinkAlt className="text-blue-500 inline ms-1" />
                </span>
                <FaCodeBranch onClick={() => sendMessage({ name: "save-as-global-variable", selector: widget.domNodeSelector, path: keyPath.toReversed().slice(2) })}
                    className="inline ms-1 cursor-pointer" />
            </>)
    }

    return <span>{raw}</span>
}

export function WidgetDetails() {
    const { selectedWidget } = useContext(SelectedWidgetContext);

    if (!selectedWidget) {
        return <div className="border border-gray-900 bg-gray-900 mx-2 rounded-md">No widget selected</div>
    }

    return <div className="border border-gray-900 ms-2 rounded-md max-w-full overflow-auto">
        <h1 className="text-xl">{selectedWidget.displayName}
            {(selectedWidget.name && selectedWidget.displayName != selectedWidget.name) && <span className="badge text-lg text-gray-400"> ({selectedWidget.name})</span>}</h1>
        <div className="flex gap-2 items-center justify-start">
            <button className={ActionButtonClass} onClick={() => devtools.inspectedWindow.eval(`inspect(document.querySelector('${selectedWidget.domNodeSelector}'))`)}><FaExternalLinkAlt className="inline" /> Inspect DOM Node </button>
            <button className={ActionButtonClass} onClick={() => sendMessage({ name: "open-source", selector: selectedWidget.domNodeSelector })}><FaCode className="inline" /> View Code </button>
            <button className={ActionButtonClass} onClick={() => sendMessage({ name: "save-as-global-variable", selector: selectedWidget.domNodeSelector })}> <FaCodeBranch className="inline" /> Save as Global Variable </button>
        </div>

        <JSONTree data={selectedWidget} theme="monokai" invertTheme={false}
            shouldExpandNodeInitially={(keyName, data, level) => keyName[0] === "widgetData" ||
                keyName[0] === "options" ||
                level === 0}
            valueRenderer={(raw, value, ...keyPath) => renderJSONValue(selectedWidget as Widget, raw, value, ...keyPath)} />
    </div>
}
