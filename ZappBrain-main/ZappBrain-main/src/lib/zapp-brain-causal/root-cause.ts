/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimIncident, SimState } from '../zapp-simulator/types';
import { RootCauseAnalysis } from './types';

/**
 * Root Cause Analysis (RCA) diagnostic logic.
 */
export class RootCauseAnalyzer {

  /**
   * Evaluates an incident within a SimState to establish its multi-level cause chain.
   */
  public analyzeIncident(incident: SimIncident, state: SimState): RootCauseAnalysis {
    const desc = incident.description.toLowerCase();
    
    let primaryCause = 'Unspecified Operational Variance';
    let secondaryCauses: string[] = [];
    let contributingFactors: { factor: string; influencePercentage: number }[] = [];
    let causeChain: string[] = [];
    let supportingEvidence: string[] = [];
    let confidenceScore = 80;

    // 1. Diagnose Fuel Loss Incident
    if (desc.includes('fuel-drop') || desc.includes('fuel_theft') || desc.includes('siphoning')) {
      primaryCause = 'Stationary Fuel Siphoning Theft';
      secondaryCauses = [
        'Unapproved Extended Overnight Layover',
        'Inadequate High-Risk Area Geo-fencing Controls',
      ];
      contributingFactors = [
        { factor: 'Stationary Rest Stop Duration', influencePercentage: 60 },
        { factor: 'Corridor Security Coverage Gaps', influencePercentage: 25 },
        { factor: 'Driver Fatigue and Stop Choice', influencePercentage: 15 },
      ];
      causeChain = [
        'Late Night Layout Stop',
        'Stationary Fuel Drop (-12L/min)',
        'Anti-Theft Guard Inactivity',
        'Active Syndicate Siphoning Breach',
      ];
      supportingEvidence = [
        'OBD Sensor fuel level slope drop alert logs',
        'GPS Coordinates placing vehicle at N3 remote parking zone',
        'Ignition status off during substantial level depletion',
      ];
      confidenceScore = 95;
    } 
    // 2. Diagnose Overheating Engine Fault
    else if (desc.includes('coolant temp') || desc.includes('dtc 523') || desc.includes('turbo')) {
      primaryCause = 'Radiator Flow Restriction';
      secondaryCauses = [
        'Missed Preventative Maintenance Schedule',
        'Overdue General Service Check',
      ];
      contributingFactors = [
        { factor: 'High Engine Load under Ascent', influencePercentage: 50 },
        { factor: 'Overdue Kilometre Limit Threshold', influencePercentage: 35 },
        { factor: 'High Ambient Temperatures', influencePercentage: 15 },
      ];
      causeChain = [
        'Overdue Service Run (+3,500km)',
        'Radiator Hose Clogging',
        'Coolant Leakage',
        'Intake Valve High Temperature (112°C)',
        'Critical Engine Shutdown Fault DTC_523',
      ];
      supportingEvidence = [
        'Active OBD Diagnostic Trouble Code (DTC) 523',
        'Overheating temperature reading logged at 112°C',
        'Vehicle service logs indicating mileage exceeded 20,000km limit',
      ];
      confidenceScore = 90;
    } 
    // 3. Diagnose Security Panic Alert / Route Deviation
    else if (desc.includes('panic') || desc.includes('hijack') || desc.includes('tamper')) {
      primaryCause = 'Active Security Intervention (Potential Hijacking)';
      secondaryCauses = [
        'Unapproved Route Boundary Deviation',
        'Device Power Supply Cut Attempt',
      ];
      contributingFactors = [
        { factor: 'High Risk Trade Corridor Navigation', influencePercentage: 55 },
        { factor: 'Driver Crisis Response Actions', influencePercentage: 30 },
        { factor: 'Lack of Real-time Escort Vehicles', influencePercentage: 15 },
      ];
      causeChain = [
        'En route corridor departure (500m bypass)',
        'Zapp Box Tamper Switch Breach alert',
        'Cabin Panic Button physical trigger',
        'Security Armed Response Deployment',
      ];
      supportingEvidence = [
        'Panic button toggle state changed from 0 to 1',
        'Device case tamper alarm packet received',
        'GPS geofence corridor exception alert',
      ];
      confidenceScore = 98;
    } 
    // 4. Diagnose Weather / Flood Delayed Delivery
    else if (desc.includes('flood') || desc.includes('storm') || desc.includes('rain')) {
      primaryCause = 'Environmental Route Blockage';
      secondaryCauses = [
        'Inadequate Low-lying Infrastructure Drainage',
        'Inflexible Dispatch Rerouting Schedule',
      ];
      contributingFactors = [
        { factor: 'Heavy Precipitation Level (120mm)', influencePercentage: 70 },
        { factor: 'N3 Coastal Corridor Flooding', influencePercentage: 20 },
        { factor: 'Local Highway Congestion', influencePercentage: 10 },
      ];
      causeChain = [
        'Severe storm meteorological warnings',
        'Road traction coefficient decreased below 0.35',
        'Complete corridor standstill flooding',
        'Missed customer loading window',
      ];
      supportingEvidence = [
        'Weather feed precipitation reports exceeding 80mm/h',
        'Average convoy speed dropped below 15km/h via telematics',
        'Customer delivery log marking delay as weather-related bottleneck',
      ];
      confidenceScore = 92;
    }
    // 5. Default Route Planning / Delay Incident
    else {
      primaryCause = 'Corridor Congestion and Bottlenecks';
      secondaryCauses = [
        'Peak Hour Mon Commuter Traffic',
        'Client Yard Loading Delays',
      ];
      contributingFactors = [
        { factor: 'Commuter Dense Junctions', influencePercentage: 60 },
        { factor: 'Customer Yard Congestion', influencePercentage: 40 },
      ];
      causeChain = [
        'Standard Morning Dispatch Departure',
        'N1 highway traffic congestion',
        'Extended client parking waiting queue',
        'Late customer drop-off',
      ];
      supportingEvidence = [
        'Delay logs exceeding planned trip parameters by 45 minutes',
        'Telematics speed reduction profile on commuter highway',
      ];
      confidenceScore = 85;
    }

    return {
      incidentId: incident.id,
      primaryCause,
      secondaryCauses,
      contributingFactors,
      causeChain,
      supportingEvidence,
      confidenceScore,
    };
  }
}
