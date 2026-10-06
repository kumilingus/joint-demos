import { dia } from '@joint/plus';

/** The `set` of a built-in attribute of JointJS (`text`, `text-wrap`): to draw it from an attribute of the app */
export function builtInSet(name: string): dia.Cell.SetCallback<dia.CellView> {
    const set = dia.Element.getAttributeDefinition(name)?.set;
    // A string: an alias of another attribute (no `set` of its own)
    if (typeof set !== 'function') throw new Error(`The built-in attribute "${name}" has no set of its own.`);
    return set;
}
