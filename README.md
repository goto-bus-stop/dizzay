dizzay
======

`dizzay` (/ˈdɪːdʒeɪ/) plays media from a plug.dj room in VLC.

## Usage

You need youtube-dl and VLC in your path, which needs something like:

```
$ apt-get install vlc
$ pip install youtube_dl
```

Then clone the repo and build the code (ES6 → ES5 with [Babel](https://babeljs.io))

```
$ git clone https://github.com/goto-bus-stop/dizzay
$ cd dizzay
$ npm run-script babel
```

Finally, run with

```
$ node lib/app.js --room ROOM_NAME
```

## License

MIT