### Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

#### [v0.9.101](https://github.com/jhuckaby/Cronicle/compare/v0.9.100...v0.9.101)

> 26 November 2025

- Fix crasher in code block that handles max emails per day
- Fixes #949 -- thanks to @frankii91 for reporting this!

- Version 0.9.101 [`9ea8467`](https://github.com/jhuckaby/Cronicle/commit/9ea846767434baec06f802c5d826cf37a990ba9c)

#### [v0.9.100](https://github.com/jhuckaby/Cronicle/compare/v0.9.99...v0.9.100)

> 4 November 2025

- SPECIAL CASE: create json-string-escaped version of chain_description, for GH Issue #942 [`5929a79`](https://github.com/jhuckaby/Cronicle/commit/5929a79044f93e5837d5db845a88411d83fefb36)
- Version 0.9.100 [`9c6aea8`](https://github.com/jhuckaby/Cronicle/commit/9c6aea89c3afa37c18655bf5f97115b6c3f5255f)

#### [v0.9.99](https://github.com/jhuckaby/Cronicle/compare/v0.9.98...v0.9.99)

> 22 October 2025

- Fixes #938

- Version 0.9.99 [`326660e`](https://github.com/jhuckaby/Cronicle/commit/326660ec5aa8f2b4453a6c014b7de7de4785dd42)

#### [v0.9.98](https://github.com/jhuckaby/Cronicle/compare/v0.9.97...v0.9.98)

> 21 October 2025

- Fix issue where limit-based job aborts (timeout, cpu, mem, log size) do not trigger a chain reaction error.   Fixes #936.

- Version 0.9.98 [`5f0ad36`](https://github.com/jhuckaby/Cronicle/commit/5f0ad36313a950ffe2d87acf4248febf7822c48a)

#### [v0.9.97](https://github.com/jhuckaby/Cronicle/compare/v0.9.96...v0.9.97)

> 13 October 2025

- Bump pixl-mail to v1.1.4 for upstream vuln patch in nodemailer.
- Bump pixl-server-user to v1.0.34 for a fix in session expiration handling.

- Version 0.9.97 [`1509773`](https://github.com/jhuckaby/Cronicle/commit/150977352350710e1da1b599b2f62d697641ba32)

#### [v0.9.96](https://github.com/jhuckaby/Cronicle/compare/v0.9.95...v0.9.96)

> 11 October 2025

- Vulnerability fixes across various APIs. [`4124a86`](https://github.com/jhuckaby/Cronicle/commit/4124a86edd5e26ccafa4415183208f52c9c2cebe)
- Added a new checkbox regarding vuln reporting [`405de16`](https://github.com/jhuckaby/Cronicle/commit/405de1611716112e14fb083e131fba9a62abb9d3)
- Version 0.9.96 [`c5e3363`](https://github.com/jhuckaby/Cronicle/commit/c5e3363c31cafe09c358d4edeaa33657f711a833)

#### [v0.9.95](https://github.com/jhuckaby/Cronicle/compare/v0.9.94...v0.9.95)

> 2 October 2025

- Version 0.9.95 [`ea50387`](https://github.com/jhuckaby/Cronicle/commit/ea5038740ea070b6c10d343a4072ef2ecacc1395)
- Add note about reporting security vulns [`93f2a5a`](https://github.com/jhuckaby/Cronicle/commit/93f2a5ae0439f2a6088a20b28440714d867eee04)
- Fix XSS vuln in password reset form. [`7d95df5`](https://github.com/jhuckaby/Cronicle/commit/7d95df522b53100be2a2d0fdbd0b134051def614)

#### [v0.9.94](https://github.com/jhuckaby/Cronicle/compare/v0.9.93...v0.9.94)

> 1 October 2025

- Version 0.9.94 [`33a0ada`](https://github.com/jhuckaby/Cronicle/commit/33a0ada500c2bcc896c76014f343cb10668da6da)
- Fix issue where single IPv6 isn't logged in transaction log in certain cases.  Changed to log all IPs from args.ip. [`474a145`](https://github.com/jhuckaby/Cronicle/commit/474a1458bb43aa0459c8f7127c9deca3ac7bd4c2)

#### [v0.9.93](https://github.com/jhuckaby/Cronicle/compare/v0.9.92...v0.9.93)

> 29 September 2025

- Fixed another case of the number suffixes being wrong in the teens.  Thanks again to @sa-dbilling for catching this.

- Version 0.9.93 [`b0cbdc7`](https://github.com/jhuckaby/Cronicle/commit/b0cbdc7351bb49ccb77b097daa4d2c65330cb9d6)

#### [v0.9.92](https://github.com/jhuckaby/Cronicle/compare/v0.9.91...v0.9.92)

> 15 September 2025

- Add protection against rare "EBADF: bad file descriptor" error when live log filehandle is closed.
- Fixes #924

- Version 0.9.92 [`9f99565`](https://github.com/jhuckaby/Cronicle/commit/9f99565ca818fa3d101e0845282cdaac083a68ce)

#### [v0.9.91](https://github.com/jhuckaby/Cronicle/compare/v0.9.90...v0.9.91)

> 30 August 2025

- Revert this commit: https://github.com/jhuckaby/Cronicle/commit/a5534917e0b47f01b8012c6d39988ce78739e6f7
- Fixes #922
- Thanks to @seanfulton for catching this!

- Version 0.9.91 [`b58244c`](https://github.com/jhuckaby/Cronicle/commit/b58244c1dc78934dbf27744c78a13607aeb47f68)

#### [v0.9.90](https://github.com/jhuckaby/Cronicle/compare/v0.9.89...v0.9.90)

> 15 August 2025

- Bump pixl-server-web to v2.0.16 for cookie parsing bug.
- FIxes #917

- Version 0.9.90 [`012e88d`](https://github.com/jhuckaby/Cronicle/commit/012e88db8b83cb976a8dc7438799a5642f91f2f8)

#### [v0.9.89](https://github.com/jhuckaby/Cronicle/compare/v0.9.88...v0.9.89)

> 13 August 2025

- Merge PR #796

- Add EOL error message [`#796`](https://github.com/jhuckaby/Cronicle/pull/796)
- Version 0.9.89 [`99ca050`](https://github.com/jhuckaby/Cronicle/commit/99ca0502cb81a931468a9b26ee639fb16cbd44a5)

#### [v0.9.88](https://github.com/jhuckaby/Cronicle/compare/v0.9.87...v0.9.88)

> 13 August 2025

- Add security options to web server headers for HTML pages. [`de45621`](https://github.com/jhuckaby/Cronicle/commit/de45621d343450bf315734d192b522455ed58086)
- Remove all HTML from notification messages, as it is now escaped as of the latest pixl-webapp. [`6f40fdd`](https://github.com/jhuckaby/Cronicle/commit/6f40fdd32c39adc68f20461636ad613ebeff0756)
- Remove Access-Control-Alllow-Origin header (legacy) [`a553491`](https://github.com/jhuckaby/Cronicle/commit/a5534917e0b47f01b8012c6d39988ce78739e6f7)
- Version 0.9.88 [`6e3ebae`](https://github.com/jhuckaby/Cronicle/commit/6e3ebaee204e2fe86db05e8ac04241406cf74e67)

#### [v0.9.87](https://github.com/jhuckaby/Cronicle/compare/v0.9.86...v0.9.87)

> 13 August 2025

- Bump pixl-server-user to v1.0.28 for vuln fux in password reset email URLs.
- Add doc blurb on http_allow_hosts, and recommended use for production
- Thanks to @matthewjhands for reporting the vuln.
- Fixes #916

- Version 0.9.87 [`78ccf62`](https://github.com/jhuckaby/Cronicle/commit/78ccf62447e55ac05ec5984ff456fd5fb79e8f21)

#### [v0.9.86](https://github.com/jhuckaby/Cronicle/compare/v0.9.85...v0.9.86)

> 11 August 2025

- Bump pixl-webapp to v2.0.3 for a XSS vuln fix, found by @matthewjhands.  Thank you Matthew!
- Bump pixl-server-web to latest, for new features (and to bump formidable to v3.5.4, to squelch a loud NPM warning).

- Version 0.9.86 [`c109a78`](https://github.com/jhuckaby/Cronicle/commit/c109a78a793b87e7adfd2f5cd60435d758ad0406)

#### [v0.9.85](https://github.com/jhuckaby/Cronicle/compare/v0.9.84...v0.9.85)

> 22 July 2025

- Another fix for same form-data vulnerability (via pixl-server-user module, which I missed the first time around)

- Version 0.9.85 [`34aa85c`](https://github.com/jhuckaby/Cronicle/commit/34aa85c7e782e63f1e4a6d7d9cedc8da7b4d12d1)

#### [v0.9.84](https://github.com/jhuckaby/Cronicle/compare/v0.9.83...v0.9.84)

> 22 July 2025

- Bump pixl-request to v2.3.1 for upstream vuln fix in form-data
- See: https://github.com/jhuckaby/pixl-request/security/dependabot/1

- Version 0.9.84 [`e46fa1e`](https://github.com/jhuckaby/Cronicle/commit/e46fa1ed305ba320e5806e43fef41cdbe288d82a)

#### [v0.9.83](https://github.com/jhuckaby/Cronicle/compare/v0.9.82...v0.9.83)

> 17 July 2025

- Add support for pushover.net for web hooks
- Special thanks to @Maxzhao1999 for the feature request!

- Version 0.9.83 [`c9cc1a1`](https://github.com/jhuckaby/Cronicle/commit/c9cc1a1a33cd8af42249e8e66f87fc86a209347c)

#### [v0.9.82](https://github.com/jhuckaby/Cronicle/compare/v0.9.81...v0.9.82)

> 14 July 2025

- Add support for proxies (for web hooks and the HTTP Plugin)
- See: https://github.com/jhuckaby/Cronicle/wiki/Proxy-Servers
- Fixes #908

- Version 0.9.82 [`03bc094`](https://github.com/jhuckaby/Cronicle/commit/03bc0942e801fc75841315e6d025adc21197ac4f)

#### [v0.9.81](https://github.com/jhuckaby/Cronicle/compare/v0.9.80...v0.9.81)

> 30 June 2025

- Fixes #903 - some ordinal day of month suffixes are incorrect
- Adjust color label checkbox colors for better visibility

- Added section on S3 compatible services (MinIO) [`d76f6bd`](https://github.com/jhuckaby/Cronicle/commit/d76f6bdb332d1120ff1092114d2504a7736c504f)
- Version 0.9.81 [`a12eacb`](https://github.com/jhuckaby/Cronicle/commit/a12eacbe5192788485f82035d32c9cd9880df83c)
- Updated TOC. [`7f0b06c`](https://github.com/jhuckaby/Cronicle/commit/7f0b06ca2c81e3193cb0a2bfb00b8cd5ac0191e1)

#### [v0.9.80](https://github.com/jhuckaby/Cronicle/compare/v0.9.79...v0.9.80)

> 2 May 2025

- Allow standard auth for get_job_log API.  Fixes #896.

- Version 0.9.80 [`31cd4a9`](https://github.com/jhuckaby/Cronicle/commit/31cd4a91cfcbd3a0f86ebc54418b2cce7ab83ef1)

#### [v0.9.79](https://github.com/jhuckaby/Cronicle/compare/v0.9.78...v0.9.79)

> 24 April 2025

- FIxed issue with timeout error message precision after 1 hour
- Fixes #895

- Version 0.9.79 [`b391707`](https://github.com/jhuckaby/Cronicle/commit/b391707f5260e2cb4c42c02270c1dbaddf0b0f6c)

#### [v0.9.78](https://github.com/jhuckaby/Cronicle/compare/v0.9.77...v0.9.78)

> 22 April 2025

- Now firing chain reaction for scheduler failures, if configured
- Fixes #885

- Version 0.9.78 [`9580980`](https://github.com/jhuckaby/Cronicle/commit/958098043ceb107411877ae0429af46244cb3f12)

#### [v0.9.77](https://github.com/jhuckaby/Cronicle/compare/v0.9.76...v0.9.77)

> 20 March 2025

- Fixed issue where check_user_exists API didn't require auth when free_accounts was false.
- See Discussion: https://github.com/jhuckaby/Cronicle/discussions/882

- Version 0.9.77 [`96a8c9f`](https://github.com/jhuckaby/Cronicle/commit/96a8c9f9c011be4fb261ece9f8a9dd7524bf4d17)

#### [v0.9.76](https://github.com/jhuckaby/Cronicle/compare/v0.9.75...v0.9.76)

> 27 February 2025

- Implement max_emails_per_day [`ca88c72`](https://github.com/jhuckaby/Cronicle/commit/ca88c72c9233184b8f6d7c41986720a522c91a0a)
- Version 0.9.76 [`5f7b3a5`](https://github.com/jhuckaby/Cronicle/commit/5f7b3a5dd80f9bb9bf48de03362ea0aba9027e02)
- Update TOC [`89ba6b2`](https://github.com/jhuckaby/Cronicle/commit/89ba6b22fcf468fed4d6d17a9135e0d442f1a2a8)

#### [v0.9.75](https://github.com/jhuckaby/Cronicle/compare/v0.9.74...v0.9.75)

> 25 February 2025

- Bump pixl-server to 1.0.45 for log filtering feature. [`aa989ac`](https://github.com/jhuckaby/Cronicle/commit/aa989acdc99e1ac1f8a050f32acb582c7904cb63)
- Version 0.9.75 [`8f10917`](https://github.com/jhuckaby/Cronicle/commit/8f10917589e71af811183417405dad08bedff9d8)
- Set debug_level to 9 for debug mode. [`6e01b73`](https://github.com/jhuckaby/Cronicle/commit/6e01b73303260b91a863c173f9f0dbf7f49739c2)
- Drop default debug_level to 5. [`5230017`](https://github.com/jhuckaby/Cronicle/commit/5230017cb51d3f3a1096ec7f908757b50616f2c2)

#### [v0.9.74](https://github.com/jhuckaby/Cronicle/compare/v0.9.73...v0.9.74)

> 19 February 2025

- Prevent non-admins from seeing any Admin UI.  Fixes #869.

- Insure NPM is preinstalled in install script.  Add to docs too. [`8ea9255`](https://github.com/jhuckaby/Cronicle/commit/8ea9255093188b392b1690884f3879dad709f986)
- Version 0.9.74 [`98c70f3`](https://github.com/jhuckaby/Cronicle/commit/98c70f37a6a7d8458bcd50656f2f6ac5269e836c)

#### [v0.9.73](https://github.com/jhuckaby/Cronicle/compare/v0.9.72...v0.9.73)

> 9 February 2025

- Bump pixl-mail to v1.1.3 for nodemailer v6.10.0, for fixing a DeprecationWarning

- Version 0.9.73 [`109c6dc`](https://github.com/jhuckaby/Cronicle/commit/109c6dc978461e525902d3115e5441dcaaa9b937)
- New issue templates, CoC, update copyright years. [`713dafa`](https://github.com/jhuckaby/Cronicle/commit/713dafa3d8179f2f3b28bf120909f25c8f2c5481)
- Fix typos [`980a645`](https://github.com/jhuckaby/Cronicle/commit/980a645605d20d27ca725dea83fd3952db8b9b33)
- Add OS version [`03b2d53`](https://github.com/jhuckaby/Cronicle/commit/03b2d532d8c2e0c9624501e13925fb1fb0b7500b)
- Typo [`0eabeb3`](https://github.com/jhuckaby/Cronicle/commit/0eabeb3cfc2d24b0b7001ea4cc6e5391ece7a85d)
- Add config.yml [`ba44d41`](https://github.com/jhuckaby/Cronicle/commit/ba44d411065b2d569b833cc33dae128cb87c8ea9)

#### [v0.9.72](https://github.com/jhuckaby/Cronicle/compare/v0.9.71...v0.9.72)

> 3 February 2025

- Resurrecred live log links feature, now with auth. [`25e5628`](https://github.com/jhuckaby/Cronicle/commit/25e562823518b3401681f1255fa59d04f6e05209)
- Add `max_clock_drift` config prop (default 10). [`77e4937`](https://github.com/jhuckaby/Cronicle/commit/77e4937f6d735437ef50b40075c16250289e9cf6)
- Version 0.9.72 [`5a26f21`](https://github.com/jhuckaby/Cronicle/commit/5a26f2193ed8329996efb164efd1043196154e49)

#### [v0.9.71](https://github.com/jhuckaby/Cronicle/compare/v0.9.70...v0.9.71)

> 27 January 2025

- No changes, did commit/tag out of order last time, re-tagging to fix.

- Version 0.9.71 [`0ba49de`](https://github.com/jhuckaby/Cronicle/commit/0ba49de60701503ae2c224b7449af0596f7bd33a)

#### [v0.9.70](https://github.com/jhuckaby/Cronicle/compare/v0.9.69...v0.9.70)

> 27 January 2025

- The Job Log API is now protected with a special SHA-256 cryptographic token, which is unique for every job.
- The Job Log Download URLs have been removed from all outgoing emails to reduce accidental sharing.
- Users can still view and download job logs by going to the Job Details Page (authenticated), and then clicking the links from there (which have the SHA-256 tokens embedded in them).
- Fixes #847

- Version 0.9.70 [`b2c6735`](https://github.com/jhuckaby/Cronicle/commit/b2c6735c6fec5d271b05b046ec47f8622ee5e9d0)

#### [v0.9.69](https://github.com/jhuckaby/Cronicle/compare/v0.9.68...v0.9.69)

> 22 January 2025

- Bump pixl-server-user to v1.0.25 for new `self_delete` config property.
- FIxes #845

- Version 0.9.69 [`1fedca6`](https://github.com/jhuckaby/Cronicle/commit/1fedca69be122b5a66dbdca2bbd79bd675d18317)

#### [v0.9.68](https://github.com/jhuckaby/Cronicle/compare/v0.9.67...v0.9.68)

> 6 January 2025

- Bump pixl-server-web to v2.0.7 for automatic reloading of SSL certs if they change on disk.
- Fixes #843

- Version 0.9.68 [`f971067`](https://github.com/jhuckaby/Cronicle/commit/f9710672cafcc193139ea3450a352ebfeffcd340)

#### [v0.9.67](https://github.com/jhuckaby/Cronicle/compare/v0.9.66...v0.9.67)

> 3 January 2025

- Added custom job labels.

- Version 0.9.67 [`81833f1`](https://github.com/jhuckaby/Cronicle/commit/81833f1b3053eccfff87c092100525bb8b940de2)
- Change verbiage re: Node LTS versions. [`4fa8743`](https://github.com/jhuckaby/Cronicle/commit/4fa8743262d2455f6ee5b104ea69aae585620cee)

#### [v0.9.66](https://github.com/jhuckaby/Cronicle/compare/v0.9.65...v0.9.66)

> 29 December 2024

- Switched `control.sh` script over to using bash instead of sh.
- Added check for nvm to work during boot, when node is not installed in the usual location.
- Fixes #780

- Version 0.9.66 [`502f6d3`](https://github.com/jhuckaby/Cronicle/commit/502f6d32ab45ae78e6da601c29a1f196ec6a2f73)

#### [v0.9.65](https://github.com/jhuckaby/Cronicle/compare/v0.9.64...v0.9.65)

> 24 December 2024

- Bump pixl-server-web to 2.0.5 for proper SNI / TLS handshake host validation.

- Version 0.9.65 [`c7552bb`](https://github.com/jhuckaby/Cronicle/commit/c7552bb248e1a6d538fe21273e04e200bc995a40)

#### [v0.9.64](https://github.com/jhuckaby/Cronicle/compare/v0.9.63...v0.9.64)

> 23 December 2024

- Bump pixl-server-web to v2.0.4 for new `http_allow_hosts` feature.  Fixes #839.

- Version 0.9.64 [`a3e3241`](https://github.com/jhuckaby/Cronicle/commit/a3e324134cb2e95bfbce7f8a7ffcc0c34dbc7172)

#### [v0.9.63](https://github.com/jhuckaby/Cronicle/compare/v0.9.62...v0.9.63)

> 18 December 2024

- Remove dependency "glob" as it has vulns.
- Now using pixl-tools custom glob implementation.

- Version 0.9.63 [`7a35af5`](https://github.com/jhuckaby/Cronicle/commit/7a35af53c325b782e65dff89122a0610099b5de0)

#### [v0.9.62](https://github.com/jhuckaby/Cronicle/compare/v0.9.61...v0.9.62)

> 17 December 2024

- Bump pixl-boot to v2.0.1 for macOS fix.

- Version 0.9.62 [`06aa1a6`](https://github.com/jhuckaby/Cronicle/commit/06aa1a628dc7b8022eea55599a3648147d126cda)
- Loosen restriction on base URI match for API filter, for injecting server_groups. [`48490e0`](https://github.com/jhuckaby/Cronicle/commit/48490e0d9a97245d2f75ade7546f34ff266f4f93)

#### [v0.9.61](https://github.com/jhuckaby/Cronicle/compare/v0.9.60...v0.9.61)

> 18 October 2024

- Improve display of chain reaction jobs on Job Detail page.
- Link chain reaction to originating job.
- Widen event name input field.
- Widen chain reaction menus for selecting jobs.

- Bump cookie and socket.io [`#819`](https://github.com/jhuckaby/Cronicle/pull/819)
- Version 0.9.61 [`ae28d63`](https://github.com/jhuckaby/Cronicle/commit/ae28d63be2fe4b9498da686bdf1dcccbe8a47ad0)

#### [v0.9.60](https://github.com/jhuckaby/Cronicle/compare/v0.9.59...v0.9.60)

> 3 October 2024

- Bring back the live job status column, but show "Last Run" if no active jobs.

- Fix grammar [`#812`](https://github.com/jhuckaby/Cronicle/pull/812)
- initialize custom_live_log_socket_url [`#797`](https://github.com/jhuckaby/Cronicle/pull/797)
- Version 0.9.60 [`8ef1076`](https://github.com/jhuckaby/Cronicle/commit/8ef10765d68fd336273285dd7b79ee7c92c5d675)
- Added note about `timing` object and subtle behavior differences. [`6cf86b7`](https://github.com/jhuckaby/Cronicle/commit/6cf86b783f15f4d0754c7fb6e58cad0332fd79f9)

#### [v0.9.59](https://github.com/jhuckaby/Cronicle/compare/v0.9.58...v0.9.59)

> 6 August 2024

- Bump pixl-server-storage to v3.2.2 for upstream vuln fix.
- Bump `@aws-sdk/client-s3` and `@aws-sdk/lib-storage` to 3.621.0 for vuln fix: GHSA-mpg4-rc92-vx8v
- Bump `@smithy/node-http-handler` to 3.1.4 for good measure.

Refs:
- https://github.com/advisories/GHSA-mpg4-rc92-vx8v
- https://github.com/jhuckaby/pixl-server-storage/commit/f6a589a1b11372cbedb5c0a6ae1156fad0ec1465

- Version 0.9.59 [`99a82d2`](https://github.com/jhuckaby/Cronicle/commit/99a82d2bd8eda424e13090a88ba28fc66e048f2e)

#### [v0.9.58](https://github.com/jhuckaby/Cronicle/compare/v0.9.57...v0.9.58)

> 31 July 2024

- Fixed loading screen before a primary server is selected.

- Version 0.9.58 [`b485288`](https://github.com/jhuckaby/Cronicle/commit/b48528890caa5fe34cf7e321c4a5b06a51156815)

#### [v0.9.57](https://github.com/jhuckaby/Cronicle/compare/v0.9.56...v0.9.57)

> 31 July 2024

- Fix PID file issue where another process may be assigned our old PID after an unclean shutdown.
- Bump pixl-server to v1.0.44 for same reason.
- Fixes #789

- Version 0.9.57 [`26aded4`](https://github.com/jhuckaby/Cronicle/commit/26aded494f1f6a21dc5750cfa5aa71a5772e2af6)

#### [v0.9.56](https://github.com/jhuckaby/Cronicle/compare/v0.9.55...v0.9.56)

> 17 July 2024

- Fix bug where live log view/download failed on detached jobs.  Fixes #786.

- Version 0.9.56 [`08b1288`](https://github.com/jhuckaby/Cronicle/commit/08b1288a5c1bca32392729baf3079704d71c8753)

#### [v0.9.55](https://github.com/jhuckaby/Cronicle/compare/v0.9.54...v0.9.55)

> 16 July 2024

- Fixed typo in `job_read_only` implementation.

- Version 0.9.55 [`801d103`](https://github.com/jhuckaby/Cronicle/commit/801d1033808549cde0dfb42f8ff2be1d820fa251)

#### [v0.9.54](https://github.com/jhuckaby/Cronicle/compare/v0.9.53...v0.9.54)

> 15 July 2024

- Added optional `job_read_only` privilege.  When set, a user (or API key) can ONLY run stock events from the schdule, with NO customization.

- Version 0.9.54 [`6bd3d90`](https://github.com/jhuckaby/Cronicle/commit/6bd3d9076050001e182dacfac54f00537a26e12b)

#### [v0.9.53](https://github.com/jhuckaby/Cronicle/compare/v0.9.52...v0.9.53)

> 21 June 2024

- Bump `socket.io` and `socket.io-client` to 4.7.5 for vuln fix.
- https://github.com/socketio/socket.io/pull/5052
- https://www.tenable.com/cve/CVE-2024-37890

- Version 0.9.53 [`eb2808f`](https://github.com/jhuckaby/Cronicle/commit/eb2808f8531b37e52e4bf9f1f4b74b617301644a)
- Added error for installing on machines with less than 64 MB RAM. [`cebf921`](https://github.com/jhuckaby/Cronicle/commit/cebf921cb5c90ef66472e1381498b3f2121aab0b)

#### [v0.9.52](https://github.com/jhuckaby/Cronicle/compare/v0.9.51...v0.9.52)

> 7 June 2024

- New optional client config param: `prompt_before_run` (see Discussion #771)
- Removed duplicate TOC entry in doc.
- Fixed manual run-all jobs when servers shut down unexpectedly (fixes #757)

- Fixed manual run-all jobs when servers shut down unexpectedly. [`b45a635`](https://github.com/jhuckaby/Cronicle/commit/b45a63565bb20f4f897b4fb34aabb49bd05e50ef)
- New optional client config param: `prompt_before_run` [`8d3389a`](https://github.com/jhuckaby/Cronicle/commit/8d3389a38ef95f08498079c62634dd42d5c97429)
- Version 0.9.52 [`5ffd58c`](https://github.com/jhuckaby/Cronicle/commit/5ffd58c96a1efcd4c82fd8c8fb3659cc5b48e1f4)
- Added note regarding issue #757 [`ec87118`](https://github.com/jhuckaby/Cronicle/commit/ec871188683102c1a4945d84a854976576d1ead8)
- Removed duplicate TOC entry. [`a1f0b67`](https://github.com/jhuckaby/Cronicle/commit/a1f0b67895b6e1e0ed956717cc6dba1036b48ac5)

#### [v0.9.51](https://github.com/jhuckaby/Cronicle/compare/v0.9.50...v0.9.51)

> 13 May 2024

- Added optional client config properties: `default_job_history_limit` and `default_job_stats_limit`.
- Fixes #756

- Version 0.9.51 [`0766211`](https://github.com/jhuckaby/Cronicle/commit/0766211161ddcc1a88b3920f7a023e8655e870f2)

#### [v0.9.50](https://github.com/jhuckaby/Cronicle/compare/v0.9.49...v0.9.50)

> 13 May 2024

- Changed behavior so manually started jobs will be rewinded if failed and Run All Mode is set.
- Fixes #757
- Updated docs regarding timeouts and Run All Mode.

- Version 0.9.50 [`846f974`](https://github.com/jhuckaby/Cronicle/commit/846f9748aa29502e8ea59a681a85ac618684e843)

#### [v0.9.49](https://github.com/jhuckaby/Cronicle/compare/v0.9.48...v0.9.49)

> 10 May 2024

- Bump `pixl-server-web` to v2.0.0 to prevent XSS reflection style attacks on APIs.
- Misc fixes to remove legacy JSONP-style APIs.
- Fixes #755

- Version 0.9.49 [`db3b4b8`](https://github.com/jhuckaby/Cronicle/commit/db3b4b8c9698e7e7acd1f76cfad69fde15b6bb82)

#### [v0.9.48](https://github.com/jhuckaby/Cronicle/compare/v0.9.47...v0.9.48)

> 7 May 2024

- Bump pixl-server-user to 1.0.22 for script injection vuln fix.
- Fixes #752

- Version 0.9.48 [`813f401`](https://github.com/jhuckaby/Cronicle/commit/813f40105e9b7eb602e6387c7ad0b61be2c9026f)

#### [v0.9.47](https://github.com/jhuckaby/Cronicle/compare/v0.9.46...v0.9.47)

> 29 April 2024

- Disabled the "event autosave" feature that saves the state of an event edit, when you leave without saving.  It creates confusion.

- Version 0.9.47 [`990e7ed`](https://github.com/jhuckaby/Cronicle/commit/990e7eda67d6726af349d44d1b719d9b74f7c620)

#### [v0.9.46](https://github.com/jhuckaby/Cronicle/compare/v0.9.45...v0.9.46)

> 23 April 2024

- Bump pixl-server-web to v1.3.30 for vulnerability fix in formidable module: https://github.com/advisories/GHSA-8cp3-66vr-3r4c

- Version 0.9.46 [`dc0340d`](https://github.com/jhuckaby/Cronicle/commit/dc0340d5f1fbcbaae42918fddc849d749a06600b)

#### [v0.9.45](https://github.com/jhuckaby/Cronicle/compare/v0.9.44...v0.9.45)

> 12 March 2024

- Added support for custom Group (GID) for Plugins.

- Version 0.9.45 [`9d2cfad`](https://github.com/jhuckaby/Cronicle/commit/9d2cfad889bdb1e7586f4a81de3ec035f42880b5)

#### [v0.9.44](https://github.com/jhuckaby/Cronicle/compare/v0.9.43...v0.9.44)

> 20 February 2024

- Fixes #724.  Thank you so much @moonsoftsrl!

- Fix cert_bypass [`#724`](https://github.com/jhuckaby/Cronicle/pull/724)
- Version 0.9.44 [`1fb0515`](https://github.com/jhuckaby/Cronicle/commit/1fb0515e7ee91fc5565ab4098ab3c1f77199bd35)

#### [v0.9.43](https://github.com/jhuckaby/Cronicle/compare/v0.9.42...v0.9.43)

> 18 February 2024

- Bumped pixl-tools to v1.1.1 for speed improvements on `glob()` and `rimraf()`.

- Version 0.9.43 [`dc27639`](https://github.com/jhuckaby/Cronicle/commit/dc2763961184cb4f687841b9b9dfb4c265a1e034)

#### [v0.9.42](https://github.com/jhuckaby/Cronicle/compare/v0.9.41...v0.9.42)

> 18 February 2024

- Bump pixl-tools to v1.1.0 for multiple vuln fixes in nested packages (namely glob and rimraf).

- Version 0.9.42 [`019b900`](https://github.com/jhuckaby/Cronicle/commit/019b90069958650de172fa5e8ed7f3f19e41b71a)

#### [v0.9.41](https://github.com/jhuckaby/Cronicle/compare/v0.9.40...v0.9.41)

> 15 February 2024

- Bump pixl-mail to v1.0.14 for upstream vuln fix in nodemailer.

- Version 0.9.41 [`759f64e`](https://github.com/jhuckaby/Cronicle/commit/759f64efc457b697c3892aff979e08c9e8bc5d43)
- Updated copyright year. [`e1182c9`](https://github.com/jhuckaby/Cronicle/commit/e1182c9a1919f835677e4235a70508d3ab841361)
- Added blurb about standard Node install locations. [`bbd7c08`](https://github.com/jhuckaby/Cronicle/commit/bbd7c08cbdc3e979f42dbeca1a33ac2ca333de99)

#### [v0.9.40](https://github.com/jhuckaby/Cronicle/compare/v0.9.39...v0.9.40)

> 18 December 2023

- Bump lodash from 4.17.10 to 4.17.21 [`#696`](https://github.com/jhuckaby/Cronicle/pull/696)
- Trying to get deps under control. [`b86792e`](https://github.com/jhuckaby/Cronicle/commit/b86792e18b449b8960f89c4d9b53eb9934caa661)
- Version 0.9.40 [`3a1aff7`](https://github.com/jhuckaby/Cronicle/commit/3a1aff7c0847ac32a9b023a939d960616adbc29f)

#### [v0.9.39](https://github.com/jhuckaby/Cronicle/compare/v0.9.38...v0.9.39)

> 16 November 2023

- Added `/api/app/get_servers` route, admin only, currenly undocumented.

- Version 0.9.39 [`2c9f6ae`](https://github.com/jhuckaby/Cronicle/commit/2c9f6aed51d7d712749248b81b1578812225518d)

#### [v0.9.38](https://github.com/jhuckaby/Cronicle/compare/v0.9.37...v0.9.38)

> 23 October 2023

- Added `chain_params` feature.

- Version 0.9.38 [`82a162a`](https://github.com/jhuckaby/Cronicle/commit/82a162a9b962ace5513800d7173a7c21ab24b494)

#### [v0.9.37](https://github.com/jhuckaby/Cronicle/compare/v0.9.36...v0.9.37)

> 17 October 2023

- Added package-lock.json.
- Fixes #656

- Version 0.9.37 [`6dda68e`](https://github.com/jhuckaby/Cronicle/commit/6dda68effab67b67295a350c10d0cd70b2520362)

#### [v0.9.36](https://github.com/jhuckaby/Cronicle/compare/v0.9.35...v0.9.36)

> 12 October 2023

- Add some common locations into the PATH env var during startup.

- Version 0.9.36 [`ca1ae43`](https://github.com/jhuckaby/Cronicle/commit/ca1ae437ec4fc9af472e24bd076346ca17392283)

#### [v0.9.35](https://github.com/jhuckaby/Cronicle/compare/v0.9.34...v0.9.35)

> 3 October 2023

- Add client.hide_schedule_checkboxes feature.
- Bump pixl-server-web to v1.3.22 for alt ports.

- Version 0.9.35 [`580ca9a`](https://github.com/jhuckaby/Cronicle/commit/580ca9a913ed57306e37aff42abaa2a46a156a19)

#### [v0.9.34](https://github.com/jhuckaby/Cronicle/compare/v0.9.33...v0.9.34)

> 3 October 2023

- Remove legacy use of `NODE_TLS_REJECT_UNAUTHORIZED` env var.
- Update docs on `web_hook_custom_opts`
- Support for future pixl-server-web listeners array (multi-port).
- Remove old `listRoughChop`, now using official `listSplice` API.

- Version 0.9.34 [`83c4eaa`](https://github.com/jhuckaby/Cronicle/commit/83c4eaa204341b48f90d0971dfcee8e193471db0)
- Added disclaimer to doc about remote_server_port [`ebad37e`](https://github.com/jhuckaby/Cronicle/commit/ebad37e258f2c67b4b44e3570ef5bec5b3d720a1)

#### [v0.9.33](https://github.com/jhuckaby/Cronicle/compare/v0.9.32...v0.9.33)

> 20 September 2023

- Fixing more bugs that surfaced because of `remote_server_port`.

- Version 0.9.33 [`a742345`](https://github.com/jhuckaby/Cronicle/commit/a742345ade8a9a603d209e3ca220ff20747d9756)

#### [v0.9.32](https://github.com/jhuckaby/Cronicle/compare/v0.9.31...v0.9.32)

> 20 September 2023

- Version 0.9.32 [`0b05b3c`](https://github.com/jhuckaby/Cronicle/commit/0b05b3c2321bca5c43ed7dccb59dea997fe3237d)
- Typo fix, thanks @seanford ! [`74cd3b7`](https://github.com/jhuckaby/Cronicle/commit/74cd3b7281845043ebac1e9175041ae448286cd7)
- Updated TOC. [`c27507e`](https://github.com/jhuckaby/Cronicle/commit/c27507e755b9c4bc818c67a8932364281b45b1eb)

#### [v0.9.31](https://github.com/jhuckaby/Cronicle/compare/v0.9.30...v0.9.31)

> 20 September 2023

- Added `remote_server_port` property (optional).

- Added docs on `get_event_history` and `get_history` API calls. [`dfe8a77`](https://github.com/jhuckaby/Cronicle/commit/dfe8a77eb9306c5417a79539ba48ab970c1c734b)
- Version 0.9.31 [`dd9c10e`](https://github.com/jhuckaby/Cronicle/commit/dd9c10e2357dd4e383c5cef92d96b099af002d6d)
- Updated TOC. [`9b51f5c`](https://github.com/jhuckaby/Cronicle/commit/9b51f5c49e36c6851c426b7dc21d40e0606cccd4)
- Using parseInt for user active. [`5f44aad`](https://github.com/jhuckaby/Cronicle/commit/5f44aad53cac953939b5cea95456f2d3e3b7e844)

#### [v0.9.30](https://github.com/jhuckaby/Cronicle/compare/v0.9.29...v0.9.30)

> 18 August 2023

- Fix bug where suspending a user in the UI doesn't work at all.
- Fixes #626

- Version 0.9.30 [`996750a`](https://github.com/jhuckaby/Cronicle/commit/996750a7453f88d1bcc696057f14209988428155)

#### [v0.9.29](https://github.com/jhuckaby/Cronicle/compare/v0.9.28...v0.9.29)

> 18 August 2023

Bump pixl-server-web to v1.3.20 for crash fix when viewing zero-byte files.

- Version 0.9.29 [`840f043`](https://github.com/jhuckaby/Cronicle/commit/840f043e0d9e2140ea84e96a2af2509f25a0bbec)

#### [v0.9.28](https://github.com/jhuckaby/Cronicle/compare/v0.9.27...v0.9.28)

> 18 August 2023

- Cleaned up sample S3 config in docs. [`ddec311`](https://github.com/jhuckaby/Cronicle/commit/ddec31176f9905a585e4179ab37b6d430b8499ac)
- Version 0.9.28 [`e15f03f`](https://github.com/jhuckaby/Cronicle/commit/e15f03f7fd5bb3f79ff41ffac3fbce8ed8fa69f2)
- Fixed bug where searching for pure numbers wouldn't match any events. [`90df805`](https://github.com/jhuckaby/Cronicle/commit/90df8059cd58fdac8141021be3216ec2a2322863)

#### [v0.9.27](https://github.com/jhuckaby/Cronicle/compare/v0.9.26...v0.9.27)

> 10 August 2023

- Added pixl-boot for automatic start on server boot.
- Updated docs for clarification on behavior.

- Version 0.9.27 [`14b6000`](https://github.com/jhuckaby/Cronicle/commit/14b60005f9fde30a6b8bad68bd623f581717cb1b)

#### [v0.9.26](https://github.com/jhuckaby/Cronicle/compare/v0.9.25...v0.9.26)

> 7 August 2023

- Fixed several issues in the Storage CLI script.
- CLI: Disable transactions
- CLI: Make sure Cronicle isn't running for write actions

- Version 0.9.26 [`8872c8a`](https://github.com/jhuckaby/Cronicle/commit/8872c8aaf37587dd87912c095b764fc7449a9de3)

#### [v0.9.25](https://github.com/jhuckaby/Cronicle/compare/v0.9.24...v0.9.25)

> 23 July 2023

- Bump socket.io to v4.7.1 for vuln: https://security.snyk.io/vuln/SNYK-JS-ENGINEIO-5496331

- Version 0.9.25 [`497ddd4`](https://github.com/jhuckaby/Cronicle/commit/497ddd408e736bee660b17d5c3b63f1693f7db65)

#### [v0.9.24](https://github.com/jhuckaby/Cronicle/compare/v0.9.23...v0.9.24)

> 17 July 2023

- Enable storage transactions by default.
- Ship with new storage repair script.
- Ensure Node.js version is 16+ on startup.

- Version 0.9.24 [`52920c9`](https://github.com/jhuckaby/Cronicle/commit/52920c91dfc90d3a7d11efbf1330e4ecabb4524a)
- Improve Plugin API documentation for successful job result [`0f5c041`](https://github.com/jhuckaby/Cronicle/commit/0f5c04134d60d3fcc454e89376c5e0c61eba5ced)
- Updated TOC. [`c3750f7`](https://github.com/jhuckaby/Cronicle/commit/c3750f75f927bf8b85cf400ed179c3463a7ea38f)

#### [v0.9.23](https://github.com/jhuckaby/Cronicle/compare/v0.9.22...v0.9.23)

> 1 June 2023

- Added new `get_master_state` API and docs.
- Added docs for  `update_master_state` API.

- Version 0.9.23 [`20a7502`](https://github.com/jhuckaby/Cronicle/commit/20a75027114f7d9859b971f6b2ab732e0d067150)

#### [v0.9.22](https://github.com/jhuckaby/Cronicle/compare/v0.9.21...v0.9.22)

> 19 May 2023

- Show confirmation dialog for toggling the scheduler. [`df93a69`](https://github.com/jhuckaby/Cronicle/commit/df93a6948c1b59a8c44986bdf04b96e3745cb548)
- Version 0.9.22 [`83681fb`](https://github.com/jhuckaby/Cronicle/commit/83681fb0821959b0e40f30ebf722078db9f210cf)
- Increase schedule column max-width to 600px. [`01f38bd`](https://github.com/jhuckaby/Cronicle/commit/01f38bde834213f1df44c64c15e95c1b6bda27f4)

#### [v0.9.21](https://github.com/jhuckaby/Cronicle/compare/v0.9.20...v0.9.21)

> 19 April 2023

- Support for Discord Web Hooks, added `content` property into web hook text props.
- Thanks to @mikeTWC1984 for this fix!

- Version 0.9.21 [`85f9862`](https://github.com/jhuckaby/Cronicle/commit/85f98621efff8aaaa6ff2ae1cac43e1b16d23e3b)
- Updated copyright year. [`1e52ea3`](https://github.com/jhuckaby/Cronicle/commit/1e52ea3ffdffc0f6c9558e4df0d1a0e4a6e14a9a)

#### [v0.9.20](https://github.com/jhuckaby/Cronicle/compare/v0.9.19...v0.9.20)

> 30 January 2023

- Now validating timezone on create_event, update_event, run_event and update_job APIs
- Fixes #571

- Version 0.9.20 [`9f574e7`](https://github.com/jhuckaby/Cronicle/commit/9f574e7a730f4a0f7d3bbe271be49847f092f03f)
- Added correct packages to check between installs. [`1ab8b85`](https://github.com/jhuckaby/Cronicle/commit/1ab8b8569db38b911ad26b2614f40e1e3ca6c160)

#### [v0.9.19](https://github.com/jhuckaby/Cronicle/compare/v0.9.18...v0.9.19)

> 28 December 2022

- Bumped pixl-logger to v2.0.2
- Bumped pixl-webapp to v2.0.2

- Version 0.9.19 [`3001ab4`](https://github.com/jhuckaby/Cronicle/commit/3001ab4a1e0a4b08a7fd5433a9b53ded3692790a)

#### [v0.9.18](https://github.com/jhuckaby/Cronicle/compare/v0.9.17...v0.9.18)

> 28 December 2022

- Add new `tz` configuration property in the `client` object.  This will override the auto-detected TZ in all users browsers.
- Fixes #565

- Version 0.9.18 [`1e80586`](https://github.com/jhuckaby/Cronicle/commit/1e805864cc3691c38598576d3e26c9e1bc29ca20)

#### [v0.9.17](https://github.com/jhuckaby/Cronicle/compare/v0.9.16...v0.9.17)

> 11 December 2022

- Bump socket.io to v4.5.4 to fix vulns.
- Bump pixl-server-web to v1.3.15 to fix vulns in formidable.

- Version 0.9.17 [`d2521f3`](https://github.com/jhuckaby/Cronicle/commit/d2521f38a73660e3393f22d133c86578af911450)
- Fixed unit test when config API was changed. [`7c716a8`](https://github.com/jhuckaby/Cronicle/commit/7c716a82731b9a91108dcf7a90f6ff1da7e6ca00)

#### [v0.9.16](https://github.com/jhuckaby/Cronicle/compare/v0.9.15...v0.9.16)

> 11 November 2022

- Fix dependency vuln: https://github.com/advisories/GHSA-qm95-pgcg-qqfq

- Version 0.9.16 [`a2d3f01`](https://github.com/jhuckaby/Cronicle/commit/a2d3f01b2a83df39d987efd7cd86906bfd327e28)

#### [v0.9.15](https://github.com/jhuckaby/Cronicle/compare/v0.9.14...v0.9.15)

> 2 November 2022

- Addresses XSS aspect of issue #546

- Version 0.9.15 [`c7486df`](https://github.com/jhuckaby/Cronicle/commit/c7486df2539b1503a0be5ded17e9b0c2d5b9a9ea)

#### [v0.9.14](https://github.com/jhuckaby/Cronicle/compare/v0.9.13...v0.9.14)

> 26 October 2022

- Fixed issue with newest pixl-server-storage and @aws-sdk/client-s3 library.

- Version 0.9.14 [`8e8e348`](https://github.com/jhuckaby/Cronicle/commit/8e8e34832a5ecdd4b21c81bc1350b7fe41a8e872)

#### [v0.9.13](https://github.com/jhuckaby/Cronicle/compare/v0.9.12...v0.9.13)

> 18 October 2022

- Removed block that was preventing API keys from becoming admins.
- See: https://github.com/jhuckaby/Cronicle/discussions/479

- More minor doc nav tweaks. [`18c20a8`](https://github.com/jhuckaby/Cronicle/commit/18c20a8112e757db1440bdd6f6028d3d8cf81f9b)
- Minor tweaks to docs. [`3d357e1`](https://github.com/jhuckaby/Cronicle/commit/3d357e1d409de83ad80076e3891694ee608d4745)
- Updated S3 docs to reflect latest pixl-server-storage changes. [`73c9e48`](https://github.com/jhuckaby/Cronicle/commit/73c9e4883394dd2a705f7dadf4573be626e064df)
- Version 0.9.13 [`2085e2c`](https://github.com/jhuckaby/Cronicle/commit/2085e2c111d00a442380403eaf3a05fa2aa7798d)

#### [v0.9.12](https://github.com/jhuckaby/Cronicle/compare/v0.9.11...v0.9.12)

> 21 September 2022

- Bumped moment-timezone to v0.5.35 for vulns.

- Reworked documentation to split across files. [`d940525`](https://github.com/jhuckaby/Cronicle/commit/d940525d66e5805ae671e991f63df6bb94f7daa4)
- Still playing with doc nav UI a bit. [`67b5013`](https://github.com/jhuckaby/Cronicle/commit/67b50134e8b42fbc23e166d7e96947dceb01bed4)
- Minor doc UI fix. [`987f64e`](https://github.com/jhuckaby/Cronicle/commit/987f64ef9afb844c79b7c426c12ad621adcafc4a)
- Version 0.9.12 [`455a29f`](https://github.com/jhuckaby/Cronicle/commit/455a29fb66cbfbe9b42fffde02d3633e32bbb477)

#### [v0.9.11](https://github.com/jhuckaby/Cronicle/compare/v0.9.10...v0.9.11)

> 28 August 2022

- Fixed security issue where websockets auth'ed with user sessions could run admin commands. [`ec4b491`](https://github.com/jhuckaby/Cronicle/commit/ec4b4910515a86c323debcc5390fd005781694e4)
- Version 0.9.11 [`44556ab`](https://github.com/jhuckaby/Cronicle/commit/44556ab98fa65eddc65e667ce7f6021e6c0b3016)

#### [v0.9.10](https://github.com/jhuckaby/Cronicle/compare/v0.9.9...v0.9.10)

> 22 August 2022

- Fixed bug where rogue JSON from Plugin could overwrite sensitive job data. [`5988163`](https://github.com/jhuckaby/Cronicle/commit/5988163a8ce983afbe5137b8016b096918a29230)
- Fixes #516 [`49f6a1b`](https://github.com/jhuckaby/Cronicle/commit/49f6a1ba5564a474a19c28f2005f3b22de8939a3)
- Added blurb about JSON output and `complete` flag. [`8e04a57`](https://github.com/jhuckaby/Cronicle/commit/8e04a577055acb61c0efbea1d4c41499b88b3df1)
- Version 0.9.10 [`9a598c8`](https://github.com/jhuckaby/Cronicle/commit/9a598c82d3e15a2e617946b686f1710bafd2676d)

#### [v0.9.9](https://github.com/jhuckaby/Cronicle/compare/v0.9.8...v0.9.9)

> 28 July 2022

https://github.com/moment/moment/pull/6015

- Bumped moment to v2.29.4 for vuln [`b939bf4`](https://github.com/jhuckaby/Cronicle/commit/b939bf4253bad1d476887577f0ef9093ad9b09c8)

#### [v0.9.8](https://github.com/jhuckaby/Cronicle/compare/v0.9.7...v0.9.8)

> 26 July 2022

- Allow for escaped shell variables in job params. [`8c500b9`](https://github.com/jhuckaby/Cronicle/commit/8c500b9954e8061342b2bd3400596e9035385aaf)
- Version 0.9.8 [`0e374c8`](https://github.com/jhuckaby/Cronicle/commit/0e374c8a9d0f638a4978ff1e1a9570587d6e5618)

#### [v0.9.7](https://github.com/jhuckaby/Cronicle/compare/v0.9.6...v0.9.7)

> 4 May 2022

- Schedule page now shows "Last Run" result (success or fail).
- Saved in state database, survives restarts.
- Click on last run bubble to jump to latest job detail.
- Updated in real-time.
- Filter events based on last run status.

- Version 0.9.7 [`a4a39ac`](https://github.com/jhuckaby/Cronicle/commit/a4a39ac75e0e05a0ef1937993c307436f8d6fb44)
- Removed redundant call to npm install. [`9c864fe`](https://github.com/jhuckaby/Cronicle/commit/9c864fe303ce38c8928401111a45f481738d9788)

#### [v0.9.6](https://github.com/jhuckaby/Cronicle/compare/v0.9.5...v0.9.6)

> 27 April 2022

- Bumped moment to v2.29.2 for vuln patch
- https://github.com/advisories/GHSA-8hfj-j24r-96c4
- Bumped moment-timezone to v0.5.34 for latest TZ data.

- Version 0.9.6 [`c55b175`](https://github.com/jhuckaby/Cronicle/commit/c55b175054e040bf7f2d50d42946ae827318be49)

#### [v0.9.5](https://github.com/jhuckaby/Cronicle/compare/v0.9.4...v0.9.5)

> 27 April 2022

- Bumped various deps for async vuln patch
- https://github.com/advisories/GHSA-fwr7-v2mv-hh25

- Version 0.9.5 [`962d711`](https://github.com/jhuckaby/Cronicle/commit/962d71135bb2c2920a7d4bf0550fe04b879b55eb)
- Bumped async to v2.6.4 for vuln [`1720340`](https://github.com/jhuckaby/Cronicle/commit/1720340106463f1858f3a0e58bf2355f1cf2c780)

#### [v0.9.4](https://github.com/jhuckaby/Cronicle/compare/v0.9.3...v0.9.4)

> 27 April 2022

- Bug fix: Event List: Redraw breaks menus and search box [`c8f06a2`](https://github.com/jhuckaby/Cronicle/commit/c8f06a2a81d88235fe3c1db2af7f6d6ac7634987)
- Added note about Couchbase v2 [`867e245`](https://github.com/jhuckaby/Cronicle/commit/867e245b5dc61953fa8e88d632d4f1616eb21e77)
- Version 0.9.4 [`a79cb4a`](https://github.com/jhuckaby/Cronicle/commit/a79cb4a0b1c39a642719d06a229f9e0711a82b87)

#### [v0.9.3](https://github.com/jhuckaby/Cronicle/compare/v0.9.2...v0.9.3)

> 6 April 2022

- Bumped pixl-request to v2.0.1
- Fixes #486 (thanks user @Musarrath!)

- Fixed bug in unit tests with queue collision. [`6c26889`](https://github.com/jhuckaby/Cronicle/commit/6c268899870f48e048597f2847b719433320cf89)
- Version 0.9.3 [`d2800fe`](https://github.com/jhuckaby/Cronicle/commit/d2800fe244a15eb4abfd50018ba4c55817883227)

#### [v0.9.2](https://github.com/jhuckaby/Cronicle/compare/v0.9.1...v0.9.2)

> 16 December 2021

- Updated copyright year in various places.

- Version 0.9.2 [`90ada98`](https://github.com/jhuckaby/Cronicle/commit/90ada989b15c00bfa00d51abfbfa971c3293da39)

#### [v0.9.1](https://github.com/jhuckaby/Cronicle/compare/v0.9.0...v0.9.1)

> 16 December 2021

- Typo, missed reference to old legacy dependency.

- Added v0.9 upgrade note to top of README. [`c2bfdc1`](https://github.com/jhuckaby/Cronicle/commit/c2bfdc15e6067661c9ec1f83a2f4b08d3c2ca3a3)
- Version 0.9.1 [`3593ef8`](https://github.com/jhuckaby/Cronicle/commit/3593ef8b082c8ff3d6dd896b6aaf15723dbadef1)

#### [v0.9.0](https://github.com/jhuckaby/Cronicle/compare/v0.8.62...v0.9.0)

> 16 December 2021

- Bumped socket.io to v4.4
- Removed mkdirp
- Bumped uglifyjs to v3.14.3
- Bumped shell-quote to v1.7.3
- Bumped pixl-server-storage to v3.0.11

- Version 0.9.0 -- bumped deps for vulns [`a093f6b`](https://github.com/jhuckaby/Cronicle/commit/a093f6b94dba3bb6017b3f9e621ddecf84892973)
- Added notice about merging PRs. [`3748186`](https://github.com/jhuckaby/Cronicle/commit/374818641b02f53adea577d18d16f8fd3255af56)
- Added .github/pull_request_template.md [`27e50c3`](https://github.com/jhuckaby/Cronicle/commit/27e50c371cc901860123015032b9f389a63714b1)

#### [v0.8.62](https://github.com/jhuckaby/Cronicle/compare/v0.8.61...v0.8.62)

> 17 June 2021

- Bumped `pixl-server` to v1.0.30 for issue with logging
- Fixes #416

- Version 0.8.61 [`fd03cb9`](https://github.com/jhuckaby/Cronicle/commit/fd03cb9225d0468d7c3b65b06fd2d812d7e356fb)
- Fixed typos in docs. [`d2cc143`](https://github.com/jhuckaby/Cronicle/commit/d2cc143224da31c11af68389a6f7bd819892fb46)

#### [v0.8.61](https://github.com/jhuckaby/Cronicle/compare/v0.8.60...v0.8.61)

> 21 May 2021

- Implemented `max_jobs` feature (global maximum).

- Version 0.8.61 [`d7fadf2`](https://github.com/jhuckaby/Cronicle/commit/d7fadf248ee9140b4d7883030c51f90a38a68042)

#### [v0.8.60](https://github.com/jhuckaby/Cronicle/compare/v0.8.59...v0.8.60)

> 21 May 2021

- Bumped pixl-mail to v1.0.11 for vuln in nodemailer.
- https://www.npmjs.com/advisories/1708

- Version 0.8.60 [`94ba681`](https://github.com/jhuckaby/Cronicle/commit/94ba6814eabdba926f20adf31693eb88827c053e)

#### [v0.8.59](https://github.com/jhuckaby/Cronicle/compare/v0.8.58...v0.8.59)

> 16 May 2021

- Bumped pixl-request to 1.0.36 for decomp bug fix. [`f585fb9`](https://github.com/jhuckaby/Cronicle/commit/f585fb984fc29de26697ee97b2b157d6cceb6093)

#### [v0.8.58](https://github.com/jhuckaby/Cronicle/compare/v0.8.57...v0.8.58)

> 14 May 2021

- Bumped jquery to v3.5.0 for vuln
- Bumped chart.js to v2.9.4 for vuln
- Bumped netmask to v2.0.1 for vuln
- Fixes #404

- Patched a few security holes. [`546c7f6`](https://github.com/jhuckaby/Cronicle/commit/546c7f6507122ef30b4d0e7539444f992ed7b511)
- Version 0.8.58 [`42975fc`](https://github.com/jhuckaby/Cronicle/commit/42975fc1b1c62b4d104d5566a3fde14f45bc5627)

#### [v0.8.57](https://github.com/jhuckaby/Cronicle/compare/v0.8.56...v0.8.57)

> 27 March 2021

- Make sure titles do not contain HTML metacharacters. [`9671c7c`](https://github.com/jhuckaby/Cronicle/commit/9671c7c02cb1bc1147cabaddf9852ca756512ba3)
- Race condition with "Run Again" and get_log_watch_auth. [`df326ee`](https://github.com/jhuckaby/Cronicle/commit/df326eefd2a2d2a67ce9c09c0b79283aaff053b1)
- Version 0.8.57 [`bba7b01`](https://github.com/jhuckaby/Cronicle/commit/bba7b01579d56b1354392d1f3e710cec3270093a)

#### [v0.8.56](https://github.com/jhuckaby/Cronicle/compare/v0.8.55...v0.8.56)

> 23 January 2021

- Now setting `no_rewind` for timeout aborts. Fixes #369.

- Version 0.8.56 [`cdf3a2e`](https://github.com/jhuckaby/Cronicle/commit/cdf3a2ee51a64396dbcaa172d84824893e742430)

#### [v0.8.55](https://github.com/jhuckaby/Cronicle/compare/v0.8.54...v0.8.55)

> 23 January 2021

- Version 0.8.55 [`3bca4fc`](https://github.com/jhuckaby/Cronicle/commit/3bca4fc360b95ee319fc44f15a0918979864260e)
- Updated TOC. [`449d578`](https://github.com/jhuckaby/Cronicle/commit/449d578a51de9154857a2d21efef4c9c1ff5d3a7)

#### [v0.8.54](https://github.com/jhuckaby/Cronicle/compare/v0.8.53...v0.8.54)

> 22 November 2020

- Bumped moment-timezone to v0.5.32.  Fixes #356. [`b90921e`](https://github.com/jhuckaby/Cronicle/commit/b90921e7512162941aafe84b3407c053f338a92f)

#### [v0.8.53](https://github.com/jhuckaby/Cronicle/compare/v0.8.52...v0.8.53)

> 8 November 2020

- Bumped pixl-request to 1.0.33 for new embedded header/data syntax in web hook URLs.

- Version 0.8.53 [`15ba50f`](https://github.com/jhuckaby/Cronicle/commit/15ba50f4a59e26de0b9a8b9b9a5f24972fa502a0)

#### [v0.8.52](https://github.com/jhuckaby/Cronicle/compare/v0.8.51...v0.8.52)

> 7 November 2020

- Fixed bug where web hook validation got tripped up on the new header system (thanks @mikeTWC1984) [`5c0199b`](https://github.com/jhuckaby/Cronicle/commit/5c0199b78616e3a9707d190e22858395d35794e2)
- Changed example URL in README to be Slack's API endpoint. [`62ed487`](https://github.com/jhuckaby/Cronicle/commit/62ed487125e0aea59f2089dcc5d73549d1b312d0)

#### [v0.8.51](https://github.com/jhuckaby/Cronicle/compare/v0.8.50...v0.8.51)

> 7 November 2020

- Bumped pixl-request to v1.0.32 for new URL header substitution feature.
- Allow Web Hook URLs to include embedded request headers e.g. `[Cookie: foo=bar]`
- Fixes #346

- Version 0.8.51 [`b46ce34`](https://github.com/jhuckaby/Cronicle/commit/b46ce3481ec9a0f6778a7c9aaf97ed21909d80d8)

#### [v0.8.50](https://github.com/jhuckaby/Cronicle/compare/v0.8.49...v0.8.50)

> 9 October 2020

- Fixes #333.  Thanks @Taz4Git and @mikeTWC1984!

- Version 0.8.50 [`8acbbf5`](https://github.com/jhuckaby/Cronicle/commit/8acbbf50fbe25cdc88494bfdf6a6d10d70c7455a)

#### [v0.8.49](https://github.com/jhuckaby/Cronicle/compare/v0.8.48...v0.8.49)

> 25 September 2020

- Added user privileges for specific server groups. [`8a9df7c`](https://github.com/jhuckaby/Cronicle/commit/8a9df7cadda5f39d33091c5e405779d894240c71)
- Fixed issue with live log watcher and workers. [`fb529e4`](https://github.com/jhuckaby/Cronicle/commit/fb529e460262310bede3a10f4f1fc92f4a216370)
- Version 0.8.49 [`d53da19`](https://github.com/jhuckaby/Cronicle/commit/d53da190f300bb08048cad45e7b91d11656b81ea)

#### [v0.8.48](https://github.com/jhuckaby/Cronicle/compare/v0.8.47...v0.8.48)

> 14 September 2020

- Removed outdated terminology from the UI.

- First pass at removing outdated terms from docs. [`6ec734f`](https://github.com/jhuckaby/Cronicle/commit/6ec734fcf6268702605c9ef1495e2d6061e9b5d3)
- Version 0.8.48 [`3300a5a`](https://github.com/jhuckaby/Cronicle/commit/3300a5aaa9fa68073f0b4f40f36a7d02720d5650)

#### [v0.8.47](https://github.com/jhuckaby/Cronicle/compare/v0.8.46...v0.8.47)

> 18 July 2020

- Fixes #305
- Updated copyright year in page footer.

- Json typo [`#281`](https://github.com/jhuckaby/Cronicle/pull/281)
- Version 0.8.47 [`f6a93d5`](https://github.com/jhuckaby/Cronicle/commit/f6a93d55246f1f17bf45194e643b91cc964dc9ce)
- Fixed spacing issue in TOC [`9ed8ce5`](https://github.com/jhuckaby/Cronicle/commit/9ed8ce5bac2dcd10a39a3f7f629e7664106ae2cf)

#### [v0.8.46](https://github.com/jhuckaby/Cronicle/compare/v0.8.45...v0.8.46)

> 24 April 2020

- Updated dependencies to address a crash seen in Node.js v14.  Should fix #275.
- Updated docs to address Node.js Active LTS and Current channels.  Only Active LTS is supported.
- Removed old Node.js v10 clock warning.
- Wrapped TOC in a details block.

- Version 0.8.46 [`5438f21`](https://github.com/jhuckaby/Cronicle/commit/5438f21d40e75f523a66d2d3671e9aeb98d6ef5a)

#### [v0.8.45](https://github.com/jhuckaby/Cronicle/compare/v0.8.44...v0.8.45)

> 11 March 2020

- Bump pixl-server-api to v1.0.2 for args.params issue.
- If you send in a POST with `true` as the JSON, the parser is happy, but it crashes inner code expecting an object.

- Version 0.8.45 [`a45169b`](https://github.com/jhuckaby/Cronicle/commit/a45169b6bfe74fb9c68a11a3dc1b0e841c6362b3)

#### [v0.8.44](https://github.com/jhuckaby/Cronicle/compare/v0.8.43...v0.8.44)

> 27 February 2020

- Fixes #264 - A refresh bug which occurs when the history view is reloaded after a job completes, but if the user has activated the "Filter By Event" menu, it gets invalidated and the user cannot select an item.  Thanks @geofffox!

- Version 0.8.44 [`8c563e2`](https://github.com/jhuckaby/Cronicle/commit/8c563e2dff8f4206c2e9342b482381f0e1ec50b0)

#### [v0.8.43](https://github.com/jhuckaby/Cronicle/compare/v0.8.42...v0.8.43)

> 19 February 2020

Fixes #216

- Version 0.8.43 [`d573e98`](https://github.com/jhuckaby/Cronicle/commit/d573e982d7db53f00fa423efe5f3c6d220b32e8e)
- Added note about Cronicle starting on boot and environment variables. [`430299d`](https://github.com/jhuckaby/Cronicle/commit/430299de31d91bf497990ddf054eb4dd40793d21)
- Added get_active_jobs to TOC. [`a577009`](https://github.com/jhuckaby/Cronicle/commit/a57700989f874e4a3777d41859b82396db555a3a)

#### [v0.8.42](https://github.com/jhuckaby/Cronicle/compare/v0.8.41...v0.8.42)

> 13 February 2020

Added `get_active_jobs` API and docs.  Closes #261.

- Version 0.8.42 [`e95d6db`](https://github.com/jhuckaby/Cronicle/commit/e95d6db258e4994c7e87ece80c77d396ad7009df)

#### [v0.8.41](https://github.com/jhuckaby/Cronicle/compare/v0.8.40...v0.8.41)

> 7 February 2020

More spawn crash protection, this time for server resource monitoring.
If the server is completely out of memory, the `ps` exec spawn may fail.
This adds crash protection, and just logs the error (non-fatal).

- Version 0.8.41 [`23c3ba2`](https://github.com/jhuckaby/Cronicle/commit/23c3ba270b0db47c3a0cd3c32c4babd0eaa9ceeb)

#### [v0.8.40](https://github.com/jhuckaby/Cronicle/compare/v0.8.39...v0.8.40)

> 7 February 2020

Better support for catching child spawn errors when the PID, STDIN or STDOUT are all undefined.
Presumably this can happen with a server that is completely out of memory.
Apparently Node.js doesn't throw an error for this.  Go figure!

- Version 0.8.40 [`267554d`](https://github.com/jhuckaby/Cronicle/commit/267554d3ddb35c07b77be6c734b629dea867ed3d)

#### [v0.8.39](https://github.com/jhuckaby/Cronicle/compare/v0.8.38...v0.8.39)

> 17 January 2020

- Includes PR #253 (thanks @attie).
- If you do not wish to merge the POST data into the `params` (for example if you are using a webhook that provides other data as JSON), then you can add `&post_data=1` to the query string. If you do this, then the POST data will be available in the `post_data` key of the `params` object.
- Thanks to user @attie and PR #254 for these fixes and suggestions.

- close the child's stdin after writing all of the payload [`#253`](https://github.com/jhuckaby/Cronicle/pull/253)
- Version 0.8.39 [`fad91ad`](https://github.com/jhuckaby/Cronicle/commit/fad91add21b70330d9fc9ffdd4c0f4e3bfad62e5)

#### [v0.8.38](https://github.com/jhuckaby/Cronicle/compare/v0.8.37...v0.8.38)

> 19 December 2019

Fixes #246 -- thanks @alexpanas!

- Version 0.8.38 [`c75664f`](https://github.com/jhuckaby/Cronicle/commit/c75664f694419d7d4da0ccb52fcbd7c87a997f4a)

#### [v0.8.37](https://github.com/jhuckaby/Cronicle/compare/v0.8.36...v0.8.37)

> 27 November 2019

Now correctly throwing an error instead of crashing when starting a job
and the event's category, plugin, or server group cannot be found.

- Version 0.8.37 [`3cfc7ef`](https://github.com/jhuckaby/Cronicle/commit/3cfc7ef09bfd2ebc07c0dc85b4425d8ad3d690fd)

#### [v0.8.36](https://github.com/jhuckaby/Cronicle/compare/v0.8.35...v0.8.36)

> 27 November 2019

- Fixes #199

- Version 0.8.36 [`1e9ed43`](https://github.com/jhuckaby/Cronicle/commit/1e9ed43a73bd45ff7e3354064a3f4edc647f812b)

#### [v0.8.35](https://github.com/jhuckaby/Cronicle/compare/v0.8.34...v0.8.35)

> 24 November 2019

- Merged #234 - Thanks @SPascareli!

- Fixed bug where reset password would not allow "-" and "." chars [`#234`](https://github.com/jhuckaby/Cronicle/pull/234)
- Version 0.8.35 [`3ccd147`](https://github.com/jhuckaby/Cronicle/commit/3ccd1479da80d2a12b5acd40f1c9314e08417b16)
- Added space to log file before npm restore junk. [`bc75410`](https://github.com/jhuckaby/Cronicle/commit/bc7541024a9015f571d84280a7b5028d20781dcb)

#### [v0.8.34](https://github.com/jhuckaby/Cronicle/compare/v0.8.33...v0.8.34)

> 24 November 2019

- Fixed typo in installer script which wiped out log file.

- Version 0.8.34 / Installer v1.3 [`7f5231c`](https://github.com/jhuckaby/Cronicle/commit/7f5231cdfc1aabee855bf5e7d516b8be9c13e872)

#### [v0.8.33](https://github.com/jhuckaby/Cronicle/compare/v0.8.32...v0.8.33)

> 24 November 2019

- Attempting to preserve add-on modules: couchbase, aws-sdk and redis
- npm update seems to clobber these on Cronicle update (sigh)

- Version 0.8.33 / Installer v1.2 [`239e3bc`](https://github.com/jhuckaby/Cronicle/commit/239e3bca8d77c0c605eeb8bd4575283531c0cc31)

#### [v0.8.32](https://github.com/jhuckaby/Cronicle/compare/v0.8.31...v0.8.32)

> 16 October 2019

https://github.com/jhuckaby/Cronicle/commit/55c64899d8de6cd55a1ac436ef600860d293dcad

- Add section about companies using Cronicle [`#212`](https://github.com/jhuckaby/Cronicle/pull/212)
- Add custom custom_live_log_socket_url for single-master systems behind an LB [`55c6489`](https://github.com/jhuckaby/Cronicle/commit/55c64899d8de6cd55a1ac436ef600860d293dcad)
- Version 0.8.32 [`59f0eab`](https://github.com/jhuckaby/Cronicle/commit/59f0eab4269e814ec88979b341522654a0ef561f)

#### [v0.8.31](https://github.com/jhuckaby/Cronicle/compare/v0.8.30...v0.8.31)

> 30 June 2019

Fix #195

- Version 0.8.31 [`df89a8f`](https://github.com/jhuckaby/Cronicle/commit/df89a8ff7cc3b46844ce9920a13d92626f4b24c4)

#### [v0.8.30](https://github.com/jhuckaby/Cronicle/compare/v0.8.29...v0.8.30)

> 30 June 2019

Fixed bug where error chain reaction would fire even if job was aborted.
Aborted jobs, either due to shutdown or manual, should never fire a chain reaction action (and now they do not).

- Version 0.8.30 [`943b667`](https://github.com/jhuckaby/Cronicle/commit/943b667e08ddb3053f4d77199326d815a081a601)

#### [v0.8.29](https://github.com/jhuckaby/Cronicle/compare/v0.8.28...v0.8.29)

> 27 May 2019

- Should fix #182.

- Fixed date handling in Time Machine text field when custom timezones are involved [`db65f93`](https://github.com/jhuckaby/Cronicle/commit/db65f93e10e3dc61c551f2bf9d662f3025a29199)
- Version 0.8.29 [`e13a3a8`](https://github.com/jhuckaby/Cronicle/commit/e13a3a896724094572b9624cd7e30fa0b00a651b)
- Fixed security issue where hashed user password and salt were getting logged. [`5e1797a`](https://github.com/jhuckaby/Cronicle/commit/5e1797a6a3053f794accb69506e837aaf0bfbac6)

#### [v0.8.28](https://github.com/jhuckaby/Cronicle/compare/v0.8.27...v0.8.28)

> 4 September 2018

Fixes #112 - Cronicle crash on a simple stress test

- Version 0.8.28 [`478e752`](https://github.com/jhuckaby/Cronicle/commit/478e752773fb61a61ad5e0da0a1f26ec638e1cda)

#### [v0.8.27](https://github.com/jhuckaby/Cronicle/compare/v0.8.26...v0.8.27)

> 2 September 2018

Now emitting a warning on startup for Node v10.0 to v10.8, due to the core timer bug: https://github.com/nodejs/node/issues/22149
Updated timer bug warning in README.
Bumped pixl-server version to 1.0.16 for more verbose startup log entry.

- Version 0.8.27 [`8c59536`](https://github.com/jhuckaby/Cronicle/commit/8c595367650ad61d13733ce967dcce14cecb293c)
- Added notice about Node.js v10 bug. [`e312471`](https://github.com/jhuckaby/Cronicle/commit/e31247113ecb08af536b4055cfc7253fd7c72891)

#### [v0.8.26](https://github.com/jhuckaby/Cronicle/compare/v0.8.25...v0.8.26)

> 28 August 2018

Reversed course on new /api/app/status API call.  It no longer causes a server restart on a tick age issue (i.e. broken timer).
It now only logs a level 1 alert, and safely returns an API response.  Server restarts should only be handled by an external monitoring tool.

This tick age thing is an ongoing investigation into a very strange situtation, seen after about 20 days of continuous running on Linux CentOS 7.2,
Node v10.6.0 and AWS (S3) storage backend.  Seemingly at random (but on multiple servers at the same time), all the Node.js timers and intervals
seem to cease firing, but all other actions triggered by sockets or child processes keep running.  The server has to be restarted, sometimes SIGKILLed.
CPU and memory are both fine.

I'm currently dumbfounded as to what could cause such a thing.

- Version 0.8.26 [`8d0282c`](https://github.com/jhuckaby/Cronicle/commit/8d0282cd1b5c3ce11ded5d35ee4cf941e28ebfc6)

#### [v0.8.25](https://github.com/jhuckaby/Cronicle/compare/v0.8.24...v0.8.25)

> 27 August 2018

Removed old garbage collection hack (was from the Node v0.12 days).
Added new api_status call for monitoring purposes.
Disable UDP broadcast server if port is zero or false.
Now keeping track of tick age (exposed in api_status).
If tick age is over 60 and status API is invoked, server will self-restart (should never happen).
Improved logging for crashes and emergency shutdowns.
Added PID log column by default.
Bumped pixl-server version to v1.0.15.

- Version 0.8.25 [`68086a3`](https://github.com/jhuckaby/Cronicle/commit/68086a3f629b5622afca76d894f2689baa188ff1)

#### [v0.8.24](https://github.com/jhuckaby/Cronicle/compare/v0.8.23...v0.8.24)

> 16 August 2018

Bumped pixl-server-storage version to 2.0.9 to pick up Couchbase bug fixes.
Should fix #101

- Version 0.8.24 [`fe375aa`](https://github.com/jhuckaby/Cronicle/commit/fe375aacd2393cba2af29d55ea59f411d688d12d)

#### [v0.8.23](https://github.com/jhuckaby/Cronicle/compare/v0.8.22...v0.8.23)

> 14 August 2018

Now allowing environment variables to override command-line arguments as well as configuration properties.
Bumped dependency versions for some pixl-* modules.

- Version 0.8.23 [`5d52469`](https://github.com/jhuckaby/Cronicle/commit/5d52469c721809d42d60700a04f0d2872319dec9)

#### [v0.8.22](https://github.com/jhuckaby/Cronicle/compare/v0.8.21...v0.8.22)

> 12 August 2018

Support for restricting users to specific categories only.
Better visual hinting for "Schedule Enabled" when user doesn't have access to click it.
Better visual hinting for disabled categories and plugins.
UI controls for creating, copying and running events are hidden if user doesn't have access.
Disable browser spellcheck on password fields.

- Support for restricting users to specific categories only. [`93c0528`](https://github.com/jhuckaby/Cronicle/commit/93c052885e92bce1fa251d62ff92f15b76351b22)
- Support for category-limited users. [`7e6ebd2`](https://github.com/jhuckaby/Cronicle/commit/7e6ebd2d86701a7ebad87a03a36b8a3dd0282d50)
- Support for restricting users to specific categories only. [`f602a41`](https://github.com/jhuckaby/Cronicle/commit/f602a414dcbbb46776bb53cc481df3542f74372e)
- UI controls for creating, copying and running events are hidden if user doesn't have access. [`a2bafd4`](https://github.com/jhuckaby/Cronicle/commit/a2bafd4292038ce6520d6e1073d46cd16bb44144)
- Support for restricting users to specific categories only. [`a45b6bc`](https://github.com/jhuckaby/Cronicle/commit/a45b6bc1eb2e219f106b9152f8bcfd3b46611923)
- Split out findJob() from updateJob() [`82baeb5`](https://github.com/jhuckaby/Cronicle/commit/82baeb56cc696722b475f4fe379e051ce54796ef)
- User Category Privilege Checkbox Label Augmentation [`b68f876`](https://github.com/jhuckaby/Cronicle/commit/b68f87661d0e8b2ab4745b1d4a09122ce2e9d3f5)
- Support for restricting users to specific categories only. [`7a299a5`](https://github.com/jhuckaby/Cronicle/commit/7a299a52137c9e0208e5f5159fd57026830e2ed2)
- Support for restricting users to specific categories only. [`434ba3b`](https://github.com/jhuckaby/Cronicle/commit/434ba3b95a68421e0462eb80d3788b31d06d5bda)
- Better visual hinting for disabled categories and plugins. [`960b609`](https://github.com/jhuckaby/Cronicle/commit/960b609fc2743d565da0e9c763754044e3c52714)
- Disable browser spellcheck on password fields. [`8676055`](https://github.com/jhuckaby/Cronicle/commit/8676055d7f0c360a20ac0f863ec6637def878b6b)
- Version 0.8.22 [`bd10964`](https://github.com/jhuckaby/Cronicle/commit/bd1096463bde3391c2b72ae3d3ef13da02734056)

#### [v0.8.21](https://github.com/jhuckaby/Cronicle/compare/v0.8.20...v0.8.21)

> 9 August 2018

Password fields now default to hidden, but can be togged back to visible.
Default password state can be configured in config.json file.
Password state is also saved in localStorage, if user toggles Hide/Show.

- Version 0.8.21 [`de0a77b`](https://github.com/jhuckaby/Cronicle/commit/de0a77b81a23d5eb15aa7b0db76d8bf600667a52)
- Icon change for chained events [`0dd287e`](https://github.com/jhuckaby/Cronicle/commit/0dd287e59adf699dc840eb44c56bb65bc53a0882)
- Updated TOC [`95ff795`](https://github.com/jhuckaby/Cronicle/commit/95ff795c9818d5d291a2730872fcecd1d5e7816b)

#### [v0.8.20](https://github.com/jhuckaby/Cronicle/compare/v0.8.19...v0.8.20)

> 8 August 2018

Added `uncatch` module.
Bumped `pixl-tools` to v1.0.18 (for sub()).
Bumped `pixl-server-web` to v1.1.7 for various bug fixes.

- New web hook text system. [`e375cca`](https://github.com/jhuckaby/Cronicle/commit/e375ccac5a24ab7e012c2f81dfb76060374f7035)
- Updated job_launch_failure web hook to use new system. [`4116950`](https://github.com/jhuckaby/Cronicle/commit/411695090bde1d419d9cbe2dd4b7391aa964858b)
- Added "Copy Event" feature. [`94a5d3a`](https://github.com/jhuckaby/Cronicle/commit/94a5d3a82555e1770068c84b4701ea6c061011ec)
- Updated docs for new web hook features. [`4d54391`](https://github.com/jhuckaby/Cronicle/commit/4d543913b5034d815290034aa394ded00af09321)
- Changed behavior of "Copy Plugin" [`6b177c6`](https://github.com/jhuckaby/Cronicle/commit/6b177c64c1249b6e85a4cf106e58ec99ce06045b)
- Added uncatch and defaultWebHookTextTemplates. [`204cdf2`](https://github.com/jhuckaby/Cronicle/commit/204cdf25a57079db9d9c4966dacc26a005ca2498)
- Version 0.8.20 [`df8076a`](https://github.com/jhuckaby/Cronicle/commit/df8076a70d70016940bbf210cfeeb3be814df1b2)
- Added default `web_hook_text_templates` values. [`4ad111e`](https://github.com/jhuckaby/Cronicle/commit/4ad111ec81a7a752c2266608883d5492cb8bf1dd)
- Fixes #86 [`119ecda`](https://github.com/jhuckaby/Cronicle/commit/119ecda44eb1bc91c16140b24460337272d83b55)

#### [v0.8.19](https://github.com/jhuckaby/Cronicle/compare/v0.8.18...v0.8.19)

> 2 August 2018

Fixed potential confusion in Shell Plugin where plain integers on their own line in STDOUT were being interpreted as progress percentages.  Now a hard `%` symbol is required.  Should fix #90.
No longer allowing user to delete final Master Eligible server group (would send application into frozen state).
Downgraded noisy error into debug message, which can happen naturally if a user jumps to view a live job that has just completed.
Disabled spell check on Server Group Hostname Match field.

- Version 0.8.19 [`3b1f6b3`](https://github.com/jhuckaby/Cronicle/commit/3b1f6b3822c9637b8b6809a56029866341281e65)

#### [v0.8.18](https://github.com/jhuckaby/Cronicle/compare/v0.8.17...v0.8.18)

> 1 August 2018

Fixed bug where a malformed group regular expression could crash the server.
See issue #88

- Version 0.8.18 [`7e42ece`](https://github.com/jhuckaby/Cronicle/commit/7e42ece81e07407c07e9db5f79b543755e5adf45)
- Fix #85 [`e3c0cbe`](https://github.com/jhuckaby/Cronicle/commit/e3c0cbefc6cb9e1172f34d91de3892ed13c38821)
- Fixed TOC [`0581199`](https://github.com/jhuckaby/Cronicle/commit/05811990ceea83a93afdd35b5f3d985760e60738)

#### [v0.8.17](https://github.com/jhuckaby/Cronicle/compare/v0.8.16...v0.8.17)

> 26 July 2018

- Added docs for `socket_io_transports` config prop. [`9434342`](https://github.com/jhuckaby/Cronicle/commit/94343427aff5a229cd2e3f6801d0bd6c4f24ecbe)
- Added support for `socket_io_transports`. [`2b9f312`](https://github.com/jhuckaby/Cronicle/commit/2b9f31200891b84d5ab10ba130e81a9263bca4d1)
- Version 0.8.17 [`fb385d9`](https://github.com/jhuckaby/Cronicle/commit/fb385d9bbdaf0e9782f11b2b046becf13f185b44)
- Bumped max events to 10K, as 1K was chopping reasonably sized schedules. [`143e0bd`](https://github.com/jhuckaby/Cronicle/commit/143e0bd5122e3c8fcaae8179aed6cd91bdb834e9)

#### [v0.8.16](https://github.com/jhuckaby/Cronicle/compare/v0.8.15...v0.8.16)

> 20 July 2018

Bumped pixl-server-web to v1.1.5, which includes fix for #81.

- Version 0.8.16 [`6f40082`](https://github.com/jhuckaby/Cronicle/commit/6f40082a30ce4bab1d7ef0a935fa17cecf04f498)

#### [v0.8.15](https://github.com/jhuckaby/Cronicle/compare/v0.8.14...v0.8.15)

> 17 July 2018

- Get rid of perl dependencies in scripts [`#77`](https://github.com/jhuckaby/Cronicle/pull/77)
- Misc changes to CLI [`0218d66`](https://github.com/jhuckaby/Cronicle/commit/0218d66b18bb46d8278ac700ccd6cc12999fb704)
- Remove perl snippets from control.sh and debug.sh scripts [`e38c591`](https://github.com/jhuckaby/Cronicle/commit/e38c5912beee3278fa5a954a13eb38952e088c60)
- Version 0.8.15 [`06e155f`](https://github.com/jhuckaby/Cronicle/commit/06e155f5a3de7708db0435144fda5f249ba55249)

#### [v0.8.14](https://github.com/jhuckaby/Cronicle/compare/v0.8.13...v0.8.14)

> 15 July 2018

Improved error messages and user feedback on Job Details page (live job log watcher).

- Version 0.8.14 [`d4764b0`](https://github.com/jhuckaby/Cronicle/commit/d4764b0e0ff8f4d98d924ca8f9ca9500c97a797d)

#### [v0.8.13](https://github.com/jhuckaby/Cronicle/compare/v0.8.12...v0.8.13)

> 15 July 2018

In header, and in scroll overlay widget.
No longer showing date (makes it too wide).

- Added new `web_direct_connect` property. [`bbbcbe4`](https://github.com/jhuckaby/Cronicle/commit/bbbcbe4265bd5a0d32cac51478cf50de3dcbf9cb)
- Added docs for `web_direct_connect`. [`006084c`](https://github.com/jhuckaby/Cronicle/commit/006084c5bd3ab140cc7ce87f03f4931c21a60c49)
- Support for new `web_direct_connect` feature. [`75c2bcc`](https://github.com/jhuckaby/Cronicle/commit/75c2bcc8f9eab65f2e758970a87c6b9116a53f1e)
- Now showing number of active jobs along with time. [`61efff5`](https://github.com/jhuckaby/Cronicle/commit/61efff5f535c90423bfc5ef35ded1c46573a4641)
- Rejiggered to remove pagination, show all API keys, sort by title. [`bc45389`](https://github.com/jhuckaby/Cronicle/commit/bc4538913fd3a0cb44783d50cba2c73a0d2d0501)
- Added max run time of 3 seconds, will abort calc if exceeded. [`9027fa6`](https://github.com/jhuckaby/Cronicle/commit/9027fa6d3e6ce4564b77ce623b63e52ece92fffc)
- Version 0.8.13 [`2369d8a`](https://github.com/jhuckaby/Cronicle/commit/2369d8a11d003eb626ba7597015ee7f91000ca9b)
- Made clock scroll overlay thinner [`564f444`](https://github.com/jhuckaby/Cronicle/commit/564f444ea0fbadaf7771e031086e4f7490ba0e23)
- Updated copyright year. [`78e30e3`](https://github.com/jhuckaby/Cronicle/commit/78e30e3d1d3a985ba86b0f9fe770bcf589a60b07)
- api_get_api_keys now returns ALL keys (no pagination) [`3334b30`](https://github.com/jhuckaby/Cronicle/commit/3334b305c3ab1e860351e0dde9d433d1048ee23e)
- Added clock icon to time display in header [`f721498`](https://github.com/jhuckaby/Cronicle/commit/f721498a097cda7b10f958e89b58e9c5df5c8237)
- Now including `web_direct_connect` in config API response. [`a57ebf3`](https://github.com/jhuckaby/Cronicle/commit/a57ebf39e9034e34f38ce12e242a6bf26dfbc87d)

#### [v0.8.12](https://github.com/jhuckaby/Cronicle/compare/v0.8.11...v0.8.12)

> 14 July 2018

- Added new HTTP Request Plugin docs [`e904092`](https://github.com/jhuckaby/Cronicle/commit/e9040927310e946b583d531abd9463f05af51855)
- Support for chain_data [`bcf1cdc`](https://github.com/jhuckaby/Cronicle/commit/bcf1cdc44ea50796d049e522df645ef71a725370)
- Version 0.8.12 [`80189b3`](https://github.com/jhuckaby/Cronicle/commit/80189b37f5da6fa797146d623ac1ed9731cfa3ab)
- Added SSL Cert Bypass option to HTTP Request Plugin [`0397bfc`](https://github.com/jhuckaby/Cronicle/commit/0397bfcb978d503ec291201e965d1c5a1f0b0329)
- Updated TOC [`fca9357`](https://github.com/jhuckaby/Cronicle/commit/fca935737009f4307dba46ac968b40d0c6422ba0)
- No longer logging all storage event types (too noisy) [`f9d5fa4`](https://github.com/jhuckaby/Cronicle/commit/f9d5fa484e9e09d5cce77d912a9271ae86d5aa14)
- Fixed potential bug where "ley" variable wasn't defined. [`31335a8`](https://github.com/jhuckaby/Cronicle/commit/31335a8f62cc97f91be7b13ccf9eb20257e0666c)

#### [v0.8.11](https://github.com/jhuckaby/Cronicle/compare/v0.8.10...v0.8.11)

> 10 July 2018

- Fixes #74 [`c5c96c5`](https://github.com/jhuckaby/Cronicle/commit/c5c96c521791694d5418b99ecb1148844856d0fb)

#### [v0.8.10](https://github.com/jhuckaby/Cronicle/compare/v0.8.9...v0.8.10)

> 8 July 2018

The watchJobLog (follow live job log) API wasn't checking the user's Session ID.
Also, now emitting visual errors if the watchJobLog socket fails to connect (direct server connection).

- Version 0.8.10: Security Patch: Session ID check on watchJobLog [`72624a8`](https://github.com/jhuckaby/Cronicle/commit/72624a84e7d5a9261b9f9ee840a0aa70c38752af)
- Added new section on Cron Noncompliance [`3965d3c`](https://github.com/jhuckaby/Cronicle/commit/3965d3c15dda3fb04b765bdceb3b8cfe89d60120)

#### [v0.8.9](https://github.com/jhuckaby/Cronicle/compare/v0.8.8...v0.8.9)

> 6 July 2018

Added support for custom maint record types (for running maint on custom days).
Home UI Worker: Max ceiling of 1000 simulated future jobs.
Added `track_manual_jobs` (default false) so manual jobs won't be added to activity log.
Now only setting one record expiration per job, and using a custom record type to delete both the job metadata and job log gzip.
Bumped pixl-server-storage version to 2.0.7 (for custom record types and efficient storage expiration).
Docs: Added recommended AWS settings for retries, clock skew and others to storage migration sample config.

- Version 0.8.9 [`ec700f0`](https://github.com/jhuckaby/Cronicle/commit/ec700f0d04b12698b05baa0e16f1aa10cd22938b)

#### [v0.8.8](https://github.com/jhuckaby/Cronicle/compare/v0.8.7...v0.8.8)

> 6 July 2018

Added optional "Burn Memory/CPU" option to Test Plugin.
Test Plugin now accepts a range of durations (picks random).
Add Storage transaction logging to default configuration.
Removed deprecated calls to `new Buffer()`.

- Version 0.8.8 [`99bda9b`](https://github.com/jhuckaby/Cronicle/commit/99bda9be44d37110ba2068ed16dd6cb259518cae)

#### [v0.8.7](https://github.com/jhuckaby/Cronicle/compare/v0.8.6...v0.8.7)

> 4 July 2018

Now including running job information for the get_event API.
Added recommended AWS S3 httpOptions (timeouts).
Updated table of contents in README.

- Version 0.8.7 [`6a72b31`](https://github.com/jhuckaby/Cronicle/commit/6a72b311f98433d72bdf7d7da690381276f8f565)
- Misc changes for 0.8.7 [`b723624`](https://github.com/jhuckaby/Cronicle/commit/b723624f74be44482c361cfbadefb9630cc29985)
- Workaround for bizarre issue #70 [`228b6b3`](https://github.com/jhuckaby/Cronicle/commit/228b6b32a993455bdcada486368e10b62c1958ab)
- Misc cleanup items. [`2c34a56`](https://github.com/jhuckaby/Cronicle/commit/2c34a56cbe59c19736685c497ef61fff1354bc7a)
- Fixed #66 -- thanks @dropthemic [`70444c2`](https://github.com/jhuckaby/Cronicle/commit/70444c27c1b1fa51bbccfe6a1819aa5651314640)

#### [v0.8.6](https://github.com/jhuckaby/Cronicle/compare/v0.8.5...v0.8.6)

> 30 May 2018

Fixed issue with storage migration script, where `--dryrun` mode was causing streams to stack up and eventually crash with EMFILE: too many open files.

- Version 0.8.6 [`06a6e6c`](https://github.com/jhuckaby/Cronicle/commit/06a6e6c4e6313c59cec6d434fe5d1104e6ca3c72)

#### [v0.8.5](https://github.com/jhuckaby/Cronicle/compare/v0.8.4...v0.8.5)

> 29 May 2018

Updated dependencies, particularly to force an update on pixl-cli, which was broken due to an update of chalk.

- Updated TOC in README.md. [`16a61ef`](https://github.com/jhuckaby/Cronicle/commit/16a61ef98eed479f4eeaee651803eb7e42a686f8)
- Version 0.8.5 [`e13b8fc`](https://github.com/jhuckaby/Cronicle/commit/e13b8fcbdf8c2b64878a734f19a55d20f8473d31)
- Added one decimal of precision to memory pies (avg). [`01d71a3`](https://github.com/jhuckaby/Cronicle/commit/01d71a33544ef81e57f2f1b8400375a384140777)

#### [v0.8.4](https://github.com/jhuckaby/Cronicle/compare/v0.8.3...v0.8.4)

> 13 May 2018

New storage migration script.
Upgrade to pixl-server-storage v2.0.1+ for AWS S3 keyTemplate and fileExtensions.
Misc other fixes.

- New storage migration script. [`1901573`](https://github.com/jhuckaby/Cronicle/commit/190157324fb1e67e4d2d1879e6e1a51ac2ff4307)
- Version 0.8.4 [`1d92600`](https://github.com/jhuckaby/Cronicle/commit/1d92600337986980f8f133a96b2bba778089eedb)
- Fixed two instances of calling fs.close() without a callback. [`e51178b`](https://github.com/jhuckaby/Cronicle/commit/e51178b481d853332908fc7b08c59ad7fa6cc025)
- Added `--trace-warnings` to CLI [`6c2b1ca`](https://github.com/jhuckaby/Cronicle/commit/6c2b1cac6fea0a2c569cc7e55a6b32dafba982c6)

#### [v0.8.3](https://github.com/jhuckaby/Cronicle/compare/v0.8.2...v0.8.3)

> 15 April 2018

Support for "on-demand" events that have no scheduled run times, but support Run Now and API jobs.
Upgraded jQuery to v3.
Upgraded MomentJS to v2.22.

- Version 0.8.3 [`d8eb19b`](https://github.com/jhuckaby/Cronicle/commit/d8eb19b77c81da13889eb87cc7677470a4c9af7d)

#### [v0.8.2](https://github.com/jhuckaby/Cronicle/compare/v0.8.1...v0.8.2)

> 9 March 2018

Dependency update of pixl-server-user to v1.0.8 should fix #57
Misc UI fix on History page (erroneous display of "All items were deleted on this page." message).

- Version 0.8.2 [`ecefe5c`](https://github.com/jhuckaby/Cronicle/commit/ecefe5c468b01e551e6aa3831b035150308f10a1)

#### [v0.8.1](https://github.com/jhuckaby/Cronicle/compare/v0.8.0...v0.8.1)

> 15 February 2018

Tweaked some Chart.js settings on history/stats page, to disable animation, fix y axis labels, and fix tooltip positions.

- Version 0.8.1 [`a10b9d2`](https://github.com/jhuckaby/Cronicle/commit/a10b9d24ccea4a79b1660a7b06766b9ba40cb98e)

#### [v0.8.0](https://github.com/jhuckaby/Cronicle/compare/v0.7.8...v0.8.0)

> 13 February 2018

Event queue!
Bumped async to v2.6.0.

- Support for event queue. [`910dbac`](https://github.com/jhuckaby/Cronicle/commit/910dbac30fe332c47cc0a671d6c57c6b73d7529c)
- Support for event queue. [`f52cd9d`](https://github.com/jhuckaby/Cronicle/commit/f52cd9d958f0dfa9fa53b41c68c3d040b0e03716)
- Changes for event queue. [`be4e5ca`](https://github.com/jhuckaby/Cronicle/commit/be4e5ca8107cf4e2d9d4c6163424b366de67bff4)
- Support for event queue. [`70cc91f`](https://github.com/jhuckaby/Cronicle/commit/70cc91f4cebb345a1c85044108c9132a41b9a4b1)
- Support for event queue. [`e193f9f`](https://github.com/jhuckaby/Cronicle/commit/e193f9f9e30c94656088358f54bbb4e7caa61279)
- Support for event queue. [`8be3de8`](https://github.com/jhuckaby/Cronicle/commit/8be3de8e3baf75fce7b2137f13d49c32b4e8c12b)
- Dialog keyboard tweaks (new pixl-webapp release). [`f7f610a`](https://github.com/jhuckaby/Cronicle/commit/f7f610af5d2feaa6428763eb501d19921bf299e3)
- Chrome hack to align checkbox labels (sigh). [`6cd2a28`](https://github.com/jhuckaby/Cronicle/commit/6cd2a284818407ae67e05a22b04d44f3d75c6fc6)
- Updated copyright year, dependencies, etc. [`2d01f20`](https://github.com/jhuckaby/Cronicle/commit/2d01f2019a4876a2ca4a1abab529d5f5691ebcd8)
- Version 0.8.0 [`2b6767e`](https://github.com/jhuckaby/Cronicle/commit/2b6767e60e0e3de0c9fdfbc26956f24db5cba2f0)
- Fixed bug where Unicode symbols would not display properly on completed job logs. [`1330ca9`](https://github.com/jhuckaby/Cronicle/commit/1330ca9cd83bdf11d79301e7ebcb4285b420e470)
- Added 'queue_max' of 1000 to new event template. [`a4b4b36`](https://github.com/jhuckaby/Cronicle/commit/a4b4b367f6707c82f309479aaf06dd6b69549435)
- Support for event queue. [`5ced2a2`](https://github.com/jhuckaby/Cronicle/commit/5ced2a234959438f4703b76202b1f24e3150f8b7)
- New event data params to validate (event queue, chain_error). [`57a19f5`](https://github.com/jhuckaby/Cronicle/commit/57a19f5b5c0703a2ccac75d0357fff19a0c4b581)
- Updated copyright year. [`c2c9ce0`](https://github.com/jhuckaby/Cronicle/commit/c2c9ce044119bca3c9647cbb39ec657febfbfa34)
- Updated copyright year. [`ff3b05a`](https://github.com/jhuckaby/Cronicle/commit/ff3b05ad48e5409e7bc60a2043678e6e35cf9dcf)
- Support for event queue. [`150d096`](https://github.com/jhuckaby/Cronicle/commit/150d096ec25317e4d3d9b6c321499c5938afe22a)

#### [v0.7.8](https://github.com/jhuckaby/Cronicle/compare/v0.7.7...v0.7.8)

> 13 January 2018

Upgrade to chart.js 2.7.1
Removal of d3 and c3 dependencies

- Version 0.7.8 [`4db2fe3`](https://github.com/jhuckaby/Cronicle/commit/4db2fe30ffea811f3e48bdc95c848615abc9b94b)
- Fixed cosmetic bug when event error descriptions contain HTML or multi-line text. [`2ed733b`](https://github.com/jhuckaby/Cronicle/commit/2ed733b6d8119a23587028bac374c6de452cd79a)

#### [v0.7.7](https://github.com/jhuckaby/Cronicle/compare/v0.7.6...v0.7.7)

> 7 January 2018

Prevent crash when restarting service with detached jobs that were still running, but the jobs complete in the interim, but they also exceed their max time.

- Version 0.7.7 [`864b8cd`](https://github.com/jhuckaby/Cronicle/commit/864b8cdda82786f27b81eefbccf82792cef0a0d6)
- Added blurb about the new keyPrefix prop in S3/Couchbase. [`bdb6868`](https://github.com/jhuckaby/Cronicle/commit/bdb6868dcf80f695ca5129f53b9021a0bff71b7e)

#### [v0.7.6](https://github.com/jhuckaby/Cronicle/compare/v0.7.5...v0.7.6)

> 16 December 2017

- Added blurb for using local sendmail with pixl-mail. [`5277c17`](https://github.com/jhuckaby/Cronicle/commit/5277c17490a6678b6537cb79a5614553030afe02)
- Fix random errors when deleting jobs. [`1fb14ec`](https://github.com/jhuckaby/Cronicle/commit/1fb14ec0bb1844e9452578d04d5efadd85751d74)
- Attempt to fix #45 [`a05ed7e`](https://github.com/jhuckaby/Cronicle/commit/a05ed7edd3f6313f3699c89c0c3905358f4d5560)
- Version 0.7.6 [`6a0b443`](https://github.com/jhuckaby/Cronicle/commit/6a0b4430659787fddac0b45e0d8416695c3a2e52)
- Fix issue with removing then re-adding same server quickly [`01998dd`](https://github.com/jhuckaby/Cronicle/commit/01998dde9800e864bf9899894a86a7ffba41894d)

#### [v0.7.5](https://github.com/jhuckaby/Cronicle/compare/v0.7.4...v0.7.5)

> 25 November 2017

- Initial implementation of delete job [`e8e8aee`](https://github.com/jhuckaby/Cronicle/commit/e8e8aeef7263b8b2b0f37b46276bae87c423ad29)
- New Feature: Specify separate chain reaction events for success and failure. [`216d5d7`](https://github.com/jhuckaby/Cronicle/commit/216d5d71ddac32a37d01110a30a2bd37d1f8b40f)
- Copying all top-level job keys into child environment. [`aad5e72`](https://github.com/jhuckaby/Cronicle/commit/aad5e72eb56944fce17c912be72d86cd63a3bd01)
- Cosmetic fixes for smaller windows. [`06f90de`](https://github.com/jhuckaby/Cronicle/commit/06f90deb8555449e0befe33628584185537094dc)
- Improved upgrade process. [`65769a9`](https://github.com/jhuckaby/Cronicle/commit/65769a9cb24a1bb660f301d7ad4f256fe8ebc9a7)
- Added `version` command-line argument. [`b52be49`](https://github.com/jhuckaby/Cronicle/commit/b52be49535ddb4dff853bc14f925e384fcbf960d)
- Fixed some textarea resize issues. [`42868d8`](https://github.com/jhuckaby/Cronicle/commit/42868d821269dcada4a411926f4c5e862cd521b3)
- New Shell Plugin Option [`7ff6ead`](https://github.com/jhuckaby/Cronicle/commit/7ff6eaddf8da902cde4509170bf3cb9faf5ac033)
- Renamed web_hook_ssl_cert_bypass to ssl_cert_bypass. [`ae42f69`](https://github.com/jhuckaby/Cronicle/commit/ae42f69b14a15fd0d5bc9e09115c5e044c113b9d)
- Fixed bug where scrolling clock wouldn't appear in Chrome/Firefox. [`cae9711`](https://github.com/jhuckaby/Cronicle/commit/cae9711d87f1bbe803651f63b4403229777721e5)
- Version 0.7.5 [`fdb6970`](https://github.com/jhuckaby/Cronicle/commit/fdb697048cbaab7809db7915c9afa7324cc6d069)
- Schedule UI Tweaks [`3b24ec4`](https://github.com/jhuckaby/Cronicle/commit/3b24ec43a1fcfbd723eeb310464f2d602d9cdb73)

#### [v0.7.4](https://github.com/jhuckaby/Cronicle/compare/v0.7.3...v0.7.4)

> 9 November 2017

Fixes for Node 7+ and deprecation warnings on fs methods.
Fixes issue #38

- Version 0.7.4 [`806e04c`](https://github.com/jhuckaby/Cronicle/commit/806e04cb7a6d624083499b77bf5d56e02c3ec52e)

#### [v0.7.3](https://github.com/jhuckaby/Cronicle/compare/v0.7.2...v0.7.3)

> 2 November 2017

API Keys can now be manually entered and edited in the UI.
The `get_event` and `run_event` APIs now accept title as well as ID.
The `run_event` API now works with HTTP GET.
Fixed a CSS bug where rapidly clicking links would select them.
Updated docs and tests.

- Version 0.7.3 [`ebba15e`](https://github.com/jhuckaby/Cronicle/commit/ebba15ecf300bb37f94cd86cc2af93573b76afca)

#### [v0.7.2](https://github.com/jhuckaby/Cronicle/compare/v0.7.1...v0.7.2)

> 3 October 2017

Fixed intermittent race condition crash on UI home screen.
Quiet some verbose installer logging junk.

- Version 0.7.2 [`f496834`](https://github.com/jhuckaby/Cronicle/commit/f496834c00cbd7ce834bceac5953f47b1988fa12)

#### [v0.7.1](https://github.com/jhuckaby/Cronicle/compare/v0.7.0...v0.7.1)

> 25 August 2017

Added category color to Home tab.
Both upcoming and active jobs.

- Version 0.7.1 [`033b84d`](https://github.com/jhuckaby/Cronicle/commit/033b84d34627d36a4516758a3064ed2bf6099754)

#### [v0.7.0](https://github.com/jhuckaby/Cronicle/compare/v0.6.16...v0.7.0)

> 25 August 2017

- New standard Plugin for making HTTP requests. [`dcdffc6`](https://github.com/jhuckaby/Cronicle/commit/dcdffc6141ed9c575769a0edce5b1c23d57fb9a6)
- Much improved handling of detached jobs on Cronicle restart / upgrade. [`d7848f2`](https://github.com/jhuckaby/Cronicle/commit/d7848f24799c5ed91fec401c96af1b2916c75026)
- Version 0.6.17 [`17c7d67`](https://github.com/jhuckaby/Cronicle/commit/17c7d6767fe9d4ca59c4571991cad09b78edb1d8)
- Now always calling Tools.getpwnam() for user info on job launch. [`6dcb06b`](https://github.com/jhuckaby/Cronicle/commit/6dcb06b29a8bbb9122bc45ae6a4fdd9a1110804c)
- Improvements to logging and error handling. [`26a8175`](https://github.com/jhuckaby/Cronicle/commit/26a81752a31b2e20a1b07593c1a040b845016d28)
- Added new HTTP Request Plugin into standard install set. [`67bd958`](https://github.com/jhuckaby/Cronicle/commit/67bd95887fef674fb77836ee3a5f0c6e4b04bdfc)
- Increment stats.jobs_failed when a job fails to launch (server unavailable, etc.). [`456ba46`](https://github.com/jhuckaby/Cronicle/commit/456ba468480437f8f52a64ab466ad4a23ae4fa73)
- Updated dead_job_timeout, added more details. [`c7605c6`](https://github.com/jhuckaby/Cronicle/commit/c7605c643ae7f44dc0ba5b39aee436e241221c2b)
- Added annotate (timestamp) checkbox to standard Shell Plugin. [`2c58301`](https://github.com/jhuckaby/Cronicle/commit/2c58301fd3d62147aad1292f9d6a00f090ea6abf)
- Fixed elapsed time for detached jobs. [`8ed0712`](https://github.com/jhuckaby/Cronicle/commit/8ed0712785d702e01d40d5e45d8bcdab30642058)
- Version 0.7.0 [`40dfa7f`](https://github.com/jhuckaby/Cronicle/commit/40dfa7f4121903bad20021b0d6d8d76ce47ded24)
- Disabled uglify for now. [`e760396`](https://github.com/jhuckaby/Cronicle/commit/e760396b0873396de1beac79f1ce2f39e896aa06)
- Increased default dead_job_timeout to 120 seconds. [`9e0563f`](https://github.com/jhuckaby/Cronicle/commit/9e0563f3bf8d76b1c26fdfb83ec18d8cf007ac02)

#### [v0.6.16](https://github.com/jhuckaby/Cronicle/compare/v0.6.15...v0.6.16)

> 11 June 2017

- Fixed race condition when navigating to JobDetails page just after starting a manual job on a remote server. [`375bafb`](https://github.com/jhuckaby/Cronicle/commit/375bafbdbbdd293441d53c8b7ca4023f57b0b86d)
- Fixed bug where server_comm_use_hostnames was not being honored for fetching job log files, and for pinging slaves during a master failover event. [`dcc5bb2`](https://github.com/jhuckaby/Cronicle/commit/dcc5bb2214b2fe4d5f7e6f046752e4f29e263858)
- Fixed crasher bug where variable was getting replaced with undefined in a chain reaction error. [`b74bf7f`](https://github.com/jhuckaby/Cronicle/commit/b74bf7ff7f5428969952cf3f2550791f25cdfbfd)
- Version 0.6.16 [`78642c0`](https://github.com/jhuckaby/Cronicle/commit/78642c01c55cf1e53c639a2d1011ac320fe7a291)

#### [v0.6.15](https://github.com/jhuckaby/Cronicle/compare/v0.6.14...v0.6.15)

> 7 May 2017

Now preserving deleted event, category and plugin titles on "Completed" page.
Fixes #28

- Fixed code indentations. [`218c68d`](https://github.com/jhuckaby/Cronicle/commit/218c68df570f42b61d0f4f3724858df4f15183bc)
- Version 0.6.15 [`51bce3c`](https://github.com/jhuckaby/Cronicle/commit/51bce3c56dd8de5624dfa0f8faf2f7071594c12d)
- Capitalization fix. [`c40fd22`](https://github.com/jhuckaby/Cronicle/commit/c40fd2270085ec6c97a8c0c955a437fd4ec19cff)

#### [v0.6.14](https://github.com/jhuckaby/Cronicle/compare/v0.6.13...v0.6.14)

> 29 April 2017

- Utility method for validating event data, used by create_event, update_event, run_event and update_job APIs [`3fda9ee`](https://github.com/jhuckaby/Cronicle/commit/3fda9ee8c107eaa36f178d156c2d4928f911b243)
- New issue template for GitHub. [`3323fc2`](https://github.com/jhuckaby/Cronicle/commit/3323fc283fd63ab208cc53bf3795cb5257a4af16)
- Support for web_hook_custom_data. [`a36ea1a`](https://github.com/jhuckaby/Cronicle/commit/a36ea1a8d49763209db4e58be3f437c1889dc919)
- Added details for web_hook_custom_data and web_hook_ssl_cert_bypass. [`61df577`](https://github.com/jhuckaby/Cronicle/commit/61df5777c28869ee41f73065ed9c642bf78da99e)
- Now making sure event has a timing element before checking (crash prevention). [`df837e9`](https://github.com/jhuckaby/Cronicle/commit/df837e99f9cb4ac47036bacc6b5007a0caff2cc6)
- Now calling requireValidEventData() for create_event, update_event, run_event and update_job APIs. [`1f79547`](https://github.com/jhuckaby/Cronicle/commit/1f795473bb3443c78f04893ea2cdf2243ddf640c)
- Now logging job completions to the activity log if and only if the job fails. [`30511ee`](https://github.com/jhuckaby/Cronicle/commit/30511ee7b9e84d88f59fb2f752eb7842b6a7ef5f)
- Support for web_hook_ssl_cert_bypass [`410db62`](https://github.com/jhuckaby/Cronicle/commit/410db62c05d18c09ffc7d1d6109fd2e566daed52)
- Fixed unit test that was relying on successful jobs being logged in the activity log (we no longer do that). [`79603b3`](https://github.com/jhuckaby/Cronicle/commit/79603b3a645fcfe085025fb22d51a6146c6596ed)
- Version 0.6.14 [`77379f6`](https://github.com/jhuckaby/Cronicle/commit/77379f6fb006ad21e395c5b7dc421e8ec5a7e558)

#### [v0.6.13](https://github.com/jhuckaby/Cronicle/compare/v0.6.12...v0.6.13)

> 24 April 2017

- Added blurb for new job_env config object. [`49761ad`](https://github.com/jhuckaby/Cronicle/commit/49761ad5c694dd5bdfcaa11b4a832b5e4977bcb5)
- Added support for job_env default environment variables. [`f9ab8c2`](https://github.com/jhuckaby/Cronicle/commit/f9ab8c2b880aa8f60f2fdc25533d19d81ec37f60)
- Support for new server_disable and server_enable activity events. [`b3c8017`](https://github.com/jhuckaby/Cronicle/commit/b3c8017c6b55cb4f3b96ceace8d884e945ddc1db)
- Now logging activity for server disable (lost conn) and server enable (reconnected). [`d0e7ad7`](https://github.com/jhuckaby/Cronicle/commit/d0e7ad76846a6957bbd067a44a8aeeaee73cf4e5)
- Fixes possible bug with least mem / least cpu algorithms, and multiple server groups. [`ca42be4`](https://github.com/jhuckaby/Cronicle/commit/ca42be4ade1980aa9cffcf4a6c5d655fb277775d)
- No longer logging activity for every job completion (is redundant, as they're all listed in the Completed tab). [`b476b7b`](https://github.com/jhuckaby/Cronicle/commit/b476b7ba53c857cfed1e24f278e1bd3185d9c72b)
- Version 0.6.13 [`dc6d9f4`](https://github.com/jhuckaby/Cronicle/commit/dc6d9f425a4169ef4ea32f70f3f2f2d2e6558d5f)
- Added empty job_env object. [`5e19b80`](https://github.com/jhuckaby/Cronicle/commit/5e19b80c78769c755bcd2d51d054bd2811abe1dc)

#### [v0.6.12](https://github.com/jhuckaby/Cronicle/compare/v0.6.11...v0.6.12)

> 9 April 2017

Added 'mail_options' config param, for sending options directly to pixl-mail, such as SMTP auth, SSL, etc.
Fixes #17

- Version 0.6.12 [`ad33c8e`](https://github.com/jhuckaby/Cronicle/commit/ad33c8edab62347b57de5841c0778adaa23b58e3)
- Updated description of detached mode, to reflect the new minute-delayed updates in v0.6.11. [`fd02cb4`](https://github.com/jhuckaby/Cronicle/commit/fd02cb4b6c6b9a9b4e8acb8bee2294f89fbb8131)

#### [v0.6.11](https://github.com/jhuckaby/Cronicle/compare/v0.6.10...v0.6.11)

> 9 March 2017

Randomized detached job update frequency as to not bash the queue directory when multiple detached jobs are running, and also to better catch the minute updates of the daemon.

- Version 0.6.11 [`185db48`](https://github.com/jhuckaby/Cronicle/commit/185db48cf2f0ab73168d98942c4309c9b36a1539)

#### [v0.6.10](https://github.com/jhuckaby/Cronicle/compare/v0.6.9...v0.6.10)

> 8 March 2017

Fixed bug where detached jobs would crash if the job command-line exec contained any arguments (typo).
Progress events emitted by detached jobs are now processed and the UI updated (once per minute).

- Version 0.6.10 [`2312fe1`](https://github.com/jhuckaby/Cronicle/commit/2312fe11dd4d0d07fa8ec146199e31a51ccf4201)
- Silence deprecation warning with Node v7. [`35408ac`](https://github.com/jhuckaby/Cronicle/commit/35408ac3a87fa6eba04c312884c1ce70f1b66cfd)

#### [v0.6.9](https://github.com/jhuckaby/Cronicle/compare/v0.6.8...v0.6.9)

> 17 February 2017

Nightly maintenance scalability: Now chopping lists manually, and not using listSplice(). This is to reduce memory usage for extremely high job traffic installations.
Cosmetic fix in CSS for drop-down menus in Chrome.

- Version 0.6.9 [`313d409`](https://github.com/jhuckaby/Cronicle/commit/313d409ee8729b793c3f45588a9eca133271c42a)

#### [v0.6.8](https://github.com/jhuckaby/Cronicle/compare/v0.6.7...v0.6.8)

> 16 February 2017

New "Error.log" contains all errors (used to be in "Cronicle.log").
New "Transaction.log" contains all transactions (used to be in "Cronicle.log").
More tweaks to socket.io-client to make it more resilient with bad server connections.

- Version 0.6.8 [`60ed518`](https://github.com/jhuckaby/Cronicle/commit/60ed51892f56a3b8d1375fd8f037dcface695208)

#### [v0.6.7](https://github.com/jhuckaby/Cronicle/compare/v0.6.6...v0.6.7)

> 15 February 2017

Fixed bugs in various APIs that expect 'offset' and 'limit'.  These were passed to the storage system as strings (not integers) which caused all manner of havoc.
Fixed bug with CLI storage script and Couchbase back-end (was not closing connections and not exiting).
Removed obsolete 'upgrade_logs' CLI command (was for v0.5 upgrade only).
Fixes #10
Fixes #11

- Version 0.6.7 [`a927e6a`](https://github.com/jhuckaby/Cronicle/commit/a927e6ae5d0bd81bb9a57acbb99b513d9a5ac6d3)

#### [v0.6.6](https://github.com/jhuckaby/Cronicle/compare/v0.6.5...v0.6.6)

> 14 February 2017

- Now properly detecting the absolute path of the control script, so it will work if the user is in the bin directory. [`24a3bc7`](https://github.com/jhuckaby/Cronicle/commit/24a3bc79938941d0959b1f04ea84c31f8c2ea32b)
- Version 0.6.6 [`c643276`](https://github.com/jhuckaby/Cronicle/commit/c6432761a933bacb0e72ed0930d9f47a992fbb79)
- Fixed bug where a plain user (i.e. no privs) could not load the event history or stats pages. [`c5ac985`](https://github.com/jhuckaby/Cronicle/commit/c5ac9850098cf44dd5c967149740980eb3a84656)

#### [v0.6.5](https://github.com/jhuckaby/Cronicle/compare/v0.6.4...v0.6.5)

> 6 February 2017

Fixed bug where "Waiting for master server..." dialog would get stuck if server became a slave.
Updated copyright years.
Small CSS cursor fix on dialog text.

- Version 0.6.5 [`163ee84`](https://github.com/jhuckaby/Cronicle/commit/163ee8429abacbaedb7e8540c653893b0a758735)

#### [v0.6.4](https://github.com/jhuckaby/Cronicle/compare/v0.6.3...v0.6.4)

> 5 January 2017

Now accepting the letter 'H' in Crontab expression imports, which represents a random value but locked to a random seed (event title).  Fixes #6.
Attempt to address weird socket.io client behavior with intermittent connection failures.

- Version 0.6.4. [`f3f98ef`](https://github.com/jhuckaby/Cronicle/commit/f3f98ef0a66fe8c7e4c7013e3dfbf5bf57751a3d)

#### [v0.6.3](https://github.com/jhuckaby/Cronicle/compare/v0.6.2...v0.6.3)

> 3 December 2016

Better summary of repeating time intervals not starting on the :00 minute.
Heard report of errors with auto-discovery and broadcast IP detection, so adding defensive code.
Heard report of errors using Least CPU / Least Memory, so trying to work around potential issues there.

- Version 0.6.3 [`01234c7`](https://github.com/jhuckaby/Cronicle/commit/01234c77f3adabcdd81844dd1d1987100560fbc3)

#### [v0.6.2](https://github.com/jhuckaby/Cronicle/compare/v0.6.1...v0.6.2)

> 26 October 2016

Fixed links to download and view job logs: now using current host, not master server's IP address.

- Version 0.6.2 [`53b1f67`](https://github.com/jhuckaby/Cronicle/commit/53b1f6754c10702f21df6e3778a728b2f2bdd473)

#### [v0.6.1](https://github.com/jhuckaby/Cronicle/compare/v0.6.0...v0.6.1)

> 24 October 2016

For external user login integrations, now forcing API to hit current page hostname vs. master server, so login redirect URL reflects it.
This results in a better experience after logging in (redirects back to correct URL, not an IP address or master server hostname).

- Version 0.6.1 [`27e25b7`](https://github.com/jhuckaby/Cronicle/commit/27e25b7db1caefd73b03c6311d5fb58418421527)

#### [v0.6.0](https://github.com/jhuckaby/Cronicle/compare/v0.5.8...v0.6.0)

> 22 October 2016

New formatting options for Schedule page.  Can now group events by category (default), plugin, target, or a simple flat list.
Options are configurable by small icons in the top-right corner of the table.
Settings are saved in localStorage.
Misc UI fixes for schedule table.

- Version 0.6.0 [`9bf87a8`](https://github.com/jhuckaby/Cronicle/commit/9bf87a8d009c3bce4eb63fad6bc32b7e199d478a)

#### [v0.5.8](https://github.com/jhuckaby/Cronicle/compare/v0.5.7...v0.5.8)

> 16 October 2016

Both will default to 0 if omitted (i.e. existing configs out in the wild).

- Now supporting loading page when job is in retry delay mode. [`5bd4dcf`](https://github.com/jhuckaby/Cronicle/commit/5bd4dcf1fd018727ef05837a1c0b06aba95ff93b)
- Now firing web hook for failing to launch job (job_launch_failure). [`92c059d`](https://github.com/jhuckaby/Cronicle/commit/92c059d8a931660c572ee71cc2be695870b98c7c)
- Now supporting linking into jobs that are in "retry delay" state. [`e2551bf`](https://github.com/jhuckaby/Cronicle/commit/e2551bfd02b1edb11c35083862c3f0b7e3ef3e7e)
- Support for pending jobs (retry delay) when opening new live log stream. [`afa005c`](https://github.com/jhuckaby/Cronicle/commit/afa005c7d9450c3d6c0ee91189e9e1b71a88f8c1)
- Support for web_socket_use_hostnames in client-side Websockets and API calls. [`88cd68c`](https://github.com/jhuckaby/Cronicle/commit/88cd68cf582c53bc2235db92e217bf4940fd1a25)
- Now including web_socket_use_hostnames param. [`92dfd18`](https://github.com/jhuckaby/Cronicle/commit/92dfd180879a1c48a4aba290c3e4fae3bbd96814)
- Added descriptions for config params server_comm_use_hostnames and web_socket_use_hostnames. [`79087bf`](https://github.com/jhuckaby/Cronicle/commit/79087bfed591ddfa8c0368309c71f237cbf7eac2)
- Support for server_comm_use_hostnames, to connect via IP or hostname. [`dcf8422`](https://github.com/jhuckaby/Cronicle/commit/dcf84224a2e1ed5be783ffce0fe85052cc8b68c9)
- Bug fixes on perf stat graph. [`ed2971b`](https://github.com/jhuckaby/Cronicle/commit/ed2971b4f1913ab9d4230e1d185d1a5b2aec55b8)
- Removed try/catch around Tools.getpwnam(), as it doesn't throw. [`35849fa`](https://github.com/jhuckaby/Cronicle/commit/35849fa8e3edf259977b9a22904800710d39e5ff)
- Added default server_comm_use_hostnames and web_socket_use_hostnames params. [`d4c38bb`](https://github.com/jhuckaby/Cronicle/commit/d4c38bb827a634afc22a0bbbac2da3875617d5ff)
- Version 0.5.8 [`7bf6fbf`](https://github.com/jhuckaby/Cronicle/commit/7bf6fbfbd4b55cc971bf60397ea8ff75abf6e2af)

#### [v0.5.7](https://github.com/jhuckaby/Cronicle/compare/v0.5.6...v0.5.7)

> 2 October 2016

Removed last remaining C++ dependency (posix) so can now be installed without any compilation.
Removed GID text field, now only accepting UID (updated docs and screenshots).
Edit Event page now has links to jump to event's history and stats.
No longer running pixl-server-storage unit tests along with ours (no reason to).

- Added https header detect to sample configuration [`#3`](https://github.com/jhuckaby/Cronicle/pull/3)
- Version 0.5.7 [`3e3ef67`](https://github.com/jhuckaby/Cronicle/commit/3e3ef678197bfcf22b88249896a9afcf06147f40)
- Use tabs instead of spaces [`b5b2e89`](https://github.com/jhuckaby/Cronicle/commit/b5b2e89571952dbd602f5bc0ef64800dc72e3d0c)

#### [v0.5.6](https://github.com/jhuckaby/Cronicle/compare/v0.5.5...v0.5.6)

> 14 August 2016

New event template is now configurable in config.json.
Bumped version to 0.5.6.

- Default new events no longer have the "Catch-Up" feature checked. [`e4d7a0f`](https://github.com/jhuckaby/Cronicle/commit/e4d7a0f4cdacecab99d1ff9129f2997ac98e3bf4)

#### [v0.5.5](https://github.com/jhuckaby/Cronicle/compare/v0.5.4...v0.5.5)

> 7 August 2016

Fixed bug where plugin params named 'script' didn't make it into the ENV hash.
Bumped version to 0.5.5.

- Now using bcrypt for hashing passwords. [`8fc2360`](https://github.com/jhuckaby/Cronicle/commit/8fc2360a84f1b9232d3cc170f4b339a4f1919fd4)

#### [v0.5.4](https://github.com/jhuckaby/Cronicle/compare/v0.5.3...v0.5.4)

> 10 June 2016

Bumped version to 0.5.4.

- Fixed bug where the nightly maintenance wasn't trimming long lists properly. [`08d9dcc`](https://github.com/jhuckaby/Cronicle/commit/08d9dcc29917b76cd6b1bf67faf60fa75f4b63c8)

#### [v0.5.3](https://github.com/jhuckaby/Cronicle/compare/v0.5.2...v0.5.3)

> 7 May 2016

Job Plugins can now emit an 'update_event' object to update the associated event upon job completion.
Fixed bug with edit event autosave data, is now cleared if schedule is updated.
Fixed potential race condition in unit test.

- "Run Now" button on Edit Event screen will now run event in it's "current" state, potentially edited and unsaved. [`7cbb440`](https://github.com/jhuckaby/Cronicle/commit/7cbb4400962e34c9d7970931372a8e3b0fc1d1f4)
- Added new job JSON feature: 'update_event' [`5f2b49c`](https://github.com/jhuckaby/Cronicle/commit/5f2b49c72d75d710fd6677dfe3550da58b7b538f)
- Bug fix: Wrong number of arguments to doError(). [`a151d9a`](https://github.com/jhuckaby/Cronicle/commit/a151d9a367cdbdce93c333094a4f2934db79c93e)
- Typo fix (only affects debug log). [`09d0d58`](https://github.com/jhuckaby/Cronicle/commit/09d0d58e30329dcd2e35f591f060432b6adbbfec)

#### [v0.5.2](https://github.com/jhuckaby/Cronicle/compare/v0.5.1...v0.5.2)

> 1 May 2016

New 'import' and 'export' CLI commands for importing and exporting data.
Fixed some CLI parsing bugs in control script.

- Version 0.5.2 [`7e6f233`](https://github.com/jhuckaby/Cronicle/commit/7e6f233ade73f226546cbd45ef732159f806d80d)

#### [v0.5.1](https://github.com/jhuckaby/Cronicle/compare/v0.5.0...v0.5.1)

> 1 May 2016

- Updated to use new screenshots. [`22a5bcf`](https://github.com/jhuckaby/Cronicle/commit/22a5bcfbefb1d9696296ac13d279967ab76119a4)
- Implemented 'web_hook_config_keys' (array), so any config keys may be included in web hook data. [`dbd801b`](https://github.com/jhuckaby/Cronicle/commit/dbd801b8b33456df14a565353908876ca8ea66d8)
- Disabled browser spellcheck in various Plugin Param text fields (was annoying me). [`774ea0f`](https://github.com/jhuckaby/Cronicle/commit/774ea0f361eb921dd4f7081cf3dbeea6aee1f75b)

#### [v0.5.0](https://github.com/jhuckaby/Cronicle/compare/v0.2.5...v0.5.0)

> 30 April 2016

All job logs are now compressed when stored.
BREAKING CHANGE: This changes the internal format of all logs to gzip, and will require a one-time script run to preserve existing logs:
Run this command once on the master server: sudo /opt/cronicle/bin/storage-cli.js upgrade_logs

- Version 0.2.6 [`60708a8`](https://github.com/jhuckaby/Cronicle/commit/60708a8628ddbcbc1e0543ecd7c09ae7f9394996)
- Version 0.5. [`feec309`](https://github.com/jhuckaby/Cronicle/commit/feec3091db47f8cfa42f861eba0da2ea0f3c858d)
- Fixed display bug where percentage could be a looooong float. [`b255394`](https://github.com/jhuckaby/Cronicle/commit/b255394909fb5e7784417990a46204fa891f3eaf)

#### [v0.2.5](https://github.com/jhuckaby/Cronicle/compare/v0.2.4...v0.2.5)

> 18 April 2016

Added filtering and keyword search to Upcoming Events on Home tab.
Socket.IO fixes (better handling for lost connections).
Fixed percentage display on Job Details page.
Fixed bug where retry delay controls were clickable even if invisible.
Removed error when adding servers: "Server clocks are too far out of sync.".
Added optional 'log_expire_days' property which can be outputted from job JSON.
Updated copyright, added link to Cronicle home.
Bumped version to 0.2.5.

- Misc changes: [`8686a99`](https://github.com/jhuckaby/Cronicle/commit/8686a996a61a3c14c6a7eba699b76ffb6866f813)

#### [v0.2.4](https://github.com/jhuckaby/Cronicle/compare/v0.2.3...v0.2.4)

> 14 April 2016

- Fixed bug where copyFiles() would assume every file was a file, and not a sub-dir. [`59f34f8`](https://github.com/jhuckaby/Cronicle/commit/59f34f81761d1367aafe592c19772ea8cc7542c0)
- Typo. [`1b22291`](https://github.com/jhuckaby/Cronicle/commit/1b222919b9f040ac187b1126ab8162a9c1af1a0c)

#### [v0.2.3](https://github.com/jhuckaby/Cronicle/compare/v0.2.2...v0.2.3)

> 13 April 2016

Bumped version to 0.2.3.

- Fixed bug where filehandle to job logs would remain open after delete, causing the disk to eventually run out of space. [`c81e150`](https://github.com/jhuckaby/Cronicle/commit/c81e1506f01a5245d7e494f2c49d62e7e5a409eb)

#### [v0.2.2](https://github.com/jhuckaby/Cronicle/compare/v0.2.1...v0.2.2)

> 6 April 2016

Now using Lato font from Google Fonts.
Bumped version to 0.2.2.

- New flat UI design changes. [`ed24346`](https://github.com/jhuckaby/Cronicle/commit/ed24346ffd54945b2186affd9aa73ede1821661a)

#### [v0.2.1](https://github.com/jhuckaby/Cronicle/compare/v0.2.0...v0.2.1)

> 4 April 2016

Bumped version to 0.2.1.

- Fixed bug where "Run Again" button could sometimes freeze up UI if job completed immediately. [`5317b06`](https://github.com/jhuckaby/Cronicle/commit/5317b063bfa342dcab47780f0e95143148cba46c)

#### [v0.2.0](https://github.com/jhuckaby/Cronicle/compare/v0.1.9...v0.2.0)

> 3 April 2016

Bumped version to 0.2.0.

- Added custom tables and HTML reports on the Job Details page. [`4fef7db`](https://github.com/jhuckaby/Cronicle/commit/4fef7dba2e30f3064847e91753953cbf5e4e5794)

#### [v0.1.9](https://github.com/jhuckaby/Cronicle/compare/v0.1.8...v0.1.9)

> 22 March 2016

No longer displaying logs over 10 MB on Job Details page, unless user asks for it.
Fixed bug when sending e-mails about jobs which failed to launch (now tracking which events launched per minute tick).
Unit test now runs on HTTP port 4012, and UDP port 4014, as to not interfere with other servers in a cluster.
Bumped version to 0.1.9.

- Misc fixes. [`d5ff383`](https://github.com/jhuckaby/Cronicle/commit/d5ff38314fd3196c4fe1c3c11d11ce8361b3b5c1)

#### [v0.1.8](https://github.com/jhuckaby/Cronicle/compare/v0.1.7...v0.1.8)

> 20 March 2016

- Now using streaming API for fetching and storing job logs. [`5dd3c80`](https://github.com/jhuckaby/Cronicle/commit/5dd3c80a20affe20a08d590d5a4b4fa297eba85a)
- Now using streaming API for fetching and storing job logs. [`de53b70`](https://github.com/jhuckaby/Cronicle/commit/de53b70a01dc2d43912b30647c6d544ea229a77f)
- Cosmetic fix for table pagination white-space. [`48b007d`](https://github.com/jhuckaby/Cronicle/commit/48b007d8f7e4cbc2c6063ecba1585550368544a3)
- Cosmetic hack for "day" to "days" in uptime display. [`135bafe`](https://github.com/jhuckaby/Cronicle/commit/135bafe7e89c9543ed5980f8c2dfd8e68dc6dea2)
- Bumped version to 0.1.8. [`6312513`](https://github.com/jhuckaby/Cronicle/commit/6312513a1075ae972890e556e608fad2da4998c8)
- Fixed bug where upcoming event countdown time was based on client's local clock, not server clock. [`9c10471`](https://github.com/jhuckaby/Cronicle/commit/9c104713b5fe99800734ec64036186146dd18af1)
- Prevent flickering on pagination click. [`4d9cb4c`](https://github.com/jhuckaby/Cronicle/commit/4d9cb4c7a090c6e4f97d3d8571108f23c1ff1078)
- Text change: "Waiting for master server..." [`105f176`](https://github.com/jhuckaby/Cronicle/commit/105f176086ce0aab731b3b03e0079cd956c10085)

#### [v0.1.7](https://github.com/jhuckaby/Cronicle/compare/v0.1.6...v0.1.7)

> 13 March 2016

On some OSes (CentOS 6.x for example), writing to log files with `fs.appendFile()` and no callback results in out-of-order lines.  Switched to `fs.appendFileSync()`.
Bumped version to v0.1.7.

- Fixed some weird log file append race conditions. [`c4e2fd5`](https://github.com/jhuckaby/Cronicle/commit/c4e2fd583e20991e8b0cd603be4d394c942a8448)

#### [v0.1.6](https://github.com/jhuckaby/Cronicle/compare/v0.1.5...v0.1.6)

> 13 March 2016

- Now using async.ensureAsync() instead of process.nextTick(). [`c0260b6`](https://github.com/jhuckaby/Cronicle/commit/c0260b669217ce3e642d5e53c20f7547f4ceb6b7)
- Added more debug info for a failing test. [`818c394`](https://github.com/jhuckaby/Cronicle/commit/818c394a4c7909aff38ee3152cdf85e4e53cfe1e)
- Misc fixes. [`e7bc851`](https://github.com/jhuckaby/Cronicle/commit/e7bc8515294edb7adfbe809934e9e1efa026f88e)
- Now catching and ignoring errors on the child STDIN stream. [`006e15c`](https://github.com/jhuckaby/Cronicle/commit/006e15cdb0f8375dff5b5620a32d966027934169)
- No longer tainting params in getClientInfo() (make a copy first). [`142fa69`](https://github.com/jhuckaby/Cronicle/commit/142fa695cd0d42894cadbb13692dd13ddf09a089)
- Fix for rare race condition seen on main Home tab. [`27c4d50`](https://github.com/jhuckaby/Cronicle/commit/27c4d50bf74e5cc069a1d1a6c5bb08b881e9706b)
- Bumped version to 0.1.6. [`24b8517`](https://github.com/jhuckaby/Cronicle/commit/24b8517cbf737310f90a5e7a1bd753a83738d436)
- Removed '--color' flag by default. [`8a52c1a`](https://github.com/jhuckaby/Cronicle/commit/8a52c1a6bb88f9155adf48c193d4427c8521a872)

#### [v0.1.5](https://github.com/jhuckaby/Cronicle/compare/v0.1.4...v0.1.5)

> 6 March 2016

Fixed bug in choose_date_time() which would not floor the seconds to 0.
Fixed bug where chain reaction mode could not be disabled after it was enabled on an event.
Misc fixes in README.md.
Bumped version to v0.1.5.

- Added optional dialog in Run Now for customizing the current time. [`0021be4`](https://github.com/jhuckaby/Cronicle/commit/0021be4c10fe679490ee92a85067fd449e9ca0d6)

#### [v0.1.4](https://github.com/jhuckaby/Cronicle/compare/v0.1.3...v0.1.4)

> 6 March 2016

Fixed markdown error in README.
Better .gitignore file in README.
Bumped version to 0.1.4.

- More accidental commits (symlinks, files created as part of build process). [`e277f40`](https://github.com/jhuckaby/Cronicle/commit/e277f4050299d44666a2778746ab15ab15856548)
- Fixed display bug with long error messages on JobDetails page. [`6625c11`](https://github.com/jhuckaby/Cronicle/commit/6625c1164f22c13f6a268720a02ea74aabfc595f)
- Removed some accidental commits (symlinks, 3rd party libs, part of build process). [`9e723fa`](https://github.com/jhuckaby/Cronicle/commit/9e723fa1402a10e8057c204c79b2e88c582ed981)

#### [v0.1.3](https://github.com/jhuckaby/Cronicle/compare/v0.1.2...v0.1.3)

> 28 February 2016

Added process.env into email_data for future use.

- Added choose_date_time() dialog. [`3f5cb25`](https://github.com/jhuckaby/Cronicle/commit/3f5cb25fe2b664b05d50d3b39b813faaa573d131)
- Now using Base choose_date_time() dialog when you click on the Time Machine text field. [`d48be9c`](https://github.com/jhuckaby/Cronicle/commit/d48be9c44962d86cb56a55be68aef3adfaabdc15)
- Added Chain Reaction feature in UI. [`343243e`](https://github.com/jhuckaby/Cronicle/commit/343243e70ce92dae702c6229ff97ab754450a278)
- Added chainReaction() function for spawning new job at completion of old one. [`c5f6fa5`](https://github.com/jhuckaby/Cronicle/commit/c5f6fa530f2a2186a07e0feeb947fdf1ce938d9d)
- Added docs for the Chain Reaction feature. [`af7deb7`](https://github.com/jhuckaby/Cronicle/commit/af7deb7d93ec99d37f1bdd6b37c94c30599815e0)
- Now sending e-mail if job fails to launch, and event has "notify_fail" set. [`8d75b2e`](https://github.com/jhuckaby/Cronicle/commit/8d75b2eca289639715f6009c0ce58a7804e3de71)
- New e-mail template for general event errors (i.e. failure to launch job). [`de40e5b`](https://github.com/jhuckaby/Cronicle/commit/de40e5b852112699564bc7ab1d8f045bec4981ab)
- Added styles for date/time dialog. [`3d9ac14`](https://github.com/jhuckaby/Cronicle/commit/3d9ac146aba359e2aa75d606bfbbe45e093447ca)
- Support for Chain Reaction feature at completion of successful job. [`70bdbe3`](https://github.com/jhuckaby/Cronicle/commit/70bdbe35f8f3515058ea2f26feb37d6adf4b6f29)
- Changed header and floating clocks to include timezone abbreviation. [`733cc2d`](https://github.com/jhuckaby/Cronicle/commit/733cc2dc25b48c0c34d7ddec71acaa2fd98861a4)
- Now sorting events properly by localeCompare, and lower-case. [`16fba1d`](https://github.com/jhuckaby/Cronicle/commit/16fba1dfb6c8b71379871c5a998b1deaca3eb37d)
- Added auto-ellipsis to job source, now that it may contain a chain reaction source event name. [`246b060`](https://github.com/jhuckaby/Cronicle/commit/246b06041e8b06a407ef39544cc21aa94f411b21)
- Now sorting things properly by localeCompare, and lower-case. [`6721f82`](https://github.com/jhuckaby/Cronicle/commit/6721f82a8c1e867d2065d7321e8c755ea77cf204)
- Now sorting things properly by localeCompare, and lower-case. [`f3e076d`](https://github.com/jhuckaby/Cronicle/commit/f3e076d59b8f1389e64fcc0a0b53c0291f2338a7)
- Now sorting things properly by localeCompare, and lower-case. [`f0dba78`](https://github.com/jhuckaby/Cronicle/commit/f0dba789959af1e138f29d5cdcbfd0c21a8e49f6)
- Now passing job JSON blob downstream to the shell script process itself, just in case it decides to read it in. [`fbf867a`](https://github.com/jhuckaby/Cronicle/commit/fbf867a519561b16ae44597fb4ad4b5d429732a5)
- Version 0.1.3. [`6276c96`](https://github.com/jhuckaby/Cronicle/commit/6276c9609147ab61912faf6856877d3916e5c1cb)
- Added conf/emails/event_error.txt email configuration file. [`15d9537`](https://github.com/jhuckaby/Cronicle/commit/15d953703401dc21a515a24323c481bb5c581d3d)

#### [v0.1.2](https://github.com/jhuckaby/Cronicle/compare/v0.1.1...v0.1.2)

> 27 February 2016

- Added Algorithm IDs (for use in API). [`3c51977`](https://github.com/jhuckaby/Cronicle/commit/3c51977a75dd6326ae6702938971c101a301e8d7)
- Now monitoring server resources every 10 seconds if local active jobs, 60 seconds if not. [`a4aa6af`](https://github.com/jhuckaby/Cronicle/commit/a4aa6af9497088f5ba5377cf68fb6aaee2b9a256)
- Renamed a few algo IDs (prefer_first and prefer_last). [`605f2d0`](https://github.com/jhuckaby/Cronicle/commit/605f2d04333fb61b813e9d6062c389a093001717)
- Now logging some more sample text every N seconds, for better live log demos. [`d623fe8`](https://github.com/jhuckaby/Cronicle/commit/d623fe807c72afdb23ac0679cda53c7d5ef0f193)
- Version 0.1.2. [`515febe`](https://github.com/jhuckaby/Cronicle/commit/515febee0626732c691cd55dce88a31049e14b88)
- Adjusted algo IDs a bit to make them more clear. [`cf38ec1`](https://github.com/jhuckaby/Cronicle/commit/cf38ec11f27721b5ea34dbce3c80a9653d9c64d4)

#### [v0.1.1](https://github.com/jhuckaby/Cronicle/compare/v0.1.0...v0.1.1)

> 27 February 2016

Also waiting for scheduler to write out its state file.
Tagging v0.1.1.

- Better shutdown procedure: Now waiting for all local, non-detached jobs to abort before continuing shutdown. [`cda2c4a`](https://github.com/jhuckaby/Cronicle/commit/cda2c4a6772ee8e975d72aafc5e538e6c33b92ea)

#### [v0.1.0](https://github.com/jhuckaby/Cronicle/compare/v0.0.9...v0.1.0)

> 27 February 2016

Tagging v0.1.0.

- Fixed bug in control shell script with multi-argument commands. [`17cf443`](https://github.com/jhuckaby/Cronicle/commit/17cf443a88e47a40b162e2c8010a83865429f842)

#### [v0.0.9](https://github.com/jhuckaby/Cronicle/compare/v0.0.8...v0.0.9)

> 27 February 2016

- New server selection algorithm feature (random, round robin, etc.). [`1f4963f`](https://github.com/jhuckaby/Cronicle/commit/1f4963ff31efc4501675cb012814c9c5bd35d14d)
- Added new server selection algorithm feature. [`e347f90`](https://github.com/jhuckaby/Cronicle/commit/e347f908d84d60b455335088c3013e4eec2edf2d)
- Added description of new server selection algorithm feature. [`b80670b`](https://github.com/jhuckaby/Cronicle/commit/b80670b146689c223982cc34514c2e57baf73e1c)
- Changed nearby server highlight color to blue. [`74b75b6`](https://github.com/jhuckaby/Cronicle/commit/74b75b6c0267e3430d53ce50854b0e51d2e4aaf5)
- Adjusted column width a bit, for smaller monitors. [`d16eb20`](https://github.com/jhuckaby/Cronicle/commit/d16eb202e18bc719f53c4b8dbe39a7376fb3c74c)
- Now deleting round robin state data when event is deleted. [`f72129c`](https://github.com/jhuckaby/Cronicle/commit/f72129cf8e3c382b80ac0f2cb0173262be46b438)
- Fixed sample e-mail address. [`faa8b4e`](https://github.com/jhuckaby/Cronicle/commit/faa8b4ea05140e93fc2afacac1ca8206ccc567e7)
- Version 0.0.9. [`9921e98`](https://github.com/jhuckaby/Cronicle/commit/9921e987a5528ef557fab3ac27d6d8a2321c4c2e)
- setGroupVisibility() now returns `this` for chaining. [`c4e32fe`](https://github.com/jhuckaby/Cronicle/commit/c4e32feafd8d677be9de3164b118b2919c71126d)

#### [v0.0.8](https://github.com/jhuckaby/Cronicle/compare/v0.0.7...v0.0.8)

> 21 February 2016

- Added api_get_plugins(). [`755ed1d`](https://github.com/jhuckaby/Cronicle/commit/755ed1dad7be75959e3fa109feb493bc7b8db8df)
- When disabling event/category/plugin and jobs are active, only alerting for non-detached ones. [`706097a`](https://github.com/jhuckaby/Cronicle/commit/706097ab2821d82161aca6e639ff978329220d7a)
- Uncommented api_get_categories(). [`330cd3d`](https://github.com/jhuckaby/Cronicle/commit/330cd3d548a4cd64af15455ae226613abd9582ab)
- Version 0.0.8: Misc bug fixes, added new APIs for fetching categories and plugins. [`54c0fe9`](https://github.com/jhuckaby/Cronicle/commit/54c0fe9eb28d59f64198d82e354d0a6cfb9cc037)
- Bug fix: User/APIKey must have "abort_events" priv in order to use abort_jobs param with api_update_event. [`6857bf0`](https://github.com/jhuckaby/Cronicle/commit/6857bf0cfdf4fe47369ff2f101dd1b823a163c20)

#### [v0.0.7](https://github.com/jhuckaby/Cronicle/compare/v0.0.6...v0.0.7)

> 6 February 2016

Bumped to v0.0.7.

- Unit tests!  Yay! [`317fda4`](https://github.com/jhuckaby/Cronicle/commit/317fda4e957c9b2dde1469c0fcc0cb50e44a88c3)
- Removed title requirement on API calls, now derives from storage. [`5976510`](https://github.com/jhuckaby/Cronicle/commit/59765104543e59ae0a6bea26d2577c6339c65957)
- Removed title requirement on API calls, now derives from storage. [`885851e`](https://github.com/jhuckaby/Cronicle/commit/885851e9e716e3d5b8d9c7ddb9106cb417719e3f)
- Fixed a few bugs in the sample Plugin code. [`f88ed59`](https://github.com/jhuckaby/Cronicle/commit/f88ed596a964b74e8c4862b9285768cf1a411ae2)
- Added recommended .gitignore file for local development. [`ab5d128`](https://github.com/jhuckaby/Cronicle/commit/ab5d1287b8f72d667ef7c7a23b087103500388f3)
- Added section on running unit tests, and now listing pixl-unit module. [`005693f`](https://github.com/jhuckaby/Cronicle/commit/005693fb4ec8947e618303bebb7f2cde4c30cd5f)
- Added checkEventTiming() method for checking event timing without having to use moment.js directly. [`6f4093a`](https://github.com/jhuckaby/Cronicle/commit/6f4093a070050c82c087681e210e3aec4b9f5ddf)
- Added optional 'ps_monitor_cmd' config property for customizing the command that grabs process cpu/mem. [`612e6cc`](https://github.com/jhuckaby/Cronicle/commit/612e6cca1e930e49a8ba03477a3d5d399387c6f1)
- Removed title requirement on API calls, now derives from storage. [`8283905`](https://github.com/jhuckaby/Cronicle/commit/828390522b45b3b005a5b0a3d6734225a96ea63c)
- Removed title requirement on API calls, now derives from storage. [`d257d76`](https://github.com/jhuckaby/Cronicle/commit/d257d7644fb1f3845b5607b7194480aaec9c1c80)
- Now writing queue files atomically, to avoid any possible race condition with the queue dir monitor. [`a7599dd`](https://github.com/jhuckaby/Cronicle/commit/a7599dd4a88f37c77afdd8f5e75d7e3ffeb3e4cd)
- Added unit test commands, and pixl-unit as a devDependency [`c7ebc13`](https://github.com/jhuckaby/Cronicle/commit/c7ebc133577f5d017d6e96a8550959a5babfd1c2)
- Fixed bug where an API key attempting an administrative level function would result in no callback being fired. [`16f65c8`](https://github.com/jhuckaby/Cronicle/commit/16f65c841cba3bbf2c5e7396c1f41dd9bc9ce7a9)
- Typo in variable name. [`124d786`](https://github.com/jhuckaby/Cronicle/commit/124d7863d3063b692b648f2ded29dd86ad6cd240)

#### [v0.0.6](https://github.com/jhuckaby/Cronicle/compare/v0.0.5...v0.0.6)

> 10 January 2016

- Now hiding all non-admin privilege checkboxes when admin is checked (they have no meaning, as admin trumps all). [`1cecc69`](https://github.com/jhuckaby/Cronicle/commit/1cecc69dda14723a913b40924bdb38f426f48ddd)
- Fixed bug where floating clock would obscure logout button when scrolled to top. [`6562b32`](https://github.com/jhuckaby/Cronicle/commit/6562b320c415c8c8fb4440676f2f2213ff3dce43)
- Added clarification about timezone interpretation on the Time Machine text field. [`91b1ef6`](https://github.com/jhuckaby/Cronicle/commit/91b1ef6d6c0b7a25c045a74b0e685a742d5974e4)
- Bumped version to 0.0.6. [`941936d`](https://github.com/jhuckaby/Cronicle/commit/941936d4ffd177d759190e82517a60e5ffd3fecc)
- Fixed bug where floating clock would obscure logout button when scrolled to top. [`645070c`](https://github.com/jhuckaby/Cronicle/commit/645070c87bf8c74a92d21da7b9a38d2fe4df6ee7)
- Added clarification on starting in debug mode and 'Run All Mode' events. [`d8840f0`](https://github.com/jhuckaby/Cronicle/commit/d8840f0b363ae9c68b7341365b850ae707850ffa)

#### [v0.0.5](https://github.com/jhuckaby/Cronicle/compare/v0.0.4...v0.0.5)

> 10 January 2016

Updated docs with explicit callout to 'pixl-webapp' for the client-side framework.
Bumped to v0.0.5.

- Install Script: Now using 'npm update' for upgrades, instead of running 'npm install' again. [`bda276d`](https://github.com/jhuckaby/Cronicle/commit/bda276d54f479f8f57e0b52d8d68f6cd00edc64e)
- Upgrade command will now only stop/start service if it was running to begin with. [`f420972`](https://github.com/jhuckaby/Cronicle/commit/f4209721042c6dac4dac824bcefa55404f9e13ee)

#### [v0.0.4](https://github.com/jhuckaby/Cronicle/compare/v0.0.3...v0.0.4)

> 10 January 2016

Bumped version to v0.0.4.

- New feature: Can now integrate with external user management system, via the 'external_user_api' User Manager config prop. [`a1e4307`](https://github.com/jhuckaby/Cronicle/commit/a1e43074d1c224921d251f61657faa247a352832)
- Fleshed out table of contents a bit. [`0adf98e`](https://github.com/jhuckaby/Cronicle/commit/0adf98e0c0a850c9e0090a88cce6b33eedd3543b)
- Emboldened the glossary terms. [`fe809cb`](https://github.com/jhuckaby/Cronicle/commit/fe809cb57a1a4253b5c6d3ee347d8790f98467a9)
- Reduced console output, now only emitting each storage command in verbose mode. [`7cec15c`](https://github.com/jhuckaby/Cronicle/commit/7cec15ce1ad51c07441317780f352eb344510305)
- symlinkFile: Will now skip operation if target exists and is NOT a symlink (i.e. hard file or directory). [`3939048`](https://github.com/jhuckaby/Cronicle/commit/393904873cf61a708553a1b36a69841e70b1361e)
- Now using fs.appendFileSync to capture command output just before calling process.exit(); [`8b1e31a`](https://github.com/jhuckaby/Cronicle/commit/8b1e31a0dced3a4a20c528f265baf2ebb2eb0034)
- Fixed a few small typos. [`173f97a`](https://github.com/jhuckaby/Cronicle/commit/173f97afc653af7d481a3d2169711793a50fb748)
- Changed wording a bit. [`7a70618`](https://github.com/jhuckaby/Cronicle/commit/7a706181aa84550735b79557c8301cc8bda9ace6)
- Moved main screenshot under first para. [`3f6d09c`](https://github.com/jhuckaby/Cronicle/commit/3f6d09c487c9278f1b1e8ebaedeae700772bba1a)
- Added log file to console output, so user can see where it lives. [`a10907f`](https://github.com/jhuckaby/Cronicle/commit/a10907fc2f40dd226c10ed0bd61e2ad49c7420de)
- Consolidated `build.log` into `install.log`. [`d634f3b`](https://github.com/jhuckaby/Cronicle/commit/d634f3b04fb8e71079f6e277919cb6795093baba)

#### [v0.0.3](https://github.com/jhuckaby/Cronicle/compare/v0.0.2...v0.0.3)

> 7 January 2016

Bumped to v0.0.3.

- Fixed a couple small bugs in the upgrade script. [`a28768c`](https://github.com/jhuckaby/Cronicle/commit/a28768ce18cb95dccb64f7bc799a4e0dc881bcc5)

#### [v0.0.2](https://github.com/jhuckaby/Cronicle/compare/v0.0.1...v0.0.2)

> 7 January 2016

A small tweak in the install script text.
Bumped to v0.0.2 to test upgrade process.

- Added dependency 'pixl-perf' as it was forgotten.  Sorry pixl-perf! [`e5c97d9`](https://github.com/jhuckaby/Cronicle/commit/e5c97d9010766d87da7048accedc35a1cb154a9f)
- Adjusted spacing slightly. [`e1245b6`](https://github.com/jhuckaby/Cronicle/commit/e1245b63ee1bf3fd6eb71151f8814a965d03fb6d)
- Fixed typo in install script. [`c7f6611`](https://github.com/jhuckaby/Cronicle/commit/c7f6611237ead9c5a322b8672095fbe5bdb2bbc4)

#### v0.0.1

> 7 January 2016

- Initial commit. [`2368814`](https://github.com/jhuckaby/Cronicle/commit/236881453b0a56b1b728020600d4dcbb84030cf8)
- Added license. [`fa91153`](https://github.com/jhuckaby/Cronicle/commit/fa911532531994943f5c47367cdbaeba4a89ca6b)
