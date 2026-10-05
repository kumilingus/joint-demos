import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../../common/Shape';

// The drawers (the starters of the motors), one above the other
const DRAWERS = 5;
const drawerY = (i: number, offset = 0) => `calc(${(0.06 + i * 0.88 / DRAWERS).toFixed(3)} * h + ${offset})`;
const range = Array.from({ length: DRAWERS }, (_, i) => i);

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    ${range.map(i => `<rect @selector='drawer${i}' /><circle @selector='lamp${i}' /><rect @selector='handle${i}' />`).join('')}
    <text @selector='label' />
`;

/**
 * A motor control center: a cabinet of drawers with the starters of the motors, fed from the left,
 * the motors connected at the bottom. Its lamps are lit while it is energized.
 */
export default class MotorControlCenter extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    // The label above it (not below)
    get overflow(): Overflow {
        return { top: 24, bottom: 0 };
    }

    get tagPrefix(): string {
        return 'MCC';
    }

    defaults(): dia.Element.Attributes {
        const attrs: Record<string, object> = {};
        const height = `calc(${(0.88 / DRAWERS).toFixed(3)} * h - 6)`;
        range.forEach((i) => {
            attrs[`drawer${i}`] = { x: 8, y: drawerY(i, 3), width: 'calc(w - 16)', height, rx: 2, ry: 2, surfaceFill: 'flat', surfaceStroke: 'edge', strokeWidth: 1.5 };
            attrs[`lamp${i}`] = { cx: 22, cy: drawerY(i + 0.5), r: 4, fill: '#666', stroke: '#333', strokeWidth: 1 };
            attrs[`handle${i}`] = { x: 'calc(w - 34)', y: drawerY(i + 0.5, -3), width: 18, height: 6, rx: 2, ry: 2, fill: '#555' };
        });
        return {
            ...super.defaults,
            type: 'MotorControlCenter',
            // Its label (see `text-from`)
            label: { text: 'Motor Control Center' },
            size: {
                width: 120,
                height: 200
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 3,
                    ry: 3,
                    surfaceFill: 'plate',
                    surfaceStroke: 'edge',
                    strokeWidth: 3
                },
                ...attrs,
                // Above it: its terminals are at the bottom
                label: {
                    ...labelAttributes,
                    y: -8,
                    textVerticalAnchor: 'bottom'
                }
            },
            ports: terminalPorts([
                { id: 'in', side: 'left', along: 'calc(0.1 * h)' },
                { id: 'out1', side: 'bottom', along: 'calc(0.25 * w)' },
                { id: 'out2', side: 'bottom', along: 'calc(0.5 * w)' },
                { id: 'out3', side: 'bottom', along: 'calc(0.75 * w)' }
            ])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
