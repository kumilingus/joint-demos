import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { inspectSelection } from '../inspector/inspector';
import { isSettingsOpen } from '../inspector/settings';
import Screen from '../shapes/models/diagram/Screen';
import { isGroup } from '../shapes/models/diagram/Group';
import { showSelection, updateGroupBadge } from '../canvas/selection';

/**
 * Shows the selected cells on the paper (a single selected cell with its tools, see `showSelection()`) and in the
 * inspector panel (see `inspectSelection()`). Active in every mode.
 */
export default class SelectionController extends Controller {

    startListening(): void {
        const { selection, graph } = this.app;

        this.listenTo(selection, 'add reset', onSelectionChange);
        this.listenTo(selection, 'remove', onSelectionRemove);
        this.listenTo(graph, 'add remove change:parent', onMembersChange);
        this.listenTo(this.app.history, 'stack:undo stack:redo', onHistoryChange);
    }
}

/** Cells selected, the selection replaced */
function onSelectionChange(app: App) {
    showSelection(app.paper, app.selection);
    inspectSelection(app);
}

/** The inspector of several cells shows their values (of a stand-in, see `selection-inspector.ts`): after an undo, a redo, again */
function onHistoryChange(app: App) {
    if (app.selection.length > 1 || isGroup(app.selection.at(0))) inspectSelection(app);
}

/** The screen removed while it is edited (switched off, deleted, undone): the settings stay open. */
function onSelectionRemove(app: App, cell: dia.Cell) {
    // Removed from the diagram (`ui.Selection` drops each removed cell): with more of it removed (the members of a
    // group, ...), the last one updates
    if (app.selection.toArray().some(selected => !app.graph.getCell(selected.id))) return;
    showSelection(app.paper, app.selection);
    inspectSelection(app, cell instanceof Screen && isSettingsOpen(app));
}

/**
 * A cell added to a selected group or removed from it (an undo, a redo, ...): its badge counts the members
 * again, its inspector lists them again.
 */
function onMembersChange(app: App, cell: dia.Cell) {
    const { selection } = app;
    const parents = [cell.get('parent'), cell.previous('parent')];
    const groups = selection.filter(selected => isGroup(selected) && parents.includes(String(selected.id)));
    if (groups.length === 0) return;
    groups.forEach(group => updateGroupBadge(app.paper, group));
    if (selection.length === 1) inspectSelection(app);
}

