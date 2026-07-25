/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FirmwareRelease, DeviceType } from './types';

// Predefined firmware database
export const FIRMWARE_REGISTRY: FirmwareRelease[] = [
  {
    firmware_version: 'v1.4.2-stable',
    release_date: '2026-05-10',
    supported_device_types: ['zapp_box', 'zapp_p1'],
    known_issues: [],
    minimum_supported_version: 'v1.0.0',
    rollout_status: 'active'
  },
  {
    firmware_version: 'v1.5.0-rc2',
    release_date: '2026-07-01',
    supported_device_types: ['zapp_box', 'zapp_p1'],
    known_issues: ['Intermittent battery voltage calibration jitter (+/- 0.1V)'],
    minimum_supported_version: 'v1.2.0',
    rollout_status: 'staged'
  },
  {
    firmware_version: 'v0.9.1-beta',
    release_date: '2025-11-15',
    supported_device_types: ['zapp_box', 'third_party_tracker'],
    known_issues: ['High data consumption during weak signals', 'Missing FNV-1a checksum calculations'],
    minimum_supported_version: 'v0.8.0',
    rollout_status: 'deprecated'
  }
];

/**
 * Checks if a given device's firmware version is below the safe threshold of active releases.
 */
export function isFirmwareOutdated(version: string): boolean {
  const release = FIRMWARE_REGISTRY.find(r => r.firmware_version === version);
  if (!release) return true;
  return release.rollout_status === 'deprecated';
}

/**
 * Finds the latest active stable release for a device type.
 */
export function getLatestFirmwareForType(type: DeviceType): string {
  const sorted = FIRMWARE_REGISTRY.filter(r => r.supported_device_types.includes(type) && r.rollout_status === 'active');
  if (sorted.length > 0) return sorted[0].firmware_version;
  return 'v1.4.2-stable';
}
