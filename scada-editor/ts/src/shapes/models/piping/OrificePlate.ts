import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import { Layer } from '../../../const';
import Shape, { type Resizable } from '../../common/Shape';

const flange = (x: string) => ({
    x,
    width: 8,
    height: 'calc(h)',
    rx: 2,
    ry: 2,
    fill: '#9aa3ab',
    stroke: '#555',
    strokeWidth: 1.5
});

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <rect @selector='tab' />
    <rect @selector='upstream' />
    <rect @selector='downstream' />
    <rect @selector='body' />
    <text @selector='label' />
`;

/** A flow element: a plate with a hole between two flanges (the flow is measured by the pressure drop). */
export default class OrificePlate extends Shape {

    get graphLayer(): Layer {
        return Layer.Instruments;
    }

    get resizable(): Resizable {
        return false;
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 14 };
    }

    get tagPrefix(): string {
        return 'FE';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'OrificePlate',
            // Its label (see `text-from`)
            label: { text: 'Orifice' },
            size: {
                width: 40,
                height: 60
            },
            attrs: {
                pipe: pipeThroughAttributes(),
                root: {
                    magnetSelector: 'body'
                },
                // The tab of the plate sticking out on the top
                tab: {
                    x: 'calc(w / 2 - 3)',
                    y: -14,
                    width: 6,
                    height: 16,
                    surfaceFill: 'dark',
                    surfaceStroke: 'var(--shape-metal-dark-edge)',
                    strokeWidth: 1
                },
                body: {
                    x: 'calc(w / 2 - 3)',
                    width: 6,
                    height: 'calc(h)',
                    surfaceFill: 'dark'
                },
                upstream: flange('calc(w / 2 - 11)'),
                downstream: flange('calc(w / 2 + 3)'),
                label: {
                    ...labelAttributes
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
