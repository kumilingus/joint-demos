import { type dia, util } from '@joint/plus';
import { METAL_STROKE, sphereGradient } from './gradients';
import { fittingPorts, type Side } from './ports';
import type { Overflow } from './footprint';
import { Shape, type Resizable } from './Shape';

// How far the pipe stubs reach out of a fitting
export const FITTING_STUB_LENGTH = 20;

/**
 * A pipe fitting: a small metal body with pipe stubs on some of its sides (see `fittingPorts()`).
 * A fitting is rotated to turn its stubs.
 */
export abstract class Fitting extends Shape {

    /** The sides with a pipe stub */
    abstract get sides(): Side[];

    /** The outline of the body: a rounded square by default */
    get bodyPath(): string {
        return 'M 0 8 Q 0 0 8 0 H calc(w - 8) Q calc(w) 0 calc(w) 8 V calc(h - 8) '
            + 'Q calc(w) calc(h) calc(w - 8) calc(h) H 8 Q 0 calc(h) 0 calc(h - 8) Z';
    }

    get resizable(): Resizable {
        return false;
    }

    get stubLength(): number {
        return FITTING_STUB_LENGTH;
    }

    // The stubs above and below go out of the bounding box (the footprint counts the side stubs only);
    // a fitting has no label.
    get overflow(): Overflow {
        const { sides } = this;
        return {
            top: sides.includes('top') ? FITTING_STUB_LENGTH : 0,
            bottom: sides.includes('bottom') ? FITTING_STUB_LENGTH : 0
        };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            size: {
                width: 40,
                height: 40
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    d: this.bodyPath,
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: sphereGradient
                }
            },
            ports: fittingPorts(this.sides)
        };
    }

    preinitialize(): void {
        this.markup = util.svg/* xml */`
            <path @selector='body' />
        `;
    }
}
