import { dia } from '@joint/plus';
import { CANVAS_COLOR } from '../../const';
import { styleOf } from '../common/style';
import { markTag } from '../common/tag';
import { glide } from './glide';

/**
 * A view of a shape rendered again when the attributes of its model change (their special attributes
 * read them): its style - the color, the finish and the outline (its color, its width) of its surfaces (see
 * `surfaceAttributes`), the data of a chart, ...
 */
export function shapeView(attributes: string[] = []): typeof dia.ElementView {
    return dia.ElementView.extend({
        // The surfaces in the color of the canvas marked on the root: the ink on them follows it
        // (see `--shape-surface-ink` in `shapes.css`)
        update(this: dia.ElementView, ...args: unknown[]) {
            dia.ElementView.prototype.update.apply(this, args);
            this.el.toggleAttribute('data-canvas', styleOf(this.model, 'color') === CANVAS_COLOR);
            markTag(this);
            // A value shown by a part: glides from the one drawn last (see `glide.ts`)
            glide(this);
        },
        presentationAttributes: dia.ElementView.addPresentationAttributes(
            {
                // Its style (see `style.ts`): the surfaces of the element and of its pipe stubs (ports)
                style: [dia.ElementView.Flags.UPDATE, dia.ElementView.Flags.PORTS],
                // Its texts (see `from-model`); its ID - the label shows it (see `labels` of the diagram style), the
                // view has it (see `markTag()`)
                label: dia.ElementView.Flags.UPDATE,
                tag: dia.ElementView.Flags.UPDATE,
                unit: dia.ElementView.Flags.UPDATE,
                function: dia.ElementView.Flags.UPDATE,
                loop: dia.ElementView.Flags.UPDATE,
                // Its parts drawn from its data (see `computed.ts`)
                data: dia.ElementView.Flags.UPDATE,
                // Its directional parts mirrored, its label clear of its drawing (see `flip.ts`)
                flip: dia.ElementView.Flags.UPDATE,
                // Rotated: its label laid out again (horizontal, on its side - see `LabelPosition`)
                angle: [dia.ElementView.Flags.ROTATE, dia.ElementView.Flags.UPDATE],
                ...Object.fromEntries(attributes.map(attribute => [attribute, dia.ElementView.Flags.UPDATE]))
            }
        )
    });
}

/** The view of the shapes without a view of their own (see `elementView` in `config.ts`) */
const ShapeView = shapeView();

export default ShapeView;
