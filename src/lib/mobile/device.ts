export interface CapturedFile {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  checksum: string;
}
export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  capturedAt: string;
}
export interface ScanResult {
  format: "barcode" | "qr";
  value: string;
  capturedAt: string;
}

export interface CameraAdapter {
  capture(options?: { quality?: number; facing?: "front" | "rear" }): Promise<CapturedFile>;
}
export interface ScannerAdapter {
  scan(format: "barcode" | "qr"): Promise<ScanResult>;
}
export interface GpsAdapter {
  currentPosition(): Promise<GeoPoint>;
}
export interface BiometricsAdapter {
  available(): Promise<boolean>;
  unlock(reason: string): Promise<boolean>;
}
export interface FilePickerAdapter {
  pick(accept: readonly string[]): Promise<CapturedFile[]>;
}
export interface ShareAdapter {
  share(input: { title: string; text?: string; file?: CapturedFile }): Promise<void>;
}
export interface ClipboardAdapter {
  write(value: string): Promise<void>;
}
export interface BackgroundTaskAdapter {
  register(name: string, minimumIntervalMinutes: number): Promise<void>;
}

export interface MobileDeviceBridge {
  camera: CameraAdapter;
  scanner: ScannerAdapter;
  gps: GpsAdapter;
  biometrics: BiometricsAdapter;
  files: FilePickerAdapter;
  sharing: ShareAdapter;
  clipboard: ClipboardAdapter;
  backgroundTasks: BackgroundTaskAdapter;
}

const ALLOWED_UPLOADS = ["image/jpeg", "image/png", "application/pdf"];
export function validateMobileUpload(file: CapturedFile, maximumBytes = 10_000_000) {
  const errors: string[] = [];
  if (!ALLOWED_UPLOADS.includes(file.mimeType)) errors.push("File type is not allowed");
  if (!file.bytes.length) errors.push("File is empty");
  if (file.bytes.length > maximumBytes) errors.push("File exceeds size limit");
  if (!/^[a-f0-9]{8,128}$/i.test(file.checksum)) errors.push("Upload checksum is invalid");
  return { valid: errors.length === 0, errors };
}

export function signatureValid(points: readonly { x: number; y: number; time: number }[]) {
  return (
    points.length >= 2 &&
    points.every(
      (point) =>
        Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.time),
    )
  );
}

export function gpsCaptureValid(point: GeoPoint) {
  return (
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180 &&
    point.accuracyMetres >= 0
  );
}
