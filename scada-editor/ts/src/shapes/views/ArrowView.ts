import { dia } from '@joint/plus';
import LinkView from './LinkView';

/** The view of an arrow: drawn again when its arrowheads change too (its markers, its line - see `Arrow`) */
const ArrowView = LinkView.extend({
    presentationAttributes: LinkView.addPresentationAttributes({
        sourceArrowhead: dia.LinkView.Flags.UPDATE,
        targetArrowhead: dia.LinkView.Flags.UPDATE
    })
});

export default ArrowView;
