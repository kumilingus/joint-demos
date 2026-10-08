import { dia } from '@joint/plus';
import type { CellFeatures, ColorField } from './Shape';
import type { StrokeWidths } from '../common/line-width';

/** The color of a link: of its line (a pipe, a wire, a signal line, an arrow) */
const LINE_COLOR_FIELD: ColorField = { path: ['style', 'color'], part: ['line', 'stroke'] };

/**
 * The base of the links of the SCADA editor (a pipe, a wire, a signal line, an arrow, a conveyor): what the editor
 * needs to know about them (see `CellFeatures`), as `Shape` of the elements. The features are defined on the
 * prototype (as getters): a link overrides only those that differ from the defaults below.
 */
export default abstract class Connection extends dia.Link implements CellFeatures {

    /** None by default: not a part of the plant (a conveyor is) */
    get tagPrefix(): string | null {
        return null;
    }

    get autoTag(): boolean {
        return true;
    }

    /** The color of its line by default */
    get colorField(): ColorField | null {
        return LINE_COLOR_FIELD;
    }

    get outlineField(): ColorField | null {
        return null;
    }

    get accentField(): ColorField | null {
        return null;
    }

    /** The widths of its strokes, scaled by the width the user sets (see `line-width.ts`); none - it has no width to set */
    get strokeWidths(): StrokeWidths | null {
        return null;
    }

    static isConnection(cell: unknown): cell is Connection {
        return cell instanceof Connection;
    }
}
