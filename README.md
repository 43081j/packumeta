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

> [!NOTE]
> The staged publishing trust status is currently sniffed from the packument until npm implements a signal to indicate that a package was published through `npm stage publish`. Once this signal is available, the trust status will be updated accordingly.
> For now, we are using an unfortunate hack which does seem somewhat accurate.

## License

MIT
