dizzay
======

`dizzay` (/ˈdɪːdʒeɪ/) is a command-line program that plays media from a plug.dj
room in VLC or in Mplayer.

[Installation](#installation) -
[Usage](#usage) -
[Dependencies](#dependencies) -
[License](#license)

![VLC](./screens/vlc-player_and_now-playing.png)

## Installation

```bash
npm install --global dizzay
```

## Usage

    dizzay [options] [room-name]

    Options:

      -h, --help                 output usage information
      -r, --room <room>          room url or slug to join.
      -q, --quality [quality]    video quality for YouTube videos. (low|medium|high) [medium]
      -m, --modules [modules]    modules to use, comma-separated. [vlc-player]
      -M, --list-modules         show a list of available modules.
      --mplayer-args <args>      string of space-separated command-line arguments to pass to mplayer.
      --vlc-args <args>          string of space-separated command-line arguments to pass to vlc.

Available modules:

 * `vlc-player` plays media in a VLC window (audio + video). Default.
 * `mplayer` plays media in mplayer. This only plays audio, and doesn't open a
   new window.
 * `now-playing` prints a line with the current song title to stdout.

Examples:

 * `dizzay -m mplayer,now-playing tastycat`
 * `dizzay -m vlc-player mrsuicidesheep-chillout`
 * `dizzay -m now-playing,vlc-player loves-kpop`

## Dependencies

You need youtube-dl and a supported media player in your `$PATH` to run Dizzay.
On Linuxes, they can be installed through a command prompt using something like:

```bash
apt-get install vlc     # for vlc
apt-get install mplayer # for mplayer
pip install youtube_dl
```

## Building

The build script uses Babel and can be invoked using:

```bash
npm run-script babel
```

## License

MIT
