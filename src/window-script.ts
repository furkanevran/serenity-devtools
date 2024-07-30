import { WindowMessageValues } from "./types/messageTypes";
import { WidgetInfo } from "./types/widgetType";

const Serenity = (globalThis as any)["Serenity"];

if (Serenity) {
    window.postMessage({
        name: 'init',
        namespace: 'is.serenity.devtools'
    } satisfies WindowMessageValues);

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
            } satisfies WindowMessageValues);

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


    window.addEventListener('message', (event: MessageEvent<WindowMessageValues>) => {
        if (event.source !== window || event.data?.namespace !== 'is.serenity.devtools/window-script') {
            return;
        }

        if (event.data.name === "save-as-global-variable" || event.data.name === "open-source") {
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

            if (event.data.name === "open-source") {
                window.postMessage({
                    name: 'open-source-response',
                    namespace: 'is.serenity.devtools',
                    tempVarName: tempVarName + tempVarIndex
                } satisfies WindowMessageValues);

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

        if (event.data.name === 'start-inspecting') {
            document.addEventListener('mouseover', inpsectMouseOver);
            document.addEventListener('mouseout', inpsectMouseOut);
            document.addEventListener('mousedown', inspectClick);
        }

        if (event.data.name === 'stop-inspecting') {
            document.removeEventListener('mouseover', inpsectMouseOver);
            document.removeEventListener('mouseout', inpsectMouseOut);
            document.removeEventListener('mousedown', inspectClick);
        }
    });

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
                return "[Function: " + (value.name || "anonymous") + "]";
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
            const widgetTree: WidgetInfo[] = [];
            const queue: { nodes: Node[], parentWidget?: WidgetInfo }[] = [{ nodes: [document.documentElement] }];
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
                        const name: string = Serenity.getTypeFullName(Serenity.getInstanceType(widget)) ?? widget.constructor.name;
                        const currParentIdPrefix = parentWidget?.domNodeSelector && "#" + parentWidget.domNodeSelector;
     
                        /*const widgetData = JSON.parse(JSON.stringify(widget, circularReplacer));
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
*/
                        currentWidgetData = {
                            name,
                            displayName: widget.domNode?.name ?? widget.getGridField()?.el?.dataset?.itemname,
                            domNodeSelector: getElSelector(node, domNodeSelectors),
                            typeName: widget.constructor.name,
                            uniqueName: widget.uniqueName,
                            children: [],
                            parentIdPrefix: parentWidget?.uniqueName ?? ""
                        };

                        if (currParentIdPrefix && currentWidgetData.domNodeSelector && currentWidgetData.domNodeSelector.startsWith(currParentIdPrefix)) {
                            currentWidgetData.displayName ??= currentWidgetData.domNodeSelector.replace(currParentIdPrefix, '');
                        }

                        if (!currentWidgetData.displayName || currentWidgetData.displayName.length === 0) {
                            currentWidgetData.displayName = currentWidgetData.name;
                        }

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

