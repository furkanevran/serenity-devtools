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

        if (event.data.name === 'inspect') {
            const selector = event.data?.selector;
            if (!selector) {
                return;
            }

            const element = document.querySelector(selector);
            if (!element) {
                return;
            }

            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.outline = '2px solid red';
        }

        console.log('window-script.ts', event.data);
    });

    function getCircularReplacer() {
        const ancestors: any = [];
        return function (key: string, value: any) {
            if (value instanceof Node) {
                let val = "[DOM Node]";
                if (value instanceof HTMLElement) {
                    if (value.id) {
                        val += `#${value.id}`;
                    }
                    else if (value.classList.length) {
                        val += `.${Array.from(value.classList).join('.')}`;
                    }
                }

                return val;
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
                        widgetData.domNodeSelector = `#${widget.uniqueName}`;
                        currentWidgetData = {
                            widgetData,
                            widgetName,
                            name: widget.domNode.name,
                            children: [],
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

