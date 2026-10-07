import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { hideLocked, showLocked } from '../canvas/lock';
import { updateNavigatorVisibility } from '../canvas/navigator';

/**
 * The locked elements (see `canvas/lock.ts`) shown as such - the pointer goes through them: added, loaded, locked or
 * unlocked, moved into a locked group or out of it. Active in the edit mode only (the runtime mode has no lock).
 */
export default class LockController extends Controller {

    startListening(): void {
        const { graph, paper } = this.app;
        graph.getElements().forEach(element => showLocked(paper, element));
        this.listenTo(graph, {
            'add change:locked change:parent': onLockChange,
            'reset': onGraphReset
        });
    }

    stopListening(): void {
        super.stopListening();
        hideLocked(this.app.paper);
    }
}

function onLockChange(app: App, cell: dia.Cell) {
    const { paper, navigator } = app;
    showLocked(paper, cell);
    updateNavigatorVisibility(navigator, cell);
}

function onGraphReset(app: App) {
    const { graph, paper } = app;
    graph.getElements().forEach(element => showLocked(paper, element));
}
