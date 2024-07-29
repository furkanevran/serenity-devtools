
export function WidgetDetails({ uniqueName }: { uniqueName: string }) {
    return <div className="border border-gray-900 bg-gray-900 mb-7 m-2 rounded-md">Widget Details of {uniqueName ?? "a"}</div>
}
