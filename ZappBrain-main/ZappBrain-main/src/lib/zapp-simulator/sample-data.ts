/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SA_DRIVER_NAMES = [
  'Sipho Nene',
  'Jabu Khumalo',
  'Pieter de Wet',
  'Thabo Mofokeng',
  'Johan Botha',
  'Nomvula Ndlovu',
  'Andile Dlamini',
  'Francois du Toit',
  'Sbusiso Zuma',
  'Lindiwe Sisulu',
  'Themba Masuku',
  'Kobus Marais',
  'Zanele Mthembu',
  'Bongani Nkosi',
  'Mlungisi Ndlela',
  'Hennie van der Merwe',
  'Lungelo Ngcobo',
  'Lungile Khuzwayo',
  'Precious Shabangu',
  'David Naidoo'
];

export const VEHICLE_MAKES_MODELS = [
  { make: 'Mercedes-Benz', model: 'Actros 2645', type: 'truck' as const },
  { make: 'Scania', model: 'R500 V8', type: 'truck' as const },
  { make: 'Volvo', model: 'FH16 700', type: 'truck' as const },
  { make: 'MAN', model: 'TGX 26.540', type: 'truck' as const },
  { make: 'Daf', model: 'XF 105', type: 'truck' as const },
  { make: 'Isuzu', model: 'FTR 850', type: 'rigid' as const },
  { make: 'Toyota', model: 'Hino 500', type: 'rigid' as const },
  { make: 'Iveco', model: 'Stralis 480', type: 'tanker' as const },
  { make: 'Mercedes-Benz', model: 'Sprinter 516', type: 'van' as const },
  { make: 'Toyota', model: 'Quantum 2.5 D-4D', type: 'van' as const }
];

export const TRAILER_MAKES = ['Henred Fruehauf', 'Aero', 'SA Truck Bodies', 'Krone'];

export const SOUTH_AFRICAN_TOWNS = [
  { name: 'Johannesburg (JHB)', lat: -26.2041, lng: 28.0473 },
  { name: 'Cape Town (CPT)', lat: -33.9249, lng: 18.4241 },
  { name: 'Durban (DUR)', lat: -29.8587, lng: 31.0218 },
  { name: 'Port Elizabeth (PLZ)', lat: -33.9608, lng: 25.6022 },
  { name: 'Bloemfontein (BFN)', lat: -29.1181, lng: 26.2236 },
  { name: 'Polokwane (PLK)', lat: -23.9045, lng: 29.4689 },
  { name: 'Nelspruit (NLP)', lat: -25.4753, lng: 30.9694 },
  { name: 'Kimberley (KIM)', lat: -28.7282, lng: 24.7499 }
];

export const SA_CUSTOMERS = [
  { name: 'Shoprite Distribution Centre', address: 'Brackenfell, Cape Town', lat: -33.8824, lng: 18.6853 },
  { name: 'Pick n Pay JHB Depot', address: 'Kempton Park, Johannesburg', lat: -26.1135, lng: 28.2415 },
  { name: 'Woolworths DUR Midline', address: 'Westville, Durban', lat: -29.8285, lng: 30.9254 },
  { name: 'Spar Eastern Cape Hub', address: 'Deal Party, Port Elizabeth', lat: -33.9125, lng: 25.6214 },
  { name: 'Massmart Free State Depot', address: 'Hamilton, Bloemfontein', lat: -29.1512, lng: 26.2418 }
];

export const DIAGNOSTIC_TROUBLE_CODES = [
  { code: 'P0101', description: 'Mass Air Flow Sensor Range/Performance' },
  { code: 'P0299', description: 'Turbocharger Underboost' },
  { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected' },
  { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold' },
  { code: 'P0700', description: 'Transmission Control System Malfunction' },
  { code: 'P0115', description: 'Engine Coolant Temperature Circuit Malfunction' },
  { code: 'U0100', description: 'Lost Communication with ECM/PCM' },
  { code: 'P0500', description: 'Vehicle Speed Sensor Malfunction' }
];
