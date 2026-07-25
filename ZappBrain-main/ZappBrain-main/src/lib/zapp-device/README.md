# Phase 11: Zapp Box / P1 Device Simulator & Hardware Readiness

This module models Zapp Box and Zapp P1 hardware device behaviors without requiring physical connected chips. It bridges real-time physical telemetry streams (GPS, GSM, Ignition, Battery power levels) through Lightstream compression to Zapp Brain, demonstrating production hardware readiness.

## Architectural Overview

The device simulator operates as a hardware loop independent of Zapp Brain, and communicates with Zapp Brain purely via the Lightstream binary batch transport layer.

```
+--------------------------------------------------------+
|                   Zapp Hardware Simulator              |
|  [GPS Path] -> [Sensors] -> [DTCs] -> [Ignition Loop]  |
+--------------------------------------------------------+
                           |
                           v  (ZappCompactTelemetryPacket)
+--------------------------------------------------------+
|                   Zapp Offline Buffer                  |
|  Spools and deduplicates pings to flash queue          |
+--------------------------------------------------------+
                           |
                           v  (compressBatch - Varint / Delta)
+--------------------------------------------------------+
|               Zapp Lightstream Transport               |
|  Simulates GSM RSSI, drops, and latent transmissions   |
+--------------------------------------------------------+
                           |
                           v  (ingestLightstreamBatch - Binary CJS)
+--------------------------------------------------------+
|                     Zapp Brain Engine                  |
|  Ingests, decodes, geofences, and alerts dispatcher   |
+--------------------------------------------------------+
```

## Module Map

- **`types.ts`**: Types for hardware sensor packages, devices, profiles, and firmwares.
- **`device-profile.ts`**: Registry of hardware provisioning, identity matching, and duplicate checks.
- **`sensors.ts`**: Real-time sensor stream modeling, adding noise, and formatting packets.
- **`ignition.ts`**: Ignition trip state machine transitions and supervisor alarms (towing/idling).
- **`power.ts`**: Main vehicle voltage monitor, enclosure tampering loops, and device health ratings.
- **`gsm.ts`**: GSM cellular profiles (Good reception, rural fringe, Mountain blackout) and drops.
- **`gps.ts`**: Interpolated GPS coordinate progression along the Nairobi to Mombasa cargo route.
- **`diagnostics.ts`**: SPN/FMI Diagnostic Fault Codes (DTC) with frequency, severity, and occurrence logs.
- **`panic.ts`**: Emergency cabin panic loop signaling and immediate high-priority spool bypass.
- **`firmware.ts`**: Active/deprecated firmware rollouts and vulnerability warnings.
- **`simulator.ts`**: Clock ticker coordinating state transitions, local queue spools, and batch uploads.

---

## Security Limitations & Future Hardware Roadmap

This simulator prepares the ZappOS architecture for physical hardware. However, since all operations currently run in a virtual frontend context, several security layers are simulated.

### Simulated Variables
- **Cryptographic Keys**: Key rotation status is simulated via state indicators.
- **Sim IMEI / ICCID**: Populated with mock global identifiers.
- **HMAC / Signatures**: Validation is mocked to demonstrate flow correctness.

### Real-Hardware Security Requirements
1. **Per-Device HSM Keys**: Physical devices must contain a Secure Element or HSM (Hardware Security Module) containing unique private keys.
2. **HMAC-SHA256 Packet Signatures**: Every telemetry batch must be signed on-board using HMAC-SHA256 before transmission.
3. **Firmware Signing (Secure Boot)**: Over-the-air (OTA) updates must be signed with Google-vetted private keys and validated by the on-board bootloader before execution.
4. **Enclosure Tampering Switches**: Physical Zapp Box switches will instantly wipe RAM secret keys if the cover is forced open.
5. **SIM Identity Pinning**: Pin IMEI to SIM ICCID on the carrier network to prevent SIM-swapping or cloning attacks.

---

## Phase 12 Recommendation: Physical Field Trials & OTA Rollouts
With the device simulator fully functional, Phase 12 should focus on:
- Wrapping this simulator into an embedded C++/Rust executable running on physical Raspberry Pi or Nordic Semi boards.
- Implementing an active MQTT/CoAP telemetry bridge.
- Testing cellular carrier handovers under extreme sub-Saharan terrain boundaries.
