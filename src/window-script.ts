const Serenity = (globalThis as any)["Serenity"];

if (Serenity) {
    window.postMessage({
        name: 'init',
        namespace: 'com.serenity.devtools',
    });

    window.addEventListener('message', (event) => {
        if (event.source !== window || event.data?.namespace !== 'com.serenity.devtools/window-script') {
            return;
        }

        console.log('window-script.ts', event.data);

        if (event.data.name === "saveAsTempVariable") {
            const selector = event.data?.selector;
            if (!selector) {
                return;
            }

            const element = document.querySelector(selector);
            if (!element) {
                return;
            }

            const tempVarValue = Serenity.tryGetWidget(element);
            if (!tempVarValue) {
                return;
            }

            const tempVarName = "temp";
            let tempVarIndex = 1;
            while ((window as any)[tempVarName + tempVarIndex]) {
                tempVarIndex++;
            }

            (window as any)[tempVarName + tempVarIndex] = tempVarValue;
            console.log(tempVarName + tempVarIndex, tempVarValue);
        }

        // if (event.data.name === 'inspect') {
        //     const selector = event.data?.selector;
        //     if (!selector) {
        //         return;
        //     }

        //     const element = document.querySelector(selector);
        //     if (!element) {
        //         return;
        //     }

        //     element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        //     element.style.outline = '2px solid red';
        // }
    });

    const getElSelector = (el: HTMLElement) => {
        let selector = el.tagName.toLowerCase();
        if (el.id) {
            selector += `#${el.id}`;
        } else if (el.classList.length) {
            selector += `.${Array.from(el.classList).join('.')}`;
        }

        const name = el.getAttribute('name');
        if (name) {
            selector += `[name="${name}"]`;
        }

        return selector;
    };

    function getCircularReplacer() {
        const ancestors: any = [];
        return function (key: string, value: any) {
            if (value instanceof Node) {
                const val = "[DOM Node]";
                if (value instanceof HTMLElement) {
                    return val+`<${getElSelector(value)}>`;
                }

                return val;
            }

            if (value instanceof Window) {
                return "[Window]";
            }

            if (typeof value === "function") {
                return value.toString();
            }

            if (typeof value !== "object" || value === null) {
                return value;
            }

            // @ts-expect-error couldn't cast to any
            while (ancestors.length > 0 && ancestors.at(-1) !== <any>this) {
                ancestors.pop();
            }

            if (ancestors.includes(value)) {
                return "[Circular]";
            }

            ancestors.push(value);
            return value;
        };
    }

    (globalThis as any).__SERENITY_DEVTOOLS__ = {
        getWidgets: () => {
            type Widget = {
                widgetData: any;
                widgetName: string;
                name?: string;
                children: Widget[];
            }

            const widgetTree: Widget[] = [];
            const queue: { nodes: Node[], parentWidget?: Widget }[] = [{ nodes: [document.documentElement] }];

            while (queue.length) {
                const { nodes, parentWidget } = queue.shift()!;
                const children: Widget[] = [];
                for (const node of nodes) {
                    if (!(node instanceof HTMLElement)) {
                        continue;
                    }

                    const widget = Serenity.tryGetWidget(node);
                    let currentWidgetData = parentWidget;
                    if (widget) {
                        const widgetName: string = Serenity.getTypeFullName(Serenity.getInstanceType(widget));
                        const widgetData = JSON.parse(JSON.stringify(widget, getCircularReplacer()));
                        widgetData.domNodeSelector = getElSelector(node);
                        if (widget["value"]) {
                            widgetData.value = JSON.parse(JSON.stringify(widget["value"], getCircularReplacer()));
                        }

                        if (widget["selectedItem"]) {
                            widgetData.selectedItem = JSON.parse(JSON.stringify(widget["selectedItem"], getCircularReplacer()));
                        }

                        if (widget["selectedItems"]) {
                            widgetData.selectedItems = JSON.parse(JSON.stringify(widget["selectedItems"], getCircularReplacer()));
                        }

                        currentWidgetData = {
                            widgetData,
                            widgetName,
                            name: widget.domNode.name,
                            children: []
                        };
                        if (parentWidget) {
                            parentWidget.children.push(currentWidgetData);
                        } else {
                            widgetTree.push(currentWidgetData);
                        }
                        children.push(currentWidgetData);
                    }

                    queue.push({ nodes: Array.from(node.childNodes), parentWidget: currentWidgetData });
                }
            }

            return JSON.stringify(widgetTree, getCircularReplacer());
        }
    };
}

