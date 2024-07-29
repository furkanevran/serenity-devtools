const Serenity = (globalThis as any)["Serenity"];

if (Serenity) {
    window.postMessage({
        name: 'init',
        namespace: 'is.serenity.devtools'
    });

    const highlightElement = document.createElement('div');
    highlightElement.style.position = 'absolute';
    highlightElement.style.backgroundColor = 'rgba(0, 0, 255, 0.3)';
    highlightElement.style.zIndex = '999999999';
    highlightElement.style.pointerEvents = 'none';

    let hoveredUniqueName: string | null = null;

    const tryFindWidget = (el: HTMLElement) => {
        let widget = Serenity.tryGetWidget(el);

        if (!widget) {
            let parent = el.parentElement;
            while (parent && !widget) {
                const children = Array.from(parent.children).filter(c => c instanceof HTMLElement);
                widget = children.map(x => Serenity.tryGetWidget(x as HTMLElement)).find(x => x);
                parent = parent.parentElement;
            }
        }

        return widget;
    }

    const getVisibleHighlightElement = (widget: any) => {
        let widgetEl = widget.element.el;
        if (widgetEl?.classList.contains('select2-offscreen')) {
            widgetEl = widgetEl.parentElement?.querySelector('.select2-container') ?? widgetEl.parentElement;
        }

        return widgetEl;
    }

    const getHighlightElement = (selector: string) => {
        if (!selector) {
            return null;
        }

        if (selector.startsWith("#") && /^[>\s]+$/.test(selector.substring(1))) {
            return document.getElementById(selector.substring(1));
        }

        return document.querySelector(selector);
    }

    const inpsectMouseOver = (e?: MouseEvent) => {
        if (!(e?.target instanceof HTMLElement)) {
            return;
        }

        hoveredUniqueName = null;
        const target = e.target;
        const widget = tryFindWidget(target);
        if (widget) {
            const widgetEl = getVisibleHighlightElement(widget);
            if (!widgetEl) {
                return;
            }

            const rect = widgetEl.getBoundingClientRect();
            highlightElement.style.top = `${rect.top}px`;
            highlightElement.style.left = `${rect.left}px`;
            highlightElement.style.width = `${rect.width}px`;
            highlightElement.style.height = `${rect.height}px`;

            hoveredUniqueName = widget.uniqueName;
            document.body.appendChild(highlightElement);
        }
    };

    const inpsectMouseOut = () => {
        if (highlightElement.parentElement)
            document.body.removeChild(highlightElement);
        hoveredUniqueName = null;
    };

    const inspectClick = (e?: MouseEvent) => {
        if (hoveredUniqueName) {
            window.postMessage({
                name: 'inspected',
                namespace: 'is.serenity.devtools',
                uniqueName: hoveredUniqueName,
            });

            document.removeEventListener('mouseover', inpsectMouseOver);
            document.removeEventListener('mouseout', inpsectMouseOut);
            document.removeEventListener('mousedown', inspectClick);
            if (highlightElement.parentElement)
                document.body.removeChild(highlightElement);

            if (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }
    };


    window.addEventListener('message', (event) => {
        if (event.source !== window || event.data?.namespace !== 'is.serenity.devtools/window-script') {
            return;
        }

        console.log('window-script.ts', event.data);

        if (event.data.name === "saveAsTempVariable" || event.data.name === "openSource") {
            const selector = event.data?.selector;
            if (!selector) {
                return;
            }

            const element = getHighlightElement(selector);
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

            if (event.data.name === "openSource") {
                window.postMessage({
                    name: 'openSource',
                    namespace: 'is.serenity.devtools',
                    tempVarName: tempVarName + tempVarIndex
                });
                return;
            }

            console.log(tempVarName + tempVarIndex, tempVarValue);
        }

        if (event.data.name === 'highlight') {
            const selector = event.data?.selector;
            if (!selector) {
                return;
            }

            const element = getHighlightElement(selector);
            if (!element) {
                return;
            }

            const widget = Serenity.tryGetWidget(element);
            if (!widget) {
                return;
            }

            const widgetEl = getVisibleHighlightElement(widget);
            if (!widgetEl) {
                return;
            }

            const rect = widgetEl.getBoundingClientRect();
            highlightElement.style.top = `${rect.top}px`;
            highlightElement.style.left = `${rect.left}px`;
            highlightElement.style.width = `${rect.width}px`;
            highlightElement.style.height = `${rect.height}px`;

            document.body.appendChild(highlightElement);

            document.body.addEventListener('mousemove', () => {
                if (highlightElement.parentElement)
                    document.body.removeChild(highlightElement);
            }, { once: true });
        }

        if (event.data.name === 'unhighlight') {
            if (highlightElement.parentElement)
                document.body.removeChild(highlightElement);
        }

        if (event.data.name === 'inspect') {
            document.addEventListener('mouseover', inpsectMouseOver);
            document.addEventListener('mouseout', inpsectMouseOut);
            document.addEventListener('mousedown', inspectClick);
        }

        if (event.data.name === 'stopInspect') {
            document.removeEventListener('mouseover', inpsectMouseOver);
            document.removeEventListener('mouseout', inpsectMouseOut);
            document.removeEventListener('mousedown', inspectClick);
        }
    });

    // const getElSelector = (el: HTMLElement) => {
    //     let selector = '';
    //     if (el.id) {
    //         return `#${el.id}`;
    //     } else if (el.classList.length) {
    //         selector += `.${Array.from(el.classList).join('.')}`;
    //     }

    //     selector = el.tagName.toLowerCase() + selector;

    //     const name = el.getAttribute('name');
    //     if (name) {
    //         selector += `[name="${name}"]`;
    //     }

    //     return selector;
    // };

    const getElSelector = (el: HTMLElement, usedSelectors?: Set<string>, suffixSelector?: string): string => {
        let selector = '';
        if (el.id) {
            selector = `#${el.id}`;
        } else {
            if (el.classList.length) {
                selector += `.${Array.from(el.classList).join('.')}`;

                selector = el.tagName.toLowerCase() + selector;

                const name = el.getAttribute('name');
                if (name) {
                    selector += `[name="${name}"]`;
                }
            }
        }

        if (suffixSelector && suffixSelector.length > 0)
            selector += suffixSelector;

        if (usedSelectors?.has(selector)) {
            if (el.parentElement)
                return getElSelector(el.parentElement!, usedSelectors, `>${selector}`);

            return selector;
        }

        usedSelectors?.add(selector);
        return selector;
    }

    function getCircularReplacer(usedSelectors?: Set<string>) {
        const ancestors: any = [];
        return function (key: string, value: any) {
            if (value instanceof Node) {
                const val = "[DOM Node]";
                if (value instanceof HTMLElement) {
                    return val + `<${getElSelector(value, usedSelectors)}>`;
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
            const domNodeSelectors: Set<string> = new Set();
            const circularReplacer = getCircularReplacer();

            while (queue.length) {
                const { nodes, parentWidget } = queue.shift()!;
                for (const node of nodes) {
                    if (!(node instanceof HTMLElement)) {
                        continue;
                    }

                    const widget = Serenity.tryGetWidget(node);
                    let currentWidgetData = parentWidget;
                    if (widget) {
                        const widgetName: string = Serenity.getTypeFullName(Serenity.getInstanceType(widget));
                        const widgetData = JSON.parse(JSON.stringify(widget, circularReplacer));
                        widgetData.domNodeSelector = getElSelector(node, domNodeSelectors);
                        if (widget["value"]) {
                            widgetData.value = JSON.parse(JSON.stringify(widget["value"], circularReplacer));
                        }

                        if (widget["selectedItem"]) {
                            widgetData.selectedItem = JSON.parse(JSON.stringify(widget["selectedItem"], circularReplacer));
                        }

                        if (widget["selectedItems"]) {
                            widgetData.selectedItems = JSON.parse(JSON.stringify(widget["selectedItems"], circularReplacer));
                        }

                        if (typeof Serenity.TemplatedDialog !== "undefined" && widget instanceof Serenity.TemplatedDialog)
                            widgetData.isDialog = true;


                        if (typeof Serenity.EntityDialog !== "undefined" && widget instanceof Serenity.EntityDialog) {
                            widgetData.isEntityDialog = true;
                            widgetData.service = `~/Services/` + widget.getService();
                            if (Serenity.resolveUrl)
                                widgetData.service = Serenity.resolveUrl(widgetData.service);
                        }

                        currentWidgetData = {
                            widgetData,
                            widgetName,
                            name: widget.domNode?.name ?? widget.getGridField()?.el?.dataset?.itemname,
                            children: []
                        };

                        if (typeof Serenity.PropertyGrid !== "undefined" && widget instanceof Serenity.PropertyGrid) {
                            if (widget.domDode?.classList.contains("s-LocalizationGrid")) {
                                currentWidgetData.name = "LocalizationGrid";
                            }
                        }

                        if (parentWidget) {
                            parentWidget.children.push(currentWidgetData);
                        } else {
                            widgetTree.push(currentWidgetData);
                        }
                    }

                    queue.push({ nodes: Array.from(node.childNodes), parentWidget: currentWidgetData });
                }
            }

            return JSON.stringify(widgetTree, circularReplacer);
        }
    };
}

