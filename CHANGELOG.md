# Cronicle Changelog

## Version v0.9.114

> April 16, 2026

- [`b79bad7`](https://github.com/jhuckaby/cronicle/commit/b79bad7febd4661b52dda130d2fcd4fda9b858ce): Version 0.9.114
	- Bump pixl-request to v2.6.5 for upstream vuln fixes in basic-ftp (sub-dep of proxy-agent).  Yup, another one.

## Version v0.9.113

> April 16, 2026

- [`bd780e9`](https://github.com/jhuckaby/cronicle/commit/bd780e96527bb833818bed03fbb871979824d492): Version 0.9.113
	- Bump pixl-request to v2.6.4 for upstream vuln fixes in basic-ftp (sub-dep of proxy-agent).
- [`30f4ff5`](https://github.com/jhuckaby/cronicle/commit/30f4ff5e944ebb09d875fd07d1c9e9bfdabc2240): README: Updated links to xyOps, and mention v1.0 launch.

## Version v0.9.112

> April 8, 2026

- [`3f8b269`](https://github.com/jhuckaby/cronicle/commit/3f8b269723daed41e78e5435699034f60a1e0da1): Version 0.9.112
	- HTTP Plugin: Add support for separate configurable idle timeout and connect timeouts.  Fixes #970.
	- Bump pixl-mail to v1.1.7 for upstream vuln fix in nodemailer.
	- Bump pixl-request to latest for upstream vuln fixes.

## Version v0.9.111

> April 2, 2026

- [`b7e3072`](https://github.com/jhuckaby/cronicle/commit/b7e3072373b587c1426b8eaeb6f9bf56b5192d54): Version 0.9.111
	- Add sanitize-html package.
- [`256d258`](https://github.com/jhuckaby/cronicle/commit/256d258a45f9b97e80f8a27ef4e5e1b91da01bda): Fix broken unit test on latest pixl-server-user.
- [`f0b6d6f`](https://github.com/jhuckaby/cronicle/commit/f0b6d6fe6779976b65863c872b72741e9ac961c9): Security Hardening: Disallow "update_event" from job output unless specifically enabled in configuration.
- [`37e21bb`](https://github.com/jhuckaby/cronicle/commit/37e21bb4c0509aae9ab5e67be33fd8a262e0af5d): Security Hardening: Perform HTML sanitization on user content in job outputs.
- [`e242dc7`](https://github.com/jhuckaby/cronicle/commit/e242dc7c7984562e19ee30116edf3b7fea8ead35): Add securty policy for reporting vulns.

## Version v0.9.110

> March 29, 2026

- [`4a66180`](https://github.com/jhuckaby/cronicle/commit/4a661808aac76381d2bc0e98da8a9d392aa5b104): Version 0.9.110
	- Bump various deps for various upstream vuls
- [`8d6ebaf`](https://github.com/jhuckaby/cronicle/commit/8d6ebaf62321d91a3971bbcdc8a4bac0982a6e3a): Add custom changelog script (to replace the aging auto-changelog NPM module).

## Version v0.9.109

> March 19, 2026

- [`de49e79`](https://github.com/jhuckaby/cronicle/commit/de49e793bba2c2b4db8308165ea74c25b2e2aa26): Version 1.0.9
	- Fix upstream vulns in fast-xml-parser and @aws-sdk/xml-builder.  See #967
- [`c2967bc`](https://github.com/jhuckaby/cronicle/commit/c2967bca10a0e5688dff42925e40b5e95c678a39): Bump fast-xml-parser and @aws-sdk/xml-builder

## Version v0.9.108

> March 19, 2026

- [`9c6d965`](https://github.com/jhuckaby/cronicle/commit/9c6d965d051aab24458b0b9735a97c88f9aced20): Version 0.9.108
	- Fix upstream vuln in socket.io -- see #966
- [`ed01708`](https://github.com/jhuckaby/cronicle/commit/ed01708a6b415cbd2c06db402eecde0ec54c47c6): Bump socket.io-parser from 4.2.5 to 4.2.6

## Version v0.9.107

> February 23, 2026

- [`0c0babc`](https://github.com/jhuckaby/cronicle/commit/0c0babcde8582f50a78d4337c3aa80f21b9bae4b): Version 0.9.107
	- Bump pixl-server-storage to v4 for latest AWS SDK, for multiple upstream vuln fixes.

## Version v0.9.106

> February 11, 2026

- [`364d394`](https://github.com/jhuckaby/cronicle/commit/364d394cb93ac8c87255ecde2ef4a348fe032ef6): Version 0.9.106
- [`4248c90`](https://github.com/jhuckaby/cronicle/commit/4248c9057fcfa6c699bae309c320bd1c8b56e8fd): Bug Fix: Crash when a core HTTP error occurs (i.e. "socket hang up") and job is configured with chain reaction.  Fixes #964.

## Version v0.9.105

> February 5, 2026

- [`5ca2577`](https://github.com/jhuckaby/cronicle/commit/5ca2577d645ae2203abe001706bc1a6181bd7a79): Version 0.9.105
- [`3e207d0`](https://github.com/jhuckaby/cronicle/commit/3e207d0b348ed96fcaf4345885422c25b76e6692): Restore master_ping_timeout to 60 seconds, as this is also the initial startup delay, so we don't want to double that for all users.

## Version v0.9.104

> February 5, 2026

- [`20e7a34`](https://github.com/jhuckaby/cronicle/commit/20e7a342ed9f2906141ea19567bb91ee08c89901): Version 0.9.104
- [`0c90847`](https://github.com/jhuckaby/cronicle/commit/0c90847e69fae11b8432cca05304edba6ae15828): Change default master_ping_freq to 5 seconds, and master_ping_timeout to 120 seconds.
- [`f92dc9f`](https://github.com/jhuckaby/cronicle/commit/f92dc9f766ffbe2b0d86da9735b7d952a7c2061d): Add further protection against rare situation where a master conflict forces an existing master primary to demote itself to worker.

## Version v0.9.103

> February 4, 2026

- [`f19d500`](https://github.com/jhuckaby/cronicle/commit/f19d500e7cbfd492ef4c2c22fffe608327f0ee5f): Version 0.9.103
- [`d724494`](https://github.com/jhuckaby/cronicle/commit/d724494ce02d919318c7001ecec88647f7b18815): Ensure goMaster() function is only ever called once.  Log a fatal error and shut down if it gets double-called.
- [`2b4f5f1`](https://github.com/jhuckaby/cronicle/commit/2b4f5f1be5ca38a7756c3df773df1f6928439864): Added trademark
- [`321a38f`](https://github.com/jhuckaby/cronicle/commit/321a38f545c91f1051afd762eef3924c1b38ea55): Add xyOps plug in README

## Version v0.9.102

> December 18, 2025

- [`6fba859`](https://github.com/jhuckaby/cronicle/commit/6fba8596e76ee39e8c145257b842d5c79d57c631): Add private flag to prevent accidental publishing to npm
- [`4948d70`](https://github.com/jhuckaby/cronicle/commit/4948d70f96e8c849248509a21956cd778ff2ab4c): Version 0.9.102
	- Bump pixl-mail (and thus nodemailer) for upstream vuln fix.
	- https://github.com/jhuckaby/Cronicle/pull/954
- [`8fe12f1`](https://github.com/jhuckaby/cronicle/commit/8fe12f1ef07a1a455d0854d0025e26fc0b192522): Bump nodemailer and pixl-mail

## Version v0.9.101

> November 26, 2025

- [`9ea8467`](https://github.com/jhuckaby/cronicle/commit/9ea846767434baec06f802c5d826cf37a990ba9c): Version 0.9.101
	- Fix crasher in code block that handles max emails per day
	- Fixes #949 -- thanks to @frankii91 for reporting this!

## Version v0.9.100

> November 4, 2025

- [`9c6aea8`](https://github.com/jhuckaby/cronicle/commit/9c6aea89c3afa37c18655bf5f97115b6c3f5255f): Version 0.9.100
- [`5929a79`](https://github.com/jhuckaby/cronicle/commit/5929a79044f93e5837d5db845a88411d83fefb36): SPECIAL CASE: create json-string-escaped version of chain_description, for GH Issue #942

## Version v0.9.99

> October 22, 2025

- [`326660e`](https://github.com/jhuckaby/cronicle/commit/326660ec5aa8f2b4453a6c014b7de7de4785dd42): Version 0.9.99
	- Fixes #938

## Version v0.9.98

> October 21, 2025

- [`5f0ad36`](https://github.com/jhuckaby/cronicle/commit/5f0ad36313a950ffe2d87acf4248febf7822c48a): Version 0.9.98
	- Fix issue where limit-based job aborts (timeout, cpu, mem, log size) do not trigger a chain reaction error.   Fixes #936.

## Version v0.9.97

> October 13, 2025

- [`1509773`](https://github.com/jhuckaby/cronicle/commit/150977352350710e1da1b599b2f62d697641ba32): Version 0.9.97
	- Bump pixl-mail to v1.1.4 for upstream vuln patch in nodemailer.
	- Bump pixl-server-user to v1.0.34 for a fix in session expiration handling.

## Version v0.9.96

> October 11, 2025

- [`405de16`](https://github.com/jhuckaby/cronicle/commit/405de1611716112e14fb083e131fba9a62abb9d3): Added a new checkbox regarding vuln reporting
- [`c5e3363`](https://github.com/jhuckaby/cronicle/commit/c5e3363c31cafe09c358d4edeaa33657f711a833): Version 0.9.96
- [`4124a86`](https://github.com/jhuckaby/cronicle/commit/4124a86edd5e26ccafa4415183208f52c9c2cebe): Vulnerability fixes across various APIs.

## Version v0.9.95

> October 2, 2025

- [`ea50387`](https://github.com/jhuckaby/cronicle/commit/ea5038740ea070b6c10d343a4072ef2ecacc1395): Version 0.9.95
- [`93f2a5a`](https://github.com/jhuckaby/cronicle/commit/93f2a5ae0439f2a6088a20b28440714d867eee04): Add note about reporting security vulns
- [`7d95df5`](https://github.com/jhuckaby/cronicle/commit/7d95df522b53100be2a2d0fdbd0b134051def614): Fix XSS vuln in password reset form.

## Version v0.9.94

> October 1, 2025

- [`33a0ada`](https://github.com/jhuckaby/cronicle/commit/33a0ada500c2bcc896c76014f343cb10668da6da): Version 0.9.94
- [`474a145`](https://github.com/jhuckaby/cronicle/commit/474a1458bb43aa0459c8f7127c9deca3ac7bd4c2): Fix issue where single IPv6 isn't logged in transaction log in certain cases.  Changed to log all IPs from args.ip.

## Version v0.9.93

> September 29, 2025

- [`b0cbdc7`](https://github.com/jhuckaby/cronicle/commit/b0cbdc7351bb49ccb77b097daa4d2c65330cb9d6): Version 0.9.93
	- Fixed another case of the number suffixes being wrong in the teens.  Thanks again to @sa-dbilling for catching this.

## Version v0.9.92

> September 15, 2025

- [`9f99565`](https://github.com/jhuckaby/cronicle/commit/9f99565ca818fa3d101e0845282cdaac083a68ce): Version 0.9.92
	- Add protection against rare "EBADF: bad file descriptor" error when live log filehandle is closed.
	- Fixes #924

## Version v0.9.91

> August 30, 2025

- [`b58244c`](https://github.com/jhuckaby/cronicle/commit/b58244c1dc78934dbf27744c78a13607aeb47f68): Version 0.9.91
	- Revert this commit: https://github.com/jhuckaby/Cronicle/commit/a5534917e0b47f01b8012c6d39988ce78739e6f7
	- Fixes #922
	- Thanks to @seanfulton for catching this!

## Version v0.9.90

> August 15, 2025

- [`012e88d`](https://github.com/jhuckaby/cronicle/commit/012e88db8b83cb976a8dc7438799a5642f91f2f8): Version 0.9.90
	- Bump pixl-server-web to v2.0.16 for cookie parsing bug.
	- FIxes #917

## Version v0.9.89

> August 13, 2025

- [`99ca050`](https://github.com/jhuckaby/cronicle/commit/99ca0502cb81a931468a9b26ee639fb16cbd44a5): Version 0.9.89
	- Merge PR #796
- [`04d75eb`](https://github.com/jhuckaby/cronicle/commit/04d75eb9c6b889f0e75a8d2030afe6124f1a567a): Add EOL error message

## Version v0.9.88

> August 13, 2025

- [`6e3ebae`](https://github.com/jhuckaby/cronicle/commit/6e3ebaee204e2fe86db05e8ac04241406cf74e67): Version 0.9.88
- [`de45621`](https://github.com/jhuckaby/cronicle/commit/de45621d343450bf315734d192b522455ed58086): Add security options to web server headers for HTML pages.
- [`a553491`](https://github.com/jhuckaby/cronicle/commit/a5534917e0b47f01b8012c6d39988ce78739e6f7): Remove Access-Control-Alllow-Origin header (legacy)
- [`6f40fdd`](https://github.com/jhuckaby/cronicle/commit/6f40fdd32c39adc68f20461636ad613ebeff0756): Remove all HTML from notification messages, as it is now escaped as of the latest pixl-webapp.

## Version v0.9.87

> August 13, 2025

- [`78ccf62`](https://github.com/jhuckaby/cronicle/commit/78ccf62447e55ac05ec5984ff456fd5fb79e8f21): Version 0.9.87
	- Bump pixl-server-user to v1.0.28 for vuln fux in password reset email URLs.
	- Add doc blurb on http_allow_hosts, and recommended use for production
	- Thanks to @matthewjhands for reporting the vuln.
	- Fixes #916

## Version v0.9.86

> August 11, 2025

- [`c109a78`](https://github.com/jhuckaby/cronicle/commit/c109a78a793b87e7adfd2f5cd60435d758ad0406): Version 0.9.86
	- Bump pixl-webapp to v2.0.3 for a XSS vuln fix, found by @matthewjhands.  Thank you Matthew!
	- Bump pixl-server-web to latest, for new features (and to bump formidable to v3.5.4, to squelch a loud NPM warning).

## Version v0.9.85

> July 22, 2025

- [`34aa85c`](https://github.com/jhuckaby/cronicle/commit/34aa85c7e782e63f1e4a6d7d9cedc8da7b4d12d1): Version 0.9.85
	- Another fix for same form-data vulnerability (via pixl-server-user module, which I missed the first time around)

## Version v0.9.84

> July 22, 2025

- [`e46fa1e`](https://github.com/jhuckaby/cronicle/commit/e46fa1ed305ba320e5806e43fef41cdbe288d82a): Version 0.9.84
	- Bump pixl-request to v2.3.1 for upstream vuln fix in form-data
	- See: https://github.com/jhuckaby/pixl-request/security/dependabot/1

## Version v0.9.83

> July 17, 2025

- [`c9cc1a1`](https://github.com/jhuckaby/cronicle/commit/c9cc1a1a33cd8af42249e8e66f87fc86a209347c): Version 0.9.83
	- Add support for pushover.net for web hooks
	- Special thanks to @Maxzhao1999 for the feature request!

## Version v0.9.82

> July 14, 2025

- [`03bc094`](https://github.com/jhuckaby/cronicle/commit/03bc0942e801fc75841315e6d025adc21197ac4f): Version 0.9.82
	- Add support for proxies (for web hooks and the HTTP Plugin)
	- See: https://github.com/jhuckaby/Cronicle/wiki/Proxy-Servers
	- Fixes #908

## Version v0.9.81

> June 30, 2025

- [`a12eacb`](https://github.com/jhuckaby/cronicle/commit/a12eacbe5192788485f82035d32c9cd9880df83c): Version 0.9.81
	- Fixes #903 - some ordinal day of month suffixes are incorrect
	- Adjust color label checkbox colors for better visibility
- [`7f0b06c`](https://github.com/jhuckaby/cronicle/commit/7f0b06ca2c81e3193cb0a2bfb00b8cd5ac0191e1): Updated TOC.
- [`d76f6bd`](https://github.com/jhuckaby/cronicle/commit/d76f6bdb332d1120ff1092114d2504a7736c504f): Added section on S3 compatible services (MinIO)

## Version v0.9.80

> May 2, 2025

- [`31cd4a9`](https://github.com/jhuckaby/cronicle/commit/31cd4a91cfcbd3a0f86ebc54418b2cce7ab83ef1): Version 0.9.80
	- Allow standard auth for get_job_log API.  Fixes #896.

## Version v0.9.79

> April 24, 2025

- [`b391707`](https://github.com/jhuckaby/cronicle/commit/b391707f5260e2cb4c42c02270c1dbaddf0b0f6c): Version 0.9.79
	- FIxed issue with timeout error message precision after 1 hour
	- Fixes #895

## Version v0.9.78

> April 22, 2025

- [`9580980`](https://github.com/jhuckaby/cronicle/commit/958098043ceb107411877ae0429af46244cb3f12): Version 0.9.78
	- Now firing chain reaction for scheduler failures, if configured
	- Fixes #885

## Version v0.9.77

> March 20, 2025

- [`96a8c9f`](https://github.com/jhuckaby/cronicle/commit/96a8c9f9c011be4fb261ece9f8a9dd7524bf4d17): Version 0.9.77
	- Fixed issue where check_user_exists API didn't require auth when free_accounts was false.
	- See Discussion: https://github.com/jhuckaby/Cronicle/discussions/882

## Version v0.9.76

> February 27, 2025

- [`89ba6b2`](https://github.com/jhuckaby/cronicle/commit/89ba6b22fcf468fed4d6d17a9135e0d442f1a2a8): Update TOC
- [`5f7b3a5`](https://github.com/jhuckaby/cronicle/commit/5f7b3a5dd80f9bb9bf48de03362ea0aba9027e02): Version 0.9.76
- [`ca88c72`](https://github.com/jhuckaby/cronicle/commit/ca88c72c9233184b8f6d7c41986720a522c91a0a): Implement max_emails_per_day

## Version v0.9.75

> February 25, 2025

- [`8f10917`](https://github.com/jhuckaby/cronicle/commit/8f10917589e71af811183417405dad08bedff9d8): Version 0.9.75
- [`aa989ac`](https://github.com/jhuckaby/cronicle/commit/aa989acdc99e1ac1f8a050f32acb582c7904cb63): Bump pixl-server to 1.0.45 for log filtering feature.
- [`6e01b73`](https://github.com/jhuckaby/cronicle/commit/6e01b73303260b91a863c173f9f0dbf7f49739c2): Set debug_level to 9 for debug mode.
- [`5230017`](https://github.com/jhuckaby/cronicle/commit/5230017cb51d3f3a1096ec7f908757b50616f2c2): Drop default debug_level to 5.

## Version v0.9.74

> February 19, 2025

- [`98c70f3`](https://github.com/jhuckaby/cronicle/commit/98c70f37a6a7d8458bcd50656f2f6ac5269e836c): Version 0.9.74
	- Prevent non-admins from seeing any Admin UI.  Fixes #869.
- [`8ea9255`](https://github.com/jhuckaby/cronicle/commit/8ea9255093188b392b1690884f3879dad709f986): Insure NPM is preinstalled in install script.  Add to docs too.

## Version v0.9.73

> February 9, 2025

- [`109c6dc`](https://github.com/jhuckaby/cronicle/commit/109c6dc978461e525902d3115e5441dcaaa9b937): Version 0.9.73
	- Bump pixl-mail to v1.1.3 for nodemailer v6.10.0, for fixing a DeprecationWarning
- [`03b2d53`](https://github.com/jhuckaby/cronicle/commit/03b2d532d8c2e0c9624501e13925fb1fb0b7500b): Add OS version
- [`0eabeb3`](https://github.com/jhuckaby/cronicle/commit/0eabeb3cfc2d24b0b7001ea4cc6e5391ece7a85d): Typo
- [`980a645`](https://github.com/jhuckaby/cronicle/commit/980a645605d20d27ca725dea83fd3952db8b9b33): Fix typos
- [`ba44d41`](https://github.com/jhuckaby/cronicle/commit/ba44d411065b2d569b833cc33dae128cb87c8ea9): Add config.yml
- [`713dafa`](https://github.com/jhuckaby/cronicle/commit/713dafa3d8179f2f3b28bf120909f25c8f2c5481): New issue templates, CoC, update copyright years.

## Version v0.9.72

> February 3, 2025

- [`5a26f21`](https://github.com/jhuckaby/cronicle/commit/5a26f2193ed8329996efb164efd1043196154e49): Version 0.9.72
- [`25e5628`](https://github.com/jhuckaby/cronicle/commit/25e562823518b3401681f1255fa59d04f6e05209): Resurrecred live log links feature, now with auth.
- [`77e4937`](https://github.com/jhuckaby/cronicle/commit/77e4937f6d735437ef50b40075c16250289e9cf6): Add `max_clock_drift` config prop (default 10).

## Version v0.9.71

> January 27, 2025

- [`0ba49de`](https://github.com/jhuckaby/cronicle/commit/0ba49de60701503ae2c224b7449af0596f7bd33a): Version 0.9.71
	- No changes, did commit/tag out of order last time, re-tagging to fix.

## Version v0.9.70

> January 27, 2025

- [`b2c6735`](https://github.com/jhuckaby/cronicle/commit/b2c6735c6fec5d271b05b046ec47f8622ee5e9d0): Version 0.9.70
	- The Job Log API is now protected with a special SHA-256 cryptographic token, which is unique for every job.
	- The Job Log Download URLs have been removed from all outgoing emails to reduce accidental sharing.
	- Users can still view and download job logs by going to the Job Details Page (authenticated), and then clicking the links from there (which have the SHA-256 tokens embedded in them).
	- Fixes #847

## Version v0.9.69

> January 22, 2025

- [`1fedca6`](https://github.com/jhuckaby/cronicle/commit/1fedca69be122b5a66dbdca2bbd79bd675d18317): Version 0.9.69
	- Bump pixl-server-user to v1.0.25 for new `self_delete` config property.
	- FIxes #845

## Version v0.9.68

> January 6, 2025

- [`f971067`](https://github.com/jhuckaby/cronicle/commit/f9710672cafcc193139ea3450a352ebfeffcd340): Version 0.9.68
	- Bump pixl-server-web to v2.0.7 for automatic reloading of SSL certs if they change on disk.
	- Fixes #843

## Version v0.9.67

> January 3, 2025

- [`81833f1`](https://github.com/jhuckaby/cronicle/commit/81833f1b3053eccfff87c092100525bb8b940de2): Version 0.9.67
	- Added custom job labels.
- [`4fa8743`](https://github.com/jhuckaby/cronicle/commit/4fa8743262d2455f6ee5b104ea69aae585620cee): Change verbiage re: Node LTS versions.

## Version v0.9.66

> December 29, 2024

- [`502f6d3`](https://github.com/jhuckaby/cronicle/commit/502f6d32ab45ae78e6da601c29a1f196ec6a2f73): Version 0.9.66
	- Switched `control.sh` script over to using bash instead of sh.
	- Added check for nvm to work during boot, when node is not installed in the usual location.
	- Fixes #780

## Version v0.9.65

> December 24, 2024

- [`c7552bb`](https://github.com/jhuckaby/cronicle/commit/c7552bb248e1a6d538fe21273e04e200bc995a40): Version 0.9.65
	- Bump pixl-server-web to 2.0.5 for proper SNI / TLS handshake host validation.

## Version v0.9.64

> December 23, 2024

- [`a3e3241`](https://github.com/jhuckaby/cronicle/commit/a3e324134cb2e95bfbce7f8a7ffcc0c34dbc7172): Version 0.9.64
	- Bump pixl-server-web to v2.0.4 for new `http_allow_hosts` feature.  Fixes #839.

## Version v0.9.63

> December 18, 2024

- [`7a35af5`](https://github.com/jhuckaby/cronicle/commit/7a35af53c325b782e65dff89122a0610099b5de0): Version 0.9.63
	- Remove dependency "glob" as it has vulns.
	- Now using pixl-tools custom glob implementation.

## Version v0.9.62

> December 17, 2024

- [`06aa1a6`](https://github.com/jhuckaby/cronicle/commit/06aa1a628dc7b8022eea55599a3648147d126cda): Version 0.9.62
	- Bump pixl-boot to v2.0.1 for macOS fix.
- [`48490e0`](https://github.com/jhuckaby/cronicle/commit/48490e0d9a97245d2f75ade7546f34ff266f4f93): Loosen restriction on base URI match for API filter, for injecting server_groups.

## Version v0.9.61

> October 18, 2024

- [`ae28d63`](https://github.com/jhuckaby/cronicle/commit/ae28d63be2fe4b9498da686bdf1dcccbe8a47ad0): Version 0.9.61
	- Improve display of chain reaction jobs on Job Detail page.
	- Link chain reaction to originating job.
	- Widen event name input field.
	- Widen chain reaction menus for selecting jobs.
- [`636b198`](https://github.com/jhuckaby/cronicle/commit/636b198e9c15b64c1213d8acb31effef9103b82c): Bump cookie and socket.io

## Version v0.9.60

> October 3, 2024

- [`8ef1076`](https://github.com/jhuckaby/cronicle/commit/8ef10765d68fd336273285dd7b79ee7c92c5d675): Version 0.9.60
	- Bring back the live job status column, but show "Last Run" if no active jobs.
- [`c237962`](https://github.com/jhuckaby/cronicle/commit/c2379629e1e47d9d64ffca1eac31b01fe115eb76): Fix grammar
- [`6cf86b7`](https://github.com/jhuckaby/cronicle/commit/6cf86b783f15f4d0754c7fb6e58cad0332fd79f9): Added note about `timing` object and subtle behavior differences.
- [`a10bcbc`](https://github.com/jhuckaby/cronicle/commit/a10bcbccfa6302ff10de9b2660eef35ea9fee832): initialize custom_live_log_socket_url

## Version v0.9.59

> August 6, 2024

- [`99a82d2`](https://github.com/jhuckaby/cronicle/commit/99a82d2bd8eda424e13090a88ba28fc66e048f2e): Version 0.9.59
	- Bump pixl-server-storage to v3.2.2 for upstream vuln fix.
	- Bump `@aws-sdk/client-s3` and `@aws-sdk/lib-storage` to 3.621.0 for vuln fix: GHSA-mpg4-rc92-vx8v
	- Bump `@smithy/node-http-handler` to 3.1.4 for good measure.
	- Refs:
	- https://github.com/advisories/GHSA-mpg4-rc92-vx8v
	- https://github.com/jhuckaby/pixl-server-storage/commit/f6a589a1b11372cbedb5c0a6ae1156fad0ec1465

## Version v0.9.58

> July 31, 2024

- [`b485288`](https://github.com/jhuckaby/cronicle/commit/b48528890caa5fe34cf7e321c4a5b06a51156815): Version 0.9.58
	- Fixed loading screen before a primary server is selected.

## Version v0.9.57

> July 31, 2024

- [`26aded4`](https://github.com/jhuckaby/cronicle/commit/26aded494f1f6a21dc5750cfa5aa71a5772e2af6): Version 0.9.57
	- Fix PID file issue where another process may be assigned our old PID after an unclean shutdown.
	- Bump pixl-server to v1.0.44 for same reason.
	- Fixes #789

## Version v0.9.56

> July 17, 2024

- [`08b1288`](https://github.com/jhuckaby/cronicle/commit/08b1288a5c1bca32392729baf3079704d71c8753): Version 0.9.56
	- Fix bug where live log view/download failed on detached jobs.  Fixes #786.

## Version v0.9.55

> July 16, 2024

- [`801d103`](https://github.com/jhuckaby/cronicle/commit/801d1033808549cde0dfb42f8ff2be1d820fa251): Version 0.9.55
	- Fixed typo in `job_read_only` implementation.

## Version v0.9.54

> July 15, 2024

- [`6bd3d90`](https://github.com/jhuckaby/cronicle/commit/6bd3d9076050001e182dacfac54f00537a26e12b): Version 0.9.54
	- Added optional `job_read_only` privilege.  When set, a user (or API key) can ONLY run stock events from the schdule, with NO customization.

## Version v0.9.53

> June 21, 2024

- [`eb2808f`](https://github.com/jhuckaby/cronicle/commit/eb2808f8531b37e52e4bf9f1f4b74b617301644a): Version 0.9.53
	- Bump `socket.io` and `socket.io-client` to 4.7.5 for vuln fix.
	- https://github.com/socketio/socket.io/pull/5052
	- https://www.tenable.com/cve/CVE-2024-37890
- [`cebf921`](https://github.com/jhuckaby/cronicle/commit/cebf921cb5c90ef66472e1381498b3f2121aab0b): Added error for installing on machines with less than 64 MB RAM.

## Version v0.9.52

> June 7, 2024

- [`5ffd58c`](https://github.com/jhuckaby/cronicle/commit/5ffd58c96a1efcd4c82fd8c8fb3659cc5b48e1f4): Version 0.9.52
	- New optional client config param: `prompt_before_run` (see Discussion #771)
	- Removed duplicate TOC entry in doc.
	- Fixed manual run-all jobs when servers shut down unexpectedly (fixes #757)
- [`8d3389a`](https://github.com/jhuckaby/cronicle/commit/8d3389a38ef95f08498079c62634dd42d5c97429): New optional client config param: `prompt_before_run`
- [`a1f0b67`](https://github.com/jhuckaby/cronicle/commit/a1f0b67895b6e1e0ed956717cc6dba1036b48ac5): Removed duplicate TOC entry.
- [`b45a635`](https://github.com/jhuckaby/cronicle/commit/b45a63565bb20f4f897b4fb34aabb49bd05e50ef): Fixed manual run-all jobs when servers shut down unexpectedly.
- [`ec87118`](https://github.com/jhuckaby/cronicle/commit/ec871188683102c1a4945d84a854976576d1ead8): Added note regarding issue #757

## Version v0.9.51

> May 13, 2024

- [`0766211`](https://github.com/jhuckaby/cronicle/commit/0766211161ddcc1a88b3920f7a023e8655e870f2): Version 0.9.51
	- Added optional client config properties: `default_job_history_limit` and `default_job_stats_limit`.
	- Fixes #756

## Version v0.9.50

> May 13, 2024

- [`846f974`](https://github.com/jhuckaby/cronicle/commit/846f9748aa29502e8ea59a681a85ac618684e843): Version 0.9.50
	- Changed behavior so manually started jobs will be rewinded if failed and Run All Mode is set.
	- Fixes #757
	- Updated docs regarding timeouts and Run All Mode.

## Version v0.9.49

> May 10, 2024

- [`db3b4b8`](https://github.com/jhuckaby/cronicle/commit/db3b4b8c9698e7e7acd1f76cfad69fde15b6bb82): Version 0.9.49
	- Bump `pixl-server-web` to v2.0.0 to prevent XSS reflection style attacks on APIs.
	- Misc fixes to remove legacy JSONP-style APIs.
	- Fixes #755

## Version v0.9.48

> May 7, 2024

- [`813f401`](https://github.com/jhuckaby/cronicle/commit/813f40105e9b7eb602e6387c7ad0b61be2c9026f): Version 0.9.48
	- Bump pixl-server-user to 1.0.22 for script injection vuln fix.
	- Fixes #752

## Version v0.9.47

> April 29, 2024

- [`990e7ed`](https://github.com/jhuckaby/cronicle/commit/990e7eda67d6726af349d44d1b719d9b74f7c620): Version 0.9.47
	- Disabled the "event autosave" feature that saves the state of an event edit, when you leave without saving.  It creates confusion.

## Version v0.9.46

> April 23, 2024

- [`dc0340d`](https://github.com/jhuckaby/cronicle/commit/dc0340d5f1fbcbaae42918fddc849d749a06600b): Version 0.9.46
	- Bump pixl-server-web to v1.3.30 for vulnerability fix in formidable module: https://github.com/advisories/GHSA-8cp3-66vr-3r4c

## Version v0.9.45

> March 12, 2024

- [`9d2cfad`](https://github.com/jhuckaby/cronicle/commit/9d2cfad889bdb1e7586f4a81de3ec035f42880b5): Version 0.9.45
	- Added support for custom Group (GID) for Plugins.

## Version v0.9.44

> February 20, 2024

- [`1fb0515`](https://github.com/jhuckaby/cronicle/commit/1fb0515e7ee91fc5565ab4098ab3c1f77199bd35): Version 0.9.44
	- Fixes #724.  Thank you so much @moonsoftsrl!
- [`645d620`](https://github.com/jhuckaby/cronicle/commit/645d620596219b125d6c0623c9be192b999dee82): Fix cert_bypass

## Version v0.9.43

> February 18, 2024

- [`dc27639`](https://github.com/jhuckaby/cronicle/commit/dc2763961184cb4f687841b9b9dfb4c265a1e034): Version 0.9.43
	- Bumped pixl-tools to v1.1.1 for speed improvements on `glob()` and `rimraf()`.

## Version v0.9.42

> February 18, 2024

- [`019b900`](https://github.com/jhuckaby/cronicle/commit/019b90069958650de172fa5e8ed7f3f19e41b71a): Version 0.9.42
	- Bump pixl-tools to v1.1.0 for multiple vuln fixes in nested packages (namely glob and rimraf).

## Version v0.9.41

> February 15, 2024

- [`759f64e`](https://github.com/jhuckaby/cronicle/commit/759f64efc457b697c3892aff979e08c9e8bc5d43): Version 0.9.41
	- Bump pixl-mail to v1.0.14 for upstream vuln fix in nodemailer.
- [`e1182c9`](https://github.com/jhuckaby/cronicle/commit/e1182c9a1919f835677e4235a70508d3ab841361): Updated copyright year.
- [`bbd7c08`](https://github.com/jhuckaby/cronicle/commit/bbd7c08cbdc3e979f42dbeca1a33ac2ca333de99): Added blurb about standard Node install locations.

## Version v0.9.40

> December 18, 2023

- [`b86792e`](https://github.com/jhuckaby/cronicle/commit/b86792e18b449b8960f89c4d9b53eb9934caa661): Trying to get deps under control.
- [`e5e3340`](https://github.com/jhuckaby/cronicle/commit/e5e3340bbc584cedbec6da72d6edd34979960dc5): Bump lodash from 4.17.10 to 4.17.21
- [`3a1aff7`](https://github.com/jhuckaby/cronicle/commit/3a1aff7c0847ac32a9b023a939d960616adbc29f): Version 0.9.40
	- Update deps to latest, rebuild package-lock.

## Version v0.9.39

> November 16, 2023

- [`2c9f6ae`](https://github.com/jhuckaby/cronicle/commit/2c9f6aed51d7d712749248b81b1578812225518d): Version 0.9.39
	- Added `/api/app/get_servers` route, admin only, currenly undocumented.

## Version v0.9.38

> October 23, 2023

- [`82a162a`](https://github.com/jhuckaby/cronicle/commit/82a162a9b962ace5513800d7173a7c21ab24b494): Version 0.9.38
	- Added `chain_params` feature.

## Version v0.9.37

> October 17, 2023

- [`6dda68e`](https://github.com/jhuckaby/cronicle/commit/6dda68effab67b67295a350c10d0cd70b2520362): Version 0.9.37
	- Added package-lock.json.
	- Fixes #656

## Version v0.9.36

> October 12, 2023

- [`ca1ae43`](https://github.com/jhuckaby/cronicle/commit/ca1ae437ec4fc9af472e24bd076346ca17392283): Version 0.9.36
	- Add some common locations into the PATH env var during startup.

## Version v0.9.35

> October 3, 2023

- [`580ca9a`](https://github.com/jhuckaby/cronicle/commit/580ca9a913ed57306e37aff42abaa2a46a156a19): Version 0.9.35
	- Add client.hide_schedule_checkboxes feature.
	- Bump pixl-server-web to v1.3.22 for alt ports.

## Version v0.9.34

> October 3, 2023

- [`83c4eaa`](https://github.com/jhuckaby/cronicle/commit/83c4eaa204341b48f90d0971dfcee8e193471db0): Version 0.9.34
	- Remove legacy use of `NODE_TLS_REJECT_UNAUTHORIZED` env var.
	- Update docs on `web_hook_custom_opts`
	- Support for future pixl-server-web listeners array (multi-port).
	- Remove old `listRoughChop`, now using official `listSplice` API.
- [`ebad37e`](https://github.com/jhuckaby/cronicle/commit/ebad37e258f2c67b4b44e3570ef5bec5b3d720a1): Added disclaimer to doc about remote_server_port

## Version v0.9.33

> September 20, 2023

- [`a742345`](https://github.com/jhuckaby/cronicle/commit/a742345ade8a9a603d209e3ca220ff20747d9756): Version 0.9.33
	- Fixing more bugs that surfaced because of `remote_server_port`.

## Version v0.9.32

> September 20, 2023

- [`0b05b3c`](https://github.com/jhuckaby/cronicle/commit/0b05b3c2321bca5c43ed7dccb59dea997fe3237d): Version 0.9.32
- [`74cd3b7`](https://github.com/jhuckaby/cronicle/commit/74cd3b7281845043ebac1e9175041ae448286cd7): Typo fix, thanks @seanford !
- [`c27507e`](https://github.com/jhuckaby/cronicle/commit/c27507e755b9c4bc818c67a8932364281b45b1eb): Updated TOC.

## Version v0.9.31

> September 20, 2023

- [`dd9c10e`](https://github.com/jhuckaby/cronicle/commit/dd9c10e2357dd4e383c5cef92d96b099af002d6d): Version 0.9.31
	- Added `remote_server_port` property (optional).
- [`9b51f5c`](https://github.com/jhuckaby/cronicle/commit/9b51f5c49e36c6851c426b7dc21d40e0606cccd4): Updated TOC.
- [`5f44aad`](https://github.com/jhuckaby/cronicle/commit/5f44aad53cac953939b5cea95456f2d3e3b7e844): Using parseInt for user active.
- [`dfe8a77`](https://github.com/jhuckaby/cronicle/commit/dfe8a77eb9306c5417a79539ba48ab970c1c734b): Added docs on `get_event_history` and `get_history` API calls.

## Version v0.9.30

> August 18, 2023

- [`996750a`](https://github.com/jhuckaby/cronicle/commit/996750a7453f88d1bcc696057f14209988428155): Version 0.9.30
	- Fix bug where suspending a user in the UI doesn't work at all.
	- Fixes #626

## Version v0.9.29

> August 18, 2023

- [`840f043`](https://github.com/jhuckaby/cronicle/commit/840f043e0d9e2140ea84e96a2af2509f25a0bbec): Version 0.9.29
	- Bump pixl-server-web to v1.3.20 for crash fix when viewing zero-byte files.

## Version v0.9.28

> August 18, 2023

- [`e15f03f`](https://github.com/jhuckaby/cronicle/commit/e15f03f7fd5bb3f79ff41ffac3fbce8ed8fa69f2): Version 0.9.28
- [`90df805`](https://github.com/jhuckaby/cronicle/commit/90df8059cd58fdac8141021be3216ec2a2322863): Fixed bug where searching for pure numbers wouldn't match any events.
- [`ddec311`](https://github.com/jhuckaby/cronicle/commit/ddec31176f9905a585e4179ab37b6d430b8499ac): Cleaned up sample S3 config in docs.

## Version v0.9.27

> August 10, 2023

- [`14b6000`](https://github.com/jhuckaby/cronicle/commit/14b60005f9fde30a6b8bad68bd623f581717cb1b): Version 0.9.27
	- Added pixl-boot for automatic start on server boot.
	- Updated docs for clarification on behavior.

## Version v0.9.26

> August 7, 2023

- [`8872c8a`](https://github.com/jhuckaby/cronicle/commit/8872c8aaf37587dd87912c095b764fc7449a9de3): Version 0.9.26
	- Fixed several issues in the Storage CLI script.
	- CLI: Disable transactions
	- CLI: Make sure Cronicle isn't running for write actions

## Version v0.9.25

> July 23, 2023

- [`497ddd4`](https://github.com/jhuckaby/cronicle/commit/497ddd408e736bee660b17d5c3b63f1693f7db65): Version 0.9.25
	- Bump socket.io to v4.7.1 for vuln: https://security.snyk.io/vuln/SNYK-JS-ENGINEIO-5496331

## Version v0.9.24

> July 17, 2023

- [`52920c9`](https://github.com/jhuckaby/cronicle/commit/52920c91dfc90d3a7d11efbf1330e4ecabb4524a): Version 0.9.24
	- Enable storage transactions by default.
	- Ship with new storage repair script.
	- Ensure Node.js version is 16+ on startup.
- [`0f5c041`](https://github.com/jhuckaby/cronicle/commit/0f5c04134d60d3fcc454e89376c5e0c61eba5ced): Improve Plugin API documentation for successful job result
- [`c3750f7`](https://github.com/jhuckaby/cronicle/commit/c3750f75f927bf8b85cf400ed179c3463a7ea38f): Updated TOC.

## Version v0.9.23

> June 1, 2023

- [`20a7502`](https://github.com/jhuckaby/cronicle/commit/20a75027114f7d9859b971f6b2ab732e0d067150): Version 0.9.23
	- Added new `get_master_state` API and docs.
	- Added docs for  `update_master_state` API.

## Version v0.9.22

> May 19, 2023

- [`83681fb`](https://github.com/jhuckaby/cronicle/commit/83681fb0821959b0e40f30ebf722078db9f210cf): Version 0.9.22
- [`01f38bd`](https://github.com/jhuckaby/cronicle/commit/01f38bde834213f1df44c64c15e95c1b6bda27f4): Increase schedule column max-width to 600px.
- [`df93a69`](https://github.com/jhuckaby/cronicle/commit/df93a6948c1b59a8c44986bdf04b96e3745cb548): Show confirmation dialog for toggling the scheduler.

## Version v0.9.21

> April 19, 2023

- [`85f9862`](https://github.com/jhuckaby/cronicle/commit/85f98621efff8aaaa6ff2ae1cac43e1b16d23e3b): Version 0.9.21
	- Support for Discord Web Hooks, added `content` property into web hook text props.
	- Thanks to @mikeTWC1984 for this fix!
- [`1e52ea3`](https://github.com/jhuckaby/cronicle/commit/1e52ea3ffdffc0f6c9558e4df0d1a0e4a6e14a9a): Updated copyright year.

## Version v0.9.20

> January 30, 2023

- [`9f574e7`](https://github.com/jhuckaby/cronicle/commit/9f574e7a730f4a0f7d3bbe271be49847f092f03f): Version 0.9.20
	- Now validating timezone on create_event, update_event, run_event and update_job APIs
	- Fixes #571
- [`1ab8b85`](https://github.com/jhuckaby/cronicle/commit/1ab8b8569db38b911ad26b2614f40e1e3ca6c160): Added correct packages to check between installs.

## Version v0.9.19

> December 28, 2022

- [`3001ab4`](https://github.com/jhuckaby/cronicle/commit/3001ab4a1e0a4b08a7fd5433a9b53ded3692790a): Version 0.9.19
	- Bumped pixl-logger to v2.0.2
	- Bumped pixl-webapp to v2.0.2

## Version v0.9.18

> December 28, 2022

- [`1e80586`](https://github.com/jhuckaby/cronicle/commit/1e805864cc3691c38598576d3e26c9e1bc29ca20): Version 0.9.18
	- Add new `tz` configuration property in the `client` object.  This will override the auto-detected TZ in all users browsers.
	- Fixes #565

## Version v0.9.17

> December 11, 2022

- [`d2521f3`](https://github.com/jhuckaby/cronicle/commit/d2521f38a73660e3393f22d133c86578af911450): Version 0.9.17
	- Bump socket.io to v4.5.4 to fix vulns.
	- Bump pixl-server-web to v1.3.15 to fix vulns in formidable.
- [`7c716a8`](https://github.com/jhuckaby/cronicle/commit/7c716a82731b9a91108dcf7a90f6ff1da7e6ca00): Fixed unit test when config API was changed.

## Version v0.9.16

> November 11, 2022

- [`a2d3f01`](https://github.com/jhuckaby/cronicle/commit/a2d3f01b2a83df39d987efd7cd86906bfd327e28): Version 0.9.16
	- Fix dependency vuln: https://github.com/advisories/GHSA-qm95-pgcg-qqfq

## Version v0.9.15

> November 2, 2022

- [`c7486df`](https://github.com/jhuckaby/cronicle/commit/c7486df2539b1503a0be5ded17e9b0c2d5b9a9ea): Version 0.9.15
	- Addresses XSS aspect of issue #546

## Version v0.9.14

> October 26, 2022

- [`8e8e348`](https://github.com/jhuckaby/cronicle/commit/8e8e34832a5ecdd4b21c81bc1350b7fe41a8e872): Version 0.9.14
	- Fixed issue with newest pixl-server-storage and @aws-sdk/client-s3 library.

## Version v0.9.13

> October 18, 2022

- [`2085e2c`](https://github.com/jhuckaby/cronicle/commit/2085e2c111d00a442380403eaf3a05fa2aa7798d): Version 0.9.13
	- Removed block that was preventing API keys from becoming admins.
	- See: https://github.com/jhuckaby/Cronicle/discussions/479
- [`73c9e48`](https://github.com/jhuckaby/cronicle/commit/73c9e4883394dd2a705f7dadf4573be626e064df): Updated S3 docs to reflect latest pixl-server-storage changes.
- [`18c20a8`](https://github.com/jhuckaby/cronicle/commit/18c20a8112e757db1440bdd6f6028d3d8cf81f9b): More minor doc nav tweaks.
- [`3d357e1`](https://github.com/jhuckaby/cronicle/commit/3d357e1d409de83ad80076e3891694ee608d4745): Minor tweaks to docs.

## Version v0.9.12

> September 21, 2022

- [`455a29f`](https://github.com/jhuckaby/cronicle/commit/455a29fb66cbfbe9b42fffde02d3633e32bbb477): Version 0.9.12
	- Bumped moment-timezone to v0.5.35 for vulns.
- [`67b5013`](https://github.com/jhuckaby/cronicle/commit/67b50134e8b42fbc23e166d7e96947dceb01bed4): Still playing with doc nav UI a bit.
- [`987f64e`](https://github.com/jhuckaby/cronicle/commit/987f64ef9afb844c79b7c426c12ad621adcafc4a): Minor doc UI fix.
- [`d940525`](https://github.com/jhuckaby/cronicle/commit/d940525d66e5805ae671e991f63df6bb94f7daa4): Reworked documentation to split across files.

## Version v0.9.11

> August 28, 2022

- [`44556ab`](https://github.com/jhuckaby/cronicle/commit/44556ab98fa65eddc65e667ce7f6021e6c0b3016): Version 0.9.11
- [`ec4b491`](https://github.com/jhuckaby/cronicle/commit/ec4b4910515a86c323debcc5390fd005781694e4): Fixed security issue where websockets auth'ed with user sessions could run admin commands.

## Version v0.9.10

> August 22, 2022

- [`9a598c8`](https://github.com/jhuckaby/cronicle/commit/9a598c82d3e15a2e617946b686f1710bafd2676d): Version 0.9.10
- [`8e04a57`](https://github.com/jhuckaby/cronicle/commit/8e04a577055acb61c0efbea1d4c41499b88b3df1): Added blurb about JSON output and `complete` flag.
- [`5988163`](https://github.com/jhuckaby/cronicle/commit/5988163a8ce983afbe5137b8016b096918a29230): Fixed bug where rogue JSON from Plugin could overwrite sensitive job data.
- [`49f6a1b`](https://github.com/jhuckaby/cronicle/commit/49f6a1ba5564a474a19c28f2005f3b22de8939a3): Fixes #516

## Version v0.9.9

> July 28, 2022

- [`b939bf4`](https://github.com/jhuckaby/cronicle/commit/b939bf4253bad1d476887577f0ef9093ad9b09c8): Bumped moment to v2.29.4 for vuln

## Version v0.9.8

> July 26, 2022

- [`0e374c8`](https://github.com/jhuckaby/cronicle/commit/0e374c8a9d0f638a4978ff1e1a9570587d6e5618): Version 0.9.8
- [`8c500b9`](https://github.com/jhuckaby/cronicle/commit/8c500b9954e8061342b2bd3400596e9035385aaf): Allow for escaped shell variables in job params.

## Version v0.9.7

> May 4, 2022

- [`a4a39ac`](https://github.com/jhuckaby/cronicle/commit/a4a39ac75e0e05a0ef1937993c307436f8d6fb44): Version 0.9.7
	- Schedule page now shows "Last Run" result (success or fail).
	- Saved in state database, survives restarts.
	- Click on last run bubble to jump to latest job detail.
	- Updated in real-time.
	- Filter events based on last run status.
- [`9c864fe`](https://github.com/jhuckaby/cronicle/commit/9c864fe303ce38c8928401111a45f481738d9788): Removed redundant call to npm install.

## Version v0.9.6

> April 27, 2022

- [`c55b175`](https://github.com/jhuckaby/cronicle/commit/c55b175054e040bf7f2d50d42946ae827318be49): Version 0.9.6
	- Bumped moment to v2.29.2 for vuln patch
	- https://github.com/advisories/GHSA-8hfj-j24r-96c4
	- Bumped moment-timezone to v0.5.34 for latest TZ data.

## Version v0.9.5

> April 27, 2022

- [`962d711`](https://github.com/jhuckaby/cronicle/commit/962d71135bb2c2920a7d4bf0550fe04b879b55eb): Version 0.9.5
	- Bumped various deps for async vuln patch
	- https://github.com/advisories/GHSA-fwr7-v2mv-hh25
- [`1720340`](https://github.com/jhuckaby/cronicle/commit/1720340106463f1858f3a0e58bf2355f1cf2c780): Bumped async to v2.6.4 for vuln

## Version v0.9.4

> April 27, 2022

- [`a79cb4a`](https://github.com/jhuckaby/cronicle/commit/a79cb4a0b1c39a642719d06a229f9e0711a82b87): Version 0.9.4
- [`c8f06a2`](https://github.com/jhuckaby/cronicle/commit/c8f06a2a81d88235fe3c1db2af7f6d6ac7634987): Bug fix: Event List: Redraw breaks menus and search box
- [`867e245`](https://github.com/jhuckaby/cronicle/commit/867e245b5dc61953fa8e88d632d4f1616eb21e77): Added note about Couchbase v2

## Version v0.9.3

> April 6, 2022

- [`d2800fe`](https://github.com/jhuckaby/cronicle/commit/d2800fe244a15eb4abfd50018ba4c55817883227): Version 0.9.3
	- Bumped pixl-request to v2.0.1
	- Fixes #486 (thanks user @Musarrath!)
- [`6c26889`](https://github.com/jhuckaby/cronicle/commit/6c268899870f48e048597f2847b719433320cf89): Fixed bug in unit tests with queue collision.

## Version v0.9.2

> December 16, 2021

- [`90ada98`](https://github.com/jhuckaby/cronicle/commit/90ada989b15c00bfa00d51abfbfa971c3293da39): Version 0.9.2
	- Updated copyright year in various places.

## Version v0.9.1

> December 16, 2021

- [`3593ef8`](https://github.com/jhuckaby/cronicle/commit/3593ef8b082c8ff3d6dd896b6aaf15723dbadef1): Version 0.9.1
	- Typo, missed reference to old legacy dependency.
- [`c2bfdc1`](https://github.com/jhuckaby/cronicle/commit/c2bfdc15e6067661c9ec1f83a2f4b08d3c2ca3a3): Added v0.9 upgrade note to top of README.

## Version v0.9.0

> December 16, 2021

- [`a093f6b`](https://github.com/jhuckaby/cronicle/commit/a093f6b94dba3bb6017b3f9e621ddecf84892973): Version 0.9.0 -- bumped deps for vulns
	- Bumped socket.io to v4.4
	- Removed mkdirp
	- Bumped uglifyjs to v3.14.3
	- Bumped shell-quote to v1.7.3
	- Bumped pixl-server-storage to v3.0.11
- [`3748186`](https://github.com/jhuckaby/cronicle/commit/374818641b02f53adea577d18d16f8fd3255af56): Added notice about merging PRs.
- [`27e50c3`](https://github.com/jhuckaby/cronicle/commit/27e50c371cc901860123015032b9f389a63714b1): Added .github/pull_request_template.md

## Version v0.8.62

> June 17, 2021

- [`fd03cb9`](https://github.com/jhuckaby/cronicle/commit/fd03cb9225d0468d7c3b65b06fd2d812d7e356fb): Version 0.8.61
	- Bumped `pixl-server` to v1.0.30 for issue with logging
	- Fixes #416
- [`d2cc143`](https://github.com/jhuckaby/cronicle/commit/d2cc143224da31c11af68389a6f7bd819892fb46): Fixed typos in docs.

## Version v0.8.61

> May 21, 2021

- [`d7fadf2`](https://github.com/jhuckaby/cronicle/commit/d7fadf248ee9140b4d7883030c51f90a38a68042): Version 0.8.61
	- Implemented `max_jobs` feature (global maximum).

## Version v0.8.60

> May 21, 2021

- [`94ba681`](https://github.com/jhuckaby/cronicle/commit/94ba6814eabdba926f20adf31693eb88827c053e): Version 0.8.60
	- Bumped pixl-mail to v1.0.11 for vuln in nodemailer.
	- https://www.npmjs.com/advisories/1708

## Version v0.8.59

> May 16, 2021

- [`f585fb9`](https://github.com/jhuckaby/cronicle/commit/f585fb984fc29de26697ee97b2b157d6cceb6093): Bumped pixl-request to 1.0.36 for decomp bug fix.

## Version v0.8.58

> May 14, 2021

- [`42975fc`](https://github.com/jhuckaby/cronicle/commit/42975fc1b1c62b4d104d5566a3fde14f45bc5627): Version 0.8.58
	- Bumped jquery to v3.5.0 for vuln
	- Bumped chart.js to v2.9.4 for vuln
	- Bumped netmask to v2.0.1 for vuln
	- Fixes #404
- [`546c7f6`](https://github.com/jhuckaby/cronicle/commit/546c7f6507122ef30b4d0e7539444f992ed7b511): Patched a few security holes.

## Version v0.8.57

> March 27, 2021

- [`bba7b01`](https://github.com/jhuckaby/cronicle/commit/bba7b01579d56b1354392d1f3e710cec3270093a): Version 0.8.57
- [`9671c7c`](https://github.com/jhuckaby/cronicle/commit/9671c7c02cb1bc1147cabaddf9852ca756512ba3): Make sure titles do not contain HTML metacharacters.
- [`df326ee`](https://github.com/jhuckaby/cronicle/commit/df326eefd2a2d2a67ce9c09c0b79283aaff053b1): Race condition with "Run Again" and get_log_watch_auth.

## Version v0.8.56

> January 23, 2021

- [`cdf3a2e`](https://github.com/jhuckaby/cronicle/commit/cdf3a2ee51a64396dbcaa172d84824893e742430): Version 0.8.56
	- Now setting `no_rewind` for timeout aborts. Fixes #369.

## Version v0.8.55

> January 23, 2021

- [`449d578`](https://github.com/jhuckaby/cronicle/commit/449d578a51de9154857a2d21efef4c9c1ff5d3a7): Updated TOC.
- [`3bca4fc`](https://github.com/jhuckaby/cronicle/commit/3bca4fc360b95ee319fc44f15a0918979864260e): Version 0.8.55
	- Now supporting `web_hook_custom_opts` for custom HTTP options in all outbound web hook requests.
	- Bumped pixl-request to v1.0.35 for auto-proxy support.

## Version v0.8.54

> November 22, 2020

- [`b90921e`](https://github.com/jhuckaby/cronicle/commit/b90921e7512162941aafe84b3407c053f338a92f): Bumped moment-timezone to v0.5.32.  Fixes #356.

## Version v0.8.53

> November 8, 2020

- [`15ba50f`](https://github.com/jhuckaby/cronicle/commit/15ba50f4a59e26de0b9a8b9b9a5f24972fa502a0): Version 0.8.53
	- Bumped pixl-request to 1.0.33 for new embedded header/data syntax in web hook URLs.

## Version v0.8.52

> November 7, 2020

- [`5c0199b`](https://github.com/jhuckaby/cronicle/commit/5c0199b78616e3a9707d190e22858395d35794e2): Fixed bug where web hook validation got tripped up on the new header system (thanks @mikeTWC1984)
- [`62ed487`](https://github.com/jhuckaby/cronicle/commit/62ed487125e0aea59f2089dcc5d73549d1b312d0): Changed example URL in README to be Slack's API endpoint.

## Version v0.8.51

> November 7, 2020

- [`b46ce34`](https://github.com/jhuckaby/cronicle/commit/b46ce3481ec9a0f6778a7c9aaf97ed21909d80d8): Version 0.8.51
	- Bumped pixl-request to v1.0.32 for new URL header substitution feature.
	- Allow Web Hook URLs to include embedded request headers e.g. `[Cookie: foo=bar]`
	- Fixes #346

## Version v0.8.50

> October 9, 2020

- [`8acbbf5`](https://github.com/jhuckaby/cronicle/commit/8acbbf50fbe25cdc88494bfdf6a6d10d70c7455a): Version 0.8.50
	- Fixes #333.  Thanks @Taz4Git and @mikeTWC1984!

## Version v0.8.49

> September 25, 2020

- [`d53da19`](https://github.com/jhuckaby/cronicle/commit/d53da190f300bb08048cad45e7b91d11656b81ea): Version 0.8.49
- [`fb529e4`](https://github.com/jhuckaby/cronicle/commit/fb529e460262310bede3a10f4f1fc92f4a216370): Fixed issue with live log watcher and workers.
- [`8a9df7c`](https://github.com/jhuckaby/cronicle/commit/8a9df7cadda5f39d33091c5e405779d894240c71): Added user privileges for specific server groups.

## Version v0.8.48

> September 14, 2020

- [`3300a5a`](https://github.com/jhuckaby/cronicle/commit/3300a5aaa9fa68073f0b4f40f36a7d02720d5650): Version 0.8.48
	- Removed outdated terminology from the UI.
- [`6ec734f`](https://github.com/jhuckaby/cronicle/commit/6ec734fcf6268702605c9ef1495e2d6061e9b5d3): First pass at removing outdated terms from docs.

## Version v0.8.47

> July 18, 2020

- [`f6a93d5`](https://github.com/jhuckaby/cronicle/commit/f6a93d55246f1f17bf45194e643b91cc964dc9ce): Version 0.8.47
	- Fixes #305
	- Updated copyright year in page footer.
- [`229aa32`](https://github.com/jhuckaby/cronicle/commit/229aa32eeb69eb635faec0b46b92ab6e3248ff04): Json typo
- [`9ed8ce5`](https://github.com/jhuckaby/cronicle/commit/9ed8ce5bac2dcd10a39a3f7f629e7664106ae2cf): Fixed spacing issue in TOC

## Version v0.8.46

> April 24, 2020

- [`5438f21`](https://github.com/jhuckaby/cronicle/commit/5438f21d40e75f523a66d2d3671e9aeb98d6ef5a): Version 0.8.46
	- Updated dependencies to address a crash seen in Node.js v14.  Should fix #275.
	- Updated docs to address Node.js Active LTS and Current channels.  Only Active LTS is supported.
	- Removed old Node.js v10 clock warning.
	- Wrapped TOC in a details block.

## Version v0.8.45

> March 11, 2020

- [`a45169b`](https://github.com/jhuckaby/cronicle/commit/a45169b6bfe74fb9c68a11a3dc1b0e841c6362b3): Version 0.8.45
	- Bump pixl-server-api to v1.0.2 for args.params issue.
	- If you send in a POST with `true` as the JSON, the parser is happy, but it crashes inner code expecting an object.

## Version v0.8.44

> February 27, 2020

- [`8c563e2`](https://github.com/jhuckaby/cronicle/commit/8c563e2dff8f4206c2e9342b482381f0e1ec50b0): Version 0.8.44
	- Fixes #264 - A refresh bug which occurs when the history view is reloaded after a job completes, but if the user has activated the "Filter By Event" menu, it gets invalidated and the user cannot select an item.  Thanks @geofffox!

## Version v0.8.43

> February 19, 2020

- [`d573e98`](https://github.com/jhuckaby/cronicle/commit/d573e982d7db53f00fa423efe5f3c6d220b32e8e): Version 0.8.43
	- Fixes #216
- [`430299d`](https://github.com/jhuckaby/cronicle/commit/430299de31d91bf497990ddf054eb4dd40793d21): Added note about Cronicle starting on boot and environment variables.
- [`a577009`](https://github.com/jhuckaby/cronicle/commit/a57700989f874e4a3777d41859b82396db555a3a): Added get_active_jobs to TOC.

## Version v0.8.42

> February 13, 2020

- [`e95d6db`](https://github.com/jhuckaby/cronicle/commit/e95d6db258e4994c7e87ece80c77d396ad7009df): Version 0.8.42
	- Added `get_active_jobs` API and docs.  Closes #261.

## Version v0.8.41

> February 7, 2020

- [`23c3ba2`](https://github.com/jhuckaby/cronicle/commit/23c3ba270b0db47c3a0cd3c32c4babd0eaa9ceeb): Version 0.8.41
	- More spawn crash protection, this time for server resource monitoring.
	- If the server is completely out of memory, the `ps` exec spawn may fail.
	- This adds crash protection, and just logs the error (non-fatal).

## Version v0.8.40

> February 7, 2020

- [`267554d`](https://github.com/jhuckaby/cronicle/commit/267554d3ddb35c07b77be6c734b629dea867ed3d): Version 0.8.40
	- Better support for catching child spawn errors when the PID, STDIN or STDOUT are all undefined.
	- Presumably this can happen with a server that is completely out of memory.
	- Apparently Node.js doesn't throw an error for this.  Go figure!

## Version v0.8.39

> January 17, 2020

- [`fad91ad`](https://github.com/jhuckaby/cronicle/commit/fad91add21b70330d9fc9ffdd4c0f4e3bfad62e5): Version 0.8.39
	- Includes PR #253 (thanks @attie).
	- If you do not wish to merge the POST data into the `params` (for example if you are using a webhook that provides other data as JSON), then you can add `&post_data=1` to the query string. If you do this, then the POST data will be available in the `post_data` key of the `params` object.
	- Thanks to user @attie and PR #254 for these fixes and suggestions.
- [`707034a`](https://github.com/jhuckaby/cronicle/commit/707034ab0521513bfefbda44335c0578778f3625): close the child's stdin after writing all of the payload

## Version v0.8.38

> December 19, 2019

- [`c75664f`](https://github.com/jhuckaby/cronicle/commit/c75664f694419d7d4da0ccb52fcbd7c87a997f4a): Version 0.8.38
	- Fixes #246 -- thanks @alexpanas!

## Version v0.8.37

> November 27, 2019

- [`3cfc7ef`](https://github.com/jhuckaby/cronicle/commit/3cfc7ef09bfd2ebc07c0dc85b4425d8ad3d690fd): Version 0.8.37
	- Now correctly throwing an error instead of crashing when starting a job
	- and the event's category, plugin, or server group cannot be found.

## Version v0.8.36

> November 27, 2019

- [`1e9ed43`](https://github.com/jhuckaby/cronicle/commit/1e9ed43a73bd45ff7e3354064a3f4edc647f812b): Version 0.8.36
	- Fixes #199

## Version v0.8.35

> November 24, 2019

- [`3ccd147`](https://github.com/jhuckaby/cronicle/commit/3ccd1479da80d2a12b5acd40f1c9314e08417b16): Version 0.8.35
	- Merged #234 - Thanks @SPascareli!
- [`bc75410`](https://github.com/jhuckaby/cronicle/commit/bc7541024a9015f571d84280a7b5028d20781dcb): Added space to log file before npm restore junk.
- [`6583b33`](https://github.com/jhuckaby/cronicle/commit/6583b3333c809dabc8cccbbcf1214099074f3267): Fixed bug where reset password would not allow "-" and "." chars

## Version v0.8.34

> November 24, 2019

- [`7f5231c`](https://github.com/jhuckaby/cronicle/commit/7f5231cdfc1aabee855bf5e7d516b8be9c13e872): Version 0.8.34 / Installer v1.3
	- Fixed typo in installer script which wiped out log file.

## Version v0.8.33

> November 24, 2019

- [`239e3bc`](https://github.com/jhuckaby/cronicle/commit/239e3bca8d77c0c605eeb8bd4575283531c0cc31): Version 0.8.33 / Installer v1.2
	- Attempting to preserve add-on modules: couchbase, aws-sdk and redis
	- npm update seems to clobber these on Cronicle update (sigh)

## Version v0.8.32

> October 16, 2019

- [`59f0eab`](https://github.com/jhuckaby/cronicle/commit/59f0eab4269e814ec88979b341522654a0ef561f): Version 0.8.32
	- https://github.com/jhuckaby/Cronicle/commit/55c64899d8de6cd55a1ac436ef600860d293dcad
- [`55c6489`](https://github.com/jhuckaby/cronicle/commit/55c64899d8de6cd55a1ac436ef600860d293dcad): Add custom custom_live_log_socket_url for single-master systems behind an LB
- [`9a85f5e`](https://github.com/jhuckaby/cronicle/commit/9a85f5e4252251f43fea71c0692af3bfbeae0002): Add section about companies using Cronicle

## Version v0.8.31

> June 30, 2019

- [`df89a8f`](https://github.com/jhuckaby/cronicle/commit/df89a8ff7cc3b46844ce9920a13d92626f4b24c4): Version 0.8.31
	- Fix #195

## Version v0.8.30

> June 30, 2019

- [`943b667`](https://github.com/jhuckaby/cronicle/commit/943b667e08ddb3053f4d77199326d815a081a601): Version 0.8.30
	- Fixed bug where error chain reaction would fire even if job was aborted.
	- Aborted jobs, either due to shutdown or manual, should never fire a chain reaction action (and now they do not).

## Version v0.8.29

> May 27, 2019

- [`e13a3a8`](https://github.com/jhuckaby/cronicle/commit/e13a3a896724094572b9624cd7e30fa0b00a651b): Version 0.8.29
	- Should fix #182.
- [`5e1797a`](https://github.com/jhuckaby/cronicle/commit/5e1797a6a3053f794accb69506e837aaf0bfbac6): Fixed security issue where hashed user password and salt were getting logged.
- [`db65f93`](https://github.com/jhuckaby/cronicle/commit/db65f93e10e3dc61c551f2bf9d662f3025a29199): Fixed date handling in Time Machine text field when custom timezones are involved

## Version v0.8.28

> September 4, 2018

- [`478e752`](https://github.com/jhuckaby/cronicle/commit/478e752773fb61a61ad5e0da0a1f26ec638e1cda): Version 0.8.28
	- Fixes #112 - Cronicle crash on a simple stress test

## Version v0.8.27

> September 2, 2018

- [`8c59536`](https://github.com/jhuckaby/cronicle/commit/8c595367650ad61d13733ce967dcce14cecb293c): Version 0.8.27
	- Now emitting a warning on startup for Node v10.0 to v10.8, due to the core timer bug: https://github.com/nodejs/node/issues/22149
	- Updated timer bug warning in README.
	- Bumped pixl-server version to 1.0.16 for more verbose startup log entry.
- [`e312471`](https://github.com/jhuckaby/cronicle/commit/e31247113ecb08af536b4055cfc7253fd7c72891): Added notice about Node.js v10 bug.

## Version v0.8.26

> August 28, 2018

- [`8d0282c`](https://github.com/jhuckaby/cronicle/commit/8d0282cd1b5c3ce11ded5d35ee4cf941e28ebfc6): Version 0.8.26
	- Reversed course on new /api/app/status API call.  It no longer causes a server restart on a tick age issue (i.e. broken timer).
	- It now only logs a level 1 alert, and safely returns an API response.  Server restarts should only be handled by an external monitoring tool.
	- This tick age thing is an ongoing investigation into a very strange situtation, seen after about 20 days of continuous running on Linux CentOS 7.2,
	- Node v10.6.0 and AWS (S3) storage backend.  Seemingly at random (but on multiple servers at the same time), all the Node.js timers and intervals
	- seem to cease firing, but all other actions triggered by sockets or child processes keep running.  The server has to be restarted, sometimes SIGKILLed.
	- CPU and memory are both fine.
	- I'm currently dumbfounded as to what could cause such a thing.

## Version v0.8.25

> August 27, 2018

- [`68086a3`](https://github.com/jhuckaby/cronicle/commit/68086a3f629b5622afca76d894f2689baa188ff1): Version 0.8.25
	- Removed old garbage collection hack (was from the Node v0.12 days).
	- Added new api_status call for monitoring purposes.
	- Disable UDP broadcast server if port is zero or false.
	- Now keeping track of tick age (exposed in api_status).
	- If tick age is over 60 and status API is invoked, server will self-restart (should never happen).
	- Improved logging for crashes and emergency shutdowns.
	- Added PID log column by default.
	- Bumped pixl-server version to v1.0.15.

## Version v0.8.24

> August 16, 2018

- [`fe375aa`](https://github.com/jhuckaby/cronicle/commit/fe375aacd2393cba2af29d55ea59f411d688d12d): Version 0.8.24
	- Bumped pixl-server-storage version to 2.0.9 to pick up Couchbase bug fixes.
	- Should fix #101

## Version v0.8.23

> August 14, 2018

- [`5d52469`](https://github.com/jhuckaby/cronicle/commit/5d52469c721809d42d60700a04f0d2872319dec9): Version 0.8.23
	- Now allowing environment variables to override command-line arguments as well as configuration properties.
	- Bumped dependency versions for some pixl-* modules.

## Version v0.8.22

> August 12, 2018

- [`bd10964`](https://github.com/jhuckaby/cronicle/commit/bd1096463bde3391c2b72ae3d3ef13da02734056): Version 0.8.22
	- Support for restricting users to specific categories only.
	- Better visual hinting for "Schedule Enabled" when user doesn't have access to click it.
	- Better visual hinting for disabled categories and plugins.
	- UI controls for creating, copying and running events are hidden if user doesn't have access.
	- Disable browser spellcheck on password fields.
- [`82baeb5`](https://github.com/jhuckaby/cronicle/commit/82baeb56cc696722b475f4fe379e051ce54796ef): Split out findJob() from updateJob()
- [`a45b6bc`](https://github.com/jhuckaby/cronicle/commit/a45b6bc1eb2e219f106b9152f8bcfd3b46611923): Support for restricting users to specific categories only.
- [`93c0528`](https://github.com/jhuckaby/cronicle/commit/93c052885e92bce1fa251d62ff92f15b76351b22): Support for restricting users to specific categories only.
- [`7a299a5`](https://github.com/jhuckaby/cronicle/commit/7a299a52137c9e0208e5f5159fd57026830e2ed2): Support for restricting users to specific categories only.
- [`f602a41`](https://github.com/jhuckaby/cronicle/commit/f602a414dcbbb46776bb53cc481df3542f74372e): Support for restricting users to specific categories only.
- [`a2bafd4`](https://github.com/jhuckaby/cronicle/commit/a2bafd4292038ce6520d6e1073d46cd16bb44144): UI controls for creating, copying and running events are hidden if user doesn't have access.
- [`8676055`](https://github.com/jhuckaby/cronicle/commit/8676055d7f0c360a20ac0f863ec6637def878b6b): Disable browser spellcheck on password fields.
- [`434ba3b`](https://github.com/jhuckaby/cronicle/commit/434ba3b95a68421e0462eb80d3788b31d06d5bda): Support for restricting users to specific categories only.
- [`960b609`](https://github.com/jhuckaby/cronicle/commit/960b609fc2743d565da0e9c763754044e3c52714): Better visual hinting for disabled categories and plugins.
- [`7e6ebd2`](https://github.com/jhuckaby/cronicle/commit/7e6ebd2d86701a7ebad87a03a36b8a3dd0282d50): Support for category-limited users.
- [`b68f876`](https://github.com/jhuckaby/cronicle/commit/b68f87661d0e8b2ab4745b1d4a09122ce2e9d3f5): User Category Privilege Checkbox Label Augmentation

## Version v0.8.21

> August 9, 2018

- [`de0a77b`](https://github.com/jhuckaby/cronicle/commit/de0a77b81a23d5eb15aa7b0db76d8bf600667a52): Version 0.8.21
	- Password fields now default to hidden, but can be togged back to visible.
	- Default password state can be configured in config.json file.
	- Password state is also saved in localStorage, if user toggles Hide/Show.
- [`0dd287e`](https://github.com/jhuckaby/cronicle/commit/0dd287e59adf699dc840eb44c56bb65bc53a0882): Icon change for chained events
- [`95ff795`](https://github.com/jhuckaby/cronicle/commit/95ff795c9818d5d291a2730872fcecd1d5e7816b): Updated TOC

## Version v0.8.20

> August 8, 2018

- [`df8076a`](https://github.com/jhuckaby/cronicle/commit/df8076a70d70016940bbf210cfeeb3be814df1b2): Version 0.8.20
	- Added `uncatch` module.
	- Bumped `pixl-tools` to v1.0.18 (for sub()).
	- Bumped `pixl-server-web` to v1.1.7 for various bug fixes.
- [`4ad111e`](https://github.com/jhuckaby/cronicle/commit/4ad111ec81a7a752c2266608883d5492cb8bf1dd): Added default `web_hook_text_templates` values.
- [`4d54391`](https://github.com/jhuckaby/cronicle/commit/4d543913b5034d815290034aa394ded00af09321): Updated docs for new web hook features.
- [`4116950`](https://github.com/jhuckaby/cronicle/commit/411695090bde1d419d9cbe2dd4b7391aa964858b): Updated job_launch_failure web hook to use new system.
- [`e375cca`](https://github.com/jhuckaby/cronicle/commit/e375ccac5a24ab7e012c2f81dfb76060374f7035): New web hook text system.
- [`204cdf2`](https://github.com/jhuckaby/cronicle/commit/204cdf25a57079db9d9c4966dacc26a005ca2498): Added uncatch and defaultWebHookTextTemplates.
- [`6b177c6`](https://github.com/jhuckaby/cronicle/commit/6b177c64c1249b6e85a4cf106e58ec99ce06045b): Changed behavior of "Copy Plugin"
- [`94a5d3a`](https://github.com/jhuckaby/cronicle/commit/94a5d3a82555e1770068c84b4701ea6c061011ec): Added "Copy Event" feature.
- [`119ecda`](https://github.com/jhuckaby/cronicle/commit/119ecda44eb1bc91c16140b24460337272d83b55): Fixes #86

## Version v0.8.19

> August 2, 2018

- [`3b1f6b3`](https://github.com/jhuckaby/cronicle/commit/3b1f6b3822c9637b8b6809a56029866341281e65): Version 0.8.19
	- Fixed potential confusion in Shell Plugin where plain integers on their own line in STDOUT were being interpreted as progress percentages.  Now a hard `%` symbol is required.  Should fix #90.
	- No longer allowing user to delete final Master Eligible server group (would send application into frozen state).
	- Downgraded noisy error into debug message, which can happen naturally if a user jumps to view a live job that has just completed.
	- Disabled spell check on Server Group Hostname Match field.

## Version v0.8.18

> August 1, 2018

- [`7e42ece`](https://github.com/jhuckaby/cronicle/commit/7e42ece81e07407c07e9db5f79b543755e5adf45): Version 0.8.18
	- Fixed bug where a malformed group regular expression could crash the server.
	- See issue #88
- [`e3c0cbe`](https://github.com/jhuckaby/cronicle/commit/e3c0cbefc6cb9e1172f34d91de3892ed13c38821): Fix #85
- [`0581199`](https://github.com/jhuckaby/cronicle/commit/05811990ceea83a93afdd35b5f3d985760e60738): Fixed TOC

## Version v0.8.17

> July 26, 2018

- [`fb385d9`](https://github.com/jhuckaby/cronicle/commit/fb385d9bbdaf0e9782f11b2b046becf13f185b44): Version 0.8.17
- [`143e0bd`](https://github.com/jhuckaby/cronicle/commit/143e0bd5122e3c8fcaae8179aed6cd91bdb834e9): Bumped max events to 10K, as 1K was chopping reasonably sized schedules.
- [`2b9f312`](https://github.com/jhuckaby/cronicle/commit/2b9f31200891b84d5ab10ba130e81a9263bca4d1): Added support for `socket_io_transports`.
- [`9434342`](https://github.com/jhuckaby/cronicle/commit/94343427aff5a229cd2e3f6801d0bd6c4f24ecbe): Added docs for `socket_io_transports` config prop.

## Version v0.8.16

> July 20, 2018

- [`6f40082`](https://github.com/jhuckaby/cronicle/commit/6f40082a30ce4bab1d7ef0a935fa17cecf04f498): Version 0.8.16
	- Bumped pixl-server-web to v1.1.5, which includes fix for #81.

## Version v0.8.15

> July 17, 2018

- [`06e155f`](https://github.com/jhuckaby/cronicle/commit/06e155f5a3de7708db0435144fda5f249ba55249): Version 0.8.15
- [`0218d66`](https://github.com/jhuckaby/cronicle/commit/0218d66b18bb46d8278ac700ccd6cc12999fb704): Misc changes to CLI
- [`e38c591`](https://github.com/jhuckaby/cronicle/commit/e38c5912beee3278fa5a954a13eb38952e088c60): Remove perl snippets from control.sh and debug.sh scripts

## Version v0.8.14

> July 15, 2018

- [`d4764b0`](https://github.com/jhuckaby/cronicle/commit/d4764b0e0ff8f4d98d924ca8f9ca9500c97a797d): Version 0.8.14
	- Improved error messages and user feedback on Job Details page (live job log watcher).

## Version v0.8.13

> July 15, 2018

- [`61efff5`](https://github.com/jhuckaby/cronicle/commit/61efff5f535c90423bfc5ef35ded1c46573a4641): Now showing number of active jobs along with time.
- [`f721498`](https://github.com/jhuckaby/cronicle/commit/f721498a097cda7b10f958e89b58e9c5df5c8237): Added clock icon to time display in header
- [`564f444`](https://github.com/jhuckaby/cronicle/commit/564f444ea0fbadaf7771e031086e4f7490ba0e23): Made clock scroll overlay thinner
- [`78e30e3`](https://github.com/jhuckaby/cronicle/commit/78e30e3d1d3a985ba86b0f9fe770bcf589a60b07): Updated copyright year.
- [`006084c`](https://github.com/jhuckaby/cronicle/commit/006084c5bd3ab140cc7ce87f03f4931c21a60c49): Added docs for `web_direct_connect`.
- [`75c2bcc`](https://github.com/jhuckaby/cronicle/commit/75c2bcc8f9eab65f2e758970a87c6b9116a53f1e): Support for new `web_direct_connect` feature.
- [`9027fa6`](https://github.com/jhuckaby/cronicle/commit/9027fa6d3e6ce4564b77ce623b63e52ece92fffc): Added max run time of 3 seconds, will abort calc if exceeded.
- [`bc45389`](https://github.com/jhuckaby/cronicle/commit/bc4538913fd3a0cb44783d50cba2c73a0d2d0501): Rejiggered to remove pagination, show all API keys, sort by title.
- [`3334b30`](https://github.com/jhuckaby/cronicle/commit/3334b305c3ab1e860351e0dde9d433d1048ee23e): api_get_api_keys now returns ALL keys (no pagination)
- [`a57ebf3`](https://github.com/jhuckaby/cronicle/commit/a57ebf39e9034e34f38ce12e242a6bf26dfbc87d): Now including `web_direct_connect` in config API response.
- [`2369d8a`](https://github.com/jhuckaby/cronicle/commit/2369d8a11d003eb626ba7597015ee7f91000ca9b): Version 0.8.13
	- Bumped some deps: pixl-tools and pixl-webapp (minor fixes).
- [`bbbcbe4`](https://github.com/jhuckaby/cronicle/commit/bbbcbe4265bd5a0d32cac51478cf50de3dcbf9cb): Added new `web_direct_connect` property.

## Version v0.8.12

> July 14, 2018

- [`fca9357`](https://github.com/jhuckaby/cronicle/commit/fca935737009f4307dba46ac968b40d0c6422ba0): Updated TOC
- [`80189b3`](https://github.com/jhuckaby/cronicle/commit/80189b37f5da6fa797146d623ac1ed9731cfa3ab): Version 0.8.12
- [`0397bfc`](https://github.com/jhuckaby/cronicle/commit/0397bfcb978d503ec291201e965d1c5a1f0b0329): Added SSL Cert Bypass option to HTTP Request Plugin
- [`f9d5fa4`](https://github.com/jhuckaby/cronicle/commit/f9d5fa484e9e09d5cce77d912a9271ae86d5aa14): No longer logging all storage event types (too noisy)
- [`31335a8`](https://github.com/jhuckaby/cronicle/commit/31335a8f62cc97f91be7b13ccf9eb20257e0666c): Fixed potential bug where "ley" variable wasn't defined.
- [`e904092`](https://github.com/jhuckaby/cronicle/commit/e9040927310e946b583d531abd9463f05af51855): Added new HTTP Request Plugin docs
- [`bcf1cdc`](https://github.com/jhuckaby/cronicle/commit/bcf1cdc44ea50796d049e522df645ef71a725370): Support for chain_data

## Version v0.8.11

> July 10, 2018

- [`c5c96c5`](https://github.com/jhuckaby/cronicle/commit/c5c96c521791694d5418b99ecb1148844856d0fb): Fixes #74

## Version v0.8.10

> July 8, 2018

- [`72624a8`](https://github.com/jhuckaby/cronicle/commit/72624a84e7d5a9261b9f9ee840a0aa70c38752af): Version 0.8.10: Security Patch: Session ID check on watchJobLog
	- The watchJobLog (follow live job log) API wasn't checking the user's Session ID.
	- Also, now emitting visual errors if the watchJobLog socket fails to connect (direct server connection).
- [`3965d3c`](https://github.com/jhuckaby/cronicle/commit/3965d3c15dda3fb04b765bdceb3b8cfe89d60120): Added new section on Cron Noncompliance

## Version v0.8.9

> July 6, 2018

- [`ec700f0`](https://github.com/jhuckaby/cronicle/commit/ec700f0d04b12698b05baa0e16f1aa10cd22938b): Version 0.8.9
	- Added support for custom maint record types (for running maint on custom days).
	- Home UI Worker: Max ceiling of 1000 simulated future jobs.
	- Added `track_manual_jobs` (default false) so manual jobs won't be added to activity log.
	- Now only setting one record expiration per job, and using a custom record type to delete both the job metadata and job log gzip.
	- Bumped pixl-server-storage version to 2.0.7 (for custom record types and efficient storage expiration).
	- Docs: Added recommended AWS settings for retries, clock skew and others to storage migration sample config.

## Version v0.8.8

> July 6, 2018

- [`99bda9b`](https://github.com/jhuckaby/cronicle/commit/99bda9be44d37110ba2068ed16dd6cb259518cae): Version 0.8.8
	- Added optional "Burn Memory/CPU" option to Test Plugin.
	- Test Plugin now accepts a range of durations (picks random).
	- Add Storage transaction logging to default configuration.
	- Removed deprecated calls to `new Buffer()`.

## Version v0.8.7

> July 4, 2018

- [`b723624`](https://github.com/jhuckaby/cronicle/commit/b723624f74be44482c361cfbadefb9630cc29985): Misc changes for 0.8.7
- [`2c34a56`](https://github.com/jhuckaby/cronicle/commit/2c34a56cbe59c19736685c497ef61fff1354bc7a): Misc cleanup items.
- [`6a72b31`](https://github.com/jhuckaby/cronicle/commit/6a72b311f98433d72bdf7d7da690381276f8f565): Version 0.8.7
	- Added maximum job log file size feature, customizable per event, category, and a global default.
- [`228b6b3`](https://github.com/jhuckaby/cronicle/commit/228b6b32a993455bdcada486368e10b62c1958ab): Workaround for bizarre issue #70
- [`70444c2`](https://github.com/jhuckaby/cronicle/commit/70444c27c1b1fa51bbccfe6a1819aa5651314640): Fixed #66 -- thanks @dropthemic

## Version v0.8.6

> May 30, 2018

- [`06a6e6c`](https://github.com/jhuckaby/cronicle/commit/06a6e6c4e6313c59cec6d434fe5d1104e6ca3c72): Version 0.8.6
	- Fixed issue with storage migration script, where `--dryrun` mode was causing streams to stack up and eventually crash with EMFILE: too many open files.

## Version v0.8.5

> May 29, 2018

- [`e13b8fc`](https://github.com/jhuckaby/cronicle/commit/e13b8fcbdf8c2b64878a734f19a55d20f8473d31): Version 0.8.5
	- Updated dependencies, particularly to force an update on pixl-cli, which was broken due to an update of chalk.
- [`01d71a3`](https://github.com/jhuckaby/cronicle/commit/01d71a33544ef81e57f2f1b8400375a384140777): Added one decimal of precision to memory pies (avg).
- [`16a61ef`](https://github.com/jhuckaby/cronicle/commit/16a61ef98eed479f4eeaee651803eb7e42a686f8): Updated TOC in README.md.

## Version v0.8.4

> May 13, 2018

- [`1d92600`](https://github.com/jhuckaby/cronicle/commit/1d92600337986980f8f133a96b2bba778089eedb): Version 0.8.4
	- New storage migration script.
	- Upgrade to pixl-server-storage v2.0.1+ for AWS S3 keyTemplate and fileExtensions.
	- Misc other fixes.
- [`1901573`](https://github.com/jhuckaby/cronicle/commit/190157324fb1e67e4d2d1879e6e1a51ac2ff4307): New storage migration script.
- [`e51178b`](https://github.com/jhuckaby/cronicle/commit/e51178b481d853332908fc7b08c59ad7fa6cc025): Fixed two instances of calling fs.close() without a callback.
- [`6c2b1ca`](https://github.com/jhuckaby/cronicle/commit/6c2b1cac6fea0a2c569cc7e55a6b32dafba982c6): Added `--trace-warnings` to CLI

## Version v0.8.3

> April 15, 2018

- [`d8eb19b`](https://github.com/jhuckaby/cronicle/commit/d8eb19b77c81da13889eb87cc7677470a4c9af7d): Version 0.8.3 Support for "on-demand" events that have no scheduled run times, but support Run Now and API jobs. Upgraded jQuery to v3. Upgraded MomentJS to v2.22.

## Version v0.8.2

> March 9, 2018

- [`ecefe5c`](https://github.com/jhuckaby/cronicle/commit/ecefe5c468b01e551e6aa3831b035150308f10a1): Version 0.8.2 Dependency update of pixl-server-user to v1.0.8 should fix #57 Misc UI fix on History page (erroneous display of "All items were deleted on this page." message).

## Version v0.8.1

> February 15, 2018

- [`a10b9d2`](https://github.com/jhuckaby/cronicle/commit/a10b9d24ccea4a79b1660a7b06766b9ba40cb98e): Version 0.8.1 Tweaked some Chart.js settings on history/stats page, to disable animation, fix y axis labels, and fix tooltip positions.

## Version v0.8.0

> February 13, 2018

- [`2b6767e`](https://github.com/jhuckaby/cronicle/commit/2b6767e60e0e3de0c9fdfbc26956f24db5cba2f0): Version 0.8.0 Event queue! Bumped async to v2.6.0.
- [`a4b4b36`](https://github.com/jhuckaby/cronicle/commit/a4b4b367f6707c82f309479aaf06dd6b69549435): Added 'queue_max' of 1000 to new event template.
- [`910dbac`](https://github.com/jhuckaby/cronicle/commit/910dbac30fe332c47cc0a671d6c57c6b73d7529c): Support for event queue.
- [`e193f9f`](https://github.com/jhuckaby/cronicle/commit/e193f9f9e30c94656088358f54bbb4e7caa61279): Support for event queue.
- [`5ced2a2`](https://github.com/jhuckaby/cronicle/commit/5ced2a234959438f4703b76202b1f24e3150f8b7): Support for event queue.
- [`70cc91f`](https://github.com/jhuckaby/cronicle/commit/70cc91f4cebb345a1c85044108c9132a41b9a4b1): Support for event queue. Added api_flush_event_queue. For api_run_event, now supporting sparsely populated params, merged with event. Also supporting &params/foo=bar query string format.
- [`57a19f5`](https://github.com/jhuckaby/cronicle/commit/57a19f5b5c0703a2ccac75d0357fff19a0c4b581): New event data params to validate (event queue, chain_error).
- [`f7f610a`](https://github.com/jhuckaby/cronicle/commit/f7f610af5d2feaa6428763eb501d19921bf299e3): Dialog keyboard tweaks (new pixl-webapp release).
- [`8be3de8`](https://github.com/jhuckaby/cronicle/commit/8be3de8e3baf75fce7b2137f13d49c32b4e8c12b): Support for event queue. Dialog keyboard tweaks (new pixl-webapp release).
- [`f52cd9d`](https://github.com/jhuckaby/cronicle/commit/f52cd9d958f0dfa9fa53b41c68c3d040b0e03716): Support for event queue.
- [`150d096`](https://github.com/jhuckaby/cronicle/commit/150d096ec25317e4d3d9b6c321499c5938afe22a): Support for event queue.
- [`c2c9ce0`](https://github.com/jhuckaby/cronicle/commit/c2c9ce044119bca3c9647cbb39ec657febfbfa34): Updated copyright year.
- [`6cd2a28`](https://github.com/jhuckaby/cronicle/commit/6cd2a284818407ae67e05a22b04d44f3d75c6fc6): Chrome hack to align checkbox labels (sigh). Cursor fix.
- [`be4e5ca`](https://github.com/jhuckaby/cronicle/commit/be4e5ca8107cf4e2d9d4c6163424b366de67bff4): Changes for event queue. Renamed some sections. Added 'Format' column to Event Data Format table.
- [`ff3b05a`](https://github.com/jhuckaby/cronicle/commit/ff3b05ad48e5409e7bc60a2043678e6e35cf9dcf): Updated copyright year.
- [`1330ca9`](https://github.com/jhuckaby/cronicle/commit/1330ca9cd83bdf11d79301e7ebcb4285b420e470): Fixed bug where Unicode symbols would not display properly on completed job logs. Test Plugin now emits emoji into log.
- [`2d01f20`](https://github.com/jhuckaby/cronicle/commit/2d01f2019a4876a2ca4a1abab529d5f5691ebcd8): Updated copyright year, dependencies, etc.

## Version v0.7.8

> January 13, 2018

- [`4db2fe3`](https://github.com/jhuckaby/cronicle/commit/4db2fe30ffea811f3e48bdc95c848615abc9b94b): Version 0.7.8 Upgrade to chart.js 2.7.1 Removal of d3 and c3 dependencies
- [`2ed733b`](https://github.com/jhuckaby/cronicle/commit/2ed733b6d8119a23587028bac374c6de452cd79a): Fixed cosmetic bug when event error descriptions contain HTML or multi-line text.

## Version v0.7.7

> January 7, 2018

- [`864b8cd`](https://github.com/jhuckaby/cronicle/commit/864b8cdda82786f27b81eefbccf82792cef0a0d6): Version 0.7.7 Prevent crash when restarting service with detached jobs that were still running, but the jobs complete in the interim, but they also exceed their max time.
- [`bdb6868`](https://github.com/jhuckaby/cronicle/commit/bdb6868dcf80f695ca5129f53b9021a0bff71b7e): Added blurb about the new keyPrefix prop in S3/Couchbase.

## Version v0.7.6

> December 16, 2017

- [`6a0b443`](https://github.com/jhuckaby/cronicle/commit/6a0b4430659787fddac0b45e0d8416695c3a2e52): Version 0.7.6
- [`5277c17`](https://github.com/jhuckaby/cronicle/commit/5277c17490a6678b6537cb79a5614553030afe02): Added blurb for using local sendmail with pixl-mail.
- [`01998dd`](https://github.com/jhuckaby/cronicle/commit/01998dde9800e864bf9899894a86a7ffba41894d): Fix issue with removing then re-adding same server quickly See issue #46 for details
- [`1fb14ec`](https://github.com/jhuckaby/cronicle/commit/1fb14ec0bb1844e9452578d04d5efadd85751d74): Fix random errors when deleting jobs. Ignoring list replace errors, as list data may have expired before job details. Fixes #46
- [`a05ed7e`](https://github.com/jhuckaby/cronicle/commit/a05ed7edd3f6313f3699c89c0c3905358f4d5560): Attempt to fix #45

## Version v0.7.5

> November 25, 2017

- [`fdb6970`](https://github.com/jhuckaby/cronicle/commit/fdb697048cbaab7809db7915c9afa7324cc6d069): Version 0.7.5
- [`e8e8aee`](https://github.com/jhuckaby/cronicle/commit/e8e8aeef7263b8b2b0f37b46276bae87c423ad29): Initial implementation of delete job Deletes job log, but only marks list items as deleted. These are "hidden" from table views, but in an awful way. TODO: Re-implement this using new pixl-server-storage splice().
- [`3b24ec4`](https://github.com/jhuckaby/cronicle/commit/3b24ec43a1fcfbd723eeb310464f2d602d9cdb73): Schedule UI Tweaks Clicking the topmost "Schedule" tab now always takes you back to the main schedule, even if you are in a sub-page.
- [`65769a9`](https://github.com/jhuckaby/cronicle/commit/65769a9cb24a1bb660f301d7ad4f256fe8ebc9a7): Improved upgrade process. Now checks upgrade version before shutting down Cronicle. If upgrade version cannot be found, or any other error occurs, exits with code 1.
- [`aad5e72`](https://github.com/jhuckaby/cronicle/commit/aad5e72eb56944fce17c912be72d86cd63a3bd01): Copying all top-level job keys into child environment. Updated docs.
- [`7ff6ead`](https://github.com/jhuckaby/cronicle/commit/7ff6eaddf8da902cde4509170bf3cb9faf5ac033): New Shell Plugin Option Checkbox to enable interpreting JSON commands in STDOUT, in case shell script naturally outputs its own unrelated JSON, which could muck things up.
- [`b52be49`](https://github.com/jhuckaby/cronicle/commit/b52be49535ddb4dff853bc14f925e384fcbf960d): Added `version` command-line argument. Emits the current package version and exits. Updated docs to list all available commands.
- [`ae42f69`](https://github.com/jhuckaby/cronicle/commit/ae42f69b14a15fd0d5bc9e09115c5e044c113b9d): Renamed web_hook_ssl_cert_bypass to ssl_cert_bypass. The old web_hook_ssl_cert_bypass is still accepted, for legacy compat.
- [`42868d8`](https://github.com/jhuckaby/cronicle/commit/42868d821269dcada4a411926f4c5e862cd521b3): Fixed some textarea resize issues.
- [`06f90de`](https://github.com/jhuckaby/cronicle/commit/06f90deb8555449e0befe33628584185537094dc): Cosmetic fixes for smaller windows. Moved "Run Again" button into separate header element above banner. Pies now auto-scale down for thinner windows. Minimum container width is now 750px. Added body classes for popular browsers (for future CSS hacks).
- [`216d5d7`](https://github.com/jhuckaby/cronicle/commit/216d5d71ddac32a37d01110a30a2bd37d1f8b40f): New Feature: Specify separate chain reaction events for success and failure.
- [`cae9711`](https://github.com/jhuckaby/cronicle/commit/cae9711d87f1bbe803651f63b4403229777721e5): Fixed bug where scrolling clock wouldn't appear in Chrome/Firefox.

## Version v0.7.4

> November 9, 2017

- [`806e04c`](https://github.com/jhuckaby/cronicle/commit/806e04cb7a6d624083499b77bf5d56e02c3ec52e): Version 0.7.4 Fixes for Node 7+ and deprecation warnings on fs methods. Fixes issue #38

## Version v0.7.3

> November 2, 2017

- [`ebba15e`](https://github.com/jhuckaby/cronicle/commit/ebba15ecf300bb37f94cd86cc2af93573b76afca): Version 0.7.3 API Keys can now be manually entered and edited in the UI. The `get_event` and `run_event` APIs now accept title as well as ID. The `run_event` API now works with HTTP GET. Fixed a CSS bug where rapidly clicking links would select them. Updated docs and tests.

## Version v0.7.2

> October 3, 2017

- [`f496834`](https://github.com/jhuckaby/cronicle/commit/f496834c00cbd7ce834bceac5953f47b1988fa12): Version 0.7.2 Fixed intermittent race condition crash on UI home screen. Quiet some verbose installer logging junk.

## Version v0.7.1

> August 25, 2017

- [`033b84d`](https://github.com/jhuckaby/cronicle/commit/033b84d34627d36a4516758a3064ed2bf6099754): Version 0.7.1 Added category color to Home tab. Both upcoming and active jobs.

## Version v0.7.0

> August 25, 2017

- [`40dfa7f`](https://github.com/jhuckaby/cronicle/commit/40dfa7f4121903bad20021b0d6d8d76ce47ded24): Version 0.7.0
- [`67bd958`](https://github.com/jhuckaby/cronicle/commit/67bd95887fef674fb77836ee3a5f0c6e4b04bdfc): Added new HTTP Request Plugin into standard install set.
- [`dcdffc6`](https://github.com/jhuckaby/cronicle/commit/dcdffc6141ed9c575769a0edce5b1c23d57fb9a6): New standard Plugin for making HTTP requests.
- [`26a8175`](https://github.com/jhuckaby/cronicle/commit/26a81752a31b2e20a1b07593c1a040b845016d28): Improvements to logging and error handling. Now supports optional `annotate` param, which will add a date/time stamp to every log row. STDERR is now captured separately, and displayed in its own custom HTML section on the job details page (up to first 32K).  Everything is still logged of course. First line of STDERR is now added to final description, in the event of an error, if less than 256 chars.
- [`2c58301`](https://github.com/jhuckaby/cronicle/commit/2c58301fd3d62147aad1292f9d6a00f090ea6abf): Added annotate (timestamp) checkbox to standard Shell Plugin.
- [`456ba46`](https://github.com/jhuckaby/cronicle/commit/456ba468480437f8f52a64ab466ad4a23ae4fa73): Increment stats.jobs_failed when a job fails to launch (server unavailable, etc.).
- [`8ed0712`](https://github.com/jhuckaby/cronicle/commit/8ed0712785d702e01d40d5e45d8bcdab30642058): Fixed elapsed time for detached jobs. The elapsed time was being calculated from when the master daemon finished the job, but this may be up to 60 seconds AFTER the job itself completed, for detached jobs, because they send status updates by way of queue files.  This corrects that by allowing the child to set the `time_end` property in the job JSON. Note that this DOES introduce a possible issue with clock sync between servers in the same cluster.
- [`6dcb06b`](https://github.com/jhuckaby/cronicle/commit/6dcb06b29a8bbb9122bc45ae6a4fdd9a1110804c): Now always calling Tools.getpwnam() for user info on job launch. This will correct issues like the shell environment missing things like HOME when init.d launches the Cronicle daemon after a server reboot.
- [`d7848f2`](https://github.com/jhuckaby/cronicle/commit/d7848f24799c5ed91fec401c96af1b2916c75026): Much improved handling of detached jobs on Cronicle restart / upgrade. Detached jobs will now seamlessly recover after any server restart (as long as the server wasn't down for dead_job_timeout+).
- [`e760396`](https://github.com/jhuckaby/cronicle/commit/e760396b0873396de1beac79f1ce2f39e896aa06): Disabled uglify for now. Makes things easier to debug on production, and the content is gzipped anyway.
- [`c7605c6`](https://github.com/jhuckaby/cronicle/commit/c7605c643ae7f44dc0ba5b39aee436e241221c2b): Updated dead_job_timeout, added more details.
- [`9e0563f`](https://github.com/jhuckaby/cronicle/commit/9e0563f3bf8d76b1c26fdfb83ec18d8cf007ac02): Increased default dead_job_timeout to 120 seconds. Upgrading servers may take longer than 30 seconds, and don't want detached jobs to be declared dead.
- [`17c7d67`](https://github.com/jhuckaby/cronicle/commit/17c7d6767fe9d4ca59c4571991cad09b78edb1d8): Version 0.6.17 Locked some top-level package versions, just for a bit of safety. npm-shrinkwrap would be better long term.

## Version v0.6.16

> June 11, 2017

- [`78642c0`](https://github.com/jhuckaby/cronicle/commit/78642c01c55cf1e53c639a2d1011ac320fe7a291): Version 0.6.16
- [`b74bf7f`](https://github.com/jhuckaby/cronicle/commit/b74bf7ff7f5428969952cf3f2550791f25cdfbfd): Fixed crasher bug where variable was getting replaced with undefined in a chain reaction error.
- [`375bafb`](https://github.com/jhuckaby/cronicle/commit/375bafbdbbdd293441d53c8b7ca4023f57b0b86d): Fixed race condition when navigating to JobDetails page just after starting a manual job on a remote server.
- [`dcc5bb2`](https://github.com/jhuckaby/cronicle/commit/dcc5bb2214b2fe4d5f7e6f046752e4f29e263858): Fixed bug where server_comm_use_hostnames was not being honored for fetching job log files, and for pinging slaves during a master failover event.

## Version v0.6.15

> May 7, 2017

- [`51bce3c`](https://github.com/jhuckaby/cronicle/commit/51bce3c56dd8de5624dfa0f8faf2f7071594c12d): Version 0.6.15 Now preserving deleted event, category and plugin titles on "Completed" page. Fixes #28
- [`c40fd22`](https://github.com/jhuckaby/cronicle/commit/c40fd2270085ec6c97a8c0c955a437fd4ec19cff): Capitalization fix.
- [`218c68d`](https://github.com/jhuckaby/cronicle/commit/218c68df570f42b61d0f4f3724858df4f15183bc): Fixed code indentations. Added bcrypt-node to colophon.

## Version v0.6.14

> April 29, 2017

- [`30511ee`](https://github.com/jhuckaby/cronicle/commit/30511ee7b9e84d88f59fb2f752eb7842b6a7ef5f): Now logging job completions to the activity log if and only if the job fails.
- [`79603b3`](https://github.com/jhuckaby/cronicle/commit/79603b3a645fcfe085025fb22d51a6146c6596ed): Fixed unit test that was relying on successful jobs being logged in the activity log (we no longer do that).
- [`77379f6`](https://github.com/jhuckaby/cronicle/commit/77379f6fb006ad21e395c5b7dc421e8ec5a7e558): Version 0.6.14
- [`df837e9`](https://github.com/jhuckaby/cronicle/commit/df837e99f9cb4ac47036bacc6b5007a0caff2cc6): Now making sure event has a timing element before checking (crash prevention). Support for web_hook_custom_data. More verbose debug logging for web hook responses.
- [`a36ea1a`](https://github.com/jhuckaby/cronicle/commit/a36ea1a8d49763209db4e58be3f437c1889dc919): Support for web_hook_custom_data. More verbose logging for all web hook responses. Bug fix: Incorrectly logging error for non-error when job runs.
- [`410db62`](https://github.com/jhuckaby/cronicle/commit/410db62c05d18c09ffc7d1d6109fd2e566daed52): Support for web_hook_ssl_cert_bypass Typo in comment
- [`1f79547`](https://github.com/jhuckaby/cronicle/commit/1f795473bb3443c78f04893ea2cdf2243ddf640c): Now calling requireValidEventData() for create_event, update_event, run_event and update_job APIs. Change in create_event API: Event MUST have a timing element now.
- [`3fda9ee`](https://github.com/jhuckaby/cronicle/commit/3fda9ee8c107eaa36f178d156c2d4928f911b243): Utility method for validating event data, used by create_event, update_event, run_event and update_job APIs
- [`61df577`](https://github.com/jhuckaby/cronicle/commit/61df5777c28869ee41f73065ed9c642bf78da99e): Added details for web_hook_custom_data and web_hook_ssl_cert_bypass. Typo fix.
- [`3323fc2`](https://github.com/jhuckaby/cronicle/commit/3323fc283fd63ab208cc53bf3795cb5257a4af16): New issue template for GitHub.

## Version v0.6.13

> April 24, 2017

- [`dc6d9f4`](https://github.com/jhuckaby/cronicle/commit/dc6d9f425a4169ef4ea32f70f3f2f2d2e6558d5f): Version 0.6.13
- [`b476b7b`](https://github.com/jhuckaby/cronicle/commit/b476b7ba53c857cfed1e24f278e1bd3185d9c72b): No longer logging activity for every job completion (is redundant, as they're all listed in the Completed tab). Manual job launches will still be logged.
- [`d0e7ad7`](https://github.com/jhuckaby/cronicle/commit/d0e7ad76846a6957bbd067a44a8aeeaee73cf4e5): Now logging activity for server disable (lost conn) and server enable (reconnected).
- [`b3c8017`](https://github.com/jhuckaby/cronicle/commit/b3c8017c6b55cb4f3b96ceace8d884e945ddc1db): Support for new server_disable and server_enable activity events.
- [`f9ab8c2`](https://github.com/jhuckaby/cronicle/commit/f9ab8c2b880aa8f60f2fdc25533d19d81ec37f60): Added support for job_env default environment variables. Added missing callback for fs.writeFile.
- [`49761ad`](https://github.com/jhuckaby/cronicle/commit/49761ad5c694dd5bdfcaa11b4a832b5e4977bcb5): Added blurb for new job_env config object.
- [`5e19b80`](https://github.com/jhuckaby/cronicle/commit/5e19b80c78769c755bcd2d51d054bd2811abe1dc): Added empty job_env object.
- [`ca42be4`](https://github.com/jhuckaby/cronicle/commit/ca42be4ade1980aa9cffcf4a6c5d655fb277775d): Fixes possible bug with least mem / least cpu algorithms, and multiple server groups.

## Version v0.6.12

> April 9, 2017

- [`ad33c8e`](https://github.com/jhuckaby/cronicle/commit/ad33c8edab62347b57de5841c0778adaa23b58e3): Version 0.6.12 Added 'mail_options' config param, for sending options directly to pixl-mail, such as SMTP auth, SSL, etc. Fixes #17
- [`fd02cb4`](https://github.com/jhuckaby/cronicle/commit/fd02cb4b6c6b9a9b4e8acb8bee2294f89fbb8131): Updated description of detached mode, to reflect the new minute-delayed updates in v0.6.11.

## Version v0.6.11

> March 9, 2017

- [`185db48`](https://github.com/jhuckaby/cronicle/commit/185db48cf2f0ab73168d98942c4309c9b36a1539): Version 0.6.11 Randomized detached job update frequency as to not bash the queue directory when multiple detached jobs are running, and also to better catch the minute updates of the daemon.

## Version v0.6.10

> March 8, 2017

- [`2312fe1`](https://github.com/jhuckaby/cronicle/commit/2312fe11dd4d0d07fa8ec146199e31a51ccf4201): Version 0.6.10 Fixed bug where detached jobs would crash if the job command-line exec contained any arguments (typo). Progress events emitted by detached jobs are now processed and the UI updated (once per minute).
- [`35408ac`](https://github.com/jhuckaby/cronicle/commit/35408ac3a87fa6eba04c312884c1ce70f1b66cfd): Silence deprecation warning with Node v7.

## Version v0.6.9

> February 17, 2017

- [`313d409`](https://github.com/jhuckaby/cronicle/commit/313d409ee8729b793c3f45588a9eca133271c42a): Version 0.6.9 Nightly maintenance scalability: Now chopping lists manually, and not using listSplice(). This is to reduce memory usage for extremely high job traffic installations. Cosmetic fix in CSS for drop-down menus in Chrome.

## Version v0.6.8

> February 16, 2017

- [`60ed518`](https://github.com/jhuckaby/cronicle/commit/60ed51892f56a3b8d1375fd8f037dcface695208): Version 0.6.8 New "Error.log" contains all errors (used to be in "Cronicle.log"). New "Transaction.log" contains all transactions (used to be in "Cronicle.log"). More tweaks to socket.io-client to make it more resilient with bad server connections.

## Version v0.6.7

> February 15, 2017

- [`a927e6a`](https://github.com/jhuckaby/cronicle/commit/a927e6ae5d0bd81bb9a57acbb99b513d9a5ac6d3): Version 0.6.7 Fixed bugs in various APIs that expect 'offset' and 'limit'.  These were passed to the storage system as strings (not integers) which caused all manner of havoc. Fixed bug with CLI storage script and Couchbase back-end (was not closing connections and not exiting). Removed obsolete 'upgrade_logs' CLI command (was for v0.5 upgrade only). Fixes #10 Fixes #11

## Version v0.6.6

> February 14, 2017

- [`c643276`](https://github.com/jhuckaby/cronicle/commit/c6432761a933bacb0e72ed0930d9f47a992fbb79): Version 0.6.6
- [`c5ac985`](https://github.com/jhuckaby/cronicle/commit/c5ac9850098cf44dd5c967149740980eb3a84656): Fixed bug where a plain user (i.e. no privs) could not load the event history or stats pages. Fixes #7, thanks user @iambocai!
- [`24a3bc7`](https://github.com/jhuckaby/cronicle/commit/24a3bc79938941d0959b1f04ea84c31f8c2ea32b): Now properly detecting the absolute path of the control script, so it will work if the user is in the bin directory. Fixes #8

## Version v0.6.5

> February 6, 2017

- [`163ee84`](https://github.com/jhuckaby/cronicle/commit/163ee8429abacbaedb7e8540c653893b0a758735): Version 0.6.5 Fixed bug where "Waiting for master server..." dialog would get stuck if server became a slave. Updated copyright years. Small CSS cursor fix on dialog text.

## Version v0.6.4

> January 5, 2017

- [`f3f98ef`](https://github.com/jhuckaby/cronicle/commit/f3f98ef0a66fe8c7e4c7013e3dfbf5bf57751a3d): Version 0.6.4. Now accepting the letter 'H' in Crontab expression imports, which represents a random value but locked to a random seed (event title).  Fixes #6. Attempt to address weird socket.io client behavior with intermittent connection failures.

## Version v0.6.3

> December 3, 2016

- [`01234c7`](https://github.com/jhuckaby/cronicle/commit/01234c77f3adabcdd81844dd1d1987100560fbc3): Version 0.6.3 Better summary of repeating time intervals not starting on the :00 minute. Heard report of errors with auto-discovery and broadcast IP detection, so adding defensive code. Heard report of errors using Least CPU / Least Memory, so trying to work around potential issues there.

## Version v0.6.2

> October 26, 2016

- [`53b1f67`](https://github.com/jhuckaby/cronicle/commit/53b1f6754c10702f21df6e3778a728b2f2bdd473): Version 0.6.2 Fixed links to download and view job logs: now using current host, not master server's IP address.

## Version v0.6.1

> October 24, 2016

- [`27e25b7`](https://github.com/jhuckaby/cronicle/commit/27e25b7db1caefd73b03c6311d5fb58418421527): Version 0.6.1 For external user login integrations, now forcing API to hit current page hostname vs. master server, so login redirect URL reflects it. This results in a better experience after logging in (redirects back to correct URL, not an IP address or master server hostname).

## Version v0.6.0

> October 22, 2016

- [`9bf87a8`](https://github.com/jhuckaby/cronicle/commit/9bf87a8d009c3bce4eb63fad6bc32b7e199d478a): Version 0.6.0 New formatting options for Schedule page.  Can now group events by category (default), plugin, target, or a simple flat list. Options are configurable by small icons in the top-right corner of the table. Settings are saved in localStorage. Misc UI fixes for schedule table.

## Version v0.5.8

> October 16, 2016

- [`d4c38bb`](https://github.com/jhuckaby/cronicle/commit/d4c38bb827a634afc22a0bbbac2da3875617d5ff): Added default server_comm_use_hostnames and web_socket_use_hostnames params. Both will default to 0 if omitted (i.e. existing configs out in the wild).
- [`7bf6fbf`](https://github.com/jhuckaby/cronicle/commit/7bf6fbfbd4b55cc971bf60397ea8ff75abf6e2af): Version 0.5.8
- [`92c059d`](https://github.com/jhuckaby/cronicle/commit/92c059d8a931660c572ee71cc2be695870b98c7c): Now firing web hook for failing to launch job (job_launch_failure).
- [`afa005c`](https://github.com/jhuckaby/cronicle/commit/afa005c7d9450c3d6c0ee91189e9e1b71a88f8c1): Support for pending jobs (retry delay) when opening new live log stream. Misc debug log fixes.
- [`dcf8422`](https://github.com/jhuckaby/cronicle/commit/dcf84224a2e1ed5be783ffce0fe85052cc8b68c9): Support for server_comm_use_hostnames, to connect via IP or hostname.
- [`92dfd18`](https://github.com/jhuckaby/cronicle/commit/92dfd180879a1c48a4aba290c3e4fae3bbd96814): Now including web_socket_use_hostnames param. Now including initial false server cluster with master server IP, for initial websocket connect.
- [`5bd4dcf`](https://github.com/jhuckaby/cronicle/commit/5bd4dcf1fd018727ef05837a1c0b06aba95ff93b): Now supporting loading page when job is in retry delay mode. Fixed high CPU usage with chart updates. Support for web_socket_use_hostnames when connecting to live log. Fixed bug where "Finishing Job..." dialog could appear when job switches to retry delay.
- [`e2551bf`](https://github.com/jhuckaby/cronicle/commit/e2551bfd02b1edb11c35083862c3f0b7e3ef3e7e): Now supporting linking into jobs that are in "retry delay" state. Better delay for retry delayed jobs.
- [`ed2971b`](https://github.com/jhuckaby/cronicle/commit/ed2971b4f1913ab9d4230e1d185d1a5b2aec55b8): Bug fixes on perf stat graph. Now ensuring perf metrics don't go below zero. Improved y axis labels for higher time scales.
- [`88cd68c`](https://github.com/jhuckaby/cronicle/commit/88cd68cf582c53bc2235db92e217bf4940fd1a25): Support for web_socket_use_hostnames in client-side Websockets and API calls.
- [`79087bf`](https://github.com/jhuckaby/cronicle/commit/79087bfed591ddfa8c0368309c71f237cbf7eac2): Added descriptions for config params server_comm_use_hostnames and web_socket_use_hostnames. Added details on job_launch_failure web hook action.
- [`35849fa`](https://github.com/jhuckaby/cronicle/commit/35849fa8e3edf259977b9a22904800710d39e5ff): Removed try/catch around Tools.getpwnam(), as it doesn't throw.

## Version v0.5.7

> October 2, 2016

- [`3e3ef67`](https://github.com/jhuckaby/cronicle/commit/3e3ef678197bfcf22b88249896a9afcf06147f40): Version 0.5.7 Removed last remaining C++ dependency (posix) so can now be installed without any compilation. Removed GID text field, now only accepting UID (updated docs and screenshots). Edit Event page now has links to jump to event's history and stats. No longer running pixl-server-storage unit tests along with ours (no reason to).
- [`b5b2e89`](https://github.com/jhuckaby/cronicle/commit/b5b2e89571952dbd602f5bc0ef64800dc72e3d0c): Use tabs instead of spaces
- [`1a1e25c`](https://github.com/jhuckaby/cronicle/commit/1a1e25c62eb33cd2331bb39ee7a89c0deb8673dd): Added https header detect to sample configuration

## Version v0.5.6

> August 14, 2016

- [`e4d7a0f`](https://github.com/jhuckaby/cronicle/commit/e4d7a0f4cdacecab99d1ff9129f2997ac98e3bf4): Default new events no longer have the "Catch-Up" feature checked. New event template is now configurable in config.json. Bumped version to 0.5.6.

## Version v0.5.5

> August 7, 2016

- [`8fc2360`](https://github.com/jhuckaby/cronicle/commit/8fc2360a84f1b9232d3cc170f4b339a4f1919fd4): Now using bcrypt for hashing passwords. Fixed bug where plugin params named 'script' didn't make it into the ENV hash. Bumped version to 0.5.5.

## Version v0.5.4

> June 10, 2016

- [`08d9dcc`](https://github.com/jhuckaby/cronicle/commit/08d9dcc29917b76cd6b1bf67faf60fa75f4b63c8): Fixed bug where the nightly maintenance wasn't trimming long lists properly. Bumped version to 0.5.4.

## Version v0.5.3

> May 7, 2016

- [`5f2b49c`](https://github.com/jhuckaby/cronicle/commit/5f2b49c72d75d710fd6677dfe3550da58b7b538f): Added new job JSON feature: 'update_event' Job Plugins can now emit an 'update_event' object to update the associated event upon job completion. Fixed bug with edit event autosave data, is now cleared if schedule is updated. Fixed potential race condition in unit test.
- [`7cbb440`](https://github.com/jhuckaby/cronicle/commit/7cbb4400962e34c9d7970931372a8e3b0fc1d1f4): "Run Now" button on Edit Event screen will now run event in it's "current" state, potentially edited and unsaved. Schedule and History tabs will now save their state (sub-page) so tab clicks return to the same sub-page you were on (similar to the Admin tab). The Edit Event page will now autosave and restore the event for returning to the tab. Bumped to version 0.5.3.
- [`a151d9a`](https://github.com/jhuckaby/cronicle/commit/a151d9a367cdbdce93c333094a4f2934db79c93e): Bug fix: Wrong number of arguments to doError(). Removed server clock sync requirement for adding servers.
- [`09d0d58`](https://github.com/jhuckaby/cronicle/commit/09d0d58e30329dcd2e35f591f060432b6adbbfec): Typo fix (only affects debug log).

## Version v0.5.2

> May 1, 2016

- [`7e6f233`](https://github.com/jhuckaby/cronicle/commit/7e6f233ade73f226546cbd45ef732159f806d80d): Version 0.5.2 New 'import' and 'export' CLI commands for importing and exporting data. Fixed some CLI parsing bugs in control script.

## Version v0.5.1

> May 1, 2016

- [`22a5bcf`](https://github.com/jhuckaby/cronicle/commit/22a5bcfbefb1d9696296ac13d279967ab76119a4): Updated to use new screenshots.
- [`774ea0f`](https://github.com/jhuckaby/cronicle/commit/774ea0f361eb921dd4f7081cf3dbeea6aee1f75b): Disabled browser spellcheck in various Plugin Param text fields (was annoying me).
- [`dbd801b`](https://github.com/jhuckaby/cronicle/commit/dbd801b8b33456df14a565353908876ca8ea66d8): Implemented 'web_hook_config_keys' (array), so any config keys may be included in web hook data. Bumped version to 0.5.1.

## Version v0.5.0

> April 30, 2016

- [`feec309`](https://github.com/jhuckaby/cronicle/commit/feec3091db47f8cfa42f861eba0da2ea0f3c858d): Version 0.5. All job logs are now compressed when stored. BREAKING CHANGE: This changes the internal format of all logs to gzip, and will require a one-time script run to preserve existing logs: Run this command once on the master server: sudo /opt/cronicle/bin/storage-cli.js upgrade_logs
- [`60708a8`](https://github.com/jhuckaby/cronicle/commit/60708a8628ddbcbc1e0543ecd7c09ae7f9394996): Version 0.2.6 New API: update_job (update jobs in progress) When updating an event, if jobs are running, prompt user to update jobs as well. On job details screen (live progress), new design for "Watch" and "Abort" buttons. "Watch" checkbox toggles user's e-mail info notify_success and notify_fail. Updated docs and unit tests. Misc UI fixes.
- [`b255394`](https://github.com/jhuckaby/cronicle/commit/b255394909fb5e7784417990a46204fa891f3eaf): Fixed display bug where percentage could be a looooong float.

## Version v0.2.5

> April 18, 2016

- [`8686a99`](https://github.com/jhuckaby/cronicle/commit/8686a996a61a3c14c6a7eba699b76ffb6866f813): Misc changes: Added filtering and keyword search to Upcoming Events on Home tab. Socket.IO fixes (better handling for lost connections). Fixed percentage display on Job Details page. Fixed bug where retry delay controls were clickable even if invisible. Removed error when adding servers: "Server clocks are too far out of sync.". Added optional 'log_expire_days' property which can be outputted from job JSON. Updated copyright, added link to Cronicle home. Bumped version to 0.2.5.

## Version v0.2.4

> April 14, 2016

- [`1b22291`](https://github.com/jhuckaby/cronicle/commit/1b222919b9f040ac187b1126ab8162a9c1af1a0c): Typo.
- [`59f34f8`](https://github.com/jhuckaby/cronicle/commit/59f34f81761d1367aafe592c19772ea8cc7542c0): Fixed bug where copyFiles() would assume every file was a file, and not a sub-dir. No longer using deprecated fs.existsSync call. Bumped version to 0.2.4.

## Version v0.2.3

> April 13, 2016

- [`c81e150`](https://github.com/jhuckaby/cronicle/commit/c81e1506f01a5245d7e494f2c49d62e7e5a409eb): Fixed bug where filehandle to job logs would remain open after delete, causing the disk to eventually run out of space. Bumped version to 0.2.3.

## Version v0.2.2

> April 6, 2016

- [`ed24346`](https://github.com/jhuckaby/cronicle/commit/ed24346ffd54945b2186affd9aa73ede1821661a): New flat UI design changes. Now using Lato font from Google Fonts. Bumped version to 0.2.2.

## Version v0.2.1

> April 4, 2016

- [`5317b06`](https://github.com/jhuckaby/cronicle/commit/5317b063bfa342dcab47780f0e95143148cba46c): Fixed bug where "Run Again" button could sometimes freeze up UI if job completed immediately. Bumped version to 0.2.1.

## Version v0.2.0

> April 3, 2016

- [`4fef7db`](https://github.com/jhuckaby/cronicle/commit/4fef7dba2e30f3064847e91753953cbf5e4e5794): Added custom tables and HTML reports on the Job Details page. Bumped version to 0.2.0.

## Version v0.1.9

> March 22, 2016

- [`d5ff383`](https://github.com/jhuckaby/cronicle/commit/d5ff38314fd3196c4fe1c3c11d11ce8361b3b5c1): Misc fixes. No longer displaying logs over 10 MB on Job Details page, unless user asks for it. Fixed bug when sending e-mails about jobs which failed to launch (now tracking which events launched per minute tick). Unit test now runs on HTTP port 4012, and UDP port 4014, as to not interfere with other servers in a cluster. Bumped version to 0.1.9.

## Version v0.1.8

> March 20, 2016

- [`135bafe`](https://github.com/jhuckaby/cronicle/commit/135bafe7e89c9543ed5980f8c2dfd8e68dc6dea2): Cosmetic hack for "day" to "days" in uptime display.
- [`48b007d`](https://github.com/jhuckaby/cronicle/commit/48b007d8f7e4cbc2c6063ecba1585550368544a3): Cosmetic fix for table pagination white-space.
- [`6312513`](https://github.com/jhuckaby/cronicle/commit/6312513a1075ae972890e556e608fad2da4998c8): Bumped version to 0.1.8.
- [`de53b70`](https://github.com/jhuckaby/cronicle/commit/de53b70a01dc2d43912b30647c6d544ea229a77f): Now using streaming API for fetching and storing job logs. Now labeling copied job logs with event title.
- [`5dd3c80`](https://github.com/jhuckaby/cronicle/commit/5dd3c80a20affe20a08d590d5a4b4fa297eba85a): Now using streaming API for fetching and storing job logs. Commented out api_upload_job_log, not being used.
- [`9c10471`](https://github.com/jhuckaby/cronicle/commit/9c104713b5fe99800734ec64036186146dd18af1): Fixed bug where upcoming event countdown time was based on client's local clock, not server clock.
- [`4d9cb4c`](https://github.com/jhuckaby/cronicle/commit/4d9cb4c7a090c6e4f97d3d8571108f23c1ff1078): Prevent flickering on pagination click.
- [`105f176`](https://github.com/jhuckaby/cronicle/commit/105f176086ce0aab731b3b03e0079cd956c10085): Text change: "Waiting for master server..."

## Version v0.1.7

> March 13, 2016

- [`c4e2fd5`](https://github.com/jhuckaby/cronicle/commit/c4e2fd583e20991e8b0cd603be4d394c942a8448): Fixed some weird log file append race conditions. On some OSes (CentOS 6.x for example), writing to log files with `fs.appendFile()` and no callback results in out-of-order lines.  Switched to `fs.appendFileSync()`. Bumped version to v0.1.7.

## Version v0.1.6

> March 13, 2016

- [`24b8517`](https://github.com/jhuckaby/cronicle/commit/24b8517cbf737310f90a5e7a1bd753a83738d436): Bumped version to 0.1.6.
- [`818c394`](https://github.com/jhuckaby/cronicle/commit/818c394a4c7909aff38ee3152cdf85e4e53cfe1e): Added more debug info for a failing test.
- [`c0260b6`](https://github.com/jhuckaby/cronicle/commit/c0260b669217ce3e642d5e53c20f7547f4ceb6b7): Now using async.ensureAsync() instead of process.nextTick(). Seems to help with Node v0.12 memory leaks a bit.
- [`e7bc851`](https://github.com/jhuckaby/cronicle/commit/e7bc8515294edb7adfbe809934e9e1efa026f88e): Misc fixes. Now including `process.argv` in startup debug message. Now including `process.memoryUsage()` in GC debug messages. No longer tainting data in `logActivity()` (making copy first).
- [`142fa69`](https://github.com/jhuckaby/cronicle/commit/142fa695cd0d42894cadbb13692dd13ddf09a089): No longer tainting params in getClientInfo() (make a copy first).
- [`27c4d50`](https://github.com/jhuckaby/cronicle/commit/27c4d50bf74e5cc069a1d1a6c5bb08b881e9706b): Fix for rare race condition seen on main Home tab. Apparently app.categories and app.plugins can be null but we still have active jobs to render.
- [`006e15c`](https://github.com/jhuckaby/cronicle/commit/006e15cdb0f8375dff5b5620a32d966027934169): Now catching and ignoring errors on the child STDIN stream. (i.e. EPIPE errors if the child exits before we get a chance to write the job JSON)
- [`8a52c1a`](https://github.com/jhuckaby/cronicle/commit/8a52c1a6bb88f9155adf48c193d4427c8521a872): Removed '--color' flag by default. Your mileage may vary with this, but feel free to re-add it on the CLI.

## Version v0.1.5

> March 6, 2016

- [`0021be4`](https://github.com/jhuckaby/cronicle/commit/0021be4c10fe679490ee92a85067fd449e9ca0d6): Added optional dialog in Run Now for customizing the current time. Fixed bug in choose_date_time() which would not floor the seconds to 0. Fixed bug where chain reaction mode could not be disabled after it was enabled on an event. Misc fixes in README.md. Bumped version to v0.1.5.

## Version v0.1.4

> March 6, 2016

- [`6625c11`](https://github.com/jhuckaby/cronicle/commit/6625c1164f22c13f6a268720a02ea74aabfc595f): Fixed display bug with long error messages on JobDetails page. Fixed markdown error in README. Better .gitignore file in README. Bumped version to 0.1.4.
- [`e277f40`](https://github.com/jhuckaby/cronicle/commit/e277f4050299d44666a2778746ab15ab15856548): More accidental commits (symlinks, files created as part of build process).
- [`9e723fa`](https://github.com/jhuckaby/cronicle/commit/9e723fa1402a10e8057c204c79b2e88c582ed981): Removed some accidental commits (symlinks, 3rd party libs, part of build process).

## Version v0.1.3

> February 28, 2016

- [`c5f6fa5`](https://github.com/jhuckaby/cronicle/commit/c5f6fa530f2a2186a07e0feeb947fdf1ce938d9d): Added chainReaction() function for spawning new job at completion of old one. Added process.env into email_data for future use.
- [`70bdbe3`](https://github.com/jhuckaby/cronicle/commit/70bdbe35f8f3515058ea2f26feb37d6adf4b6f29): Support for Chain Reaction feature at completion of successful job.
- [`6721f82`](https://github.com/jhuckaby/cronicle/commit/6721f82a8c1e867d2065d7321e8c755ea77cf204): Now sorting things properly by localeCompare, and lower-case.
- [`f3e076d`](https://github.com/jhuckaby/cronicle/commit/f3e076d59b8f1389e64fcc0a0b53c0291f2338a7): Now sorting things properly by localeCompare, and lower-case.
- [`f0dba78`](https://github.com/jhuckaby/cronicle/commit/f0dba789959af1e138f29d5cdcbfd0c21a8e49f6): Now sorting things properly by localeCompare, and lower-case.
- [`343243e`](https://github.com/jhuckaby/cronicle/commit/343243e70ce92dae702c6229ff97ab754450a278): Added Chain Reaction feature in UI. Now sorting everything properly, using localeCompare() and lower-case.
- [`246b060`](https://github.com/jhuckaby/cronicle/commit/246b06041e8b06a407ef39544cc21aa94f411b21): Added auto-ellipsis to job source, now that it may contain a chain reaction source event name.
- [`16fba1d`](https://github.com/jhuckaby/cronicle/commit/16fba1dfb6c8b71379871c5a998b1deaca3eb37d): Now sorting events properly by localeCompare, and lower-case.
- [`fbf867a`](https://github.com/jhuckaby/cronicle/commit/fbf867a519561b16ae44597fb4ad4b5d429732a5): Now passing job JSON blob downstream to the shell script process itself, just in case it decides to read it in.
- [`af7deb7`](https://github.com/jhuckaby/cronicle/commit/af7deb7d93ec99d37f1bdd6b37c94c30599815e0): Added docs for the Chain Reaction feature. Added docs for including config params and env vars in e-mails.
- [`6276c96`](https://github.com/jhuckaby/cronicle/commit/6276c9609147ab61912faf6856877d3916e5c1cb): Version 0.1.3.
- [`8d75b2e`](https://github.com/jhuckaby/cronicle/commit/8d75b2eca289639715f6009c0ce58a7804e3de71): Now sending e-mail if job fails to launch, and event has "notify_fail" set.
- [`d48be9c`](https://github.com/jhuckaby/cronicle/commit/d48be9c44962d86cb56a55be68aef3adfaabdc15): Now using Base choose_date_time() dialog when you click on the Time Machine text field. Also, changed it to use the EVENT's timezone, not your local timezone (seems to make more sense).
- [`3f5cb25`](https://github.com/jhuckaby/cronicle/commit/3f5cb25fe2b664b05d50d3b39b813faaa573d131): Added choose_date_time() dialog.
- [`733cc2d`](https://github.com/jhuckaby/cronicle/commit/733cc2dc25b48c0c34d7ddec71acaa2fd98861a4): Changed header and floating clocks to include timezone abbreviation.
- [`3d9ac14`](https://github.com/jhuckaby/cronicle/commit/3d9ac146aba359e2aa75d606bfbbe45e093447ca): Added styles for date/time dialog. Misc. adjustments for adding TZ to floating clock.
- [`15d9537`](https://github.com/jhuckaby/cronicle/commit/15d953703401dc21a515a24323c481bb5c581d3d): Added conf/emails/event_error.txt email configuration file.
- [`de40e5b`](https://github.com/jhuckaby/cronicle/commit/de40e5b852112699564bc7ab1d8f045bec4981ab): New e-mail template for general event errors (i.e. failure to launch job).

## Version v0.1.2

> February 27, 2016

- [`515febe`](https://github.com/jhuckaby/cronicle/commit/515febee0626732c691cd55dce88a31049e14b88): Version 0.1.2.
- [`605f2d0`](https://github.com/jhuckaby/cronicle/commit/605f2d04333fb61b813e9d6062c389a093001717): Renamed a few algo IDs (prefer_first and prefer_last). Adjustments for monitoring server resources every 10 seconds. Now logging res monitor stuff at debug level 10 to prevent spamming log. Changed default job_startup_grace to 5 seconds. cp.exec for ps -ef now has a 5 sec timeout.
- [`a4aa6af`](https://github.com/jhuckaby/cronicle/commit/a4aa6af9497088f5ba5377cf68fb6aaee2b9a256): Now monitoring server resources every 10 seconds if local active jobs, 60 seconds if not.
- [`cf38ec1`](https://github.com/jhuckaby/cronicle/commit/cf38ec11f27721b5ea34dbce3c80a9653d9c64d4): Adjusted algo IDs a bit to make them more clear.
- [`d623fe8`](https://github.com/jhuckaby/cronicle/commit/d623fe807c72afdb23ac0679cda53c7d5ef0f193): Now logging some more sample text every N seconds, for better live log demos.
- [`3c51977`](https://github.com/jhuckaby/cronicle/commit/3c51977a75dd6326ae6702938971c101a301e8d7): Added Algorithm IDs (for use in API). Changed resource monitoring frequency to 10 seconds.

## Version v0.1.1

> February 27, 2016

- [`cda2c4a`](https://github.com/jhuckaby/cronicle/commit/cda2c4a6772ee8e975d72aafc5e538e6c33b92ea): Better shutdown procedure: Now waiting for all local, non-detached jobs to abort before continuing shutdown. Also waiting for scheduler to write out its state file. Tagging v0.1.1.

## Version v0.1.0

> February 27, 2016

- [`17cf443`](https://github.com/jhuckaby/cronicle/commit/17cf443a88e47a40b162e2c8010a83865429f842): Fixed bug in control shell script with multi-argument commands. Tagging v0.1.0.

## Version v0.0.9

> February 27, 2016

- [`faa8b4e`](https://github.com/jhuckaby/cronicle/commit/faa8b4ea05140e93fc2afacac1ca8206ccc567e7): Fixed sample e-mail address.
- [`9921e98`](https://github.com/jhuckaby/cronicle/commit/9921e987a5528ef557fab3ac27d6d8a2321c4c2e): Version 0.0.9.
- [`1f4963f`](https://github.com/jhuckaby/cronicle/commit/1f4963ff31efc4501675cb012814c9c5bd35d14d): New server selection algorithm feature (random, round robin, etc.). Added detail to child spawn error message.
- [`f72129c`](https://github.com/jhuckaby/cronicle/commit/f72129cf8e3c382b80ac0f2cb0173262be46b438): Now deleting round robin state data when event is deleted.
- [`74b75b6`](https://github.com/jhuckaby/cronicle/commit/74b75b6c0267e3430d53ce50854b0e51d2e4aaf5): Changed nearby server highlight color to blue. Fixed width of "Add Server" text field in dialog.
- [`e347f90`](https://github.com/jhuckaby/cronicle/commit/e347f908d84d60b455335088c3013e4eec2edf2d): Added new server selection algorithm feature.
- [`d16eb20`](https://github.com/jhuckaby/cronicle/commit/d16eb202e18bc719f53c4b8dbe39a7376fb3c74c): Adjusted column width a bit, for smaller monitors.
- [`c4e32fe`](https://github.com/jhuckaby/cronicle/commit/c4e32feafd8d677be9de3164b118b2919c71126d): setGroupVisibility() now returns `this` for chaining.
- [`b80670b`](https://github.com/jhuckaby/cronicle/commit/b80670b146689c223982cc34514c2e57baf73e1c): Added description of new server selection algorithm feature. Misc other fixes.

## Version v0.0.8

> February 21, 2016

- [`54c0fe9`](https://github.com/jhuckaby/cronicle/commit/54c0fe9eb28d59f64198d82e354d0a6cfb9cc037): Version 0.0.8: Misc bug fixes, added new APIs for fetching categories and plugins.
- [`755ed1d`](https://github.com/jhuckaby/cronicle/commit/755ed1dad7be75959e3fa109feb493bc7b8db8df): Added api_get_plugins().
- [`6857bf0`](https://github.com/jhuckaby/cronicle/commit/6857bf0cfdf4fe47369ff2f101dd1b823a163c20): Bug fix: User/APIKey must have "abort_events" priv in order to use abort_jobs param with api_update_event.
- [`330cd3d`](https://github.com/jhuckaby/cronicle/commit/330cd3d548a4cd64af15455ae226613abd9582ab): Uncommented api_get_categories().
- [`706097a`](https://github.com/jhuckaby/cronicle/commit/706097ab2821d82161aca6e639ff978329220d7a): When disabling event/category/plugin and jobs are active, only alerting for non-detached ones.

## Version v0.0.7

> February 6, 2016

- [`c7ebc13`](https://github.com/jhuckaby/cronicle/commit/c7ebc133577f5d017d6e96a8550959a5babfd1c2): Added unit test commands, and pixl-unit as a devDependency Bumped to v0.0.7.
- [`6f4093a`](https://github.com/jhuckaby/cronicle/commit/6f4093a070050c82c087681e210e3aec4b9f5ddf): Added checkEventTiming() method for checking event timing without having to use moment.js directly.
- [`124d786`](https://github.com/jhuckaby/cronicle/commit/124d7863d3063b692b648f2ded29dd86ad6cd240): Typo in variable name.
- [`612e6cc`](https://github.com/jhuckaby/cronicle/commit/612e6cca1e930e49a8ba03477a3d5d399387c6f1): Added optional 'ps_monitor_cmd' config property for customizing the command that grabs process cpu/mem. Added optional 'job_startup_grace' config property to adjust the amount of time before jobs are measured (cpu/mem). More verbose debug logging.
- [`8283905`](https://github.com/jhuckaby/cronicle/commit/828390522b45b3b005a5b0a3d6734225a96ea63c): Removed title requirement on API calls, now derives from storage.
- [`885851e`](https://github.com/jhuckaby/cronicle/commit/885851e9e716e3d5b8d9c7ddb9106cb417719e3f): Removed title requirement on API calls, now derives from storage.
- [`d257d76`](https://github.com/jhuckaby/cronicle/commit/d257d7644fb1f3845b5607b7194480aaec9c1c80): Removed title requirement on API calls, now derives from storage.
- [`5976510`](https://github.com/jhuckaby/cronicle/commit/59765104543e59ae0a6bea26d2577c6339c65957): Removed title requirement on API calls, now derives from storage. api_get_api_key: Added requireParams check.
- [`16f65c8`](https://github.com/jhuckaby/cronicle/commit/16f65c841cba3bbf2c5e7396c1f41dd9bc9ce7a9): Fixed bug where an API key attempting an administrative level function would result in no callback being fired.
- [`a7599dd`](https://github.com/jhuckaby/cronicle/commit/a7599dd4a88f37c77afdd8f5e75d7e3ffeb3e4cd): Now writing queue files atomically, to avoid any possible race condition with the queue dir monitor.
- [`005693f`](https://github.com/jhuckaby/cronicle/commit/005693fb4ec8947e618303bebb7f2cde4c30cd5f): Added section on running unit tests, and now listing pixl-unit module.
- [`317fda4`](https://github.com/jhuckaby/cronicle/commit/317fda4e957c9b2dde1469c0fcc0cb50e44a88c3): Unit tests!  Yay!
- [`f88ed59`](https://github.com/jhuckaby/cronicle/commit/f88ed596a964b74e8c4862b9285768cf1a411ae2): Fixed a few bugs in the sample Plugin code. Renamed "Shell Plugin" to "Built-in Shell Plugin" to reduce confusion with neighboring sections.
- [`ab5d128`](https://github.com/jhuckaby/cronicle/commit/ab5d1287b8f72d667ef7c7a23b087103500388f3): Added recommended .gitignore file for local development. Added warning regarding file permissions when running in debug mode as a non-root user. Minor wording changes.

## Version v0.0.6

> January 10, 2016

- [`941936d`](https://github.com/jhuckaby/cronicle/commit/941936d4ffd177d759190e82517a60e5ffd3fecc): Bumped version to 0.0.6.
- [`1cecc69`](https://github.com/jhuckaby/cronicle/commit/1cecc69dda14723a913b40924bdb38f426f48ddd): Now hiding all non-admin privilege checkboxes when admin is checked (they have no meaning, as admin trumps all).
- [`91b1ef6`](https://github.com/jhuckaby/cronicle/commit/91b1ef6d6c0b7a25c045a74b0e685a742d5974e4): Added clarification about timezone interpretation on the Time Machine text field.
- [`6562b32`](https://github.com/jhuckaby/cronicle/commit/6562b320c415c8c8fb4440676f2f2213ff3dce43): Fixed bug where floating clock would obscure logout button when scrolled to top.
- [`645070c`](https://github.com/jhuckaby/cronicle/commit/645070c87bf8c74a92d21da7b9a38d2fe4df6ee7): Fixed bug where floating clock would obscure logout button when scrolled to top.
- [`d8840f0`](https://github.com/jhuckaby/cronicle/commit/d8840f0b363ae9c68b7341365b850ae707850ffa): Added clarification on starting in debug mode and 'Run All Mode' events.

## Version v0.0.5

> January 10, 2016

- [`bda276d`](https://github.com/jhuckaby/cronicle/commit/bda276d54f479f8f57e0b52d8d68f6cd00edc64e): Install Script: Now using 'npm update' for upgrades, instead of running 'npm install' again. Updated docs with explicit callout to 'pixl-webapp' for the client-side framework. Bumped to v0.0.5.
- [`f420972`](https://github.com/jhuckaby/cronicle/commit/f4209721042c6dac4dac824bcefa55404f9e13ee): Upgrade command will now only stop/start service if it was running to begin with.

## Version v0.0.4

> January 10, 2016

- [`a1e4307`](https://github.com/jhuckaby/cronicle/commit/a1e43074d1c224921d251f61657faa247a352832): New feature: Can now integrate with external user management system, via the 'external_user_api' User Manager config prop. Bumped version to v0.0.4.
- [`7cec15c`](https://github.com/jhuckaby/cronicle/commit/7cec15ce1ad51c07441317780f352eb344510305): Reduced console output, now only emitting each storage command in verbose mode. Cleaned up spacing a bit.
- [`7a70618`](https://github.com/jhuckaby/cronicle/commit/7a706181aa84550735b79557c8301cc8bda9ace6): Changed wording a bit.
- [`3939048`](https://github.com/jhuckaby/cronicle/commit/393904873cf61a708553a1b36a69841e70b1361e): symlinkFile: Will now skip operation if target exists and is NOT a symlink (i.e. hard file or directory).
- [`8b1e31a`](https://github.com/jhuckaby/cronicle/commit/8b1e31a0dced3a4a20c528f265baf2ebb2eb0034): Now using fs.appendFileSync to capture command output just before calling process.exit();
- [`a10907f`](https://github.com/jhuckaby/cronicle/commit/a10907fc2f40dd226c10ed0bd61e2ad49c7420de): Added log file to console output, so user can see where it lives.
- [`173f97a`](https://github.com/jhuckaby/cronicle/commit/173f97afc653af7d481a3d2169711793a50fb748): Fixed a few small typos.
- [`0adf98e`](https://github.com/jhuckaby/cronicle/commit/0adf98e0c0a850c9e0090a88cce6b33eedd3543b): Fleshed out table of contents a bit. Added a "Single Server" section, and changed a heading.
- [`fe809cb`](https://github.com/jhuckaby/cronicle/commit/fe809cb57a1a4253b5c6d3ee347d8790f98467a9): Emboldened the glossary terms.
- [`3f6d09c`](https://github.com/jhuckaby/cronicle/commit/3f6d09c487c9278f1b1e8ebaedeae700772bba1a): Moved main screenshot under first para.
- [`d634f3b`](https://github.com/jhuckaby/cronicle/commit/d634f3b04fb8e71079f6e277919cb6795093baba): Consolidated `build.log` into `install.log`. Updated README.

## Version v0.0.3

> January 7, 2016

- [`a28768c`](https://github.com/jhuckaby/cronicle/commit/a28768ce18cb95dccb64f7bc799a4e0dc881bcc5): Fixed a couple small bugs in the upgrade script. Bumped to v0.0.3.

## Version v0.0.2

> January 7, 2016

- [`e5c97d9`](https://github.com/jhuckaby/cronicle/commit/e5c97d9010766d87da7048accedc35a1cb154a9f): Added dependency 'pixl-perf' as it was forgotten.  Sorry pixl-perf! A small tweak in the install script text. Bumped to v0.0.2 to test upgrade process.
- [`e1245b6`](https://github.com/jhuckaby/cronicle/commit/e1245b63ee1bf3fd6eb71151f8814a965d03fb6d): Adjusted spacing slightly.
- [`c7f6611`](https://github.com/jhuckaby/cronicle/commit/c7f6611237ead9c5a322b8672095fbe5bdb2bbc4): Fixed typo in install script.

## Version v0.0.1

> January 7, 2016

- Initial beta release!
