import { type dia, mvc, ui } from '@joint/plus';

/*
 * A list of entries filtered by the words typed, its rows marked by their keys - shown in a dialog that can be moved
 * (the log of the plant, Find). The view is its content: it lives as long as its controller (the log keeps its filter
 * from an opening to the next one), a dialog is created for each opening (see `open()`) - one list open in a container
 * at a time (see `openLists`). Triggers `open` and `close` (closed by its button, by Escape, by the close button of the
 * dialog, by another list opened).
 * A subclass gives the entries, their keys and texts, their rows; it adds to the parts and to the handling of the events
 * by overriding them (calling `super`).
 */

/** A text as it is searched (the filter, the texts of the entries): lower case, without the dashes - `b101` finds `B-101` */
export function normalizeSearch(text: string): string {
    return text.toLowerCase().replaceAll('-', '');
}

/**
 * The list open in a container: one at a time (Find and the log both mark a cell of the diagram - one arrow, see
 * `canvas/marker.ts`); another one opened there closes it
 */
const openLists = new WeakMap<HTMLElement, { close(): void }>();

/** Whether a list is open in the container (see `openLists`) */
export function isListOpen(container: HTMLElement): boolean {
    return openLists.has(container);
}

export default abstract class FilterListView<T> extends mvc.View<undefined> {

    /** The title of the dialog */
    protected abstract title: string;
    protected width = 420;
    protected placeholder = 'Filter';
    protected emptyText = 'Nothing found';

    /** The text of the filter (kept from an opening to the next one) */
    protected filter = '';
    /** The keys of the rows marked (the rows of a key are marked together) */
    protected marked = new Set<string>();
    protected dialog: ui.Dialog | null = null;
    /** The button of the toolbar that opened the list: active while it is open */
    protected button: Element | null = null;

    // The classes of the element: as attributes, not `className` (prefixed by the library: `joint-`)
    preinitialize(): void {
        this.attributes = { class: 'scada-list' };
    }

    events(): mvc.EventsHash {
        return {
            'input .scada-list-filter input': 'onFilterInputEvent',
            'click .scada-list-row': 'onRowClickEvent',
            'dblclick .scada-list-row': 'onRowDblclickEvent',
            // The focus kept in the filter: the keys stay with the list (see `onKeydown()`)
            'mousedown .scada-list-rows': 'onRowsMousedownEvent',
            'keydown': 'onKeydownEvent'
        };
    }

    /** The entries, in the order they are listed */
    protected abstract entries(): T[];

    /** The key of the entry: its row marked with the other rows of the key */
    protected abstract getKey(entry: T): string;

    /** The text the words of the filter are found in */
    protected abstract getText(entry: T): string;

    /** The row of the entry (the class, the key and the mark of a row are added to it) */
    protected abstract renderRow(entry: T): HTMLElement;

    get isOpen(): boolean {
        return this.dialog !== null;
    }

    /** Open the list in a dialog in the container (its filter focused); the button active while it is open */
    open(container: HTMLElement, button?: Element): void {
        if (this.dialog) {
            return;
        }
        openLists.get(container)?.close();
        openLists.set(container, this);
        this.button = button ?? null;
        this.button?.classList.add('active');
        this.render();
        // Its events again: the dialog of the last opening cleaned them up when it was removed
        this.delegateEvents();
        const dialog = this.dialog = new ui.Dialog({
            title: this.title,
            content: this.el,
            width: this.width,
            draggable: true,
            closeButton: true,
            // The diagram can be edited or operated with the list open
            modal: false
        });
        dialog.on('close', () => {
            // The view kept for the next opening (out of the dialog)
            this.el.remove();
            this.dialog = null;
            if (openLists.get(container) === this) {
                openLists.delete(container);
            }
            this.button?.classList.remove('active');
            this.button = null;
            this.onClose();
            this.trigger('close');
        });
        dialog.open(container);
        this.onOpen();
        this.trigger('open');
        this.focusInput();
    }

    close(): void {
        this.dialog?.close();
    }

    /** Open the list, or close it */
    toggle(container: HTMLElement, button?: Element): void {
        if (this.dialog) {
            this.close();
        } else {
            this.open(container, button);
        }
    }

    /** Open the list, or focus its filter if it is open (its text selected: typed over) */
    focusFilter(container: HTMLElement, button?: Element): void {
        if (this.dialog) {
            this.focusInput();
        } else {
            this.open(container, button);
        }
    }

    render(): this {
        const rows = document.createElement('div');
        rows.className = 'scada-list-rows';
        this.el.replaceChildren(...this.renderHeader(), this.renderFilter(), rows);
        this.renderList();
        return this;
    }

    /** The parts above the filter: none */
    protected renderHeader(): HTMLElement[] {
        return [];
    }

    /** The filter: its input */
    protected renderFilter(): HTMLElement {
        const row = document.createElement('div');
        row.className = 'scada-list-filter';
        const input = document.createElement('input');
        input.type = 'search';
        input.placeholder = this.placeholder;
        input.value = this.filter;
        row.append(input);
        return row;
    }

    /** The rows of the entries the filter lets through (the filter or the entries changed) */
    protected renderList(): void {
        const rows = this.rowsEl;
        if (!rows) {
            return;
        }
        const entries = this.shownEntries();
        rows.replaceChildren(...entries.map(entry => this.renderEntry(entry)));
        if (entries.length === 0) {
            rows.append(this.renderEmpty());
        }
    }

    /** The row of a new entry at the top, if the filter lets it through */
    protected insertRow(entry: T): void {
        const rows = this.rowsEl;
        if (!rows || !this.matches(entry, this.filterWords())) {
            return;
        }
        rows.querySelector('.scada-list-empty')?.remove();
        rows.prepend(this.renderEntry(entry));
    }

    /** The rows marked by their keys (see `marked`) */
    protected renderMarks(): void {
        this.rowsEl?.querySelectorAll<HTMLElement>('.scada-list-row').forEach((row) => {
            row.classList.toggle('selected', this.marked.has(row.dataset.key ?? ''));
        });
    }

    /** The first row of the key */
    protected getRow(key: string): HTMLElement | null {
        return this.rowsEl?.querySelector<HTMLElement>(`.scada-list-row[data-key="${CSS.escape(key)}"]`) ?? null;
    }

    /** The entries the filter lets through */
    protected shownEntries(): T[] {
        const words = this.filterWords();
        return this.entries().filter(entry => this.matches(entry, words));
    }

    /** A text as it is searched (the filter, the texts of the entries, see `normalizeSearch()`) */
    protected normalize(text: string): string {
        return normalizeSearch(text);
    }

    /** The words of the filter (see `normalize()`) */
    protected filterWords(): string[] {
        return this.normalize(this.filter).split(/\s+/).filter(Boolean);
    }

    /** Whether the filter lets the entry through: its text has every word */
    protected matches(entry: T, words: string[]): boolean {
        const text = this.normalize(this.getText(entry));
        return words.every(word => text.includes(word));
    }

    /** A row clicked (not the second click of a double click): nothing */
    protected onRowClick(_key: string, _evt: MouseEvent): void {}

    /** A row double clicked: nothing */
    protected onRowDblclick(_key: string, _evt: MouseEvent): void {}

    /**
     * A key pressed in the list (its filter): Escape closes it - the keyboard of the app does not get the keys typed into a
     * field (nor the Escape of the diagram: one level of the groups up)
     */
    protected onKeydown(evt: KeyboardEvent): void {
        if (evt.key !== 'Escape') {
            return;
        }
        evt.stopPropagation();
        this.close();
    }

    /** The list opened (rendered, in its dialog): nothing */
    protected onOpen(): void {}

    /** The list closed: nothing */
    protected onClose(): void {}

    protected get rowsEl(): HTMLElement | null {
        return this.el.querySelector<HTMLElement>('.scada-list-rows');
    }

    protected get input(): HTMLInputElement | null {
        return this.el.querySelector<HTMLInputElement>('.scada-list-filter input');
    }

    /** The filter focused, its text selected (typed over) */
    protected focusInput(): void {
        this.input?.focus();
        this.input?.select();
    }

    /** The row of the entry: its class, its key, its mark */
    protected renderEntry(entry: T): HTMLElement {
        const row = this.renderRow(entry);
        const key = this.getKey(entry);
        row.classList.add('scada-list-row');
        row.dataset.key = key;
        row.classList.toggle('selected', this.marked.has(key));
        return row;
    }

    protected renderEmpty(): HTMLElement {
        const empty = document.createElement('p');
        empty.className = 'scada-list-empty';
        empty.textContent = this.emptyText;
        return empty;
    }

    // The events of the view (see `events`): the native ones passed on, a row by its key

    protected onFilterInputEvent(evt: dia.Event): void {
        if (!(evt.target instanceof HTMLInputElement)) {
            return;
        }
        this.filter = evt.target.value;
        this.renderList();
    }

    protected onRowClickEvent(evt: dia.Event): void {
        const { currentTarget, originalEvent } = evt;
        if (!(currentTarget instanceof HTMLElement) || !(originalEvent instanceof MouseEvent)) {
            return;
        }
        if (originalEvent.detail > 1 || currentTarget.dataset.key === undefined) {
            return;
        }
        this.onRowClick(currentTarget.dataset.key, originalEvent);
    }

    protected onRowDblclickEvent(evt: dia.Event): void {
        const { currentTarget, originalEvent } = evt;
        if (!(currentTarget instanceof HTMLElement) || !(originalEvent instanceof MouseEvent)) {
            return;
        }
        if (currentTarget.dataset.key === undefined) {
            return;
        }
        this.onRowDblclick(currentTarget.dataset.key, originalEvent);
    }

    protected onRowsMousedownEvent(evt: dia.Event): void {
        evt.preventDefault();
    }

    protected onKeydownEvent(evt: dia.Event): void {
        const { originalEvent } = evt;
        if (originalEvent instanceof KeyboardEvent) {
            this.onKeydown(originalEvent);
        }
    }
}
