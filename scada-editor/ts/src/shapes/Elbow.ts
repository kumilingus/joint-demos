import type { dia } from '@joint/plus';
import Fitting from './Fitting';
import type { Side } from './ports';

/** A pipe elbow: the line turns by 90 degrees (from the left down). */
export default class Elbow extends Fitting {

    get sides(): Side[] {
        return ['left', 'bottom'];
    }

    // The outer corner of the turn (the top right one) is round.
    get bodyPath(): string {
        return 'M 0 8 Q 0 0 8 0 H calc(0.5 * w) A calc(0.5 * w) calc(0.5 * h) 0 0 1 calc(w) calc(0.5 * h) '
            + 'V calc(h - 8) Q calc(w) calc(h) calc(w - 8) calc(h) H 8 Q 0 calc(h) 0 calc(h - 8) Z';
    }

    get tagPrefix(): string {
        return 'ELB';
    }

    defaults(): dia.Element.Attributes {
        return { ...super.defaults(), type: 'Elbow' };
    }
}
