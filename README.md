dizzay
======

`dizzay` (/ˈdɪːdʒeɪ/) plays media from a plug.dj room in VLC or Mplayer.

## Usage

    dizzay [options] [room-name]

    Options:

      -h, --help                 output usage information
      -q, --quality [quality]    video quality for YouTube videos. (low|medium|high) [medium]
      -m, --modules [modules]    modules to use, comma-separated. [vlc-player]
      -M, --list-modules         show a list of available modules.

Available modules:

 * `vlc-player` plays media in VLC (audio + video). Default.
 * `mplayer` plays media in mplayer (just audio).
 * `now-playing` prints a line with the current song title to stdout.

Examples:

 * `dizzay -m mplayer,now-playing tastycat`
 * `dizzay -m vlc-player mrsuicidesheep-chillout`
 * `dizzay -m now-playing,vlc-player loves-kpop`

## Dependencies

You need youtube-dl and a supported media player in your path, which needs
something like:

```
$ apt-get install vlc     # for vlc
$ apt-get install mplayer # for mplayer
$ pip install youtube_dl
```

Then clone the repo and build the code (ES6 → ES5 with [Babel](https://babeljs.io))

```
$ git clone https://github.com/goto-bus-stop/dizzay
$ cd dizzay
$ npm install
$ npm run-script babel
```

Finally, run with

```
$ ./bin/dizzay ROOM_NAME
```

## License

MIT