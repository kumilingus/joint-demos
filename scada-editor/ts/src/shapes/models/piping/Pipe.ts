import { dia, util } from '@joint/plus';
import { followRouting, routingAttributes } from '../../common/routing';
import { Layer, PIPE_COLOR, PIPE_OUTLINE } from '../../../const';
import { type ColorField, LINE_COLOR_FIELD } from '../../common/Shape';
import { followLineWidth, type StrokeWidths } from '../../common/line-width';
import { outlineWidthOf } from '../../common/gradients';

// The widths of its strokes (normal, see `lineWidth`); the outline is around the line (see `pipeOutline`)
const STROKE_WIDTHS: StrokeWidths = { line: 10, flow: 3 };

/** The width of the outline of the pipe: its line and a border on each side as wide as the outlines of the shapes */
export function pipeOutlineWidth(pipe: dia.Cell): number {
    const line = Number(pipe.attr(['line', 'strokeWidth'])) || STROKE_WIDTHS.line;
    return line + 2 * outlineWidthOf(pipe);
}

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='outline' fill='none' />
    <path @selector='line' fill='none' />
    <path @selector='flow' fill='none' />
`;

export default class Pipe extends dia.Link {

    // The outline: as wide as the line plus the border on each side (the outline width, see `OutlineWidth`)
    static attributes: typeof dia.Link.attributes = {
        'pipe-outline': {
            set(this: dia.LinkView) {
                return { 'stroke-width': pipeOutlineWidth(this.model) };
            }
        }
    };

    // The color of its line (see `ColorField`)
    get colorField(): ColorField {
        return LINE_COLOR_FIELD;
    }

    // The color of its outline: the dark of the theme by default
    get outlineField(): ColorField {
        return { path: ['attrs', 'outline', 'stroke'], defaultValue: PIPE_OUTLINE };
    }

    // Thin, normal or thick (see `line-width.ts`)
    get strokeWidths(): StrokeWidths {
        return STROKE_WIDTHS;
    }

    defaults(): dia.Link.Attributes {
        return {
            ...super.defaults,
            type: 'Pipe',
            layer: Layer.Pipes,
            z: -1,
            routing: 'orthogonal',
            ...routingAttributes('orthogonal'),
            attrs: {
                // An invisible wide stroke that makes the pipe easy to grab.
                wrapper: {
                    connection: true,
                    stroke: 'transparent',
                    strokeWidth: 40,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
                },
                outline: {
                    connection: true,
                    stroke: PIPE_OUTLINE,
                    pipeOutline: true,
                    strokeLinejoin: 'round',
                    // Reaching under the element it connects to (the pipes are drawn under the equipment):
                    // no gap at a slanted side (the tip of a zone) or a round one
                    strokeLinecap: 'square'
                },
                line: {
                    connection: true,
                    stroke: PIPE_COLOR,
                    strokeWidth: STROKE_WIDTHS.line,
                    strokeLinejoin: 'round',
                    // Reaching under the element it connects to (the pipes are drawn under the equipment):
                    // no gap at a slanted side (the tip of a zone) or a round one
                    strokeLinecap: 'square'
                },
                // The dashes of the flowing liquid: hidden, shown by the animation in the runtime mode
                flow: {
                    connection: true,
                    stroke: '#ffffff',
                    strokeOpacity: 0,
                    strokeWidth: STROKE_WIDTHS.flow,
                    strokeDasharray: '6 18',
                    strokeLinecap: 'round',
                    pointerEvents: 'none'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Link['initialize']>): void {
        super.initialize(...args);
        followRouting(this);
        followLineWidth(this, STROKE_WIDTHS);
    }
}

/** The view of a pipe: its outline drawn again when its outline width changes (see `pipeOutline`) */
export const PipeView = dia.LinkView.extend({
    presentationAttributes: dia.LinkView.addPresentationAttributes({
        outlineWidth: dia.LinkView.Flags.UPDATE
    })
});
