import type { dia } from '@joint/plus';

/** A style of a text (several at once): its slant, its lines */
export type TextStyle = 'italic' | 'underline' | 'line-through';

const DECORATIONS: TextStyle[] = ['underline', 'line-through'];

/**
 * The special attributes of the texts: `textStyles` - the styles of a text (an array of `TextStyle`, as the inspector
 * sets it), the SVG attributes of each (`font-style`, `text-decoration`).
 */
export const textAttributes = {
    // `textStyles` in the attributes
    'text-styles': {
        set(styles: unknown) {
            const list = Array.isArray(styles) ? styles as TextStyle[] : [];
            const decorations = DECORATIONS.filter(style => list.includes(style));
            return {
                'font-style': list.includes('italic') ? 'italic' : 'normal',
                'text-decoration': decorations.length > 0 ? decorations.join(' ') : 'none'
            };
        },
        unset: ['font-style', 'text-decoration']
    }
} satisfies Record<string, dia.Cell.PresentationAttributeDefinition<dia.ElementView>>;
