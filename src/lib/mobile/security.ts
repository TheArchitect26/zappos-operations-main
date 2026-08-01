export interface DeviceSecuritySignals {
  rootedOrJailbroken: boolean;
  screenCaptureActive: boolean;
  secureStorageAvailable: boolean;
  biometricAvailable: boolean;
}

export function deviceTrustDecision(signals: DeviceSecuritySignals) {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];
  if (signals.rootedOrJailbroken) blockedReasons.push("Device integrity check failed");
  if (!signals.secureStorageAvailable) blockedReasons.push("Secure local storage is unavailable");
  if (signals.screenCaptureActive) warnings.push("Screen capture protection should be enabled");
  return {
    trusted: blockedReasons.length === 0,
    biometricUnlockAvailable: signals.biometricAvailable && blockedReasons.length === 0,
    blockedReasons,
    warnings,
  };
}

export function sessionExpired(expiresAtSeconds: number | null, now = Date.now()) {
  return expiresAtSeconds === null || expiresAtSeconds * 1000 <= now;
}

export function deviceRegistrationValid(input: {
  deviceId: string;
  nickname: string;
  platform: string;
  appVersion: string;
}) {
  return (
    input.deviceId.trim().length >= 8 &&
    input.nickname.trim().length >= 2 &&
    ["web", "android", "ios"].includes(input.platform) &&
    /^\d+\.\d+\.\d+/.test(input.appVersion)
  );
}
