import { type dia, util } from '@joint/plus';
import { centerPortPosition, labelAttributes, pipePorts } from './ports';
import { METAL_STROKE, pipeGradient } from './gradients';
import { Shape, type ControlKind } from './Shape';

// The stages of blades, growing with the casing (relative x positions)
const BLADES = [0.25, 0.45, 0.65, 0.85]
    .map(x => {
        // At the relative x, the casing spans from 0.3 * (1 - x) * h to (1 - 0.3 * (1 - x)) * h.
        const top = (0.3 * (1 - x)).toFixed(3);
        const bottom = (1 - 0.3 * (1 - x)).toFixed(3);
        return `M calc(${x} * w) calc(${top} * h + 6) V calc(${bottom} * h - 6)`;
    })
    .join(' ');

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='shaft' />
    <path @selector='body' />
    <path @selector='blades' />
    <text @selector='label' />
`;

/** A steam turbine: the casing widens as the steam expands from the left to the right. */
export class Turbine extends Shape {

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 30;
    }

    get tagPrefix(): string {
        return 'TB';
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Turbine',
            size: {
                width: 120,
                height: 80
            },
            // 0 = off, 1 = on
            power: 0,
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                shaft: {
                    d: 'M -16 calc(h / 2) H calc(w + 16)',
                    stroke: '#555',
                    strokeWidth: 8
                },
                body: {
                    d: 'M 0 calc(0.3 * h) L calc(w) 0 V calc(h) L 0 calc(0.7 * h) Z',
                    stroke: METAL_STROKE,
                    strokeWidth: 2,
                    strokeLinejoin: 'round',
                    fill: pipeGradient
                },
                blades: {
                    d: BLADES,
                    stroke: '#444',
                    strokeWidth: 3,
                    strokeLinecap: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Turbine'
                }
            },
            ports: pipePorts(centerPortPosition)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
