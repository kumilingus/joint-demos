import type { App } from './app';
import { Mode } from './const';
import { openExample } from './actions';
import { createExampleButtons } from './example-buttons';

/*
 * A phone (narrow or short, see `PHONE_QUERY`): a viewer of the examples - no room for the palette and the inspector. The edit
 * mode is a page of the examples (see `phone.css`); the one picked runs, its Exit button back to the page.
 */

/** A phone: narrow, or short (turned sideways) - the same as the `@media` of `phone.css` */
const PHONE_QUERY = '(max-width: 640px), (max-height: 480px)';

export function isPhone(): boolean {
    return window.matchMedia(PHONE_QUERY).matches;
}

/** The page of the examples (in `index.html`): shown on a phone in the edit mode (see `phone.css`) */
export function renderPhoneExamples(app: App): void {
    const el = app.el.querySelector('.scada-phone-examples');
    if (!el) {
        return;
    }
    const title = document.createElement('h2');
    title.textContent = 'Examples';
    const text = document.createElement('p');
    text.textContent = 'Run a plant: watch it, operate its equipment. Editing needs a larger screen.';
    const buttons = createExampleButtons((example) => {
        if (openExample(app, example)) {
            app.setMode(Mode.Runtime);
        }
    });
    el.append(title, text, ...buttons);
}
