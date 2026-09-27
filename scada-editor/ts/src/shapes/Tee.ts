import type { dia } from '@joint/plus';
import Fitting from './Fitting';
import type { Side } from './ports';

/** A pipe fork: in, out and a branch. */
export default class Tee extends Fitting {

    get sides(): Side[] {
        return ['left', 'right', 'bottom'];
    }

    get tagPrefix(): string {
        return 'TEE';
    }

    defaults(): dia.Element.Attributes {
        return { ...super.defaults(), type: 'Tee' };
    }
}
