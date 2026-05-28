import { describe, expect, it } from 'vitest';
import * as meta from './main.js';

describe('getTrustStatus', () => {
  it('should return false for all properties if meta is not an object', () => {
    expect(meta.getTrustStatus(null)).toEqual({
      provenance: false,
      trustedPublisher: false,
      stagedPublish: false,
    });
  });

  it('should return true for trustedPublisher if _npmUser.trustedPublisher is set', () => {
    expect(
      meta.getTrustStatus({
        _npmUser: {
          trustedPublisher: {
            id: 'github',
            oidcConfigId: 'a-b-c',
          },
        },
      }),
    ).toEqual({
      provenance: false,
      trustedPublisher: true,
      stagedPublish: false,
    });
  });

  it('should return true for provenance if dist.attestations.provenance is set', () => {
    expect(
      meta.getTrustStatus({
        dist: {
          attestations: {
            url: 'https://example.com/provenance.json',
            provenance: {
              predicateType: 'https://slsa.dev/provenance/v1',
            },
          },
        },
      }),
    ).toEqual({
      provenance: true,
      trustedPublisher: false,
      stagedPublish: false,
    });
  });

  it('should return true for both properties if both are set', () => {
    expect(
      meta.getTrustStatus({
        _npmUser: {
          trustedPublisher: {
            id: 'github',
            oidcConfigId: 'a-b-c',
          },
        },
        dist: {
          attestations: {
            url: 'https://example.com/provenance.json',
            provenance: {
              predicateType: 'https://slsa.dev/provenance/v1',
            },
          },
        },
      }),
    ).toEqual({
      provenance: true,
      trustedPublisher: true,
      stagedPublish: false,
    });
  });

  it('should be false if _npmUser is not an object', () => {
    expect(
      meta.getTrustStatus({
        _npmUser: 'not-an-object',
      }),
    ).toEqual({
      provenance: false,
      trustedPublisher: false,
      stagedPublish: false,
    });
  });

  it('should be false if dist.attestations is not an object', () => {
    expect(
      meta.getTrustStatus({
        dist: {
          attestations: 'not-an-object',
        },
      }),
    ).toEqual({
      provenance: false,
      trustedPublisher: false,
      stagedPublish: false,
    });
  });

  it('should be false if dist.attestations.provenance is not set', () => {
    expect(
      meta.getTrustStatus({
        dist: {
          attestations: {},
        },
      }),
    ).toEqual({
      provenance: false,
      trustedPublisher: false,
      stagedPublish: false,
    });
  });

  it('should set stagedPublish to true if the approver is set', () => {
    expect(
      meta.getTrustStatus({
        _id: 'some-package@1.0.0',
        _npmUser: {
          name: 'james',
          email: 'james@that-random-number.dev',
          approver: {
            name: 'not-james',
            email: 'not@that-random-number.dev',
          },
        },
      }),
    ).toEqual({
      provenance: false,
      trustedPublisher: false,
      stagedPublish: true,
    });
  });

  it('should set stagedPublish in addition to provenance', () => {
    expect(
      meta.getTrustStatus({
        _id: 'some-package@1.0.0',
        _npmUser: {
          name: 'james',
          email: 'james@that-random-number.dev',
          approver: {
            name: 'not-james',
            email: 'not@that-random-number.dev',
          },
        },
        dist: {
          attestations: {
            url: 'https://example.com/provenance.json',
            provenance: {
              predicateType: 'https://slsa.dev/provenance/v1',
            },
          },
        },
      }),
    ).toEqual({
      provenance: true,
      trustedPublisher: false,
      stagedPublish: true,
    });
  });

  it('should set stagedPublish to false when the approver is empty', () => {
    expect(
      meta.getTrustStatus({
        _id: 'some-package@1.0.0',
        name: 'some-package',
        version: '1.0.0',
        _npmUser: {
          name: 'james',
          email: 'james@that-random-number.dev',
          approver: null,
        },
      }),
    ).toEqual({
      provenance: false,
      trustedPublisher: false,
      stagedPublish: false,
    });
  });
});

describe('getTrustLevel', () => {
  it('should return 3 if stagedPublish is true', () => {
    expect(
      meta.getTrustLevel({
        provenance: false,
        trustedPublisher: false,
        stagedPublish: true,
      }),
    ).toBe(3);
  });

  it('should return 2 if both trustedPublisher and provenance are true', () => {
    expect(
      meta.getTrustLevel({
        provenance: true,
        trustedPublisher: true,
        stagedPublish: false,
      }),
    ).toBe(2);
  });

  it('should return 1 if only provenance is true', () => {
    expect(
      meta.getTrustLevel({
        provenance: true,
        trustedPublisher: false,
        stagedPublish: false,
      }),
    ).toBe(1);
  });

  it('should return 0 if neither property is true', () => {
    expect(
      meta.getTrustLevel({
        provenance: false,
        trustedPublisher: false,
        stagedPublish: false,
      }),
    ).toBe(0);
  });
});

describe('getTrustOrder', () => {
  it('should return -1 if a has lower trust level than b', () => {
    expect(
      meta.getTrustOrder(
        { provenance: false, trustedPublisher: false, stagedPublish: false },
        { provenance: true, trustedPublisher: false, stagedPublish: false },
      ),
    ).toBe(-1);
  });

  it('should return 1 if a has higher trust level than b', () => {
    expect(
      meta.getTrustOrder(
        { provenance: true, trustedPublisher: true, stagedPublish: false },
        { provenance: true, trustedPublisher: false, stagedPublish: false },
      ),
    ).toBe(1);
  });

  it('should return 0 if both have the same trust level', () => {
    expect(
      meta.getTrustOrder(
        { provenance: true, trustedPublisher: false, stagedPublish: false },
        { provenance: true, trustedPublisher: false, stagedPublish: false },
      ),
    ).toBe(0);
  });

  it('can be used to sort an array of TrustStatus objects', () => {
    const statuses = [
      { provenance: false, trustedPublisher: false, stagedPublish: false },
      { provenance: true, trustedPublisher: false, stagedPublish: false },
      { provenance: true, trustedPublisher: true, stagedPublish: false },
      { provenance: false, trustedPublisher: false, stagedPublish: true },
    ];
    const sorted = statuses.sort(meta.getTrustOrder);
    expect(sorted).toEqual([
      { provenance: false, trustedPublisher: false, stagedPublish: false },
      { provenance: true, trustedPublisher: false, stagedPublish: false },
      { provenance: true, trustedPublisher: true, stagedPublish: false },
      { provenance: false, trustedPublisher: false, stagedPublish: true },
    ]);
  });
});

describe('didDecreaseInTrust', () => {
  it('should return true if newStatus has a lower trust level than oldStatus', () => {
    expect(
      meta.didDecreaseInTrust(
        { provenance: true, trustedPublisher: true, stagedPublish: false },
        { provenance: true, trustedPublisher: false, stagedPublish: false },
      ),
    ).toBe(true);
  });

  it('should return false if newStatus has a higher trust level than oldStatus', () => {
    expect(
      meta.didDecreaseInTrust(
        { provenance: true, trustedPublisher: false, stagedPublish: false },
        { provenance: true, trustedPublisher: true, stagedPublish: false },
      ),
    ).toBe(false);
  });

  it('should return false if both statuses have the same trust level', () => {
    expect(
      meta.didDecreaseInTrust(
        { provenance: true, trustedPublisher: false, stagedPublish: false },
        { provenance: true, trustedPublisher: false, stagedPublish: false },
      ),
    ).toBe(false);
  });
});

describe('isSupportedArchitecture', () => {
  it('should return true if OS matches and cpu/libc not set', () => {
    expect(
      meta.isSupportedArchitecture(
        {
          os: 'linux',
        },
        'linux',
        'x64',
        'glibc',
      ),
    ).toBe(true);
  });

  it('should return true if OS and cpu match and libc not set', () => {
    expect(
      meta.isSupportedArchitecture(
        {
          os: 'linux',
          cpu: 'x64',
        },
        'linux',
        'x64',
        'glibc',
      ),
    ).toBe(true);
  });

  it('should return true if OS, cpu, and libc match', () => {
    expect(
      meta.isSupportedArchitecture(
        {
          os: 'linux',
          cpu: 'x64',
          libc: 'glibc',
        },
        'linux',
        'x64',
        'glibc',
      ),
    ).toBe(true);
  });

  it('should return false if OS does not match', () => {
    expect(
      meta.isSupportedArchitecture(
        {
          os: 'windows',
        },
        'linux',
        'x64',
        'glibc',
      ),
    ).toBe(false);
  });

  it('should return false if cpu does not match', () => {
    expect(
      meta.isSupportedArchitecture(
        {
          os: 'linux',
          cpu: 'arm64',
        },
        'linux',
        'x64',
        'glibc',
      ),
    ).toBe(false);
  });

  it('should return false if libc does not match', () => {
    expect(
      meta.isSupportedArchitecture(
        {
          os: 'linux',
          cpu: 'x64',
          libc: 'musl',
        },
        'linux',
        'x64',
        'glibc',
      ),
    ).toBe(false);
  });

  it('should return true if OS matches and cpu/libc not set, even if other properties are present', () => {
    expect(
      meta.isSupportedArchitecture(
        {
          os: 'linux',
          someOtherProperty: 'value',
        },
        'linux',
        'x64',
        'glibc',
      ),
    ).toBe(true);
  });

  it('should return false if OS does not match, even if cpu/libc match', () => {
    expect(
      meta.isSupportedArchitecture(
        {
          os: 'windows',
          cpu: 'x64',
          libc: 'glibc',
        },
        'linux',
        'x64',
        'glibc',
      ),
    ).toBe(false);
  });
});

describe('getTrustLevelName', () => {
  it('should return "stagedPublish" if stagedPublish is true', () => {
    expect(
      meta.getTrustLevelName({
        provenance: false,
        trustedPublisher: false,
        stagedPublish: true,
      }),
    ).toBe('stagedPublish');
  });

  it('should return "trustedPublisher" if both trustedPublisher and provenance are true', () => {
    expect(
      meta.getTrustLevelName({
        provenance: true,
        trustedPublisher: true,
        stagedPublish: false,
      }),
    ).toBe('trustedPublisher');
  });

  it('should return "provenance" if only provenance is true', () => {
    expect(
      meta.getTrustLevelName({
        provenance: true,
        trustedPublisher: false,
        stagedPublish: false,
      }),
    ).toBe('provenance');
  });

  it('should return "none" if neither property is true', () => {
    expect(
      meta.getTrustLevelName({
        provenance: false,
        trustedPublisher: false,
        stagedPublish: false,
      }),
    ).toBe('none');
  });
});
