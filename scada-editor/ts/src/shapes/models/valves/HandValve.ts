import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ColorField, type Resizable, type ControlKind } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <rect @selector='stem' />
    <rect @selector='handwheel' />
    <ellipse @selector='body' />
    <text @selector='label' />
`;

export default class HandValve extends Shape {

    // The accent: the handwheel
    get accentField(): ColorField {
        return { path: ['attrs', 'handwheel', 'fill'] };
    }

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'toggle';
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 30 };
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'HandValve',
            // What it shows (see `data.ts`)
            data: {
                open: true
            },
            size: {
                width: 60,
                height: 60
            },
            attrs: {
                pipe: pipeThroughAttributes(),
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    rx: 'calc(w / 2)',
                    ry: 'calc(h / 2)',
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'sphere'
                },
                stem: {
                    width: 10,
                    height: 30,
                    x: 'calc(w / 2 - 5)',
                    y: -30,
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 2,
                    surfaceFill: 'dark'
                },
                handwheel: {
                    width: 60,
                    height: 10,
                    x: 'calc(w / 2 - 30)',
                    y: -30,
                    stroke: '#333',
                    strokeWidth: 2,
                    rx: 5,
                    ry: 5,
                    fill: 'var(--shape-valve-operator)'
                },
                label: {
                    ...labelAttributes,
                    // Above it: its control below (see `controlPosition` in `controls.ts`)
                    labelPosition: 'top',
                    text: 'Valve'
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
