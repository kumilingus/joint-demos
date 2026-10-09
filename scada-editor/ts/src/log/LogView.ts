import type { dia, mvc } from '@joint/plus';
import FilterListView, { normalizeSearch } from '../list/FilterListView';
import type { PlantEvent, PlantMessage } from '../plant/plant';

/*
 * The log of the messages between the diagram and the plant (in the runtime mode, see `plant.ts`): the updates the
 * plant sends and the commands of the operator - the tag of an element, a property, its value. A listener of the plant
 * as any other system. A list filtered by the words typed and the direction (see `FilterListView`), shown in a dialog
 * that can be moved (the Log button of the toolbar).
 */

// The messages kept (the newest ones)
const MAX_MESSAGES = 200;

/** A message logged: of an event of the plant (see `plant.ts`) */
interface LogEntry extends PlantMessage {
    kind: PlantEvent;
}

// From the plant (down to the diagram), to it (up)
const KIND_ARROWS: Record<PlantEvent, string> = {
    update: '↓',
    command: '↑'
};

/** What the log shows on the diagram (see `LogController`) */
export interface LogHooks {
    /** The element of the tag highlighted (a message of it clicked), or none */
    highlight: (tag: string | null) => void;
    /** The elements pinged when a message of them comes, or not */
    pingChanges: (pinged: boolean) => void;
    /**
     * The log filtered (by words, by a direction): the cells of the tags of the messages shown and the cells the words
     * find by their tags brought forward; `null` - not filtered, all as they are
     */
    filterChange: (filter: LogFilter | null) => void;
}

/** What the log is filtered by (see `LogHooks.filterChange`) */
export interface LogFilter {
    /** The words of the filter (see `normalizeSearch()`) */
    words: string[];
    /** The tags of the messages shown */
    tags: string[];
}

/** Which messages the log shows: of all the directions or one (and the words of the filter) */
type DirectionFilter = 'all' | PlantEvent;

const DIRECTION_FILTERS: Array<[DirectionFilter, string]> = [['all', 'All'], ['update', 'Updates'], ['command', 'Commands']];

/** What the log shows on the diagram: the pings of the changes */
interface LogDisplay {
    pings: boolean;
}

/**
 * The log of an app (see `LogController`): its messages, kept while it is closed, shown while it is open. Its rows by the
 * tags of the messages: a message clicked marks all of its tag (and highlights its element).
 */
export default class LogView extends FilterListView<LogEntry> {

    protected title = 'Plant Messages';
    protected width = 480;
    protected placeholder = 'Filter: a tag or a property - or click an element';
    protected emptyText = 'No messages';

    protected hooks: LogHooks;
    protected messages: LogEntry[] = [];
    /** The direction of the messages shown (kept for the next opening) */
    protected direction: DirectionFilter = 'all';
    /** What it shows on the diagram (kept for the next opening) */
    protected display: LogDisplay = { pings: false };
    /** The filter the diagram shows last (see `updateFilter()`): only a change of it shown */
    protected shownFilter = '';

    constructor(hooks: LogHooks) {
        super();
        this.hooks = hooks;
    }

    preinitialize(): void {
        super.preinitialize();
        this.attributes = { class: 'scada-list scada-log' };
    }

    events(): mvc.EventsHash {
        return {
            ...super.events(),
            'click .scada-log-directions button': 'onDirectionClickEvent',
            'change .scada-log-option input': 'onOptionChangeEvent'
        };
    }

    /** Log a message of an event of the plant: shown at the top of the log (if it is open) */
    add(kind: PlantEvent, plantMessage: PlantMessage): void {
        const message: LogEntry = { kind, ...plantMessage };
        const { messages } = this;
        messages.unshift(message);
        // The oldest one dropped (the log keeps the last ones)
        const dropped = messages.length > MAX_MESSAGES ? messages.pop() : undefined;
        if (!this.isOpen) {
            return;
        }
        this.insertRow(message);
        // Its row too, if it is shown: the last one (the newest first)
        if (dropped && this.matches(dropped, this.filterWords())) {
            this.rowsEl?.lastElementChild?.remove();
        }
        // Its tag shown, the tag of a message dropped not any more
        this.updateFilter();
    }

    /** Forget the messages (a new run of the plant) */
    clear(): void {
        this.messages.length = 0;
        this.renderList();
        this.selectTag(null);
    }

    /** The tag in the text filter, or out of it if it is there (an element clicked on the diagram while the log is open) */
    toggleFilterTag(tag: string): void {
        if (!this.isOpen) {
            return;
        }
        const words = this.filter.split(/\s+/).filter(Boolean);
        // As the filter finds it (`p101` is `P-101`, see `normalizeSearch()`)
        const index = words.findIndex(word => normalizeSearch(word) === normalizeSearch(tag));
        if (index === -1) {
            words.push(tag);
        } else {
            words.splice(index, 1);
        }
        this.filter = words.join(' ');
        if (this.input) {
            this.input.value = this.filter;
        }
        this.renderList();
    }

    /** The newest first */
    protected entries(): LogEntry[] {
        return this.messages;
    }

    protected getKey({ tag }: LogEntry): string {
        return tag;
    }

    protected getText({ tag, property }: LogEntry): string {
        return `${tag} ${property}`;
    }

    /** Of the direction, with any of the words (the tags of several elements clicked) */
    protected matches(message: LogEntry, words: string[]): boolean {
        const { direction } = this;
        if (direction !== 'all' && message.kind !== direction) {
            return false;
        }
        const text = this.normalize(this.getText(message));
        return words.length === 0 || words.some(word => text.includes(word));
    }

    /** The intro, the options of what the log shows on the diagram */
    protected renderHeader(): HTMLElement[] {
        const intro = document.createElement('p');
        intro.className = 'scada-log-intro';
        intro.textContent = 'Live traffic between this diagram and the plant. Readings come in addressed by element tags, and whatever you do to a valve or a pump goes out as a command. The plant is simulated here - in a real deployment, the same messages would travel over OPC UA, MQTT, WebSockets or a REST API. Hold Alt to see the tags of the elements.';
        // On the diagram: the tags (where the messages go), the elements pinged as their messages come
        const settings = document.createElement('div');
        settings.className = 'scada-log-options';
        settings.append(this.renderOption('Ping the changes', 'pings'));
        return [intro, settings];
    }

    /** The filter with the direction (a segmented control, as the switch of a valve) */
    protected renderFilter(): HTMLElement {
        const row = super.renderFilter();
        const directions = document.createElement('div');
        directions.className = 'scada-log-directions';
        directions.append(...DIRECTION_FILTERS.map(([direction, text]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = text;
            button.dataset.direction = direction;
            button.setAttribute('aria-pressed', String(this.direction === direction));
            return button;
        }));
        row.append(directions);
        return row;
    }

    protected renderRow({ kind, tag, property, value, time }: LogEntry): HTMLElement {
        const row = document.createElement('div');
        row.className = 'scada-log-message';
        row.dataset.kind = kind;
        const cells: Array<[string, string]> = [
            ['time', time.toLocaleTimeString([], { hour12: false }) + `.${String(time.getMilliseconds()).padStart(3, '0')}`],
            ['kind', `${KIND_ARROWS[kind]} ${kind}`],
            ['tag', tag],
            ['property', property],
            ['value', String(value)]
        ];
        row.append(...cells.map(([name, text]) => {
            const cell = document.createElement('span');
            cell.className = `scada-log-${name}`;
            cell.textContent = text;
            return cell;
        }));
        return row;
    }

    /** The messages of its tag marked, its element highlighted - clicked again: none */
    protected onRowClick(tag: string): void {
        this.selectTag(this.marked.has(tag) ? null : tag);
    }

    /** The rows of the filter, the elements of their tags brought forward on the diagram */
    protected renderList(): void {
        super.renderList();
        this.updateFilter();
    }

    /** The filter shown on the diagram (see `LogHooks.filterChange`), if it changed: none while the log is closed */
    protected updateFilter(): void {
        const words = this.filterWords();
        const filtered = this.isOpen && (words.length > 0 || this.direction !== 'all');
        const tags = filtered ? [...new Set(this.shownEntries().map(({ tag }) => tag))].sort() : [];
        const key = filtered ? `${words.join(' ')}|${tags.join(' ')}` : '';
        if (key === this.shownFilter) {
            return;
        }
        this.shownFilter = key;
        this.hooks.filterChange(filtered ? { words, tags } : null);
    }

    /** What it shows on the diagram: as asked */
    protected onOpen(): void {
        const { hooks, display } = this;
        hooks.pingChanges(display.pings);
        this.updateFilter();
    }

    /** Nothing shown on the diagram */
    protected onClose(): void {
        const { hooks } = this;
        this.selectTag(null);
        hooks.pingChanges(false);
        this.updateFilter();
    }

    /** The messages of the tag marked (the new ones too), its element highlighted - or none */
    protected selectTag(tag: string | null): void {
        this.marked = new Set(tag ? [tag] : []);
        this.renderMarks();
        this.hooks.highlight(tag);
    }

    /** A checkbox of what the log shows on the diagram (kept in `display`) */
    protected renderOption(text: string, name: keyof LogDisplay): HTMLElement {
        const label = document.createElement('label');
        label.className = 'scada-log-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.option = name;
        checkbox.checked = this.display[name];
        label.append(checkbox, text);
        return label;
    }

    /** A direction picked: the messages of it shown */
    protected onDirectionClickEvent(evt: dia.Event): void {
        const direction = DIRECTION_FILTERS.find(([value]) => value === evt.currentTarget?.dataset.direction)?.[0];
        if (!direction) {
            return;
        }
        this.direction = direction;
        this.el.querySelectorAll<HTMLElement>('.scada-log-directions button').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.direction === direction));
        });
        this.renderList();
    }

    /** An option checked or unchecked: shown on the diagram, or not */
    protected onOptionChangeEvent(evt: dia.Event): void {
        const { target } = evt;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        const { hooks, display } = this;
        if (target.dataset.option === 'pings') {
            display.pings = target.checked;
            hooks.pingChanges(target.checked);
        }
    }
}
