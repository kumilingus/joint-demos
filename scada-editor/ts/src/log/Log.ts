import { ui } from '@joint/plus';
import type { PlantEvent, PlantMessage } from '../plant/plant';

/*
 * The log of the messages between the diagram and the plant (in the runtime mode, see `plant.ts`): the updates the
 * plant sends and the commands of the operator - the tag of an element, a property, its value. A listener of the plant
 * as any other system. Shown in a dialog that can be moved (the Log button of the toolbar).
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
    /** The tags of the elements shown on the diagram, or not */
    showTags: (shown: boolean) => void;
    /** The elements pinged when a message of them comes, or not */
    pingChanges: (pinged: boolean) => void;
}

/** Which messages the log shows: of all the directions or one, with a tag or a property containing any of the words */
type DirectionFilter = 'all' | PlantEvent;

const DIRECTION_FILTERS: Array<[DirectionFilter, string]> = [['all', 'All'], ['update', 'Updates'], ['command', 'Commands']];

/** What the log shows on the diagram: the tags, the pings of the changes */
interface LogOptions {
    tags: boolean;
    pings: boolean;
}

/** The log of an app (see `LogController`): its messages, kept while it is closed, shown in its dialog while it is open */
export default class Log {

    protected hooks: LogHooks;
    protected messages: LogEntry[] = [];
    /** Which messages it shows (kept for the next opening) */
    protected filter: { text: string; direction: DirectionFilter } = { text: '', direction: 'all' };
    /** What it shows on the diagram (kept for the next opening) */
    protected options: LogOptions = { tags: false, pings: false };
    /** The tag of the message clicked: its messages marked, its element highlighted (not by the pointer: the list moves) */
    protected selectedTag: string | null = null;
    protected dialog: ui.Dialog | null = null;

    constructor(hooks: LogHooks) {
        this.hooks = hooks;
    }

    /** The list of the messages in the dialog: while it is open */
    protected get list(): HTMLElement | null {
        return this.dialog?.el.querySelector<HTMLElement>('.jj-log-list') ?? null;
    }

    /** Whether the log is open */
    get isOpen(): boolean {
        return this.dialog !== null;
    }

    /** Log a message of an event of the plant: shown at the top of the log (if it is open) */
    add(kind: PlantEvent, plantMessage: PlantMessage): void {
        const message: LogEntry = { kind, ...plantMessage };
        const { messages, list } = this;
        messages.unshift(message);
        messages.length = Math.min(messages.length, MAX_MESSAGES);
        if (!list || !this.matches(message)) return;
        list.prepend(this.renderMessage(message));
        while (list.childElementCount > MAX_MESSAGES) list.lastElementChild!.remove();
    }

    /** Forget the messages (a new run of the plant) */
    clear(): void {
        this.messages.length = 0;
        this.list?.replaceChildren();
        this.selectTag(null);
    }

    /** Open the log in the container (the messages so far, the new ones as they come), or close it; the button active while it is open */
    toggle(container: HTMLElement, button?: Element): void {
        if (this.dialog) {
            this.close();
        } else {
            this.open(container, button);
        }
    }

    close(): void {
        this.dialog?.close();
    }

    /** The tag in the text filter, or out of it if it is there (an element clicked on the diagram while the log is open) */
    toggleFilterTag(tag: string): void {
        if (!this.dialog) return;
        const { filter } = this;
        const words = filter.text.split(/\s+/).filter(Boolean);
        const index = words.findIndex(word => word.toLowerCase() === tag.toLowerCase());
        if (index === -1) {
            words.push(tag);
        } else {
            words.splice(index, 1);
        }
        filter.text = words.join(' ');
        const input = this.dialog.el.querySelector<HTMLInputElement>('.jj-log-filter input');
        if (input) input.value = filter.text;
        this.renderList();
    }

    /** Open the log in the container (the app: the page is not scrolled by it) */
    protected open(container: HTMLElement, button?: Element): void {
        const { hooks, options } = this;
        button?.classList.add('active');
        const content = document.createElement('div');
        content.className = 'jj-log';
        const intro = document.createElement('p');
        intro.className = 'jj-log-intro';
        intro.textContent = 'Live traffic between this diagram and the plant. Readings come in addressed by element tags, and whatever you do to a valve or a pump goes out as a command. The plant is simulated here - in a real deployment, the same messages would travel over OPC UA, MQTT, WebSockets or a REST API.';
        // On the diagram: the tags (where the messages go), the elements pinged as their messages come
        const settings = document.createElement('div');
        settings.className = 'jj-log-options';
        settings.append(
            this.renderOption('Show the tags', 'tags', shown => hooks.showTags(shown)),
            this.renderOption('Ping the changes', 'pings', pinged => hooks.pingChanges(pinged))
        );
        const list = document.createElement('div');
        list.className = 'jj-log-list';
        list.append(...this.shownMessages());
        // A message clicked: the messages of its tag marked, its element highlighted - clicked again: none
        list.addEventListener('click', (evt) => {
            const row = (evt.target as Element).closest<HTMLElement>('.jj-log-message');
            if (row) this.selectTag(row.dataset.tag === this.selectedTag ? null : row.dataset.tag ?? null);
        });
        content.append(intro, settings, this.renderFilter(), list);
        hooks.showTags(options.tags);
        hooks.pingChanges(options.pings);
        const dialog = this.dialog = new ui.Dialog({
            title: 'Plant Messages',
            content,
            width: 480,
            draggable: true,
            closeButton: true,
            // The diagram can be operated with the log open
            modal: false
        });
        dialog.on('close', () => {
            this.selectTag(null);
            hooks.showTags(false);
            hooks.pingChanges(false);
            button?.classList.remove('active');
            this.dialog = null;
        });
        dialog.open(container);
    }

    /** The words of the text filter (lower case) */
    protected filterWords(): string[] {
        return this.filter.text.toLowerCase().split(/\s+/).filter(Boolean);
    }

    /** Whether the log shows the message (see `filter`) */
    protected matches({ kind, tag, property }: LogEntry): boolean {
        const { direction } = this.filter;
        if (direction !== 'all' && kind !== direction) return false;
        const words = this.filterWords();
        const text = `${tag} ${property}`.toLowerCase();
        return words.length === 0 || words.some(word => text.includes(word));
    }

    /** The rows of the messages the log shows (see `filter`) */
    protected shownMessages(): HTMLElement[] {
        return this.messages.filter(message => this.matches(message)).map(message => this.renderMessage(message));
    }

    /** The messages shown again (the filter changed) */
    protected renderList(): void {
        this.list?.replaceChildren(...this.shownMessages());
    }

    /** The messages of the tag marked (the new ones too), its element highlighted - or none */
    protected selectTag(tag: string | null): void {
        this.selectedTag = tag;
        this.list?.querySelectorAll<HTMLElement>('.jj-log-message').forEach(row => row.classList.toggle('selected', row.dataset.tag === tag));
        this.hooks.highlight(tag);
    }

    /** The filter of the messages: the words of a tag or a property (an element clicked adds its tag), the direction */
    protected renderFilter(): HTMLElement {
        const { filter } = this;
        const row = document.createElement('div');
        row.className = 'jj-log-filter';
        const input = document.createElement('input');
        input.type = 'search';
        input.placeholder = 'Filter: a tag or a property - or click an element';
        input.value = filter.text;
        input.addEventListener('input', () => {
            filter.text = input.value;
            this.renderList();
        });
        const directions = document.createElement('div');
        directions.className = 'jj-log-directions';
        const buttons = DIRECTION_FILTERS.map(([direction, text]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = text;
            button.setAttribute('aria-pressed', String(filter.direction === direction));
            button.addEventListener('click', () => {
                filter.direction = direction;
                buttons.forEach((other, index) => other.setAttribute('aria-pressed', String(DIRECTION_FILTERS[index][0] === direction)));
                this.renderList();
            });
            return button;
        });
        directions.append(...buttons);
        row.append(input, directions);
        return row;
    }

    /** A checkbox of an option of the log (kept in `options`) */
    protected renderOption(text: string, name: keyof LogOptions, onChange: (checked: boolean) => void): HTMLElement {
        const { options } = this;
        const label = document.createElement('label');
        label.className = 'jj-log-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = options[name];
        checkbox.addEventListener('change', () => {
            options[name] = checkbox.checked;
            onChange(checkbox.checked);
        });
        label.append(checkbox, text);
        return label;
    }

    protected renderMessage({ kind, tag, property, value, time }: LogEntry): HTMLElement {
        const row = document.createElement('div');
        row.className = 'jj-log-message';
        row.dataset.kind = kind;
        row.dataset.tag = tag;
        row.classList.toggle('selected', tag === this.selectedTag);
        const cells: Array<[string, string]> = [
            ['time', time.toLocaleTimeString([], { hour12: false }) + `.${String(time.getMilliseconds()).padStart(3, '0')}`],
            ['kind', `${KIND_ARROWS[kind]} ${kind}`],
            ['tag', tag],
            ['property', property],
            ['value', String(value)]
        ];
        row.append(...cells.map(([name, text]) => {
            const cell = document.createElement('span');
            cell.className = `jj-log-${name}`;
            cell.textContent = text;
            return cell;
        }));
        return row;
    }
}
