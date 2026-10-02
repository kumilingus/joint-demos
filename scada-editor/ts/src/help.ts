import { LAYER_NAMES } from './layers';

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
        <strong class="tooltip-heading">Unique</strong>
        An ID taken by another element (or an empty one) is not accepted. A copy gets a new one.`,
    layer: `
        <strong>Layers</strong>, from the top:
        <ol class="tooltip-list">${Object.values(LAYER_NAMES).map(name => `<li>${name}</li>`).join('')}</ol>
        Everything in a layer is drawn over everything in the layers below it.
        <strong class="tooltip-heading">Within a layer</strong>
        Right-click a shape and choose <em>Bring to Front</em> or <em>Send to Back</em>.`,
    controls: `
        <strong>Controls</strong> - the switch or the slider on the equipment (the power of a pump,
        the opening of a valve), operated in the run mode.
        <strong class="tooltip-heading">Off</strong>
        The element only shows its state: it is operated by the plant alone.`,
    finish: `
        <strong>Finish</strong> - how the surfaces of the element are drawn, in its color.
        <strong class="tooltip-heading">Shaded</strong>
        Lit metal: a 3D look, close to the real equipment.
        <strong class="tooltip-heading">Flat</strong>
        One tone, as the <em>high-performance HMI</em> style (ISA-101) draws the equipment.`,
    paletteFinish: `
        <strong>Palette finish</strong> - the finish of the shapes in the palette, and of the shapes dropped
        from it from now on. The diagram stays as it is (an element's own finish is set in its inspector).
        <strong class="tooltip-heading">Flat - high-performance HMI</strong>
        The ISA-101 standard (<em>Human Machine Interfaces for Process Automation Systems</em>) recommends
        muted, flat, mostly gray graphics: the equipment stays calm, so that color is left for what needs
        attention - the abnormal values and the alarms.
        <strong class="tooltip-heading">Shaded</strong>
        Lit metal: a 3D look, close to the real equipment.`,
    animations: `
        <strong>Animations</strong> - what moves in the run mode. Saved with the diagram.
        <strong class="tooltip-heading">Full</strong>
        The equipment runs: rotors spin, agitators stir, the liquid flows, flames flicker, the alarms pulse.
        <strong class="tooltip-heading">Alarms only - high-performance HMI</strong>
        The ISA-101 standard keeps the steady plant still: the eye goes to what moves, so the motion is left
        for what needs attention - the alarms. A level still glides to its new value.
        <strong class="tooltip-heading">Reduced motion</strong>
        A system set to reduce motion gets the alarms only.`,
    screen: `
        <strong>Screen</strong> - the part of the diagram the run mode shows: in the whole window,
        fitted to it, without scrolling and zooming; the toolbar slides away (and back when the pointer
        comes to the top).
        <strong class="tooltip-heading">Without a screen</strong>
        The run mode shows the whole diagram.
        <strong class="tooltip-heading">The frame</strong>
        It can be moved and resized only while the settings are open.`
};

/** The label of a field of an inspector: with the question mark if it has a help (the default label otherwise) */
export function renderLabel(options: { label?: string }, path: string): HTMLElement | undefined {
    const help = FIELD_HELP[path];
    if (!help) return undefined;
    const label = document.createElement('label');
    label.textContent = options.label ?? path;
    const mark = document.createElement('span');
    mark.className = 'field-help';
    mark.textContent = '?';
    mark.dataset.tooltip = help;
    label.append(mark);
    return label;
}
