/**
 * The keys of an object as its type names them: `Object.keys()` types them as strings (an object may have more keys
 * than its type says) - for the objects of the app's own constants (the options of a field, ...), which have no others.
 */
export function keysOf<T extends object>(object: T): Array<keyof T & string> {
    // The keys of its type: the object has no others (see above)
    return Object.keys(object) as Array<keyof T & string>;
}
