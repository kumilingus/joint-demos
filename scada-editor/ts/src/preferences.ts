/*
 * The preferences of the user (the settings of the editor, not of the diagram): remembered in this browser
 * (`localStorage`), the defaults where there is none - a private window, a first visit, a value of another shape.
 */

/** The preferences remembered (see the Editor group of the settings) */
export interface Preferences {
    /** A moved or resized element aligns with the others */
    snaplines: boolean;
    /** The palette has the group of the shapes in use */
    inUse: boolean;
    /** A drag moves a selected cell only (on any other it pans the canvas) */
    moveSelectedOnly: boolean;
}

// Where they are remembered: one entry (JSON)
const PREFERENCES_KEY = 'scada-editor:preferences';

/** The preferences remembered, the defaults for those that are not */
export function loadPreferences(defaults: Preferences): Preferences {
    const stored = readStored();
    const preferences = { ...defaults };
    (Object.keys(defaults) as Array<keyof Preferences>).forEach((key) => {
        if (typeof stored[key] === 'boolean') preferences[key] = stored[key];
    });
    return preferences;
}

/** Remember a preference (the user changed it) */
export function storePreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
    try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ ...readStored(), [key]: value }));
    } catch {
        // No storage (a private window): changed, not remembered.
    }
}

/** The entry as it is stored: an object, anything else - none */
function readStored(): Record<string, unknown> {
    try {
        const stored: unknown = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}');
        return stored && typeof stored === 'object' ? { ...stored } : {};
    } catch {
        return {};
    }
}
