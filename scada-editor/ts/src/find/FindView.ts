import FilterListView from '../list/FilterListView';

/*
 * Find a shape: the cells with a tag listed - their tag, their label, their kind - and filtered by the words typed (see
 * `FilterListView`). A row clicked shows its cell on the diagram (see `find-hooks.ts`). Where several can be shown (the
 * selection of the edit mode), as in a list of files: Ctrl / Cmd adds an entry or removes it, Shift the entries from the
 * one clicked before (the anchor) - Ctrl / Cmd + Shift adds them; Shift + up and down too. In both modes (the Find button
 * of the toolbar, Ctrl+F).
 */

/** A cell listed: what it is found by */
export interface FindEntry {
    id: string;
    tag: string;
    label: string;
    /** The name of its kind of shape (as in the palette); its description as the tooltip */
    kind: string;
    description: string;
}

/** How the cells of the entries are shown (see `FindHooks.show()`) */
export interface ShowOptions {
    /** The entry clicked (or moved to): its cell scrolled into view */
    focus?: string;
    /** ... to the middle of the canvas - picked to close the list (a double click, Enter) */
    center?: boolean;
}

/** What the list reads from the diagram and shows on it (see `find-hooks.ts`) */
export interface FindHooks {
    /** The cells listed */
    entries: () => FindEntry[];
    /** Whether several cells can be shown at once (the selection of the edit mode; one tinted in the runtime mode) */
    multiple: () => boolean;
    /** The cells of the entries shown on the diagram, instead of the ones before (none: no more - the list closed) */
    show: (ids: string[], options?: ShowOptions) => void;
}

/** Find of an app (see `FindController`) */
export default class FindView extends FilterListView<FindEntry> {

    protected title = 'Find';
    protected placeholder = 'A tag, a label or a kind of shape';
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

    /** By their tags: `P-2` before `P-10` */
    protected entries(): FindEntry[] {
        return this.hooks.entries().sort((a, b) => a.tag.localeCompare(b.tag, undefined, { numeric: true }));
    }

    protected keyOf({ id }: FindEntry): string {
        return id;
    }

    protected textOf({ tag, label, kind }: FindEntry): string {
        return `${tag} ${label} ${kind}`;
    }

    /** Without the dashes too: `b101` finds `B-101` */
    protected normalize(text: string): string {
        return super.normalize(text).replaceAll('-', '');
    }

    protected renderRow({ tag, label, kind, description }: FindEntry): HTMLElement {
        const row = document.createElement('div');
        const cells: Array<[string, string]> = [['tag', tag], ['label', label], ['kind', kind]];
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
     * Up and down: the previous, the next entry shown (with Shift: the range to it); Enter: the current entry (or the
     * first one) picked, the list closed
     */
    protected onKeydown(evt: KeyboardEvent): void {
        if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
            evt.preventDefault();
            this.markNext(evt.key === 'ArrowDown' ? 1 : -1, evt.shiftKey);
            return;
        }
        if (evt.key === 'Enter') {
            const entries = this.shownEntries();
            const picked = entries.find(entry => entry.id === this.currentId) ?? entries[0];
            if (!picked) return;
            this.markOnly(picked.id, true);
            this.close();
            return;
        }
        super.onKeydown(evt);
    }

    /** Nothing shown by the list any more (the tint of the runtime mode; the selection stays) */
    protected onClose(): void {
        this.marked.clear();
        this.currentId = this.anchorId = null;
        this.hooks.show([]);
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
