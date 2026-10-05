import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ColorField, type Resizable } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='soil' />
    <path @selector='grass' />
    <rect @selector='body' />
    <rect @selector='clamp' />
    <text @selector='label' />
`;

/** The ground (the earth): a copper rod driven into the soil, the reference of the voltage. */
export default class Ground extends Shape {

    // The accent: the soil
    get accentField(): ColorField {
        return { path: ['style', 'accent'], part: ['soil', 'fill'] };
    }

    get resizable(): Resizable {
        return false;
    }

    get tagPrefix(): string {
        return 'GND';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Ground',
            size: {
                width: 60,
                height: 60
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                soil: {
                    // In the accent of its style (see `style-color.ts`)
                    styleFill: 'accent',
                    y: 'calc(0.45 * h)',
                    width: 'calc(w)',
                    height: 'calc(0.55 * h)',
                    rx: 3,
                    ry: 3,
                    fill: 'var(--shape-soil)',
                    fillOpacity: 0.55
                },
                grass: {
                    d: 'M 0 calc(0.45 * h) H calc(w)',
                    stroke: '#5f7f3a',
                    strokeWidth: 3
                },
                // The rod (grabbed and connected at its top)
                body: {
                    x: 'calc(0.5 * w - 4)',
                    width: 8,
                    height: 'calc(0.95 * h)',
                    rx: 3,
                    ry: 3,
                    materialFill: 'copper',
                    stroke: 'var(--shape-copper-3)',
                    strokeWidth: 1
                },
                clamp: {
                    x: 'calc(0.5 * w - 9)',
                    y: 'calc(0.12 * h)',
                    width: 18,
                    height: 10,
                    rx: 2,
                    ry: 2,
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 1.5
                },
                label: {
                    ...labelAttributes,
                    text: 'Ground'
                }
            },
            ports: terminalPorts([{ id: 'in', side: 'top' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
