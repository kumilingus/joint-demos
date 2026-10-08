import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import FindView from '../find/FindView';
import { findHooks } from '../find/find-hooks';
import type { SelectionOptions } from '../actions';

/**
 * Find a shape (see `find/FindView.ts`): the list opened by the Find button, or Ctrl+F (its filter focused), closed by
 * Escape or by a selection on the canvas; kept up to date with the diagram while it is open. Active in both modes (one
 * controller), closed with a mode.
 */
export default class FindController extends Controller<[App, FindView]> {

    constructor(app: App) {
        super(app, new FindView(findHooks(app)));
    }

    get view(): FindView {
        return this.callbackArguments[1];
    }

    startListening(): void {
        const { toolbar, keyboard, graph, selection } = this.app;
        this.listenTo(toolbar, {
            'find:pointerclick': onFindPointerclick
        });
        this.listenTo(keyboard, {
            'ctrl+f meta+f': onFindKey,
            'escape': onEscape
        });
        // A cell added, removed, its tag, its label changed, locked or unlocked; a diagram loaded
        this.listenTo(graph, {
            'add remove reset change:tag change:label change:locked': onDiagramChange
        });
        // Selected otherwise (a click on the canvas, a region, Select All): the list closed - done with it; the selection
        // cleared (the blank canvas pressed: panned too): no entries of the list marked
        this.listenTo(selection, {
            'reset': onSelectionReset,
            'add remove': onSelectionChange
        });
    }

    stopListening(): void {
        super.stopListening();
        this.view.close();
    }
}

function onFindPointerclick(app: App, view: FindView) {
    const { el, toolbar } = app;
    view.toggle(el, toolbar.getWidgetByName('find')?.el);
}

function onFindKey(app: App, view: FindView, evt: dia.Event) {
    const { el, toolbar } = app;
    // Not the find of the browser
    evt.preventDefault();
    view.focusFilter(el, toolbar.getWidgetByName('find')?.el);
}

function onEscape(_app: App, view: FindView) {
    view.close();
}

function onDiagramChange(_app: App, view: FindView) {
    if (view.isOpen) {
        view.refresh();
    }
}

function onSelectionReset(app: App, view: FindView, _selection: unknown, options: SelectionOptions) {
    const { selection } = app;
    if (!options.find) {
        view.selectedElsewhere(selection.length > 0);
    }
}

function onSelectionChange(app: App, view: FindView, _cell: unknown, _selection: unknown, options: SelectionOptions) {
    const { selection } = app;
    if (!options.find) {
        view.selectedElsewhere(selection.length > 0);
    }
}
