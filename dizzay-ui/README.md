# dizzay-ui

`dizzay-ui` is an addon for [dizzay](https://github.com/goto-bus-stop/dizzay) that adds a fully terminal-based user interface.

![screenshot](https://cloud.githubusercontent.com/assets/1006268/26473137/0865eb86-41aa-11e7-93b9-7aceb0cdedfe.png)

`dizzay-ui` is available as an addon because it's niche and uses native (C++) dependencies, which require a compiler toolchain to install.
You can use dizzay without it.

## Installation

First make sure you've got `dizzay` installed.

```bash
npm install --global dizzay-ui
```

## Usage

Use the `--ui` flag with `dizzay`:

```bash
dizzay --ui
```

## Dependencies

`dizzay-ui` can use mplayer or mpv to provide video playback.
See the [dizzay readme](../README.md#dependencies) for more.

## Building

See the [dizzay readme](../README.md#building).

## License

[MIT](../LICENSE)

