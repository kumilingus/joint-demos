import type { dia } from '@joint/plus';
import Fitting from './Fitting';
import type { Side } from '../../common/ports';

/** An end cap: it closes the end of a line. */
export default class EndCap extends Fitting {

    get sides(): Side[] {
        return ['left'];
    }

    // A dome closing the pipe
    get bodyPath(): string {
        return 'M 0 0 H calc(0.5 * w) A calc(0.5 * w) calc(0.5 * h) 0 0 1 calc(0.5 * w) calc(h) H 0 Z';
    }

    get tagPrefix(): string {
        return 'CAP';
    }

    defaults(): dia.Element.Attributes {
        return { ...super.defaults(), type: 'EndCap', size: { width: 20, height: 40 }};
    }
}
