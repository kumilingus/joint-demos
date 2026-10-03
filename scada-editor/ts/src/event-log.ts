import { ui } from '@joint/plus';
import type { MessageDirection, PlantMessage } from './plant';

/*
 * The log of the messages between the diagram and the plant (in the runtime mode, see `plant.ts`): the updates the
 * plant sends and the commands of the operator - the tag of an element, a property, its value. A listener of the plant
 * as any other system. Shown in a dialog that can be moved (the Log button of the toolbar).
 */

// The messages kept (the newest ones)
const MAX_MESSAGES = 200;

const DIRECTION_NAMES: Record<MessageDirection, string> = {
    in: 'update',
    out: 'command'
};

/** What the log shows on the diagram (see `LogController`) */
export interface LogHooks {
    /** The element of the tag highlighted (the pointer on a message of it), or none */
    hover: (tag: string | null) => void;
    /** The tags of the elements shown on the diagram, or not */
    showTags: (shown: boolean) => void;
    /** The elements flashed when a message of them comes, or not */
    flashChanges: (flashed: boolean) => void;
}

const messages: PlantMessage[] = [];
let dialog: ui.Dialog | null = null;
let hooks: LogHooks | null = null;
/** What the log shows on the diagram (kept for the next opening of the log): the tags, the flashes of the changes */
const options = { tags: false, flashes: false };
let list: HTMLElement | null = null;
/** The button opening the log: active while it is open */
let button: Element | null = null;

/** Log a message (see `plant.subscribe()`): shown at the top of the log (if it is open) */
export function logMessage(message: PlantMessage): void {
    messages.unshift(message);
    messages.length = Math.min(messages.length, MAX_MESSAGES);
    if (!list) return;
    list.prepend(renderMessage(message));
    while (list.childElementCount > MAX_MESSAGES) list.lastElementChild!.remove();
}

/** Forget the messages (a new run of the plant) */
export function clearLog(): void {
    messages.length = 0;
    list?.replaceChildren();
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
export function openLog(container: HTMLElement, logHooks: LogHooks, toggle?: Element): void {
    if (dialog) return;
    hooks = logHooks;
    button = toggle ?? null;
    button?.classList.add('active');
    const content = document.createElement('div');
    content.className = 'jj-log';
    const intro = document.createElement('p');
    intro.className = 'jj-log-intro';
    intro.textContent = 'Live traffic between this diagram and the plant. Readings come in addressed by element tags, and whatever you do to a valve or a pump goes out as a command. The plant is simulated here - in a real deployment, the same messages would travel over OPC UA, MQTT, WebSockets or a REST API.';
    // On the diagram: the tags (where the messages go), the elements flashed as their messages come
    const settings = document.createElement('div');
    settings.className = 'jj-log-options';
    settings.append(
        renderOption('Show the tags', 'tags', shown => hooks?.showTags(shown)),
        renderOption('Flash the changes', 'flashes', flashed => hooks?.flashChanges(flashed))
    );
    list = document.createElement('div');
    list.className = 'jj-log-list';
    list.append(...messages.map(renderMessage));
    // The element of a message highlighted while the pointer is on it
    list.addEventListener('pointerover', (evt) => {
        const row = (evt.target as Element).closest<HTMLElement>('.jj-log-message');
        hooks?.hover(row?.dataset.tag ?? null);
    });
    list.addEventListener('pointerleave', () => hooks?.hover(null));
    content.append(intro, settings, list);
    hooks.showTags(options.tags);
    hooks.flashChanges(options.flashes);
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
        hooks?.hover(null);
        hooks?.showTags(false);
        hooks?.flashChanges(false);
        hooks = null;
        button?.classList.remove('active');
        dialog = null;
        list = null;
        button = null;
    });
    dialog.open(container);
}

export function closeLog(): void {
    dialog?.close();
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

function renderMessage({ direction, tag, property, value, time }: PlantMessage): HTMLElement {
    const row = document.createElement('div');
    row.className = 'jj-log-message';
    row.dataset.direction = direction;
    row.dataset.tag = tag;
    const cells: Array<[string, string]> = [
        ['time', time.toLocaleTimeString([], { hour12: false }) + `.${String(time.getMilliseconds()).padStart(3, '0')}`],
        ['direction', `${direction === 'in' ? '↓' : '↑'} ${DIRECTION_NAMES[direction]}`],
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
