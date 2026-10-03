import type { dia } from '@joint/plus';
import { Layer } from '../../../const';
import type { Overflow } from '../../common/footprint';
import Shape from '../../common/Shape';

/**
 * A group of elements: its members embedded in it (see `groupSelection()` in `actions/groups.ts`). Nothing of
 * it is drawn (an empty markup): a click on a member selects the group, a drag of a member moves it
 * (see `interactivityOf()` in `app.ts`). It is not resized nor rotated.
 */
export default class Group extends Shape {

    get resizable(): boolean {
        return false;
    }

    get rotatable(): boolean {
        return false;
    }

    get graphLayer(): Layer {
        return Layer.Background;
    }

    get tagPrefix(): string {
        return 'GRP';
    }

    // No label
    get overflow(): Overflow {
        return { bottom: 0 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Group',
            attrs: {}
        };
    }

    preinitialize(): void {
        this.markup = [];
    }
}

/** Whether the cell is a group (see `Group`) */
export const isGroup = (cell: dia.Cell | null | undefined): cell is Group => cell?.get('type') === 'Group';
