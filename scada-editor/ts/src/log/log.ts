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

const filter: { text: string; direction: DirectionFilter } = { text: '', direction: 'all' };

const DIRECTION_FILTERS: Array<[DirectionFilter, string]> = [['all', 'All'], ['update', 'Updates'], ['command', 'Commands']];

const messages: LogEntry[] = [];
let dialog: ui.Dialog | null = null;
let filterInput: HTMLInputElement | null = null;
let hooks: LogHooks | null = null;
/** What the log shows on the diagram (kept for the next opening of the log): the tags, the pings of the changes */
const options = { tags: false, pings: false };
let list: HTMLElement | null = null;
/** The button opening the log: active while it is open */
let button: Element | null = null;
/** The tag of the message clicked: its messages marked, its element highlighted (not by the pointer: the list moves) */
let selectedTag: string | null = null;

/** Log a message of an event of the plant (see `LogController`): shown at the top of the log (if it is open) */
export function logMessage(kind: PlantEvent, plantMessage: PlantMessage): void {
    const message: LogEntry = { kind, ...plantMessage };
    messages.unshift(message);
    messages.length = Math.min(messages.length, MAX_MESSAGES);
    if (!list || !matches(message)) return;
    list.prepend(renderMessage(message));
    while (list.childElementCount > MAX_MESSAGES) list.lastElementChild!.remove();
}

/** The words of the text filter (lower case) */
function filterWords(): string[] {
    return filter.text.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Whether the log shows the message (see `filter`) */
function matches({ kind, tag, property }: LogEntry): boolean {
    if (filter.direction !== 'all' && kind !== filter.direction) return false;
    const words = filterWords();
    const text = `${tag} ${property}`.toLowerCase();
    return words.length === 0 || words.some(word => text.includes(word));
}

/** The messages shown again (the filter changed) */
function renderList(): void {
    list?.replaceChildren(...messages.filter(matches).map(renderMessage));
}

/** The tag in the text filter, or out of it if it is there (an element clicked on the diagram while the log is open) */
export function toggleFilterTag(tag: string): void {
    if (!dialog) return;
    const words = filter.text.split(/\s+/).filter(Boolean);
    const index = words.findIndex(word => word.toLowerCase() === tag.toLowerCase());
    if (index === -1) {
        words.push(tag);
    } else {
        words.splice(index, 1);
    }
    filter.text = words.join(' ');
    if (filterInput) filterInput.value = filter.text;
    renderList();
}

/** Whether the log is open */
export function isLogOpen(): boolean {
    return dialog !== null;
}

/** Forget the messages (a new run of the plant) */
export function clearLog(): void {
    messages.length = 0;
    list?.replaceChildren();
    selectTag(null);
}

/** Open the log (the messages so far, the new ones as they come), or close it; the button active while it is open */
export function toggleLog(container: HTMLElement, logHooks: LogHooks, toggle?: Element): void {
    if (dialog) {
        closeLog();
    } else {
        openLog(container, logHooks, toggle);
    }
}

/** Open the log in the container (the app: the page is not scrolled by it) */
function openLog(container: HTMLElement, logHooks: LogHooks, toggle?: Element): void {
    if (dialog) return;
    hooks = logHooks;
    button = toggle ?? null;
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
        renderOption('Show the tags', 'tags', shown => hooks?.showTags(shown)),
        renderOption('Ping the changes', 'pings', pinged => hooks?.pingChanges(pinged))
    );
    list = document.createElement('div');
    list.className = 'jj-log-list';
    renderList();
    // A message clicked: the messages of its tag marked, its element highlighted - clicked again: none
    list.addEventListener('click', (evt) => {
        const row = (evt.target as Element).closest<HTMLElement>('.jj-log-message');
        if (row) selectTag(row.dataset.tag === selectedTag ? null : row.dataset.tag ?? null);
    });
    content.append(intro, settings, renderFilter(), list);
    hooks.showTags(options.tags);
    hooks.pingChanges(options.pings);
    dialog = new ui.Dialog({
        title: 'Plant Messages',
        content,
        width: 480,
        draggable: true,
        closeButton: true,
        // The diagram can be operated with the log open
        modal: false
    });
    dialog.on('close', () => {
        selectTag(null);
        hooks?.showTags(false);
        hooks?.pingChanges(false);
        hooks = null;
        button?.classList.remove('active');
        dialog = null;
        list = null;
        filterInput = null;
        button = null;
    });
    dialog.open(container);
}

/** The messages of the tag marked (the new ones too), its element highlighted - or none */
function selectTag(tag: string | null): void {
    selectedTag = tag;
    list?.querySelectorAll<HTMLElement>('.jj-log-message').forEach(row => row.classList.toggle('selected', row.dataset.tag === tag));
    hooks?.highlight(tag);
}

export function closeLog(): void {
    dialog?.close();
}

/** The filter of the messages: the words of a tag or a property (an element clicked adds its tag), the direction */
function renderFilter(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'jj-log-filter';
    const input = filterInput = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Filter: a tag or a property - or click an element';
    input.value = filter.text;
    input.addEventListener('input', () => {
        filter.text = input.value;
        renderList();
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
            renderList();
        });
        return button;
    });
    directions.append(...buttons);
    row.append(input, directions);
    return row;
}

/** A checkbox of an option of the log (kept in `options`) */
function renderOption(text: string, name: keyof typeof options, onChange: (checked: boolean) => void): HTMLElement {
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

function renderMessage({ kind, tag, property, value, time }: LogEntry): HTMLElement {
    const row = document.createElement('div');
    row.className = 'jj-log-message';
    row.dataset.kind = kind;
    row.dataset.tag = tag;
    row.classList.toggle('selected', tag === selectedTag);
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
