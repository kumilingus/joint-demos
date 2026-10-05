import { type dia, util } from '@joint/plus';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type ControlKind } from '../../common/Shape';
import { dataOf } from '../../common/data';

// The flames are drawn around the bottom center of the firebox.
const flamesTransform = 'translate(calc(w / 2), calc(h - 18))';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='outlet' />
    <rect @selector='body' />
    <rect @selector='firebox' />
    <path @selector='flameOuter' />
    <path @selector='flameInner' />
    <text @selector='label' />
`;

/** A boiler: its burner on (the flames in the firebox) or off (`power`, switched by the operator and the plant). */
export default class Boiler extends Shape {
    get control(): ControlKind {
        return 'power';
    }

    // The accent: the flames (the inner one a darker tone of it)
    get accentField(): ColorField {
        return { path: ['attrs', 'flameOuter', 'fill'] };
    }

    static attributes = {
        ...Shape.attributes,
        // The inner flame (`innerFlame` in the attributes): the color of the outer one, darker
        'inner-flame': {
            set(this: dia.ElementView) {
                const outer = this.model.attr(['flameOuter', 'fill']) ?? 'var(--shape-flame)';
                return { fill: `color-mix(in oklab, ${outer} 78%, #8b1e1e)` };
            }
        }
    };

    get overflow(): Overflow {
        return { top: 16 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Boiler',
            // What it shows (see `data.ts`)
            data: {
                // The burner: 1 = on (firing, by default), 0 = off
                power: 1
            },
            size: {
                width: 120,
                height: 160
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                outlet: {
                    x: 'calc(0.5 * w - 10)',
                    y: -16,
                    width: 20,
                    height: 20,
                    surfaceFill: 'flat-2',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 'calc(0.5 * w)',
                    ry: 20,
                    surfaceStroke: 'edge',
                    strokeWidth: 4,
                    surfaceFill: 'cylinder'
                },
                firebox: {
                    x: 'calc(0.2 * w)',
                    y: 'calc(h - 70)',
                    width: 'calc(0.6 * w)',
                    height: 56,
                    rx: 4,
                    ry: 4,
                    fill: '#333',
                    stroke: '#222',
                    strokeWidth: 2
                },
                flameOuter: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    d: 'M -22 10 C -28 -8 -12 -14 -14 -30 C -4 -20 0 -28 2 -42 C 12 -26 26 -18 22 10 Z',
                    transform: flamesTransform,
                    fill: 'var(--shape-flame)'
                },
                flameInner: {
                    // Drawn from the data (see `dataAttributes()`)
                    fromData: true,
                    d: 'M -10 10 C -14 -2 -4 -6 -4 -16 C 2 -10 4 -16 6 -24 C 12 -14 16 -6 12 10 Z',
                    transform: flamesTransform,
                    // Darker than the outer one: of its color
                    innerFlame: true
                },
                label: {
                    ...labelAttributes,
                    text: 'Boiler'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
    }

    /** The flames shown while the burner is on - out: the firebox dark (see `from-data.ts`) */
    dataAttributes(selector: string): Record<string, unknown> {
        if (selector !== 'flameOuter' && selector !== 'flameInner') return {};
        return { display: dataOf(this, 'power') ? 'block' : 'none' };
    }

}
