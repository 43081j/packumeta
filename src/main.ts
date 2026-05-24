export interface TrustStatus {
  provenance: boolean;
  trustedPublisher: boolean;
  stagedPublish: boolean;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const hasOwn = <T extends Record<string, unknown>, TKey extends string>(
  obj: T,
  key: TKey,
): obj is T & { [k in TKey]: unknown } => Object.hasOwn(obj, key);

export function getTrustStatus(meta: unknown): TrustStatus {
  const status: TrustStatus = {
    provenance: false,
    trustedPublisher: false,
    stagedPublish: false,
  };
  if (!isObject(meta)) {
    return status;
  }
  if (
    hasOwn(meta, '_npmUser') &&
    isObject(meta._npmUser) &&
    hasOwn(meta._npmUser, 'trustedPublisher') &&
    meta._npmUser.trustedPublisher
  ) {
    status.trustedPublisher = true;
  }
  if (
    hasOwn(meta, 'dist') &&
    isObject(meta.dist) &&
    hasOwn(meta.dist, 'attestations') &&
    isObject(meta.dist.attestations) &&
    hasOwn(meta.dist.attestations, 'provenance') &&
    meta.dist.attestations.provenance
  ) {
    status.provenance = true;
  }
  return status;
}

export function getTrustLevel(status: TrustStatus): number {
  if (status.stagedPublish) {
    return 3;
  }
  if (status.trustedPublisher && status.provenance) {
    return 2;
  }
  if (status.provenance) {
    return 1;
  }
  return 0;
}

export function getTrustOrder(a: TrustStatus, b: TrustStatus): -1 | 0 | 1 {
  const levelA = getTrustLevel(a);
  const levelB = getTrustLevel(b);
  if (levelA < levelB) {
    return -1;
  } else if (levelA > levelB) {
    return 1;
  } else {
    return 0;
  }
}

export interface MinTrustLevelResult {
  level: number;
  status: TrustStatus;
}

export function didDecreaseInTrust(
  oldStatus: TrustStatus,
  newStatus: TrustStatus,
): boolean {
  const oldLevel = getTrustLevel(oldStatus);
  const newLevel = getTrustLevel(newStatus);
  return newLevel < oldLevel;
}

export function isSupportedArchitecture(
  pkg: Record<string, unknown>,
  os: string,
  cpu: string,
  libc: string,
): boolean {
  const osMatches =
    pkg.os === undefined ||
    (typeof pkg.os === 'string' &&
      (pkg.os.length === 0 || pkg.os.includes(os)));
  const cpuMatches =
    pkg.cpu === undefined ||
    (typeof pkg.cpu === 'string' &&
      (pkg.cpu.length === 0 || pkg.cpu.includes(cpu)));
  const libcMatches =
    pkg.libc === undefined ||
    (typeof pkg.libc === 'string' &&
      (pkg.libc.length === 0 || pkg.libc.includes(libc)));
  return osMatches && cpuMatches && libcMatches;
}
