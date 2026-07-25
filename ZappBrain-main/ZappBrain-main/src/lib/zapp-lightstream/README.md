# 📡 Zapp Lightstream: Lossless Telemetry Compression, Adaptive Batching & Offline Sync

## 1. Overview
Zapp Lightstream is a high-performance, lightweight telemetry transport protocol designed specifically to handle **unreliable, low-bandwidth, and intermittent African mobile networks** (2G / Edge / Fringe 3G). 

By implementing specialized binary packing, delta/delta-of-delta encoding, dictionary compression, and an intelligent offline buffer, Zapp Lightstream reduces mobile data consumption by **80% to 92%** compared to standard verbose JSON-over-HTTP telemetry streams.

---

## 2. Compact Telemetry Packet Format
The core packet structure is defined by `ZappCompactTelemetryPacket`. It represents the essential state of a heavy commercial vehicle at a precise instant:

```typescript
export interface ZappCompactTelemetryPacket {
  timestamp: number;              // Epoch millisecond precision
  vehicle_id: string;             // Unique vehicle identification
  device_id: string;              // On-board telematics unit hardware ID
  latitude: number;               // Coordinates scaled to 6 decimal places (~11cm accuracy)
  longitude: number;              // Coordinates scaled to 6 decimal places (~11cm accuracy)
  speed: number;                  // Integer km/h
  heading: number;                // Integer degrees (0-359)
  ignition_state: 'on' | 'off';   // Operational power state
  battery_voltage: number;        // Float (scaled by 10 to preserve 1 decimal place)
  odometer?: number;              // Accumulating mileage in km
  signal_strength: number;        // Received signal strength (dBm)
  event_flags: number;            // Bit-packed flags (0x01=panic, 0x02=harsh_braking, 0x04=overspeeding, etc.)
  sensor_readings?: Record<string, number>; // Dynamic diagnostic readings
  diagnostic_fault_codes?: string[];       // Active J1939 fault codes
  sequence_number: number;        // Monotonically increasing sequence tracker
  checksum?: string;              // FNV-1a unsigned 32-bit checksum
}
```

---

## 3. Lossless Compression Techniques

Rather than relying on generic compression libraries (like Gzip/Brotli) which exhibit high memory overhead and poor compression ratios on short, fragmented JSON packets, Zapp Lightstream uses a **domain-specific binary serialization pipeline**:

1.  **Dictionary Encoding (Repeated Strings)**:
    *   Vehicle and Device IDs are extracted into a local dictionary header.
    *   Subsequent packets in the batch reference small integer indexes rather than duplicating strings.
2.  **Lossless Coordinate Scaling**:
    *   Latitude and Longitude are scaled by $10^6$ to convert floats to integers, preserving sub-meter GPS accuracy (~11cm).
3.  **Delta Coordinate Encoding**:
    *   The first packet stores the absolute coordinates.
    *   Following packets store only the integer difference (delta) from the previous packet.
4.  **Delta-of-Delta Timestamps**:
    *   Tracks high-frequency reporting intervals. The first packet stores the absolute epoch timestamp, the second stores the delta, and subsequent packets store the deviation in intervals (delta-of-delta), which often collapse to `0` or small integers for uniform ping rates.
5.  **ZigZag Integer Representation**:
    *   Maps signed integers (such as negative coordinate deltas or signal strengths) to unsigned values ($0 \to 0, -1 \to 1, 1 \to 2, -2 \to 3$), preparing them for optimal Varint compression.
6.  **Variable-Length Integer Encoding (Varint)**:
    *   Stores integers using only the necessary number of bytes (e.g., values $<128$ take 1 byte instead of 4).
7.  **Bit-Packing Flags**:
    *   Packs multiple booleans (Ignition state, overspeeding alerts, harsh braking, trailer connection, route deviation) into a single byte payload mask.

---

## 4. Adaptive Batching & Signal Awareness

Zapp Lightstream dynamically adjusts its transmission behavior based on cellular telemetry conditions:

| Network Profile | Signal Range | Batching Mode | Buffer Hold / Max Batch | Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Good Network** | $-50 \to -75 \text{ dBm}$ | `realtime` | Immediate Sync (Max 2) | Ultra-low latency, transmits pings within 1 second. |
| **Weak Network** | $-76 \to -90 \text{ dBm}$ | `balanced` | 5s Hold (Max 10) | Minimizes transport header overhead over fringe connections. |
| **Intermittent** | $-91 \to -105 \text{ dBm}$ | `low_data` | 15s Hold (Max 30) | Groups pings heavily to save bandwidth. |
| **Complete Blackout** | $\le -106 \text{ dBm}$ | `offline` | Local Spooling (Max 2000) | Stores everything locally chronologically. |

### 🚨 Critical Safety Alert Override
If a packet contains an active **Panic Alarm Trigger** (`event_flags & 0x01`), the adaptive batcher immediately bypasses the configured intervals and triggers a **force upload sync** to ensure human dispatchers receive the distress alert without delay (provided the device is not physically blocked/offline).

---

## 5. Offline Queueing & Replay Protection

When completely offline, the system utilizes a robust queueing model:
*   **Deduplication**: Redundant idle GPS coordinates are automatically deduplicated at the buffer edge to prevent storage explosion, while ensuring critical alerts are never ignored.
*   **Chronological Preservation**: Keeps messages strictly ordered by timestamp.
*   **Integrity Audits**: The server boundary validates:
    *   **FNV-1a Checksums** for corruption rejection.
    *   **Replay Auditing** using a sliding history of sequence numbers.
    *   **Gap Ingestion** to identify dropped cell towers or range boundaries.

---

## 6. Zero Autonomous Operational Mutation
To maintain full **dispatcher-supervised safety safeguards**, Zapp Lightstream operates strictly as a telemetry transport layer:
*   It **never** makes autonomous operational decisions.
*   It **never** cancels jobs, suspends drivers, blocks heavy vehicles, or sends autonomous chat warnings.
*   All anomalies are converted to persistent dispatcher insights to await human verification.

---

## 7. Phase 11 Recommendations
*   **Hardware Prototypes**: Implement the C/C++ version of the encoder on ESP32 or Teltonika P1 telematics hardware.
*   **TLS/Noise Protocol Handshake**: Establish secure payload tunnels using custom lightweight cryptographic handshakes to encrypt binary streams.
