# JointJS+: SCADA Editor (TypeScript) <a href="https://www.jointjs.com/jointjs-plus"><img src="../../jointjs-plus-badge.svg" alt="JointJS+" width="123" align="right" /></a>

An editor of a SCADA plant diagram, built with JointJS+, with a runtime mode where the plant runs (a mock) and the equipment is operated. The shapes are based on the ones of the [SCADA demo](../../scada/).

## Features

- **Canvas** - `ui.PaperScroller` (pan, zoom, pinch) and a `ui.Navigator` minimap with simplified views.
- **Palette** - `ui.Stencil`; each group is packed with a skyline packing of the shape footprints (`packing.ts`, no third-party code), without the labels. A click on a shape shows it in the inspector panel with a description, where it can be made a favorite (and an uploaded image renamed or deleted); a drag starts once the pointer moves, a dropped shape is selected.
  - **Favorites** and **In Use** are made of the other groups (hidden while empty). A shape is matched by `paletteKey()`: its type, plus the image for an uploaded image.
  - **Custom** - uploaded images. They are stored on the graph (`graph.get('images')`) and an element refers to its image by id, so an image is saved once and is in the DOM once per paper (`images.ts`: a `<symbol>` in the paper defs, a `<use>` in each element). An element whose image is not in the diagram (pasted from another one) shows a placeholder.
- **Editing** - on a grid (`GRID_SIZE`), elements resize in two grid steps; snaplines; selection by click, `Ctrl` / `Cmd` / `Shift` + click and `Shift` + drag (a region touching the cells, a pipe by its route), all by `Ctrl` / `Cmd` + `A` (as a region: not the screen, a group for its members); `ui.Selection` frames the selected cells and moves them together (`selection.ts`), `ui.FreeTransform` and link tools for a single selection; copy / cut / paste (`ui.Clipboard`); undo / redo (`dia.CommandManager`).
- **Pipes** - dragged from the palette and connected with the arrowheads: to a pipe stub (a port) if the element has any, otherwise to its side (`connectionStrategy` in `connections.ts` pins the anchor to the side nearest to the pointer, relative to the size). A signal line connects to the body of an element, nothing connects to a label. An arrow (`shapes/Arrow.ts`, in the instruments group) points at a part of the plant: free or connected to the body of an element, its arrowheads at both ends (none, an arrow, an open arrow, a circle, a diamond) and its color set in the inspector. The routing (straight, orthogonal, curved) is chosen in the inspector (`shapes/routing.ts`), and so are the color of a pipe and of its outline.
- **Electrical** - a palette group of the electrical equipment: a diesel generator set (fed with fuel by a pipe, e.g. from the fuel tank of the storage group), a wind turbine, a solar array, a power transformer, a switchgear, a motor control center, a battery bank; the smaller parts of the circuits (a generator, a transformer, a copper busbar, a battery, a molded-case breaker, a knife disconnector, a fuse, a surge arrester, a ground rod, a lamp, a heater, a voltmeter) and a wire. A wire connects to the terminals of the electrical shapes only (`terminalPorts()` in `shapes/ports.ts`), a pipe never does. In the runtime mode the circuits energized from a running generator or wind turbine, a battery or a solar array, through the closed breakers and disconnectors, are shown live (the `energized` of the cells, sent by the plant - traced by the mock in `simulation/energized.ts`): the wires in color, the lamps of the cabinets and a lamp lit, a heater glowing, a voltmeter reading the voltage; a wind turbine spins, a diesel generator smokes, the charge of a battery bank and the fuel of a tank change.
- **Bulk handling** - a palette group of the solids: a conveyor (`shapes/Conveyor.ts`, a link drawn as a belt: its outline, the belt and the cleats across it - their colors the Outline, the Color and the Accent - straight, inclined or turning on its route, connected to the body of the equipment; while it runs, `power`, its cleats move from its start to its end), a belt conveyor (an element: its boxes ride from the start of the belt to its end), a bucket elevator (the buckets go up), a jaw crusher (the flywheel turns, the jaw swings), a ball mill (the liners move round with the drum) and a rotary kiln (the flame burns, the hot zone glows); a bag filter (its bags pulsed clean one after the other) is in the process group.
- **Charts** - a line chart, a bar chart, a donut chart and a gauge chart (`shapes/charts.ts`): shapes of their own (not the legacy chart shapes), their data on the model (`values`, `slices`, `value`) and their paths computed from it by special attributes when they are rendered (their views render them again when the data changes), configured in the inspector (the scale, the thresholds, the slices). The runtime mode feeds them new data every second.
- **Tables** - a table with a title (both of them shown or hidden in the inspector) and a readout (neither the title nor the names of the columns), in the charts group (`shapes/Table.ts`): its columns (a name, and the kind of the values: a text, a number, a state - a dot in the color of `on`, `off`, `alarm`, in a narrow column) set in the inspector, its rows by resizing it (by its sides and its bottom: as many rows as the height takes, a row a step of the grid, as the length of a busbar its taps), the columns sharing its width. It has a view of its own (`shapes/TableView.ts`, as the counters demo draws its nodes): the structure is rendered when it changes, a new value from the plant (the runtime mode) updates the text of its cell only.
- **Background** - a palette group of the shapes under the plant: a rectangle and an ellipse (`shapes/Rectangle.ts`, `shapes/Ellipse.ts`), resized and rotated freely, their color and opacity set in the inspector; nothing connects to them.
- **Groups** - several selected elements grouped from the context menu (Group, `Ctrl`/`Cmd` + `G`) into an invisible element they are embedded in (`shapes/Group.ts`), with the links between them; selected, it has a dashed frame and a badge (its ID, how many members), a hovered member outlines its group. A click on a member selects the group, a click again goes one level in (the member, a group in it) - `Escape` one level up; a drag moves the selected level, the groups refit (`GroupController`). Cherry-picking adds the elements of the same level only; grouping them in a group nests the new group; a group left with one member is dissolved. Copied, pasted, deleted, brought to the front as a whole; Ungroup (`Ctrl`/`Cmd` + `Shift` + `G`) moves the members to the group above. A group is not resized nor rotated; its inspector shows its ID and members. The snaplines snap a dragged group (`Snaplines.ts`: a fix of the library, it took the pointer offset of the clicked member).
- **Colors of the equipment** - the surfaces of a shape are set to a color of its own in the inspector (`color`): the special attributes `surfaceFill` (a shading: `'cylinder'`, `'pipe'`, ..., or `'flat'`) / `surfaceStroke` (`'edge'`) - a kind of the metal, or a color of the shape of its own (`'var(--shape-fitting-fill)'`) (`shapes/gradients.ts`) mix it into each stop of the shading (`color-mix()`), so the highlights and the edges stay, in the colors of the theme still; the default is the plain metal. The finish (`finish`) of the surfaces is shaded (the color mixed into the shading) or flat - the color as it is, every surface outlined, as the high-performance HMI (ISA-101) style draws the equipment; in the color Canvas (`--shape-canvas`, a theme color too) a line drawing as a P&ID (the ink on the surfaces, `SURFACE_INK`, then as the labels). The outline (`outline`) is a color of the element's own for all its surfaces, in one width; Auto: as the shape draws it (flat: the edge of the metal). The inspector shows the Finish first. A shape with a marking has an accent too (`accentField`: the bands of a stack, the handwheel or actuator, coil, cap of a valve, the terminal box of a motor, the agitator motor of a tank, the base, saddles, skirt, skid of the equipment; the content of a fixed color too: the fuel of a fuel tank, the material of a hopper, the flames of a boiler, the soil of a ground rod; the series of a chart, a trend - the parts of one color follow it, `fillFrom`), set as its Accent - not the colors of a state (an alarm, a warning level), the plant sets those. The parts of another material (porcelain, copper, glass: `materialFill`) keep their colors, flat in the flat finish. The swatches offer the colors of the theme (`--color-*` in `shapes.css`: blue, green, violet, slate, amber, red - a tone in each scheme - and the canvas), then the recent colors and those of the diagram (the pipes, ...). A shape is rendered again when its color changes, its pipe stubs too (`shapes/ShapeView.ts`, the `elementView` of the paper). A pipe stub reaches under its element (no gap at a round side).
- **Layers** - `background`, `pipes`, `equipment`, `instruments` and `foreground` (`layers.ts`): a pipe is under the equipment, a level panel over its tank; a cell is put in another layer in the inspector (the JointJS badge of the example is in the background).
- **Inspector** - `ui.Inspector` for a single selected cell, in groups: General (the tag, the texts, the layer), Appearance (the color and the finish of the equipment, the size and color of a label, the color and opacity of a background shape), Values, Thresholds, Controls (whether the control is used); a link has one group (its routing, color, arrowheads, layer). Several selected cells: their color and finish at once (`selection-inspector.ts`: an inspector of a cell standing in for them - a value they all have, or "mixed"; each cell's own color, the metal of a pump, the line of a pipe; one step of the history); a group sets the appearance of its members, as they are now (it has none of its own).
- **Examples** - three diagrams (`examples.ts`) offered in the inspector panel when nothing is selected: a boiler house (steam, opened at the start), a microgrid (power: a wind turbine, a solar array, a diesel backup fed from a day tank and a battery bank on a 400 V bus, the lighting and the motors under it) and a cement plant (solids: the rock crushed and ground in the raw mill, lifted by the bucket elevator onto the conveyor over the raw meal silos, the meal through the cyclones of the preheater into the rotary kiln, the clinker on a conveyor under the kiln into its silo, the gas through the bag filter to the stack). Opened as a file; asked first if the diagram has changes (an undo to lose).
- **New / save / open** - a new diagram is an empty screen (asked first if the diagram has changes); JSON from `graph.toJSON()`: the cells, the images and the favorites (not the layers). An element is saved without its ports (`Shape.toJSON()`): they are its shape's, a busbar makes them of its `taps`. A file is loaded into a scratch graph first, so an invalid one doesn't replace the diagram.
- **Settings** - the cog in the toolbar opens the settings in the inspector panel (`settings.ts`): of the diagram, a **screen** and its size, its **style** (`style.ts`: the finish of every shape without one of its own - its finish Auto - a color mixed into the metal of all the equipment, an outline, an accent - instead of the defaults of the shapes, the `--base-*` of `shapes.css`, everywhere: the canvas, the palette; an element's own colors over them; saved with the diagram), the **animations** of the run mode (full, or the alarms only - the ISA-101 high-performance HMI style, also when the system asks for reduced motion; a kind of each animation in `animations.ts`); of the editor, the snaplines and the In Use group of the palette (on or off, not saved). The screen (`shapes/Screen.ts`) is a frame in the background layer, saved with the diagram (and undone as any change); it can be moved, resized and selected only while the settings are open, and a region never selects it. In the runtime mode the canvas shows the screen only (`screen.ts`): in the whole window (the toolbar slides down when the pointer comes to the top 32 pixels), fitted (again when the window is resized), clipped, without scrolling, panning, zooming and the navigator.
- **Runtime mode** - the palette, the history and the file buttons don't exist in it. `simulation/` (the mock of the plant: an app with a real plant deletes the folder and its controller in `app.ts`) sends random updates addressed by the element tags, some of them following the plant (the feedwater flow and pressure follow the feed pumps running, the charts follow the flow); `animations.ts` spins the rotors and the agitators, carries the boxes of a conveyor, moves the liquid through the pipes, the control valves and the level panels, and animates the flames, the smoke and the alarm. The controls (HTML in highlighters) are operated in this mode only; while editing they are `inert`.
- **Light / dark** - the design tokens in `variables.css`. The shapes use CSS variables for their colors, `--shape-*` in `shapes.css` (`fill: 'var(--shape-face)'`, the stops of the metal gradients, ...): the dark scheme redefines them (blue steel, dark faces), no selectors override the shapes.
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
  app.ts           the App: graph, paper, scroller, toolbar, palette, controllers, the mode switch
  config.ts        options (paper, history, scroller, toolbar, tooltips) and the interactivity of each mode
  actions.ts       what the controllers do: selection, clipboard, save / open, images, the palette groups
  connections.ts   where a link end connects (the connection strategy)
  layers.ts        the graph with its layers
  stencil.ts       the palette: groups, layout, the derived groups, the upload button
  packing.ts       the skyline packing
  shape-preview.ts a shape of the palette clicked: shown in the inspector panel (descriptions.ts: the texts)
  images.ts        the images of the user
  favorites.ts     the favorite shapes
  inspector.ts     the inputs of the inspector
  help.ts          the help of the fields of the inspectors (a question mark with a tooltip)
  color-field.ts   the color fields of the inspector: the native input and the colors to pick again
  tools.ts         the link tools
  controls.ts      the controls of the equipment
  tags.ts          the IDs of the elements
  animations.ts    the runtime animations
  navigator.ts     the minimap
  settings.ts      the settings of the diagram (the screen) in the inspector panel
  screen.ts      the screen: added, shown alone in the runtime mode
  selection.ts     the selection on the canvas (`ui.Selection`): the region, the frames, the hover frame, the badges of the groups
  Snaplines.ts     the snaplines (`ui.Snaplines` with a fix for the dragged groups)
  examples.ts      the examples to open (in the empty inspector panel)
  diagram/         the examples: a boiler house, a microgrid and a cement plant, JSON files as saved by the Save button (with the JointJS badge and a photo as images)
  shapes/          the shapes (see Shape features); ports.ts the pipe stubs and the terminals, footprint.ts the area a shape takes
  controllers/     the event handling
  simulation/      the mock of the plant (simulation.ts, the energized circuits in energized.ts) and its controller: delete it for a real plant
```

## How It Works

A controller is an `mvc.Listener` getting the `App` as its first argument; its handlers are plain functions `(app, ...eventArgs)`.

| Controller | Mode | Listens to |
|---|---|---|
| `CanvasController` | always | paper: blank drag (panning), pinch, pan |
| `ControlsController` | always | graph: the controls of the added elements |
| `SelectionController` | always | the selection: free transform, link tools, the inspector |
| `TagsController` | always | graph: a free tag for every element |
| `PipeColorController` | always | graph: the pipes (their colors, their ends) - a control valve shows the color of its pipe |
| `GroupController` | always | graph: a member moved, resized, rotated - its groups refit |
| `ToolbarController` | each mode | toolbar: mode, color scheme, save, open, settings |
| `EditController` | edit | paper: cell click, blank drag (a region) |
| `PaletteController` | edit | palette: shape click, shape drop; graph: the derived palette groups |
| `KeyboardController` | edit | the keyboard shortcuts |
| `RuntimeController` | runtime | paper: a cell drag pans the canvas |
| `SimulationController` | runtime | the mock of the plant (in `simulation/`) |
| `AnimationsController` | runtime | graph: `power`, `open`, `level` |
| `ElectricalController` | runtime | graph: `energized` (the live circuits) |

### Shape features

Every element extends `Shape` (`shapes/Shape.ts`) and overrides the prototype getters that differ from the defaults:

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
