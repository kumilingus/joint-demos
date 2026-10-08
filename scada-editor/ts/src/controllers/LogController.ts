import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import LogView from '../log/LogView';
import { logHooks } from '../log/log-hooks';
import type { PlantMessage } from '../plant/plant';
import { getTag } from '../shapes/common/tag';

/**
 * The log of the messages between the diagram and the plant (see `log/LogView.ts`): opened by the Log button, closed by
 * it or by Escape. Active in the runtime mode only: a new run starts a new log, closed with the mode. While it is open,
 * the cell of the message clicked is marked (see `canvas/marker.ts`), the elements of the messages pinged if asked.
 */
export default class LogController extends Controller<[App, LogView]> {

    constructor(app: App) {
        // The log of the app (its options kept from a run to the next one): passed to the handlers too
        super(app, new LogView(logHooks(app)));
    }

    get log(): LogView {
        return this.callbackArguments[1];
    }

    startListening(): void {
        const { plant, toolbar, paper, keyboard } = this.app;
        this.log.clear();
        // A listener of the plant (as any system): the updates and the commands
        this.listenTo(plant, {
            'update': onPlantUpdate,
            'command': onPlantCommand
        });
        this.listenTo(toolbar, {
            'log:pointerclick': onLogPointerclick
        });
        this.listenTo(keyboard, {
            'escape': onEscape
        });
        // A cell clicked while the log is open: its tag in the filter of the log (or out of it)
        this.listenTo(paper, {
            'cell:pointerclick': onCellPointerclick
        });
        // Whether it is open: the cursors (see `canvas.css`)
        this.listenTo(this.log, {
            'open': onLogOpen,
            'close': onLogClose
        });
    }

    stopListening(): void {
        // Closed while it is listened to (its `close` handled)
        this.log.close();
        super.stopListening();
    }
}

function onPlantUpdate(_app: App, log: LogView, message: PlantMessage) {
    log.add('update', message);
}

function onPlantCommand(_app: App, log: LogView, message: PlantMessage) {
    log.add('command', message);
}

function onLogPointerclick(app: App, log: LogView) {
    const { el, toolbar } = app;
    log.toggle(el, toolbar.getWidgetByName('log')?.el);
}

function onEscape(_app: App, log: LogView) {
    log.close();
}

function onLogOpen(app: App) {
    app.el.dataset.log = 'open';
}

function onLogClose(app: App) {
    app.el.dataset.log = 'closed';
}

function onCellPointerclick(_app: App, log: LogView, cellView: dia.CellView) {
    const tag = getTag(cellView.model);
    if (tag && log.isOpen) log.toggleFilterTag(tag);
}
