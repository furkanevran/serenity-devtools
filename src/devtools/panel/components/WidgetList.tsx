export function WidgetList({ selectedUniqueName, setSelectedUniqueName }:
    { selectedUniqueName: string | null, setSelectedUniqueName: (name: string | null) => void }) {
    return (
        <div
            onClick={() => setSelectedUniqueName("Widget 1")}>Widget List {selectedUniqueName ?? ""}</div>
    )
}