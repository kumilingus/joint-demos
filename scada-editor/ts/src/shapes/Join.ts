import { type dia, util } from '@joint/plus';
import type { Overflow } from './footprint';
import Shape, { type Anchors, type Resizable } from './Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='body' />
`;

export default class Join extends Shape {

    // A fitting: as big as the pipes it joins
    get resizable(): Resizable {
        return false;
    }

    // The pipes meet in the middle of the fitting.
    get anchors(): Anchors {
        return 'middles';
    }

    get overflow(): Overflow {
        return { bottom: 0 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Join',
            size: {
                width: 40,
                height: 40
            },
            attrs: {
                body: {
                    fill: 'var(--shape-fitting-fill)',
                    stroke: 'var(--shape-fitting-stroke)',
                    strokeWidth: 2,
                    d: 'M 10 0 H calc(w - 10) l 10 10 V calc(h - 10) l -10 10 H 10 l -10 -10 V 10 Z'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
