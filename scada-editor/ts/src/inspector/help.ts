import { LAYER_NAMES } from '../canvas/layers';
import { setBesidePanel } from '../tooltips';

/*
 * The help of the fields of the inspectors (of a cell, of the settings): a question mark next to the label
 * of a field, its tooltip explaining what the label can't say. The texts are HTML (the tooltip renders
 * its content as such).
 */

/** The help by the path of the field */
const FIELD_HELP: Record<string, string> = {
    tag: `
        <strong>ID</strong> - the tag of the element in the plant (e.g. <em>P-101</em>): the plant data
        are addressed to it, a SCADA server sends the values by it.
        <strong class="scada-tooltip-heading">Optional</strong>
        Without one the element is not a part of the plant: a picture, a background. <em>Generate</em> gives it the next
        free ID of its kind. The equipment gets one when it is dropped.
        <strong class="scada-tooltip-heading">Unique</strong>
        An ID taken by another element is not accepted. A copy gets a new one (of the same series: <em>FT-102</em>
        after <em>FT-101</em>).`,
    layer: `
        <strong>Layers</strong>, from the top:
        <ol class="scada-tooltip-list">${Object.values(LAYER_NAMES).map(name => `<li>${name}</li>`).join('')}</ol>
        Everything in a layer is drawn over everything in the layers below it.
        <strong class="scada-tooltip-heading">Within a layer</strong>
        Right-click a shape and choose <em>Bring to Front</em> or <em>Send to Back</em>.`,
    controls: `
        <strong>Controls</strong> - the switch or the slider on the equipment (the power of a pump,
        the opening of a valve), operated in the run mode.
        <strong class="scada-tooltip-heading">Off</strong>
        The element only shows its state: it is operated by the plant alone.`,
    finish: `
        <strong>Finish</strong> - how the surfaces of the element are drawn, in its color.
        <strong class="scada-tooltip-heading">Shaded</strong>
        Lit metal: a 3D look, close to the real equipment.
        <strong class="scada-tooltip-heading">Flat</strong>
        Its color as it is, every part outlined, as the <em>high-performance HMI</em> style (ISA-101) draws the
        equipment. In the color <em>Canvas</em>: a line drawing, as a P&amp;ID.
        <strong class="scada-tooltip-heading">Auto</strong>
        The finish of the diagram (Settings - Style).`,
    // The colors of a shape (see `ColorField`): by the label of the field - each shape has them at a path of its own
    color: `
        <strong>Color</strong> - the main color of the shape: the metal of the equipment, the line of a pipe,
        the text of a label. Mixed into the shading in the finish <em>Shaded</em>, as it is in <em>Flat</em>.
        <strong class="scada-tooltip-heading">Default</strong>
        The color of the shape (the first swatch): of the diagram's style, if it has one (Settings - Style).
        <strong class="scada-tooltip-heading">Canvas</strong>
        The color of the canvas, light or dark with the theme: a line drawing, as a P&amp;ID.`,
    outline: `
        <strong>Outline</strong> - the outline of the shape (of its surfaces: one color, one width for all of them;
        the edges of a pipe).
        <strong class="scada-tooltip-heading">Auto</strong>
        As the shape draws it (in the finish <em>Flat</em>: the edge of the metal).`,
    outlineWidth: `
        <strong>Outline width</strong> - the width of the outline: of a shape while it is outlined (an outline color of
        its own, or the finish <em>Flat</em>), of the border of a pipe.
        <strong class="scada-tooltip-heading">Auto</strong>
        The outline width of the diagram (Settings - Style).`,
    accent: `
        <strong>Accent</strong> - a marking of the shape in a color of its own: the bands of a stack, the handwheel
        of a valve, the motor of a pump, the needle of a gauge, the reading of a meter, the liquid of a level panel.
        <strong class="scada-tooltip-heading">Not a state</strong>
        The colors of a state (an alarm, a warning level, a running pump) are the plant's: they stay.`,
    animations: `
        <strong>Animations</strong> - what moves in the run mode. Saved with the diagram.
        <strong class="scada-tooltip-heading">Full</strong>
        The equipment runs: rotors spin, agitators stir, the liquid flows, flames flicker, the alarms pulse.
        <strong class="scada-tooltip-heading">Alarms only - high-performance HMI</strong>
        The ISA-101 standard keeps the steady plant still: the eye goes to what moves, so the motion is left
        for what needs attention - the alarms. A level still glides to its new value.
        <strong class="scada-tooltip-heading">Reduced motion</strong>
        A system set to reduce motion gets the alarms only.`,
    // The style of the diagram (in the settings: on its color, see `settings.ts`)
    'diagram-style': `
        <strong>Style</strong> - the colors of the whole diagram: of every shape without a color of its own, in the
        palette too. Saved with the diagram.
        <strong class="scada-tooltip-heading">Finish</strong>
        Shaded or flat: of every shape without a finish of its own (its finish <em>Auto</em>).
        <strong class="scada-tooltip-heading">Color</strong>
        Mixed into the metal of the equipment (the shading stays).
        <strong class="scada-tooltip-heading">Outline, Accent</strong>
        The outlines; the markings (bands, handwheels, motors, caps, ...).
        <strong class="scada-tooltip-heading">Outline width</strong>
        Of the outlined shapes and the borders of the pipes without one of their own (their <em>Auto</em>).
        <strong class="scada-tooltip-heading">Auto</strong>
        The colors of the shapes themselves.`,
    // What the labels of the shapes show (the style of the diagram, see `LabelContent`)
    labels: `
        <strong>Labels</strong> - what the labels of the shapes show. Saved with the diagram.
        <strong class="scada-tooltip-heading">Name</strong>
        The name of the shape (its <em>Name</em> in the inspector).
        <strong class="scada-tooltip-heading">ID</strong>
        The ID of the shape (its tag: <em>P-101</em>) - as on a P&amp;ID, where everything is labeled by its tag.
        <strong class="scada-tooltip-heading">ID + name</strong>
        The ID in bold above the name - as the operator displays (ISA-101): the plant speaks in tags, the name
        says what it is. A shape without a name shows its ID alone.
        <strong class="scada-tooltip-heading">Without an ID</strong>
        A shape not bound to the plant (a picture, a background) shows its name. The Label shape and the zones keep
        their text.`,
    screen: `
        <strong>Screen</strong> - the part of the diagram the run mode shows: in the whole window,
        fitted to it, without scrolling and zooming; the toolbar slides away (and back when the pointer
        comes to the top).
        <strong class="scada-tooltip-heading">Without a screen</strong>
        The run mode shows the whole diagram.
        <strong class="scada-tooltip-heading">The frame</strong>
        It can be moved and resized only while the settings are open.`
};

/** The label of a field of an inspector: with the question mark if it has a help (the default label otherwise) */
export function renderLabel(options: { label?: string; help?: string }, path: string): HTMLElement | undefined {
    // By its own key (a field of the style of a cell, of the diagram: the same path), else by its path
    const help = FIELD_HELP[options.help ?? path];
    if (!help) return undefined;
    const label = document.createElement('label');
    label.textContent = options.label ?? path;
    const mark = document.createElement('span');
    mark.className = 'scada-field-help';
    mark.textContent = '?';
    mark.dataset.tooltip = help;
    setBesidePanel(mark, 'inspector');
    label.append(mark);
    return label;
}
