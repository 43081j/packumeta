# packumeta 📦🔍

Extract and inspect metadata from npm packument version documents.

## Install

```sh
npm install packumeta
```

## Usage

```ts
import {
  getTrustStatus,
  getTrustLevel,
  isSupportedArchitecture,
} from 'packumeta';

const res = await fetch('https://registry.npmjs.org/some-package');
const packument = await res.json();
const version = packument.versions['1.2.3'];

const status = getTrustStatus(version);
const level = getTrustLevel(status);

const supported = isSupportedArchitecture(version, 'linux', 'x64', 'glibc');
```

## Trust Scale

The `getTrustLevel` and `getTrustOrder` functions rely on a _trust scale_. This scale is defined as follows from most trusted to least trusted:

| Level | Trust Status      | Description                                                                                                          |
| ----- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| 3     | Staged publishing | The package was published through `npm stage publish`, i.e. it passed a 2FA approval process before being published. |
| 2     | OIDC & provenance | The package was published using trusted publishing (OIDC) and has a provenance record.                               |
| 1     | Provenance        | The package has a provenance record, but was not published using trusted publishing.                                 |
| 0     | None              | The package has no trust status.                                                                                     |

## API

### `getTrustStatus(meta)`

Returns a `TrustStatus` object (`{ provenance, trustedPublisher, stagedPublish }`) derived from a packument version document.

### `getTrustLevel(status)`

Returns the numeric trust level for a `TrustStatus`. See the [Trust Scale](#trust-scale).

### `getTrustLevelName(status)`

Returns the trust level as a string: `'none'`, `'provenance'`, `'trustedPublisher'`, or `'stagedPublish'`.

### `getTrustOrder(a, b)`

Comparator for two `TrustStatus` values. Returns `-1`, `0`, or `1`, suitable for use with `Array#sort`.

### `didDecreaseInTrust(oldStatus, newStatus)`

Returns `true` if `newStatus` has a lower trust level than `oldStatus`.

### `isSupportedArchitecture(pkg, os, cpu, libc)`

Returns `true` if the package's `os`, `cpu`, and `libc` fields are compatible with the given platform.

## License

MIT
