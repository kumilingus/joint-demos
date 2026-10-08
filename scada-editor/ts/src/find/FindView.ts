import FilterListView from '../list/FilterListView';

/*
 * Find a shape: the cells with a tag listed - their ID, their name, their kind - and filtered by the words typed (see
 * `FilterListView`). A row clicked shows its cell on the diagram (see `find-hooks.ts`). Where several can be shown (the
 * selection of the edit mode), as in a list of files: Ctrl / Cmd adds an entry or removes it, Shift the entries from the
 * one clicked before (the anchor) - Ctrl / Cmd + Shift adds them; Shift + up and down too. In both modes (the Find button
 * of the toolbar, Ctrl+F).
 */

/** A cell listed: what it is found by (its ID, its name: one of them at least) */
export interface FindEntry {
    id: string;
    /** Empty: not bound to the plant */
    tag: string;
    name: string;
    /** The name of its kind of shape (as in the palette); its description as the tooltip */
    kind: string;
    description: string;
}

/** How the cells of the entries are shown (see `FindHooks.show()`) */
export interface ShowOptions {
    /** The entry clicked (or moved to): its cell scrolled into view */
    focus?: string;
    /** All the cells shown to the middle of the canvas instead - picked to close the list (a double click, Enter) */
    center?: boolean;
}

/** What the list reads from the diagram and shows on it (see `find-hooks.ts`) */
export interface FindHooks {
    /** The cells listed */
    entries: () => FindEntry[];
    /** Whether several cells can be shown at once (the selection of the edit mode; one marked in the runtime mode) */
    multiple: () => boolean;
    /** The cells of the entries shown on the diagram, instead of the ones before (none: no more - the list closed) */
    show: (ids: string[], options?: ShowOptions) => void;
}

/** Find of an app (see `FindController`) */
export default class FindView extends FilterListView<FindEntry> {

    protected title = 'Find';
    protected placeholder = 'An ID, a name or a kind of shape';
    protected emptyText = 'No shape found';

    protected hooks: FindHooks;
    /** The entry clicked last: where the arrows go on from */
    protected currentId: string | null = null;
    /** The entry clicked last without Shift: where a range starts (see `markRange()`) */
    protected anchorId: string | null = null;

    constructor(hooks: FindHooks) {
        super();
        this.hooks = hooks;
    }

    preinitialize(): void {
        super.preinitialize();
        this.attributes = { class: 'scada-list scada-find' };
    }

    /** Opened with an empty filter: a new search (the filter of the last one is not kept) */
    open(container: HTMLElement, button?: Element): void {
        if (!this.isOpen) this.filter = '';
        super.open(container, button);
    }

    /** The entries listed again (the diagram changed) */
    refresh(): void {
        this.renderList();
    }

    /**
     * Selected elsewhere (on the canvas): the list closed - done with it; nothing selected (the blank canvas pressed, it
     * is panned too): no entries marked, the list kept open
     */
    selectedElsewhere(anything: boolean): void {
        if (anything) {
            this.close();
            return;
        }
        this.marked.clear();
        this.currentId = this.anchorId = null;
        this.renderMarks();
    }

    /** By their IDs (`P-2` before `P-10`); the ones without at the end, by their names */
    protected entries(): FindEntry[] {
        const compare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
        return this.hooks.entries().sort((a, b) => {
            if (Boolean(a.tag) !== Boolean(b.tag)) return a.tag ? -1 : 1;
            return a.tag ? compare(a.tag, b.tag) : compare(a.name, b.name);
        });
    }

    protected keyOf({ id }: FindEntry): string {
        return id;
    }

    protected textOf({ tag, name, kind }: FindEntry): string {
        return `${tag} ${name} ${kind}`;
    }

    /** Without the dashes too: `b101` finds `B-101` */
    protected normalize(text: string): string {
        return super.normalize(text).replaceAll('-', '');
    }

    protected renderRow({ tag, name, kind, description }: FindEntry): HTMLElement {
        const row = document.createElement('div');
        const cells: Array<[string, string]> = [['tag', tag], ['name', name], ['kind', kind]];
        row.append(...cells.map(([name, text]) => {
            const cell = document.createElement('span');
            cell.className = `scada-find-${name}`;
            cell.textContent = text;
            return cell;
        }));
        row.lastElementChild!.setAttribute('data-tooltip', description);
        return row;
    }

    /** Its cell shown - with the keys of a list of files (see above) */
    protected onRowClick(key: string, evt: MouseEvent): void {
        const add = evt.metaKey || evt.ctrlKey;
        if (!this.hooks.multiple() || (!add && !evt.shiftKey)) {
            this.markOnly(key);
        } else if (evt.shiftKey) {
            this.markRange(key, add);
        } else {
            this.toggleMark(key);
        }
    }

    /** Its cell shown (to the middle of the canvas), the list closed */
    protected onRowDblclick(key: string): void {
        this.markOnly(key, true);
        this.close();
    }

    /**
     * Up and down: the previous, the next entry shown (with Shift: the range to it); Enter: the entries marked (or the
     * first one) picked, the list closed
     */
    protected onKeydown(evt: KeyboardEvent): void {
        if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
            evt.preventDefault();
            this.markNext(evt.key === 'ArrowDown' ? 1 : -1, evt.shiftKey);
            return;
        }
        if (evt.key === 'Enter') {
            this.pick();
            return;
        }
        super.onKeydown(evt);
    }

    /** Nothing shown by the list any more (the marked cell of the runtime mode; the selection stays) */
    protected onClose(): void {
        this.marked.clear();
        this.currentId = this.anchorId = null;
        this.hooks.show([]);
    }

    /** The entries marked shown (all of them to the middle of the canvas), or the first one if none is; the list closed */
    protected pick(): void {
        const [first] = this.marked;
        if (first) {
            this.showMarked(first, true);
        } else {
            const [entry] = this.shownEntries();
            if (!entry) return;
            this.markOnly(entry.id, true);
        }
        this.close();
    }

    /**
     * The entry after (1) or before (-1) the current one - the first, the last if none is - shown alone, or with Shift the
     * entries from the anchor to it; its row in view
     */
    protected markNext(step: 1 | -1, range: boolean): void {
        const entries = this.shownEntries();
        if (entries.length === 0) return;
        const index = entries.findIndex(entry => entry.id === this.currentId);
        const next = index === -1
            ? (step === 1 ? 0 : entries.length - 1)
            : Math.min(Math.max(index + step, 0), entries.length - 1);
        const { id } = entries[next];
        if (range && this.hooks.multiple()) {
            this.markRange(id, false);
        } else {
            this.markOnly(id);
        }
        this.rowOf(id)?.scrollIntoView({ block: 'nearest' });
    }

    /** The entry shown alone: the current one, the anchor */
    protected markOnly(id: string, center = false): void {
        this.marked = new Set([id]);
        this.currentId = this.anchorId = id;
        this.showMarked(id, center);
    }

    /** The entry added to the ones shown, or out of them: the current one, the anchor */
    protected toggleMark(id: string): void {
        if (!this.marked.delete(id)) this.marked.add(id);
        this.currentId = this.anchorId = id;
        this.showMarked(id);
    }

    /** The entries from the anchor to the one (as listed) shown instead of the ones before, or added to them; the current one */
    protected markRange(id: string, add: boolean): void {
        const ids = this.shownEntries().map(entry => entry.id);
        const from = ids.indexOf(this.anchorId ?? id);
        const to = ids.indexOf(id);
        const range = from === -1 ? [id] : ids.slice(Math.min(from, to), Math.max(from, to) + 1);
        this.marked = new Set(add ? [...this.marked, ...range] : range);
        this.currentId = id;
        if (from === -1) this.anchorId = id;
        this.showMarked(id);
    }

    /** The marked entries shown on the diagram, the one clicked (or moved to) in view */
    protected showMarked(focus: string, center = false): void {
        this.renderMarks();
        this.hooks.show([...this.marked], { focus, center });
    }
}
