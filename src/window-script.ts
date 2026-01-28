import { WindowMessageValues } from "./types/messageTypes";
import { Widget, WidgetInfo } from "./types/widgetType";

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
    let isInspecting = false;

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
        if (!widget) {
            return null;
        }

        let widgetEl = widget.element?.el ?? widget.element?.[0] ?? widget.element ?? widget.domNode;
        if (widgetEl instanceof HTMLElement && widgetEl.classList.contains('select2-offscreen')) {
            widgetEl = widgetEl.parentElement?.querySelector('.select2-container') ?? widgetEl.parentElement;
        }

        return widgetEl instanceof HTMLElement ? widgetEl : null;
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
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }

        if (hoveredUniqueName) {
            window.postMessage({
                name: 'inspected',
                namespace: 'is.serenity.devtools',
                uniqueName: hoveredUniqueName,
            } satisfies WindowMessageValues);

            isInspecting = false;
            document.removeEventListener('mouseover', inpsectMouseOver);
            document.removeEventListener('mouseout', inpsectMouseOut);
            document.removeEventListener('mousedown', inspectClick);
            if (highlightElement.parentElement)
                document.body.removeChild(highlightElement);
        }
    };


    window.addEventListener('message', (event: MessageEvent<WindowMessageValues>) => {
        if (event.source !== window || event.data?.namespace !== 'is.serenity.devtools/window-script') {
            return;
        }

        if (event.data.name === "save-as-global-variable" || event.data.name === "open-source" || event.data.name === "run-function") {
            const selector = event.data?.selector;
            if (!selector) {
                return;
            }

            const element = getHighlightElement(selector);
            if (!element) {
                return;
            }

            let tempVarValue = Serenity.tryGetWidget(element);
            const widgetRef = tempVarValue;
            if (!tempVarValue) {
                return;
            }

            if (event.data.path?.length) {
                const path = event.data.path;
                for (let i = 0; i < path.length; i++) {
                    tempVarValue = tempVarValue[path[i]];
                    if (!tempVarValue) {
                        return;
                    }
                }

                if (typeof tempVarValue === "function" && event.data.name !== "open-source")
                    tempVarValue = tempVarValue.bind(widgetRef);
            }

            let savedName = "";
            if (event.data.name === "save-as-global-variable" && event.data.explicitName?.length) {
                savedName = event.data.explicitName;
                (window as any)[savedName] = tempVarValue;
            }
            else {
                const tempVarName = "temp";
                let tempVarIndex = 1;
                while ((window as any)[tempVarName + tempVarIndex]) {
                    tempVarIndex++;
                }

                savedName = tempVarName + tempVarIndex;
                (window as any)[savedName] = tempVarValue;
            }

            if (event.data.name === "open-source" || event.data.name === "run-function") {
                window.postMessage({
                    name: `${event.data.name}-response`,
                    namespace: 'is.serenity.devtools',
                    tempVarName: savedName,
                    path: event.data.path
                } satisfies WindowMessageValues);

                return;
            }

            if (event.data.noConsole !== true)
                console.log(savedName, tempVarValue);
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

            const widgetEl = getVisibleHighlightElement(Serenity.tryGetWidget(element)) ?? element;

            const rect = widgetEl.getBoundingClientRect();
            highlightElement.style.top = `${rect.top}px`;
            highlightElement.style.left = `${rect.left}px`;
            highlightElement.style.width = `${rect.width}px`;
            highlightElement.style.height = `${rect.height}px`;
            highlightElement.dataset.selector = selector;
            document.body.appendChild(highlightElement);

            document.body.addEventListener('mousemove', () => {
                if (highlightElement.parentElement)
                    document.body.removeChild(highlightElement);
            }, { once: true, passive: true });
        }

        if (event.data.name === 'unhighlight') {
            if (highlightElement.parentElement)
                document.body.removeChild(highlightElement);
        }

        if (event.data.name === 'start-inspecting') {
            isInspecting = true;
            document.addEventListener('mouseover', inpsectMouseOver);
            document.addEventListener('mouseout', inpsectMouseOut);
            document.addEventListener('mousedown', inspectClick);
        }

        if (event.data.name === 'stop-inspecting') {
            isInspecting = false;
            document.removeEventListener('mouseover', inpsectMouseOver);
            document.removeEventListener('mouseout', inpsectMouseOut);
            document.removeEventListener('mousedown', inspectClick);
            if (highlightElement.parentElement)
                document.body.removeChild(highlightElement);
        }

        if (event.data.name === 'scroll-into-view') {
            const selector = event.data?.selector;
            if (!selector) return;
            const element = getHighlightElement(selector);
            if (!element) return;

            ensureVisible(element);
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            
            // Highlight momentarily
            const widget = Serenity.tryGetWidget(element);
            if (widget) {
               const widgetEl = getVisibleHighlightElement(widget);
               if (widgetEl) {
                  const rect = widgetEl.getBoundingClientRect();
                  highlightElement.style.top = `${rect.top}px`;
                  highlightElement.style.left = `${rect.left}px`;
                  highlightElement.style.width = `${rect.width}px`;
                  highlightElement.style.height = `${rect.height}px`;
                  document.body.appendChild(highlightElement);
                  setTimeout(() => {
                      if (highlightElement.parentElement) document.body.removeChild(highlightElement);
                  }, 1500);
               }
            }
        }
    });

    // Keyboard shortcut: Ctrl/Cmd+Shift+X to toggle inspecting
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
            e.preventDefault();
            if (isInspecting) {
                isInspecting = false;
                document.removeEventListener('mouseover', inpsectMouseOver);
                document.removeEventListener('mouseout', inpsectMouseOut);
                document.removeEventListener('mousedown', inspectClick);
                if (highlightElement.parentElement)
                    document.body.removeChild(highlightElement);
                window.postMessage({
                    name: 'stop-inspecting',
                    namespace: 'is.serenity.devtools'
                } satisfies WindowMessageValues);
            } else {
                isInspecting = true;
                document.addEventListener('mouseover', inpsectMouseOver);
                document.addEventListener('mouseout', inpsectMouseOut);
                document.addEventListener('mousedown', inspectClick);
                window.postMessage({
                    name: 'start-inspecting',
                    namespace: 'is.serenity.devtools'
                } satisfies WindowMessageValues);
            }
        }
    });

    // --- HELPER: TAB SWITCHER ---
    function ensureVisible(element: Element) {
        let current: Element | null = element;
        let parentPane = null;

        while (current && current !== document.body) {
            if (current.classList.contains('tab-pane') && !current.classList.contains('active')) {
                parentPane = current;
                break;
            }
            if (current.parentElement) {
                current = current.parentElement;
            } else {
                break;
            }
        }

        if (parentPane) {
            const paneId = parentPane.id;
            if (paneId) {
                const selector = `a[href="#${paneId}"], button[data-bs-target="#${paneId}"], a[data-tabkey]`;
                const tabLink = document.querySelector(`.nav-link[href="#${paneId}"]`) || document.querySelector(selector);

                if (tabLink && tabLink instanceof HTMLElement) {
                    tabLink.click();
                    return 300;
                }
            }
        }
        return 0;
    }

    const getElSelector = (el: HTMLElement, usedSelectors: Set<string>, nodeSelectors: Map<Node, string>): string => {
        if (nodeSelectors.has(el)) {
            return nodeSelectors.get(el)!;
        }

        const isUnique = (sel: string): boolean => {
            try {
                return document.querySelectorAll(sel).length === 1 && document.querySelector(sel) === el;
            } catch {
                return false;
            }
        };

        const buildStep = (element: HTMLElement): string => {
            const tag = element.tagName.toLowerCase();

            if (element.id) {
                const idSel = `#${CSS.escape(element.id)}`;
                if (document.querySelectorAll(idSel).length === 1) {
                    return idSel;
                }
            }

            const uniqueAttrs = ['name', 'data-testid', 'data-id', 'data-field'];
            for (const attr of uniqueAttrs) {
                const val = element.getAttribute(attr);
                if (val) {
                    const attrSel = `${tag}[${attr}="${CSS.escape(val)}"]`;
                    if (isUnique(attrSel)) {
                        return attrSel;
                    }
                }
            }

            const significantClasses = Array.from(element.classList).filter(c =>
                !c.startsWith('s-') ||
                c.match(/^s-[A-Z]/)
            ).slice(0, 3);

            if (significantClasses.length > 0) {
                return `${tag}.${significantClasses.map(c => CSS.escape(c)).join('.')}`;
            }

            return tag;
        };

        const getNthOfType = (element: HTMLElement): number => {
            const parent = element.parentElement;
            if (!parent) return 1;
            const tag = element.tagName;
            const siblings = Array.from(parent.children).filter(c => c.tagName === tag);
            return siblings.indexOf(element) + 1;
        };

        const parts: string[] = [];
        let current: HTMLElement | null = el;
        const maxDepth = 10;
        let depth = 0;

        while (current && current !== document.body && current !== document.documentElement && depth < maxDepth) {
            let step = buildStep(current);

            if (step.startsWith('#')) {
                parts.unshift(step);
                break;
            }

            const testSelector = parts.length > 0 ? `${step} > ${parts.join(' > ')}` : step;
            if (!isUnique(testSelector) && !usedSelectors.has(testSelector)) {
                const nth = getNthOfType(current);
                step = `${step}:nth-of-type(${nth})`;
            }

            parts.unshift(step);

            const currentSelector = parts.join(' > ');
            if (isUnique(currentSelector) && !usedSelectors.has(currentSelector)) {
                break;
            }

            current = current.parentElement;
            depth++;
        }

        let selector = parts.join(' > ');

        if (!isUnique(selector) || usedSelectors.has(selector)) {
            let parent = el.parentElement;
            while (parent && parent !== document.body) {
                const parentSel = nodeSelectors.get(parent);
                if (parentSel) {
                    const combined = `${parentSel} > ${selector}`;
                    if (isUnique(combined) && !usedSelectors.has(combined)) {
                        selector = combined;
                        break;
                    }
                }
                parent = parent.parentElement;
            }
        }

        usedSelectors.add(selector);
        nodeSelectors.set(el, selector);
        return selector;
    }

    function getCircularReplacer(usedSelectors: Set<string>, nodeSelectors: Map<Node, string>) {
        const seen = new WeakSet();
        return function (key: string, value: any) {
            if (value instanceof Node) {
                const val = "[DOM Node]";
                if (value instanceof HTMLElement) {
                    return val + `<${getElSelector(value, usedSelectors, nodeSelectors)}>`;
                }
                return val;
            }

            if (value instanceof Window) {
                return "[Window]";
            }

            if (typeof value === "function") {
                 const params = value.toString().match(/\(([^)]*)\)/)?.[1] ?? "";
                 return "[Function: " + (value.name || "anonymous") + "(" + params + ")]";
            }

            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return "[Circular]";
                }
                seen.add(value);
            }

            return value;
        };
    }

    (globalThis as any).__SERENITY_DEVTOOLS__ = {
        getWidgets: (selectedSelector?: string) => {
            const widgetTree: (WidgetInfo | Widget)[] = [];
            const queue: { nodes: Node[], parentWidget?: (WidgetInfo | Widget) }[] = [{ nodes: [document.documentElement] }];
            const domNodeSelectors: Set<string> = new Set();
            const nodeSelectors: Map<Node, string> = new Map();

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
                        let displayName = widget.domDode?.name;

                        if (!(widget instanceof Serenity.Toolbar) && !(widget instanceof Serenity.QuickSearchInput)) {
                            const gridField = widget.getGridField()?.el;
                            if (gridField) {
                                const caption = gridField.querySelector('.caption')?.cloneNode(true) as HTMLElement;
                                if (caption) {
                                    caption.querySelectorAll('sup').forEach(sup => sup.remove());
                                    displayName = caption.textContent;
                                }
                                else
                                    displayName = gridField.dataset?.itemname;
                            }
                        }

                        if (parentWidget?.typeName === "QuickFilterBar") {
                            const quickFilterLabel = widget.domNode?.closest('.quick-filter-item').querySelector(".quick-filter-label");
                            if (quickFilterLabel) {
                                displayName = quickFilterLabel.textContent;
                            }
                        }

                        currentWidgetData = {
                            name,
                            displayName: displayName,
                            domNodeSelector: getElSelector(node, domNodeSelectors, nodeSelectors),
                            typeName: widget.constructor.name,
                            uniqueName: widget.uniqueName,
                            children: [],
                            parentIdPrefix: parentWidget?.uniqueName ?? "",
                            isVisible: Serenity.Fluent(widget.domNode).isVisibleLike() ?? true
                        };

                        if (selectedSelector == currentWidgetData.domNodeSelector) {
                            const widgetData = JSON.parse(JSON.stringify(widget, getCircularReplacer(domNodeSelectors, nodeSelectors)));

                            if (widget["value"]) {
                                widgetData.value = JSON.parse(JSON.stringify(widget["value"], getCircularReplacer(domNodeSelectors, nodeSelectors)));
                            }

                            if (widget["selectedItem"]) {
                                widgetData.selectedItem = JSON.parse(JSON.stringify(widget["selectedItem"], getCircularReplacer(domNodeSelectors, nodeSelectors)));
                            }

                            if (widget["selectedItems"]) {
                                widgetData.selectedItems = JSON.parse(JSON.stringify(widget["selectedItems"], getCircularReplacer(domNodeSelectors, nodeSelectors)));
                            }

                            if (typeof Serenity.TemplatedDialog !== "undefined" && widget instanceof Serenity.TemplatedDialog)
                                widgetData.isDialog = true;

                            if (typeof Serenity.EntityDialog !== "undefined" && widget instanceof Serenity.EntityDialog) {
                                widgetData.isEntityDialog = true;
                                widgetData.service = `~/Services/` + widget.getService();
                                if (Serenity.resolveUrl)
                                    widgetData.service = Serenity.resolveUrl(widgetData.service);
                            }

                            //get all functions of the widget
                            const all = Object.getOwnPropertyNames(Object.getPrototypeOf(widget));
                            all.forEach((name: string) => {
                                if (name === "constructor")
                                    return;

                                if (widgetData[name])
                                    return;

                                const f = widget[name];
                                if (typeof f === "function") {
                                    const params = f.toString().match(/\(([^)]*)\)/)?.[1] ?? "";
                                    widgetData[name] = `[Function: ${name}(${params})]`;
                                    return;
                                }

                                if (typeof f === "object") {
                                    widgetData[name] = JSON.parse(JSON.stringify(f, getCircularReplacer(domNodeSelectors, nodeSelectors)));
                                    return;
                                }

                                if (f instanceof HTMLElement) {
                                    widgetData[name] = "[DOM Node]<" + getElSelector(f, domNodeSelectors, nodeSelectors) + ">";
                                    return;
                                }

                                widgetData[name] = f;
                            });

                            (currentWidgetData as Widget).widgetData = widgetData;
                        }

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

            return JSON.stringify(widgetTree, getCircularReplacer(domNodeSelectors, nodeSelectors));
        }
    };
}

