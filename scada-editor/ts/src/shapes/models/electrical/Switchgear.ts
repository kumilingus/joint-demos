import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../../common/Shape';

// The panels of the cabinet side by side
const PANELS = 4;
const panelX = (i: number, offset = 0) => `calc(${(i / PANELS).toFixed(3)} * w + ${offset})`;
const range = Array.from({ length: PANELS }, (_, i) => i);

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='body' />
    <path @selector='panels' />
    ${range.map(i => `<rect @selector='door${i}' /><circle @selector='lamp${i}' /><rect @selector='handle${i}' />`).join('')}
    <text @selector='label' />
`;

/**
 * A switchgear: a row of cabinet panels with the breakers behind their doors,
 * the incoming power on the sides, the feeders at the bottom. Its lamps are lit while it is energized.
 */
export default class Switchgear extends Shape {

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    // The label above it (not below)
    get overflow(): Overflow {
        return { top: 24, bottom: 0 };
    }

    get tagPrefix(): string {
        return 'SWG';
    }

    defaults(): dia.Element.Attributes {
        const attrs: Record<string, object> = {};
        range.forEach((i) => {
            attrs[`door${i}`] = {
                x: panelX(i, 8), y: 'calc(0.3 * h)', width: `calc(${(1 / PANELS).toFixed(3)} * w - 16)`, height: 'calc(0.5 * h)',
                rx: 2, ry: 2, surfaceFill: 'flat', surfaceStroke: 'edge', strokeWidth: 1.5
            };
            attrs[`lamp${i}`] = { cx: panelX(i + 0.5), cy: 'calc(0.15 * h)', r: 5, fill: '#666', stroke: '#333', strokeWidth: 1 };
            attrs[`handle${i}`] = { x: panelX(i + 0.5, -3), y: 'calc(0.5 * h)', width: 6, height: 'calc(0.12 * h)', rx: 2, ry: 2, fill: '#555' };
        });
        return {
            ...super.defaults,
            type: 'Switchgear',
            size: {
                width: 240,
                height: 150
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
                panels: {
                    d: range.slice(1).map(i => `M ${panelX(i)} 0 V calc(h)`).join(' '),
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                ...attrs,
                // Above it: its terminals are at the bottom
                label: {
                    ...labelAttributes,
                    text: 'Switchgear',
                    y: -8,
                    textVerticalAnchor: 'bottom'
                }
            },
            ports: terminalPorts([
                { id: 'in1', side: 'left', along: 'calc(0.2 * h)' },
                { id: 'in2', side: 'right', along: 'calc(0.2 * h)' },
                ...range.map(i => ({ id: `feeder${i + 1}`, side: 'bottom' as const, along: panelX(i + 0.5) }))
            ])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
