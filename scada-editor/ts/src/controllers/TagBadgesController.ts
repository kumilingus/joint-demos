import Controller from './Controller';
import type { App } from '../app';
import TagBadges from '../canvas/tag-badges';
import { isTyping } from '../events';

// How long Alt is held before the badges show (a stray press does not flash them)
const SHOW_DELAY = 150;

/**
 * The IDs of the cells shown while Alt (Option) is held (see `canvas/tag-badges.ts`): in both modes; the badges of the
 * cells added, removed, their IDs changed meanwhile drawn again; hidden when Alt is released or the window loses the
 * focus (the release would not come). Active in every mode.
 */
export default class TagBadgesController extends Controller<[App, TagBadges]> {

    onWindowKeydown = (evt: KeyboardEvent) => onWindowKeydown(this.app, this.badges, evt);
    onWindowKeyup = (evt: KeyboardEvent) => onWindowKeyup(this.app, this.badges, evt);
    onWindowBlur = () => onWindowBlur(this.app, this.badges);

    constructor(app: App) {
        super(app, new TagBadges(app.paper));
    }

    get badges(): TagBadges {
        return this.callbackArguments[1];
    }

    startListening(): void {
        const { graph } = this.app;
        this.listenTo(graph, {
            'add remove reset change:tag': onDiagramChange
        });
        window.addEventListener('keydown', this.onWindowKeydown);
        window.addEventListener('keyup', this.onWindowKeyup);
        window.addEventListener('blur', this.onWindowBlur);
    }

    stopListening(): void {
        super.stopListening();
        window.removeEventListener('keydown', this.onWindowKeydown);
        window.removeEventListener('keyup', this.onWindowKeyup);
        window.removeEventListener('blur', this.onWindowBlur);
        this.badges.hide();
    }
}

/** Alt pressed (not while typing: a character of its own): the badges after the delay */
function onWindowKeydown(_app: App, badges: TagBadges, evt: KeyboardEvent) {
    if (evt.key !== 'Alt' || isTyping(evt)) return;
    // Not the menu of the browser (Windows: Alt alone activates it)
    evt.preventDefault();
    badges.showSoon(SHOW_DELAY);
}

/** Alt released: the badges hidden (not the menu of the browser either: Windows opens it on the release) */
function onWindowKeyup(_app: App, badges: TagBadges, evt: KeyboardEvent) {
    if (evt.key !== 'Alt') return;
    evt.preventDefault();
    badges.hide();
}

/** The release of Alt would not come (the focus elsewhere) */
function onWindowBlur(_app: App, badges: TagBadges) {
    badges.hide();
}

function onDiagramChange(_app: App, badges: TagBadges) {
    badges.refresh();
}
