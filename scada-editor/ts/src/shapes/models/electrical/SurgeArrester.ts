import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../../common/Shape';

// The sheds of the porcelain housing: at parts of the height
const SHEDS = [0.28, 0.42, 0.56, 0.7];

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    ${SHEDS.map((_, i) => `<rect @selector='shed${i}' />`).join('')}
    <rect @selector='topCap' />
    <rect @selector='bottomCap' />
    <text @selector='label' />
`;

/** A surge arrester: a porcelain housing between metal caps, leads an overvoltage (a lightning strike) to the ground. */
export default class SurgeArrester extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get tagPrefix(): string {
        return 'SA';
    }

    // The label on the right (not below)
    get overflow(): Overflow {
        return { right: 110, bottom: 0 };
    }

    defaults(): dia.Element.Attributes {
        const sheds: Record<string, object> = {};
        SHEDS.forEach((y, i) => {
            sheds[`shed${i}`] = { y: `calc(${y} * h)`, width: 'calc(w)', height: 6, rx: 3, ry: 3, materialFill: 'porcelain', stroke: 'var(--shape-porcelain-3)', strokeWidth: 1 };
        });
        const cap = { x: 'calc(0.15 * w)', width: 'calc(0.7 * w)', height: 'calc(0.12 * h)', rx: 2, ry: 2, surfaceFill: 'pipe', surfaceStroke: 'edge', strokeWidth: 1.5 };
        return {
            ...super.defaults,
            type: 'SurgeArrester',
            // Its label (see `text-from`)
            label: { text: 'Surge Arrester', position: 'bottom' },
            size: {
                width: 40,
                height: 80
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    x: 'calc(0.25 * w)',
                    y: 'calc(0.1 * h)',
                    width: 'calc(0.5 * w)',
                    height: 'calc(0.8 * h)',
                    materialFill: 'porcelain',
                    stroke: 'var(--shape-porcelain-3)',
                    strokeWidth: 1.5
                },
                ...sheds,
                topCap: cap,
                bottomCap: { ...cap, y: 'calc(0.88 * h)' },
                // Beside it: its terminals are on the top and the bottom
                label: {
                    ...labelAttributes,
                    x: 'calc(w + 10)',
                    y: 'calc(0.5 * h)',
                    textAnchor: 'start',
                    textVerticalAnchor: 'middle'
                }
            },
            ports: terminalPorts([{ id: 'line', side: 'top' }, { id: 'ground', side: 'bottom' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
