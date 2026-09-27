import type { dia } from '@joint/plus';
import { Fitting } from './Fitting';
import type { Side } from './ports';

/** A pipe cross: four pipes meet (e.g. a line with a branch on each side). */
export class Cross extends Fitting {

    get sides(): Side[] {
        return ['left', 'right', 'top', 'bottom'];
    }

    get tagPrefix(): string {
        return 'CRS';
    }

    defaults(): dia.Element.Attributes {
        return { ...super.defaults(), type: 'Cross' };
    }
}
