import ReactJson from 'react-json-view'
import { SelectedWidgetContext } from '../utils/SelectedWidgetContext';
import { useContext } from 'react';

export function WidgetDetails() {
    const { selectedWidget } = useContext(SelectedWidgetContext);

    if (!selectedWidget) {
        return <div className="border border-gray-900 bg-gray-900 ms-2 rounded-md">No widget selected</div>
    }

    return <div className="border border-gray-900 ms-2 rounded-md max-w-full overflow-auto">
        <ReactJson src={selectedWidget.widgetData} theme="monokai" collapsed={1} />
    </div>
}
