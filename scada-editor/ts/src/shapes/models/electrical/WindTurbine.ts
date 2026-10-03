import { type dia, util } from '@joint/plus';
import { terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import type { Overflow } from '../../common/footprint';
import Shape, { type ControlKind, type Resizable } from '../../common/Shape';

// A blade from the hub up, turned around it by the angle
const blade = (angle: number) => `<path @selector='blade${angle}' transform='rotate(${angle})' d='M -4 -4 L -3 -58 Q 0 -64 3 -58 L 5 -4 Z' />`;

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='tower' />
    <rect @selector='nacelle' />
    <g @selector='rotorGroup'>
        <g @selector='rotor'>
            ${blade(0)}
            ${blade(120)}
            ${blade(240)}
        </g>
        <circle @selector='hub' />
    </g>
    <text @selector='label' />
`;

/** A wind turbine: a source of the power while it runs (its rotor spins in the runtime mode). */
export default class WindTurbine extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get rotatable(): boolean {
        return false;
    }

    get control(): ControlKind {
        return 'power';
    }

    // The label beside the base (not below)
    get overflow(): Overflow {
        return { right: 40, bottom: 0 };
    }

    get tagPrefix(): string {
        return 'WT';
    }

    defaults(): dia.Element.Attributes {
        const bladeAttributes = { surfaceFill: 'flat', surfaceStroke: 'edge', strokeWidth: 1.5 };
        return {
            ...super.defaults,
            type: 'WindTurbine',
            size: {
                width: 140,
                height: 220
            },
            power: 1,
            attrs: {
                root: {
                    magnetSelector: 'tower'
                },
                tower: {
                    d: 'M calc(0.47 * w) calc(0.3 * h) H calc(0.53 * w) L calc(0.57 * w) calc(h) H calc(0.43 * w) Z',
                    surfaceFill: 'cylinder',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                nacelle: {
                    x: 'calc(0.44 * w)',
                    y: 'calc(0.26 * h)',
                    width: 'calc(0.3 * w)',
                    height: 16,
                    rx: 6,
                    ry: 6,
                    surfaceFill: 'pipe',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                // The rotor is drawn around the hub (the group moved there) and turned around it (see `animations.ts`).
                rotorGroup: {
                    transform: 'translate(calc(0.44 * w), calc(0.26 * h + 8))'
                },
                blade0: bladeAttributes,
                blade120: bladeAttributes,
                blade240: bladeAttributes,
                hub: {
                    r: 8,
                    surfaceFill: 'sphere',
                    surfaceStroke: 'edge',
                    strokeWidth: 2
                },
                // Beside the base of the tower (the wire leaves it down)
                label: {
                    ...labelAttributes,
                    text: 'Wind Turbine',
                    x: 'calc(0.5 * w + 16)',
                    y: 'calc(h)',
                    textAnchor: 'start',
                    textVerticalAnchor: 'bottom'
                }
            },
            ports: terminalPorts([{ id: 'out', side: 'bottom' }])
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
