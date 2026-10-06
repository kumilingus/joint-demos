import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import Log from '../log/Log';
import { logHooks } from '../log/log-hooks';
import type { PlantMessage } from '../plant/plant';
import { getTag } from '../plant/tags';

/**
 * The log of the messages between the diagram and the plant (see `log/Log.ts`): opened by the Log button.
 * Active in the runtime mode only: a new run starts a new log, closed with the mode. While it is open, the element
 * of the message clicked is tinted blue; the tags of the elements are shown, the elements of the messages pinged if asked.
 */
export default class LogController extends Controller<[App, Log]> {

    constructor(app: App) {
        // The log of the app (its options kept from a run to the next one): passed to the handlers too
        super(app, new Log(logHooks(app)));
    }

    get log(): Log {
        return this.callbackArguments[1];
    }

    startListening(): void {
        const { plant, toolbar, paper } = this.app;
        this.log.clear();
        // A listener of the plant (as any system): the updates and the commands
        this.listenTo(plant, {
            'update': onPlantUpdate,
            'command': onPlantCommand
        });
        this.listenTo(toolbar, {
            'log:pointerclick': onLogPointerclick
        });
        // An element clicked while the log is open: its tag in the filter of the log (or out of it)
        this.listenTo(paper, {
            'element:pointerclick': onElementPointerclick
        });
    }

    stopListening(): void {
        super.stopListening();
        this.log.close();
    }
}

function onPlantUpdate(_app: App, log: Log, message: PlantMessage) {
    log.add('update', message);
}

function onPlantCommand(_app: App, log: Log, message: PlantMessage) {
    log.add('command', message);
}

function onLogPointerclick(app: App, log: Log) {
    const { el, toolbar } = app;
    log.toggle(el, toolbar.getWidgetByName('log')?.el);
}

function onElementPointerclick(_app: App, log: Log, elementView: dia.ElementView) {
    const tag = getTag(elementView.model);
    if (tag && log.isOpen) log.toggleFilterTag(tag);
}
