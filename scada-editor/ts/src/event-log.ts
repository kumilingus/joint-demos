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

const messages: PlantMessage[] = [];
let dialog: ui.Dialog | null = null;
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
export function toggleLog(container: HTMLElement, toggle?: Element): void {
    if (dialog) {
        closeLog();
    } else {
        openLog(container, toggle);
    }
}

/** Open the log in the container (the app: the page is not scrolled by it) */
export function openLog(container: HTMLElement, toggle?: Element): void {
    if (dialog) return;
    button = toggle ?? null;
    button?.classList.add('active');
    const content = document.createElement('div');
    content.className = 'jj-log';
    const intro = document.createElement('p');
    intro.className = 'jj-log-intro';
    intro.textContent = 'Live traffic between this diagram and the plant. Readings come in addressed by element tags, and whatever you do to a valve or a pump goes out as a command. The plant is simulated here - in a real deployment, the same messages would travel over OPC UA, MQTT, WebSockets or a REST API.';
    list = document.createElement('div');
    list.className = 'jj-log-list';
    list.append(...messages.map(renderMessage));
    content.append(intro, list);
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

function renderMessage({ direction, tag, property, value, time }: PlantMessage): HTMLElement {
    const row = document.createElement('div');
    row.className = 'jj-log-message';
    row.dataset.direction = direction;
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
