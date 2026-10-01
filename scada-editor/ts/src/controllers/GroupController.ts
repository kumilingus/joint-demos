import type { dia } from '@joint/plus';
import Controller from './Controller';
import type { App } from '../app';
import { fitGroups } from '../actions';

/**
 * A group fits its members (see `Group`): a member moved on its own (selected in the group), resized
 * or rotated, the groups it is in are fitted again (derived, not in the history). A member moved with
 * its group (`translateBy` the group) changes nothing. Active in every mode.
 */
export default class GroupController extends Controller {

    startListening(): void {
        const { graph } = this.context;
        this.listenTo(graph, 'change:position change:size change:angle', onMemberChange);
    }
}

function onMemberChange(_app: App, cell: dia.Cell, _value: unknown, options: dia.Cell.Options) {
    if (!cell.isEmbedded() || options.derived) return;
    // Moved with an element it is in (the group): its groups move as a whole
    if (options.translateBy && options.translateBy !== cell.id) return;
    const parent = cell.getParentCell();
    if (parent) fitGroups(parent);
}
