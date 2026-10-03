import Controller from './Controller';
import type { App } from '../app';
import { clearLog, closeLog, logMessage, toggleLog } from '../event-log';
import { plant } from '../plant';

/**
 * The log of the messages between the diagram and the plant (see `event-log.ts`): opened by the Log button.
 * Active in the runtime mode only: a new run starts a new log, closed with the mode.
 */
export default class LogController extends Controller {

    unsubscribe: (() => void) | null = null;

    startListening(): void {
        clearLog();
        // A listener of the plant (as any system): the updates and the commands
        this.unsubscribe = plant.subscribe(logMessage);
        this.listenTo(this.context.toolbar, {
            'log:pointerclick': onLogPointerclick
        });
    }

    stopListening(): void {
        super.stopListening();
        this.unsubscribe?.();
        this.unsubscribe = null;
        closeLog();
    }
}

function onLogPointerclick(app: App) {
    toggleLog(app.el, app.toolbar.getWidgetByName('log')?.el);
}
