import { type dia, util } from '@joint/plus';
import { labelAttributes, pipePorts, pipeThroughAttributes } from './ports';
import { METAL_STROKE, pipeGradient, sphereGradient } from './gradients';
import type { Overflow } from './footprint';
import Shape, { type Resizable, type ControlKind } from './Shape';

// The spokes of the impeller, around the center of the casing
const SPOKES = Array.from({ length: 8 }, (_, i) => {
    const angle = i * Math.PI / 4;
    return `M 0 0 L ${(22 * Math.cos(angle)).toFixed(2)} ${(22 * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <path @selector='base' />
    <rect @selector='outlet' />
    <circle @selector='body' />
    <circle @selector='impeller' />
    <g @selector='spokesGroup'>
        <path @selector='spokes' />
    </g>
    <text @selector='label' />
`;

/** A centrifugal blower: the air leaves the casing through the outlet on the top. */
export default class Blower extends Shape {

    get resizable(): Resizable {
        return false;
    }

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 20;
    }

    get overflow(): Overflow {
        return { top: 14, bottom: 34 };
    }

    get tagPrefix(): string {
        return 'BL';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Blower',
            size: {
                width: 100,
                height: 100
            },
            // 0 = off, 1 = on
            power: 0,
            attrs: {
                pipe: pipeThroughAttributes(),
                root: {
                    magnetSelector: 'body'
                },
                base: {
                    d: 'M calc(0.15 * w) calc(h + 6) L calc(0.3 * w) calc(0.8 * h) H calc(0.7 * w) L calc(0.85 * w) calc(h + 6) Z',
                    fill: '#777',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                outlet: {
                    x: 'calc(0.5 * w)',
                    y: -14,
                    width: 'calc(0.42 * w)',
                    height: 'calc(0.5 * h)',
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: pipeGradient
                },
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 'calc(0.48 * h)',
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    fill: sphereGradient
                },
                impeller: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 26,
                    fill: '#777',
                    stroke: '#222',
                    strokeWidth: 1.5
                },
                // The spokes turn in their group (see `animations.ts`), which moves them to the center.
                spokesGroup: {
                    transform: 'translate(calc(w / 2), calc(h / 2))'
                },
                spokes: {
                    d: SPOKES,
                    stroke: '#ddd',
                    strokeWidth: 2.5,
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Blower',
                    y: 'calc(h + 14)'
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
