export class JsonViewer {
    public expandedPaths: string[] = [];
    private root: HTMLElement | null = null;
    private data: any;

    public setRoot(root: HTMLElement | null) {
        this.root = root;

        root?.addEventListener('click', (event) => {
            if (!(event.target instanceof HTMLElement)) {
                return;
            }

            const target = event.target.closest<HTMLElement>('.toggle-button');
            if (!target) {
                return;
            }

            const path = target.getAttribute('data-path');
            if (!path) {
                return;
            }

            if (target.classList.contains('toggle-button')) {
                if (this.expandedPaths.includes(path)) {
                    this.expandedPaths = this.expandedPaths.filter((p) => p !== path);
                } else {
                    this.expandedPaths.push(path);
                }

                this.render(this.data);
            }
        });

        this.render(this.data);
    }

    public setData(data: any) {
        this.data = data;
        this.render(data);
    }

    public render(data: any) {
        if (!this.root) {
            return;
        }

        this.root.innerHTML = this.getMarkup(data);
    }

    public getMarkup(data: any, path: string = ''): string {
        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data)) {
                return this.getArrayMarkup(data, path);
            } else {
                return this.getObjectMarkup(data, path);
            }
        } else {
            return this.getPrimitiveMarkup(data, path);
        }
    }

    public getArrayMarkup(data: any[], path: string): string {
        let markup = '<ul class="list-none pl-4">';
        data.forEach((item, index) => {
            const itemPath = `${path}[${index}]`;
            markup += `<li>${this.getMarkup(item, itemPath)}</li>`;
        });
        markup += '</ul>';
        return markup;
    }

    public getObjectMarkup(data: any, path: string): string {
        const keys = Object.keys(data);
        if (keys.length === 0) {
            return '<span>{}</span>';
        }

        let markup = '<ul class="list-none pl-4">';
        for (const key in data) {
            const itemPath = `${path}.${key}`;

            if (typeof data[key] === 'object' && data[key] !== null) {
                if (Object.keys(data[key]).length === 0)
                    markup += `<li><span>${key}</span>: {}</li>`;
                else
                    if (!this.expandedPaths.includes(itemPath))
                        markup += `<li><span>${key}</span>: { <button class="text-blue-300 toggle-button" data-path="${itemPath}">+ Expand </button> }</li>`;
                    else
                        markup += `<li><span>${key}</span>: { <button class="text-blue-300 toggle-button" data-path="${itemPath}">- Collapse </button>\n ${this.getMarkup(data[key], itemPath)} \n}</li>`;
            }
            else
                markup += `<li><span>${key}</span>: ${this.getMarkup(data[key], itemPath)}</li>`;
        }
        markup += '</ul>';
        return markup;

        // if (this.expandedPaths.includes(path)) {
        //     return this.getExpandedObjectMarkup(data, path);
        // }

        // return this.getCollapsedObjectMarkup(data, path);
    }

    getCollapsedObjectMarkup(data: any, path: string): string {
        let markup = '<ul class="list-none pl-4">';
        for (const key in data) {
            const itemPath = `${path}.${key}`;
            markup += `<li><span>${key}</span>: { <button class="text-blue-300 expand-button" data-path="${itemPath}">+ Expand </button> }</li>`;
        }
        markup += '</ul>';
        return markup;
    }

    getExpandedObjectMarkup(data: any, path: string): string {
        let markup = '<ul class="list-none pl-4">';
        for (const key in data) {
            const itemPath = `${path}.${key}`;
            markup += `<li><span>${key}</span>: ${this.getMarkup(data[key], itemPath)}</li>`;
        }
        markup += '</ul>';
        return markup;
    }

    public getPrimitiveMarkup(data: any, _path: string): string {
        return `<span>${data}</span>`;
    }
}