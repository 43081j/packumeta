# packumeta 📦🔍

Extract and inspect metadata from npm packument version documents.

## Install

```sh
npm install packumeta
```

## Usage

```ts
import {getTrustStatus, getTrustLevel, isSupportedArchitecture} from 'packumeta';

const res = await fetch('https://registry.npmjs.org/some-package');
const packument = await res.json();
const version = packument.versions['1.2.3'];

const status = getTrustStatus(version);
const level = getTrustLevel(status);

const supported = isSupportedArchitecture(version, 'linux', 'x64', 'glibc');
```

## License

MIT
