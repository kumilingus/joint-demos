import { dia } from '@joint/plus';
import { routingPresentationAttributes } from '../common/routing';
import { markTag } from '../common/tag';

/**
 * The view of a link drawn again when its style (its colors, its size), its routing (see `style.ts`, `routing.ts`) or
 * its ID changes (a conveyor's: on the view, see `markTag()`)
 */
const LinkView = dia.LinkView.extend({
    update(this: dia.LinkView, ...args: unknown[]) {
        dia.LinkView.prototype.update.apply(this, args);
        markTag(this);
    },
    presentationAttributes: dia.LinkView.addPresentationAttributes({
        style: dia.LinkView.Flags.UPDATE,
        tag: dia.LinkView.Flags.UPDATE,
        ...routingPresentationAttributes
    })
});

export default LinkView;
