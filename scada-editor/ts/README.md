# JointJS+: SCADA Editor (TypeScript) <a href="https://www.jointjs.com/jointjs-plus"><img src="../../jointjs-plus-badge.svg" alt="JointJS+" width="123" align="right" /></a>

An editor of a SCADA plant diagram, built with JointJS+, with a runtime mode where the plant runs (a mock) and the equipment is operated. The shapes are based on the ones of the [SCADA demo](../../scada/).

## Features

- **Canvas** - `ui.PaperScroller` (pan, zoom, pinch) and a `ui.Navigator` minimap with simplified views.
- **Palette** - `ui.Stencil`; each group is packed with a skyline packing of the shape footprints (`palette/packing.ts`, no third-party code), without the labels. A click on a shape shows it in the inspector panel with a description, where it can be made a favorite (and an uploaded image renamed or deleted); a drag starts once the pointer moves, a dropped shape is selected.
  - **Favorites** and **In Use** are made of the other groups (hidden while empty). A shape is matched by `paletteKey()`: its type, plus the image for an uploaded image.
  - **Custom** - uploaded images. They are stored on the graph (`graph.get('images')`) and an element refers to its image by id, so an image is saved once and is in the DOM once per paper (`palette/images.ts`: a `<symbol>` in the paper defs, a `<use>` in each element). An element whose image is not in the diagram (pasted from another one) shows a placeholder.
- **Editing** - on a grid (`GRID_SIZE`), elements resize in two grid steps; snaplines; selection by click, `Ctrl` / `Cmd` / `Shift` + click and `Shift` + drag (a region touching the cells, a pipe by its route), all by `Ctrl` / `Cmd` + `A` (as a region: not the screen, a group for its members); `ui.Selection` frames the selected cells and moves them together (`canvas/selection.ts`), `ui.FreeTransform` and link tools for a single selection; copy / cut / paste (`ui.Clipboard`); undo / redo (`dia.CommandManager`).
- **Pipes** - dragged from the palette and connected with the arrowheads: to a pipe stub (a port) if the element has any, otherwise to its side (`connectionStrategy` in `canvas/connections.ts` pins the anchor to the side nearest to the pointer, relative to the size). A signal line connects to the body of an element, an arrow alone connects to a label (a note). An arrow (`shapes/models/instruments/Arrow.ts`, in the instruments group) points at a part of the plant: free or connected to the body of an element, its arrowheads at both ends (none, an arrow, an open arrow, a circle, a diamond) and its color set in the inspector. The routing (straight, orthogonal, curved) is chosen in the inspector (`shapes/common/routing.ts`), and so are the color of a pipe and of its outline.
- **Electrical** - a palette group of the electrical equipment: a diesel generator set (fed with fuel by a pipe, e.g. from the fuel tank of the storage group), a wind turbine, a solar array, a power transformer, a switchgear, a motor control center, a battery bank; the smaller parts of the circuits (a generator, a transformer, a copper busbar, a battery, a molded-case breaker, a knife disconnector, a fuse, a surge arrester, a ground rod, a lamp, a heater, a voltmeter) and a wire. A wire connects to the terminals of the electrical shapes only (`terminalPorts()` in `shapes/common/ports.ts`), a pipe never does. In the runtime mode the circuits energized from a running generator or wind turbine, a battery or a solar array, through the closed breakers and disconnectors, are shown live (the `energized` of the cells, sent by the plant - traced by the mock in `plant/mock/energized.ts`): the wires in color, the lamps of the cabinets and a lamp lit, a heater glowing, a voltmeter reading the voltage; a wind turbine spins, a diesel generator smokes, the charge of a battery bank and the fuel of a tank change.
- **Bulk handling** - a palette group of the solids: a conveyor (`shapes/models/bulk/Conveyor.ts`, a link drawn as a belt: its outline, the belt and the cleats across it - their colors the Outline, the Color and the Accent - straight, inclined or turning on its route, connected to the body of the equipment; while it runs, `power`, its cleats move from its start to its end), a belt conveyor (an element: its boxes ride from the start of the belt to its end), a bucket elevator (the buckets go up), a jaw crusher (the flywheel turns, the jaw swings), a ball mill (the liners move round with the drum) and a rotary kiln (the flame burns, the hot zone glows); a bag filter (its bags pulsed clean one after the other) is in the process group.
- **Charts** - a line chart, a bar chart, a donut chart and a gauge chart (`shapes/common/charts.ts`): shapes of their own (not the legacy chart shapes), their data on the model (`values`, `slices`, `value`) and their paths computed from it by special attributes when they are rendered (their views render them again when the data changes), configured in the inspector (the scale, the thresholds, the slices). The runtime mode feeds them new data every second.
- **Tables** - a table with a title (both of them shown or hidden in the inspector) and a readout (neither the title nor the names of the columns), in the charts group (`shapes/models/charts/Table.ts`): its columns (a name, and the kind of the values: a text, a number, a state - a dot in the color of `on`, `off`, `alarm`, in a narrow column) set in the inspector, its rows by resizing it (by its sides and its bottom: as many rows as the height takes, a row a step of the grid, as the length of a busbar its taps), the columns sharing its width. It has a view of its own (`shapes/views/TableView.ts`, as the counters demo draws its nodes): the structure is rendered when it changes, a new value from the plant (the runtime mode) updates the text of its cell only.
- **Background** - a palette group of the shapes under the plant: a rectangle and an ellipse (`shapes/models/background/Rectangle.ts`, `shapes/models/background/Ellipse.ts`), resized and rotated freely, their color and opacity set in the inspector; nothing connects to them.
- **Groups** - several selected elements grouped from the context menu (Group, `Ctrl`/`Cmd` + `G`) into an invisible element they are embedded in (`shapes/models/diagram/Group.ts`), with the links between them; selected, it has a dashed frame and a badge (its ID, how many members), a hovered member outlines its group. A click on a member selects the group, a click again goes one level in (the member, a group in it) - `Escape` one level up; a drag moves the selected level, the groups refit (`GroupController`). Cherry-picking adds the elements of the same level only; grouping them in a group nests the new group; a group left with one member is dissolved. Copied, pasted, deleted, brought to the front as a whole; Ungroup (`Ctrl`/`Cmd` + `Shift` + `G`) moves the members to the group above. A group is not resized nor rotated; its inspector shows its ID and members. The snaplines snap a dragged group (`canvas/Snaplines.ts`: a fix of the library, it took the pointer offset of the clicked member).
- **Colors of the equipment** - the surfaces of a shape are set to a color of its own in the inspector (`color`): the special attributes `surfaceFill` (a shading: `'cylinder'`, `'pipe'`, ..., or `'flat'`) / `surfaceStroke` (`'edge'`) - a kind of the metal, or a color of the shape of its own (`'var(--shape-fitting-fill)'`) (`shapes/common/gradients.ts`) mix it into each stop of the shading (`color-mix()`), so the highlights and the edges stay, in the colors of the theme still; the default is the plain metal. The finish (`finish`) of the surfaces is shaded (the color mixed into the shading) or flat - the color as it is, every surface outlined, as the high-performance HMI (ISA-101) style draws the equipment; in the color Canvas (`--shape-canvas`, a theme color too) a line drawing as a P&ID (the ink on the surfaces, `SURFACE_INK`, then as the labels). The outline (`outline`) is a color of the element's own for all its surfaces, in one width; Auto: as the shape draws it (flat: the edge of the metal). The inspector shows the Finish first. A shape with a marking has an accent too (`accentField`: the bands of a stack, the handwheel or actuator, coil, cap of a valve, the terminal box of a motor, the agitator motor of a tank, the base, saddles, skirt, skid of the equipment; the content of a fixed color too: the fuel of a fuel tank, the material of a hopper, the flames of a boiler, the soil of a ground rod; the series of a chart, a trend - the parts of one color follow it, `fillFrom`), set as its Accent - not the colors of a state (an alarm, a warning level), the plant sets those. The parts of another material (porcelain, copper, glass: `materialFill`) keep their colors, flat in the flat finish. The swatches offer the colors of the theme (`--color-*` in `shapes/shapes.css`: blue, green, violet, slate, amber, red - a tone in each scheme - and the canvas), then the recent colors and those of the diagram (the pipes, ...). A shape is rendered again when its color changes, its pipe stubs too (`shapes/views/ShapeView.ts`, the `elementView` of the paper). A pipe stub reaches under its element (no gap at a round side).
- **Layers** - `background`, `pipes`, `equipment`, `instruments` and `foreground` (`canvas/layers.ts`): a pipe is under the equipment, a level panel over its tank; a cell is put in another layer in the inspector (the JointJS badge of the example is in the background).
- **Inspector** - `ui.Inspector` for a single selected cell, in groups: General (the tag, the texts, the layer), Appearance (the color and the finish of the equipment, the size and color of a label, the color and opacity of a background shape), Values, Thresholds, Controls (whether the control is used); a link has one group (its routing, color, arrowheads, layer). Several selected cells: their color and finish at once (`inspector/selection-inspector.ts`: an inspector of a cell standing in for them - a value they all have, or "mixed"; each cell's own color, the metal of a pump, the line of a pipe; one step of the history); a group sets the appearance of its members, as they are now (it has none of its own).
- **Examples** - three diagrams (`examples.ts`) offered in the inspector panel when nothing is selected: a boiler house (steam, opened at the start), a microgrid (power: a wind turbine, a solar array, a diesel backup fed from a day tank and a battery bank on a 400 V bus, the lighting and the motors under it) and a cement plant (solids: the rock crushed and ground in the raw mill, lifted by the bucket elevator onto the conveyor over the raw meal silos, the meal through the cyclones of the preheater into the rotary kiln, the clinker on a conveyor under the kiln into its silo, the gas through the bag filter to the stack). Opened as a file; asked first if the diagram has changes (an undo to lose).
- **New / save / open** - a new diagram is an empty screen (asked first if the diagram has changes); JSON from `graph.toJSON()`: the cells, the images and the favorites (not the layers). An element is saved without its ports (`Shape.toJSON()`): they are its shape's, a busbar makes them of its `taps`. A file is loaded into a scratch graph first, so an invalid one doesn't replace the diagram.
- **Settings** - the cog in the toolbar opens the settings in the inspector panel (`inspector/settings.ts`): of the diagram, a **screen** and its size, its **style** (`diagram-style.ts`: the finish of every shape without one of its own - its finish Auto - a color mixed into the metal of all the equipment, an outline, an accent - instead of the defaults of the shapes, the `--base-*` of `shapes/shapes.css`, everywhere: the canvas, the palette; an element's own colors over them; saved with the diagram), the **animations** of the run mode (full, or the alarms only - the ISA-101 high-performance HMI style, also when the system asks for reduced motion; a kind of each animation in `runtime/animations.ts`); of the editor, the snaplines and the In Use group of the palette (on or off, not saved). The screen (`shapes/models/diagram/Screen.ts`) is a frame in the background layer, saved with the diagram (and undone as any change); it can be moved, resized and selected only while the settings are open, and a region never selects it. In the runtime mode the canvas shows the screen only (`canvas/screen.ts`): in the whole window (the toolbar slides down when the pointer comes to the top 32 pixels), fitted (again when the window is resized), clipped, without scrolling, panning, zooming and the navigator.
- **Runtime mode** - the palette, the history and the file buttons don't exist in it. `plant/mock/` (the mock of the plant: an app with a real plant deletes the folder and its controller in `app.ts`) sends random updates addressed by the element tags, some of them following the plant (the feedwater flow and pressure follow the feed pumps running, the charts follow the flow); `runtime/animations.ts` spins the rotors and the agitators, carries the boxes of a conveyor, moves the liquid through the pipes, the control valves and the level panels, and animates the flames, the smoke and the alarm. The controls (HTML in highlighters) are operated in this mode only; while editing they are `inert`.
- **Light / dark** - the design tokens in `theme/tokens.css` (the app's own in `tokens.css`). The shapes use CSS variables for their colors, `--shape-*` in `shapes/shapes.css` (`fill: 'var(--shape-face)'`, the stops of the metal gradients, ...): the dark scheme redefines them (blue steel, dark faces), no selectors override the shapes.
- **Tooltips** - `ui.Tooltip` for every element with `data-tooltip`.

## History

Recorded: the editing of the diagram, the images included (an upload, a rename, a delete - a delete with its elements is one step). Not recorded (see `historyOptions` in `config.ts`): the runtime changes (`RUNTIME`), the changes derived from others (`DERIVED`, e.g. the router of a routing) and the favorites (`PREFERENCE`). Opening a diagram clears the history.

## Controls

| Action | Shortcut |
|---|---|
| Delete the selection | `Delete` / `Backspace` |
| Clear the selection | `Escape` |
| Undo / redo | `Ctrl` / `Cmd` + `Z` / `Y` (or `Shift` + `Z`) |
| Copy / cut / paste | `Ctrl` / `Cmd` + `C` / `X` / `V` |
| Add to / remove from the selection | `Ctrl` / `Cmd` / `Shift` + click |
| Select a region | `Shift` + drag on the blank canvas |

## Project Structure

```
src/
  main.ts            the entry: the font, the theme, the app
  app.ts             the App: graph, paper, scroller, toolbar, palette, controllers, the mode switch
  config.ts          options (paper, history, scroller, toolbar, tooltips) and the interactivity of each mode
  const.ts           the constants: the modes, the layers, the grid, the colors
  diagram-style.ts   the style of the diagram (a finish, a color, an outline, an accent of all the shapes)
  examples.ts        the examples to open (in the empty inspector panel)
  styles.css         the styles: the layers of JointJS+ and the theme, the tokens, the styles of the parts of the app (layout.css, */*.css)
  tokens.css         the design tokens of the app over the theme's, the icons of its tools (icons/, Lucide)
  actions/           what the controllers do: selection.ts, history.ts, clipboard.ts, order.ts (front, back, the layers),
                     groups.ts, pipes.ts (split, join), file.ts (new, open, save, export), palette.ts (the images, the derived groups), view.ts
  canvas/            the canvas: selection.ts (`ui.Selection`: the region, the frames, the hover frame, the badges of the groups),
                     Snaplines.ts, tools.ts (the link tools), connections.ts (where a link end connects), layers.ts (the graph with its layers),
                     navigator.ts (the minimap), screen.ts, context-menu.ts, tint.ts (an element tinted in a color)
  palette/           the palette: stencil.ts (groups, layout, the derived groups, the upload button), packing.ts (the skyline packing),
                     shape-preview.ts (a shape clicked: shown in the inspector panel; descriptions.ts: the texts), images.ts, favorites.ts
  inspector/         the inspector: inspector.ts (the inputs), selection-inspector.ts (several cells), color-field.ts, help.ts (the help of the fields),
                     settings.ts (the settings of the diagram and of the editor)
  runtime/           the runtime mode: controls.ts (the controls of the equipment), animations.ts
  plant/             the interface of the diagram to the plant: plant.ts (`update(tag, property, value)`, `get()`, the `update` and `command` events, see Connecting a plant),
                     properties.ts (the properties of the equipment as the plant knows them, bound to the elements by their types), tags.ts (the IDs);
                     mock/ the mock of the plant (mock-plant.ts, the energized circuits in energized.ts) and its controller: delete it for a real plant
  log/               the log of the messages between the diagram and the plant (the Log button in the runtime mode): a listener of the plant
  controllers/       the event handling
  shapes/            the shapes (see Shape features): models/ the shape classes by the groups of the palette (piping/, rotating/, valves/,
                     process/, storage/, bulk/, structures/, instruments/, electrical/, charts/, background/; custom/ the images of the user,
                     diagram/ the group and the screen), views/ their views (ShapeView.ts, TableView.ts),
                     common/ the base class (Shape.ts) and the parts the shapes share (ports.ts the pipe stubs and the terminals, footprint.ts
                     the area a shape takes, routing.ts, gradients.ts, charts.ts), attributes/ the special attributes of the texts
                     (label.ts the label of a shape and its position, text-styles.ts the font style), shapes.css the colors of the shapes
  theme/             the `minimal` theme of the JointJS+ components (theme-minimal.css, scoped to `.joint-theme-minimal`), its design tokens (tokens.css:
                     the CSS variable names of shadcn/ui, light and dark) and icons (icons/, Lucide) - reusable in another app, see theme/README.md
  diagrams/          the examples: a boiler house, a microgrid and a cement plant, JSON files as saved by the Save button (with the JointJS badge and a photo as images)
```

## How It Works

A controller is an `mvc.Listener` getting the `App` as its first argument; its handlers are plain functions `(app, ...eventArgs)`.

| Controller | Mode | Listens to |
|---|---|---|
| `CanvasController` | always | paper: blank drag (panning), pinch, pan |
| `ControlsController` | always | graph: the controls of the added elements; an element operated by its control (a change with the `command` option) - sent to `app.plant` |
| `SelectionController` | always | the selection: free transform, link tools, the inspector |
| `TagsController` | always | graph: a free tag for every element |
| `PipeColorController` | always | graph: the pipes (their colors, their ends) - a control valve shows the color of its pipe |
| `GroupController` | always | graph: a member moved, resized, rotated - its groups refit |
| `ToolbarController` | each mode | toolbar: mode, color scheme, save, open, settings |
| `EditController` | edit | paper: cell click, blank drag (a region) |
| `PaletteController` | edit | palette: shape click, shape drop; graph: the derived palette groups |
| `KeyboardController` | edit | the keyboard shortcuts |
| `RuntimeController` | runtime | paper: a cell drag pans the canvas |
| `MockPlantController` | runtime | the mock of the plant (in `plant/mock/`): calls `app.plant.update()` |
| `LogController` | runtime | toolbar: the Log button; the plant: its messages |
| `AnimationsController` | runtime | graph: `power`, `open`, `level` |
| `ElectricalController` | runtime | graph: `energized` (the live circuits) |

### Shape features

Every element extends `Shape` (`shapes/common/Shape.ts`) and overrides the prototype getters that differ from the defaults:

| Feature | Default | Example |
|---|---|---|
| `resizable` | `true` (down to half of the default size) | `false` (a pump), `{ preserveAspectRatio: true }` |
| `rotatable` | `true` | `false` (a display) |
| `control` | `null` | `'power'`, `'toggle'`, `'slider'` |
| `graphLayer` | `Layer.Equipment` | `Layer.Instruments` (a gauge) |
| `anchors` | `'sides'` | `'middles'` (a join) |
| `stubLength` | `null` | `20` (a valve): how far the pipe stubs reach out |
| `tagPrefix` | the initials of the type | `'NRV'` (a check valve) |
| `overflow` | `{}` | `{ top: 42 }` (the actuator of a control valve) |

### Connecting a plant

The diagram changes in the runtime mode by the messages of the plant only, through its interface (`app.plant`, `plant/plant.ts` - a new one for each run, `null` while editing; also `window.plant` in the console): the tag of an element, the name of a property, a plain value - nothing of the shapes. The commands of the operator (a pump turned on, a valve opened) come out of it the same way: a control changes its element only (with the `command` option), `ControlsController` sends the change to the plant.

```ts
app.plant.update('FM-101', 'value', 18.6);   // a reading
app.plant.update('HV-101', 'open', false);   // a state
app.plant.get('LI-101', 'level');            // what the diagram shows now
app.plant.on('command', ({ tag, property, value }) => { /* ... */ });   // a command of the operator
app.plant.on('update', ({ tag, property, value }) => { /* ... */ });    // an update applied to the diagram
```

A new plant is created for each run: listen to it when the runtime mode is entered (as a controller of the mode does, see below).

Try it in the browser console: run the plant (the Run button), open the Log, and send an update as a plant would - the diagram follows, the message shows in the log:

```js
plant.update('LI-101', 'level', 90);    // the level panel of the deaerator to 90 %
plant.update('P-102', 'power', true);   // the feed pump 2 starts
plant.update('HV-101', 'open', false);  // the inlet valve closes
```

(`window.plant` is the plant of the current run: `null` while editing.)

The properties of each type of element are bound in `plant/properties.ts` (`power`, `open`, `level`, `value`; an element can have several). The mock in `plant/mock/` is one such system: to connect a real one, delete the folder and its controller in `app.ts`, and add a controller of your own - e.g. over a WebSocket:

```ts
export default class PlantSocketController extends Controller {
    socket: WebSocket | null = null;

    startListening(): void {
        const plant = this.context.plant!;
        const socket = this.socket = new WebSocket('wss://scada.example.com/plant');
        socket.onmessage = ({ data }) => {
            const { tag, property, value } = JSON.parse(data);
            plant.update(tag, property, value);
        };
        // The commands of the operator to the plant (stopped with the controller)
        this.listenTo(plant, 'command', (_app: App, { tag, property, value }: PlantMessage) => {
            socket.send(JSON.stringify({ tag, property, value }));
        });
    }

    stopListening(): void {
        super.stopListening();
        this.socket?.close();
    }
}
```

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
