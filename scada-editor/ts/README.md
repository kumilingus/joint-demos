# JointJS+: SCADA Editor (TypeScript) <a href="https://www.jointjs.com/jointjs-plus"><img src="../../jointjs-plus-badge.svg" alt="JointJS+" width="123" align="right" /></a>

An editor of a SCADA plant diagram, built with JointJS+. The shapes are the ones of the [SCADA demo](../../scada/), drawn statically (there is no simulation).

## Features

- **Example** - a boiler house: water treatment, feed pumps, a flow meter, two boilers with their stacks, the steam header and a process heater.
- **Canvas** - `ui.PaperScroller` with panning (drag the blank area) and zooming (toolbar, pinch).
- **Navigator** - `ui.Navigator` minimap in the corner of the canvas, with simplified views: an element is a plain rectangle, a pipe a single line.
- **Palette** - `ui.Stencil` with the shapes in groups, laid out in a compact grid (`layout.GridLayout`) with the shapes of a similar size next to each other, and a search (by the type, the label or the instrument tag). Pipes and signal lines are dragged from the palette like the elements; so are the labels (a text on its own, wrapped in its box).
  - Piping: pipe, join, Y-strainer, orifice plate, zone (facing left or right)
  - Rotating Equipment: pump, compressor, fan, blower, motor, turbine, conveyor belt
  - Valves: control, hand, check, butterfly, ball, solenoid, relief and gate valve
  - Process: heat exchanger, filter, boiler, reactor, distillation column, separator, cyclone, air cooler, scrubber
  - Storage: tank, conic tank, mixing tank, silo, spherical tank, hopper, horizontal tank, water tower
  - Structures: chimney, cooling tower
  - Instruments: ISA instrument bubble, pressure gauge (its needle points to the `value`, the warning zones follow its `thresholds`), level panel (in the example it is embedded in the feedwater tank, so it moves with the tank), thermometer, flow meter, beacon, display, trend (the recent history of a value)
- **Editing** - on a grid (`GRID_SIZE` in `const.ts`, drawn as a double mesh: thin lines and a thick one every five of them): the elements move and the anchors of the pipes snap in its steps, the elements resize in two steps (their centers stay on the grid). Move elements and pipes; a moved element aligns with the others (`ui.Snaplines`, also for the shapes dropped from the palette). Select a cell with a click, add or remove one with `Ctrl` / `Cmd` / `Shift` + click, select the cells in a region with `Shift` + drag on the blank canvas (`ui.RectangularSelectionRegion`: the elements and the pipes whole in it); the selected elements move together (one step in the history). Resize and rotate an element selected alone (`ui.FreeTransform`), reshape a pipe selected alone with link tools (vertices, source and target arrowheads) and inspect it; in a multiple selection the elements are only framed (a dashed frame, a `HighlighterView` of their model size) and the pipes outlined. Delete the selection with `Delete` / `Backspace`, clear it with `Escape`, copy, cut and paste it with `Ctrl` / `Cmd` + `C`, `X`, `V` (`ui.Clipboard`: the pasted cells a little further, with tags of their own; a pipe copied on its own has free ends).
- **Light / dark** - the button in the toolbar switches the color scheme (remembered; the first time it follows the system): the design tokens in `styles.css`, the canvas (`canvasColors` in `config.ts`) and the shapes: the dark one is navy, with the steel of the shapes in blue - CSS overrides the stops of their gradients (matched by color) and their few dark parts.
- **Undo / redo** - `dia.CommandManager`: the toolbar buttons and `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z`). The history records the editing only: the changes in the runtime mode (operating the equipment, the plant data) are not undone.
- **Inspector** - `ui.Inspector` for the selected element, with the inputs for what it has: the ID (the tag), the label (and the instrument tag), the values (power, open, level, temperature, the value on a display) and whether it uses its control in the runtime mode. For a label: its text and its font size. For a pipe or a signal line: its routing (`routing` in `shapes/routing.ts`, as the link routing presets of `@joint/react`) - Straight, Orthogonal (in right angles through its vertices) or Curved (leaving its ends outwards); the corners are rounded. The routing sets the router and the connector of the link (derived changes, not recorded in the history: they follow the routing on undo and redo).
- **Tags** - every element has an ID of its own (`tag`, e.g. `P-101`): JointJS generates the `id` of a cell, but it can't be changed. It's edited in the inspector (an empty or a taken tag is reverted); an element dropped from the palette gets the next free one (`P-103`).
- **Runtime mode** - the Run button in the toolbar makes the diagram read-only; what can't be done in it doesn't exist in it (the palette and the undo / redo buttons are destroyed, the toolbar is created for each mode - not only hidden); dragging anywhere pans the canvas. The plant runs: a mock (`simulation.ts`) sends random updates of the plant data in random intervals, addressed by the tags of the elements (`{ tag: 'FT-101', changes: { 'attrs/value/text': '18.9' }}`) - levels, flows, pressures and temperatures drift, the control valve moves, the equipment is switched now and then and the alarm goes on above 11 bar. The plant is animated (`animations.ts`, the Web Animations API): the rotors of the pumps, the fans and the blowers spin while they are on, the liquid flows through the pipes (unless a pump at their end is off or a valve closed) and the open control valves, the flames of the boilers flicker, the smoke of the stacks rises, the plume of the cooling towers breathes, the alarm pulses and the liquid of the level gauges rises and falls to its new level (from the previous one, both computed from the model). The equipment is operated with its controls (highlighters with HTML form controls), unless they are turned off in the inspector: a power switch on the rotating equipment and the beacon, open / close buttons on the hand, ball, butterfly and solenoid valves and a slider on the control valves.

The graph has three layers (`layers.ts`), from the bottom: `pipes` (the pipes), `equipment` (the machines, the tanks, the valves - the default one) and `instruments` (the gauges, the meters, the displays, the signal lines and the labels). A pipe is drawn under the equipment it connects and a level gauge over its tank, whatever the order they were added in.

The pipes are dragged from the palette (not from the ports of the equipment); their ends are connected to the equipment with the arrowheads - to the end of a pipe stub (a port) if the element has any, to a side of it otherwise; a signal line connects to the side of an element (never to a stub), nothing connects to a label. The arrowheads (`tools.ts`) are translucent pills over the ends of the pipe and the vertices small handles as those of the selection frame (a `VertexHandle`); a dragged end snaps to the ports and elements nearby (`snapLinks`), outlined in the color of the selection (the `connecting` highlighting of the paper). The `connectionStrategy` (`connections.ts`) pins the anchor to the side of the element nearest to the pointer, in the steps of the grid (a port keeps its own anchor) - so the arrowhead moves the anchor too, along the sides of the same element.

## Project Structure

```
src/
  main.ts          entry point
  app.ts           the App: graph, paper, scroller, stencil, toolbar, keyboard and the mode switch
  config.ts        options of the paper, the scroller and the toolbar; the interactivity of each mode
  const.ts         the modes, the layers and the colors
  layers.ts        the graph with its layers (for the canvas and the palette)
  actions.ts       selecting (with the free transform) and removing cells
  controls.ts      the controls of the equipment (operated in the runtime mode)
  tags.ts          the IDs of the elements
  simulation.ts    the mock of the plant (random runtime updates)
  animations.ts    the animations of the runtime mode
  inspector.ts     the inputs of the inspector
  navigator.ts     the minimap and its simplified views
  stencil.ts       the palette
  diagram/         the example (a boiler house)
  shapes/          one file per shape (extending `Shape`, see below); ports.ts has the shared pipe stubs and label, gradients.ts the metal,
                   footprint.ts the area a shape takes (its bounding box, pipe stubs and `static overflow`)
  controllers/     the event handling
```

## How It Works

The event handling lives in controllers (`src/controllers`). A controller is an `mvc.Listener` that gets the `App` as its first argument: every handler is a plain function `(app, ...eventArgs)` that calls into `src/actions.ts`.

| Controller | Mode | Listens to |
|---|---|---|
| `CanvasController` | always | paper: blank drag (not with `Shift` in the edit mode), pinch, pan; scroller: pan start/stop |
| `ControlsController` | always | graph: the controls of the added elements, `controls` turned on / off |
| `SelectionController` | always | the selection: the free transform, the link tools, the inspector |
| `TagsController` | always | graph: a tag for every added element, no empty or taken tags |
| `ToolbarController` | always | toolbar: the mode button |
| `EditController` | edit | paper: cell click (with a modifier: cherry-picking), blank click (with `Shift`: a region); graph: `position` (the selection moves together) |
| `KeyboardController` | edit | keyboard: `Delete`, `Backspace`, `Escape`, undo / redo, copy / cut / paste |
| `RuntimeController` | runtime | paper: cell drag (pans the canvas, not on a control) |
| `SimulationController` | runtime | starts the mock of the plant on start, stops it on stop |
| `AnimationsController` | runtime | starts the animations on start (stops them on stop); graph: `power`, `open` (the rotor stops, the pipes stop flowing), `level` (the liquid of a level gauge moves) |

`App.setMode()` stops the controllers of the old mode, starts the controllers of the new one and changes the interactivity of the paper (`config.ts`).

### Shape features

Every element extends `Shape` (`src/shapes/Shape.ts`) and overrides the features (getters on the prototype) that differ from the defaults:

| Feature | Default | Example |
|---|---|---|
| `resizable` | `true` (down to half of the default size) | `false` (a pump), `{ preserveAspectRatio: true }` (an instrument bubble), also `minWidth`, `maxHeight`, ... |
| `rotatable` | `true` | `false` (a display) |
| `control` | `null` | `'power'`, `'toggle'` or `'slider'` (the control in the runtime mode) |
| `graphLayer` | `Layer.Equipment` | `Layer.Instruments` (a gauge, a display): the layer of the graph the element is in |
| `anchors` | `'sides'` (anywhere on a side, in the steps of the grid) | `'middles'` (a join): a pipe end is anchored in the middle of a side only |
| `stubLength` | `null` | `25`: the pipe stubs start in the center and reach 25 out of the element, whatever its size |
| `tagPrefix` | the initials of the type | `'NRV'` (a check valve): the start of the generated tags |
| `overflow` | `{}` | `{ top: 42 }` (the actuator of a control valve), on top of the label below the shape |

The free transform, the controls and the palette layout read them.

## Running the Demo

To run this application you need to have access to the JointJS+ package. You can get it by having a JointJS+ license or by starting a [free trial](https://www.jointjs.com/free-trial).

If you are a trial user, you received your access token during the trial sign-up process.
If you are a customer, log in to the customer portal at https://my.jointjs.com to obtain your access token.

This example uses the `.npmrc` file to set up access to the JointJS+ private npm registry. By default it reads the authentication token from the `JOINTJS_NPM_TOKEN` environment variable, which you can set in your terminal or CI environment:

**macOS / Linux**:
```sh
export JOINTJS_NPM_TOKEN="jjs-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Windows (PowerShell)**:
```sh
$env:JOINTJS_NPM_TOKEN="jjs-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Learn more about our [private npm registry here.](https://docs.jointjs.com/learn/help-center/npm-registry)

After setting up access to the JointJS+ package, install the dependencies and start the dev server:

```bash
npm install
npm run dev
```
