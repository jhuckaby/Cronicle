## Introduction

This script gives you the zone info key representing your device's time zone setting.

The return value is an [IANA zone info key][1] (aka the Olson time zone database).

The IANA timezone database is pretty much standard for most platforms (UNIX and
  Mac support it natively, and every programming language in the world either
  has native support or well maintained libraries that support it).

## Example Use

Invoke the script by calling

    :::javascript
        var tz = jstz.determine();
        tz.name();
        'Europe/Berlin'

## Use Case

The script is useful if you do not want to disturb your users with questions
about what time zone they are in. You can rely on this script to give you a
key that is usable for server side date and time normalizations across
time zones.

## Limitations

This script does not do geo-location, nor does it care very much about
historical time zones. So if you are unhappy with the time zone "Europe/Berlin"
when the user is in fact in "Europe/Stockholm" - this script is not for you.
They are both identical in modern time.

Also, if it is important to you to know that in Europe/Simferopool (Ukraine)
the UTC offset before 1924 was +2.67, sorry, this script will not help you.

Time zones are a screwed up thing, generally speaking, and the scope of this
script is to solve problems concerning modern time zones, in this case from
2010 and onwards.

## Web Implementation

Simply include the `dist/jstz.min.js` file on your webpage at which point
the `jstz` object will be exposed to you

## NPM package

The latest version is always available as [jstimezonedetect][4] in NPM.

    :::javascript
        > var jstz = require('jstimezonedetect');
        > jstz.determine().name();
        'America/Chicago'

## Demo

There is an updated demo running on: [http://pellepim.bitbucket.org/jstz/][2].

## Contribute?

If you want to contribute to the project (perhaps fix a bug, or reflect a
  change in time zone rules), please simply issue a Pull Request. Please take
  note that jstz.main.js is the source code, while jstz.rules.js is a generated
  file which, any changes therein will be overwritten. The build is found in the
  dist folder in full and minified versions.

## Credits

Thanks to

  - [Josh Fraser][5] for the original idea
  - [Brian Donovan][6] for making jstz CommonJS compliant
  - [Ilya Sedlovsky][7] for help with namespacing
  - [Jordan Magnuson][9] for adding to cdnjs, documentation tags, and for reporting important issues
  - [Matt Johnson][11] for adding support for the Internationalization API

Other contributors:
[Gilmore Davidson][8]

[1]: http://www.iana.org/time-zones
[2]: http://pellepim.bitbucket.org/jstz/
[3]: https://bitbucket.org/pellepim/jstimezonedetect/src
[4]: https://www.npmjs.com/package/jstimezonedetect
[5]: http://www.onlineaspect.com/about/
[6]: https://bitbucket.org/eventualbuddha
[7]: https://bitbucket.org/purebill
[8]: https://bitbucket.org/gdavidson
[9]: https://github.com/JordanMagnuson
[10]: http://cdnjs.com
[11]: https://bitbucket.org/mj1856
