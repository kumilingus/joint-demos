import { type dia, util } from '@joint/plus';
import { pipePorts, pipeThroughAttributes } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import Shape, { type ColorField, type Resizable, type ControlKind } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <rect @selector='pipe' />
    <path @selector='base' />
    <circle @selector='body' />
    <path @selector='symbol' />
    <text @selector='label' />
`;

export default class Compressor extends Shape {

    // The accent: the base
    get accentField(): ColorField {
        return { path: ['attrs', 'base', 'fill'] };
    }

    get resizable(): Resizable {
        return { preserveAspectRatio: true };
    }

    get control(): ControlKind {
        return 'power';
    }

    get stubLength(): number {
        return 30;
    }

    defaults(): dia.Element.Attributes {
        return {
            ...super.defaults,
            type: 'Compressor',
            size: {
                width: 80,
                height: 80
            },
            // 0 = off, 1 = on
            power: 0,
            attrs: {
                pipe: pipeThroughAttributes(),
                root: {
                    magnetSelector: 'body'
                },
                base: {
                    d: 'M calc(0.15 * w) calc(h) L calc(0.3 * w) calc(0.8 * h) H calc(0.7 * w) L calc(0.85 * w) calc(h) Z',
                    fill: 'var(--shape-support)',
                    stroke: '#333',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                body: {
                    cx: 'calc(w / 2)',
                    cy: 'calc(h / 2)',
                    r: 'calc(0.45 * w)',
                    surfaceStroke: 'edge',
                    strokeWidth: 2,
                    surfaceFill: 'sphere'
                },
                // The ISA symbol of a compressor: a trapezoid narrowing in the direction of the flow.
                symbol: {
                    d: 'M calc(0.22 * w) calc(0.22 * h) L calc(0.78 * w) calc(0.36 * h) V calc(0.64 * h) L calc(0.22 * w) calc(0.78 * h) Z',
                    fill: '#777',
                    stroke: '#222',
                    strokeWidth: 2,
                    strokeLinejoin: 'round'
                },
                label: {
                    ...labelAttributes,
                    text: 'Compressor'
                }
            },
            ports: pipePorts(this.stubLength)
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }
}
