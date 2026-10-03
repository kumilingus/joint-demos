import { type dia, util } from '@joint/plus';
import { terminal, terminalPorts } from '../../common/ports';
import { labelAttributes } from '../../attributes/label';
import { DERIVED } from '../../common/routing';
import type { Overflow } from '../../common/footprint';
import Shape, { type Resizable } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='supports' />
    <rect @selector='body' />
    <path @selector='bolts' />
    <text @selector='label' />
`;

// A tap (a terminal on the top and one on the bottom) every this much of the length, from the left end
// (the first half of it from the end): the gap between the taps is the same whatever the length.
const TAP_SPACING = 80;

/** Where the tap is along the bar (from its left end) */
const tapX = (index: number) => TAP_SPACING / 2 + index * TAP_SPACING;

/**
 * A busbar: a copper conductor many circuits are connected to. A terminal on each end, and taps on
 * the top and the bottom, a constant gap apart: as many as its length takes (see `updateTaps()`).
 * The model keeps how many there are (`taps`): its ports are made of it (see `updatePorts()`).
 */
export default class Busbar extends Shape {

    // As long as needed (not shorter than its connected taps take), as thick as it is
    get resizable(): Resizable {
        return { minWidth: Math.max(120, this.connectedTaps() * TAP_SPACING), minHeight: 20, maxHeight: 20 };
    }

    // The label above it, over the top taps (not below)
    get overflow(): Overflow {
        return { top: 40, bottom: 0 };
    }

    get tagPrefix(): string {
        return 'BB';
    }

    defaults(): dia.Element.Attributes {
        const ends = terminalPorts([{ id: 'left', side: 'left' }, { id: 'right', side: 'right' }])!;
        return {
            ...super.defaults,
            type: 'Busbar',
            size: {
                width: 240,
                height: 20
            },
            attrs: {
                root: {
                    magnetSelector: 'body'
                },
                // The porcelain supports under the ends of the bar
                supports: {
                    d: 'M 8 calc(h) V calc(h + 10) M calc(w - 8) calc(h) V calc(h + 10)',
                    stroke: 'var(--shape-porcelain-3)',
                    strokeWidth: 8
                },
                body: {
                    width: 'calc(w)',
                    height: 'calc(h)',
                    rx: 2,
                    ry: 2,
                    materialFill: 'copper',
                    stroke: 'var(--shape-copper-3)',
                    strokeWidth: 1.5
                },
                // The bolts of the taps (see `updateTaps()`)
                bolts: {
                    stroke: '#5a3417',
                    strokeWidth: 5,
                    strokeLinecap: 'round'
                },
                // Above its left end, over the terminals of the top taps (they reach 16 above it)
                label: {
                    ...labelAttributes,
                    // Over the taps on the left (see above): at a side of its own, not one to choose
                    labelPosition: null,
                    text: 'Busbar',
                    x: 0,
                    y: -22,
                    textAnchor: 'start',
                    textVerticalAnchor: 'bottom'
                }
            },
            // As many as the default length takes
            taps: 3,
            ports: ends
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        this.updateTaps();
        this.updatePorts();
        this.on('change:size', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updateTaps(options));
        this.on('change:taps', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.updatePorts(options));
    }

    /**
     * How many taps are on each side: as many as the length takes, and never fewer than are connected
     * (not in a graph yet, e.g. loaded from a file: not fewer than it had)
     */
    tapCount(): number {
        // The last one half of the spacing from the right end at least
        const fitting = Math.max(1, Math.floor(this.size().width / TAP_SPACING));
        if (!this.graph) return Math.max(fitting, Number(this.get('taps')) || 0);
        return Math.max(fitting, this.connectedTaps());
    }

    /** The last tap with a wire (its number on its side), 0 if none */
    connectedTaps(): number {
        const connected = (this.graph?.getConnectedLinks(this) ?? []).flatMap(link => [link.source(), link.target()])
            .filter(end => end.id === this.id && typeof end.port === 'string')
            .map(end => Number(String(end.port).replace(/^(top|bottom)/, '')))
            .filter(Number.isFinite);
        return Math.max(0, ...connected);
    }

    /** The taps for the length (a change following the size: not in the history, done again on undo) */
    updateTaps(options: dia.Cell.Options = {}): void {
        this.set('taps', this.tapCount(), { ...options, ...DERIVED });
    }

    /** The ports of the taps (a terminal on the top and one on the bottom of each), and a bolt on the bar at each of them */
    updatePorts(options: dia.Cell.Options = {}): void {
        const count = Number(this.get('taps')) || 0;
        const taps = Array.from({ length: count }, (_, i) => i + 1);
        const ends = this.getPorts().filter(port => port.id === 'left' || port.id === 'right');
        const items = [
            ...ends,
            ...taps.map(i => terminal({ id: `top${i}`, side: 'top', along: tapX(i - 1) })),
            ...taps.map(i => terminal({ id: `bottom${i}`, side: 'bottom', along: tapX(i - 1) }))
        ];
        const current = this.getPorts().map(port => port.id).join();
        if (current === items.map(port => port.id).join()) return this.updateBolts(count, options);
        this.prop('ports/items', items, { ...options, ...DERIVED, rewrite: true });
        this.updateBolts(count, options);
    }

    /** A bolt where each tap is */
    updateBolts(count: number, options: dia.Cell.Options): void {
        const d = Array.from({ length: count }, (_, i) => `M ${tapX(i)} calc(0.5 * h) h 0.01`).join(' ');
        this.attr('bolts/d', d, { ...options, ...DERIVED });
    }
}
