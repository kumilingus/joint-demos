# JointJS+: SCADA Editor (TypeScript) <a href="https://www.jointjs.com/jointjs-plus"><img src="../../jointjs-plus-badge.svg" alt="JointJS+" width="123" align="right" /></a>

An editor of a SCADA plant diagram, built with JointJS+, with a runtime mode where the plant runs (a mock) and the equipment is operated. The shapes are based on the ones of the [SCADA demo](../../scada/).

## Features

- **Canvas** - `ui.PaperScroller` (pan, zoom, pinch) and a `ui.Navigator` minimap with simplified views.
- **Palette** - `ui.Stencil`; each group is packed with a skyline packing of the shape footprints (`packing.ts`, no third-party code), without the labels. A click on a shape shows it in the inspector panel with a description, where it can be made a favorite (and an uploaded image renamed or deleted); a drag starts once the pointer moves.
  - **In Use** and **Favorites** are made of the other groups (hidden while empty). A shape is matched by `paletteKey()`: its type, plus the image for an uploaded image.
  - **Custom** - uploaded images. They are stored on the graph (`graph.get('images')`) and an element refers to its image by id, so an image is saved once and is in the DOM once per paper (`images.ts`: a `<symbol>` in the paper defs, a `<use>` in each element). An element whose image is not in the diagram (pasted from another one) shows a placeholder.
- **Editing** - on a grid (`GRID_SIZE`), elements resize in two grid steps; snaplines; selection by click, `Ctrl` / `Cmd` / `Shift` + click and `Shift` + drag (a region touching the cells, a pipe by its route); `ui.Selection` frames the selected cells and moves them together (`selection.ts`), `ui.FreeTransform` and link tools for a single selection; copy / cut / paste (`ui.Clipboard`); undo / redo (`dia.CommandManager`).
- **Pipes** - dragged from the palette and connected with the arrowheads: to a pipe stub (a port) if the element has any, otherwise to its side (`connectionStrategy` in `connections.ts` pins the anchor to the side nearest to the pointer, relative to the size). A signal line connects to the body of an element, nothing connects to a label. The routing (straight, orthogonal, curved) is chosen in the inspector (`shapes/routing.ts`).
- **Layers** - `background`, `pipes`, `equipment`, `instruments` and `foreground` (`layers.ts`): a pipe is under the equipment, a level panel over its tank; a cell is put in another layer in the inspector (the logo of the example is in the background).
- **Inspector** - `ui.Inspector` for a single selected cell: the tag, the texts, the values and thresholds, whether the control is used, the routing of a link, the text, size and color of a label, the layer.
- **Save / open** - JSON from `graph.toJSON()`: the cells, the images and the favorites (not the layers). A file is loaded into a scratch graph first, so an invalid one doesn't replace the diagram.
- **Runtime mode** - the palette, the history and the file buttons don't exist in it. `simulation.ts` sends random updates addressed by the element tags; `animations.ts` spins the rotors and the agitators, carries the boxes of a conveyor, moves the liquid through the pipes, the control valves and the level panels, and animates the flames, the smoke and the alarm. The controls (HTML in highlighters) are operated in this mode only; while editing they are `inert`.
- **Light / dark** - the design tokens in `styles.css`. The shapes use CSS variables for their colors (`fill: 'var(--shape-face)'`, the stops of the metal gradients, ...): the dark scheme redefines them (blue steel, dark faces), no selectors override the shapes.
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
  palette.ts       a palette shape shown in the inspector panel (descriptions.ts: the texts)
  images.ts        the images of the user
  favorites.ts     the favorite shapes
  inspector.ts     the inputs of the inspector
  tools.ts         the link tools
  controls.ts      the controls of the equipment
  tags.ts          the IDs of the elements
  simulation.ts    the mock of the plant
  animations.ts    the runtime animations
  navigator.ts     the minimap
  selection.ts     the selection on the canvas (`ui.Selection`): the region, the frames
  diagram/         the example: a boiler house, a JSON file as saved by the Save button (with the JointJS logo as an image)
  shapes/          the shapes (see Shape features); ports.ts the pipe stubs, footprint.ts the area a shape takes
  controllers/     the event handling
```

## How It Works

A controller is an `mvc.Listener` getting the `App` as its first argument; its handlers are plain functions `(app, ...eventArgs)`.

| Controller | Mode | Listens to |
|---|---|---|
| `CanvasController` | always | paper: blank drag (panning), pinch, pan |
| `ControlsController` | always | graph: the controls of the added elements |
| `SelectionController` | always | the selection: free transform, link tools, the inspector |
| `TagsController` | always | graph: a free tag for every element |
| `ToolbarController` | each mode | toolbar: mode, color scheme, save, open |
| `EditController` | edit | paper: cell click, blank drag (a region) |
| `PaletteController` | edit | palette: shape click; graph: the derived palette groups |
| `KeyboardController` | edit | the keyboard shortcuts |
| `RuntimeController` | runtime | paper: a cell drag pans the canvas |
| `SimulationController` | runtime | the mock of the plant |
| `AnimationsController` | runtime | graph: `power`, `open`, `level` |

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
