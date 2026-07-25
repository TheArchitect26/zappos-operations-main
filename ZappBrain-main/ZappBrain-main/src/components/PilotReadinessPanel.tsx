/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  Edit,
  FileText,
  HelpCircle,
  Info,
  Lock,
  Play,
  RotateCcw,
  Save,
  Shield,
  FileSpreadsheet,
  Terminal,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Settings,
  Database,
  Plus,
  Trash2,
  ListTodo,
  FileCode,
  ShieldCheck,
  Zap,
  Check,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PilotReadinessPanelProps {
  companyId: string;
}

export default function PilotReadinessPanel({ companyId }: PilotReadinessPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'dashboard'
    | 'demo-walkthrough'
    | 'demo-script'
    | 'discovery'
    | 'data-checklist'
    | 'agreement'
    | 'success-criteria'
    | 'roi-assumptions'
    | 'kickoff'
    | 'support-sop'
    | 'report-templates'
    | 'objections'
    | 'safety-review'
  >('dashboard');

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // ----------------------------------------------------
  // DATA STATES FOR PILOT READINESS
  // ----------------------------------------------------

  // 1. Kickoff Checklist State
  const [kickoffItems, setKickoffItems] = useState([
    { id: 'profile', text: 'Company profile completed & active tenant mapped', checked: true, critical: true },
    { id: 'users', text: 'Dispatcher & Supervisor users invited with correct roles', checked: true, critical: true },
    { id: 'roles', text: 'Role memberships verified (no supervisor-override breach risk)', checked: true, critical: true },
    { id: 'vehicles', text: 'Pilot vehicles selected & virtual hardware serials mapped', checked: true, critical: true },
    { id: 'data_received', text: 'Historical delay/depot excel logs received', checked: false, critical: false },
    { id: 'data_staged', text: 'Spreadsheet rows imported/staged in OneDrive/Staging hub', checked: false, critical: false },
    { id: 'limitations_explained', text: 'Demo limitations & simulated hardware boundaries explained', checked: true, critical: true },
    { id: 'support_channel', text: 'Support communication channel agreed (Slack/WhatsApp)', checked: true, critical: false },
    { id: 'reporting_schedule', text: 'Weekly reporting & review schedule agreed with sponsor', checked: true, critical: false },
    { id: 'success_criteria', text: 'Measurable pilot success criteria explicitly agreed', checked: false, critical: true },
    { id: 'safety_limitations', text: 'Safety limitations & human-supervised AI terms accepted', checked: true, critical: true },
    { id: 'start_date', text: 'Pilot start date & final review date confirmed', checked: false, critical: true }
  ]);

  const toggleKickoffItem = (id: string) => {
    setKickoffItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  // 2. Pre-Demo Safety Checklist State
  const [safetyItems, setSafetyItems] = useState([
    { id: 'tenant_select', text: 'Demo sandbox tenant selected (Nairobi Freight/SA Logistics)', checked: true },
    { id: 'staging_clear', text: 'Staging mode banner clearly visible & labeled "STAGING"', checked: true },
    { id: 'sim_hardware', text: 'Simulated hardware labeled clearly (Zapp Box P1 Mockups)', checked: true },
    { id: 'mock_connectors', text: 'Mock connectors labeled as virtual testing streams', checked: true },
    { id: 'ai_labeled', text: 'Zapp Brain is labeled dispatcher-supervised only', checked: true },
    { id: 'no_customer_data', text: 'No production customer data or live PI visible on-screen', checked: true },
    { id: 'no_secret_key', text: 'No service-role keys or Supabase secrets exposed in console/env UI', checked: true },
    { id: 'rls_passed', text: 'Row Level Security (RLS) policies verified active in test suite', checked: true },
    { id: 'script_reviewed', text: 'Presenter demo script reviewed and tailored to client sector', checked: true },
    { id: 'roi_estimates', text: 'ROI calculator assumptions marked as pilot estimates/defaults', checked: true },
    { id: 'agreement_draft', text: 'Pilot agreement marked as "DRAFT - FOR WORKSHOP DISCUSSIONS"', checked: true },
    { id: 'limitations_visible', text: 'System limitations pane visible and easily reachable', checked: true }
  ]);

  const toggleSafetyItem = (id: string) => {
    setSafetyItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  // 3. Customer ROI Assumptions State
  const [roiAssumptions, setRoiAssumptions] = useState([
    { id: 'delay_cost', label: 'Delay Cost Hour', value: '45.00', unit: 'USD/hr', source: 'Default Estimate', confidence: 'medium', desc: 'Driver overtime + idle fuel burn + standard customer delivery SLA delays' },
    { id: 'idle_cost', label: 'Fuel Idle Cost', value: '3.80', unit: 'USD/gal', source: 'Customer Provided', confidence: 'high', desc: 'Average diesel price in operating corridor (heavy truck fuel idle rate is 0.8gal/hr)' },
    { id: 'dispatcher_time', label: 'Dispatcher Admin Overhead', value: '18.50', unit: 'USD/hr', source: 'Default Estimate', confidence: 'medium', desc: 'Average hourly fully-loaded cost of manual data entry and phone check-calls' },
    { id: 'missed_delivery', label: 'Missed Delivery Penalty', value: '250.00', unit: 'USD/event', source: 'Demo Placeholder', confidence: 'low', desc: 'Average penalty charged by premium distribution client for route deviations or missed slots' },
    { id: 'maintenance_failure', label: 'Catastrophic Engine Blowout Cost', value: '3200.00', unit: 'USD/event', source: 'Customer Provided', confidence: 'high', desc: 'Cost of major roadside breakdown, towing, and engine core overhaul due to ignored DTC warnings' },
    { id: 'compliance_fine', label: 'Statutory compliance violation fine', value: '850.00', unit: 'USD/event', source: 'Default Estimate', confidence: 'medium', desc: 'Penalty for active route vehicles caught with expired Certificate of Fitness (COF) or license' },
    { id: 'support_cost', label: 'Device Support & Licensing Base', value: '40.00', unit: 'USD/vehicle/mo', source: 'Demo Placeholder', confidence: 'high', desc: 'Baseline cost of Zapp Box device lease, data SIM plan, and software licensing' }
  ]);

  const updateRoiAssumption = (id: string, newVal: string) => {
    setRoiAssumptions(prev => prev.map(item => item.id === id ? { ...item, value: newVal } : item));
  };

  // 4. Success Criteria Builder State
  const [successCriteria, setSuccessCriteria] = useState([
    { id: 'sc_telemetry', metric: 'Telemetry signal connection uptime', method: 'Zapp Lightstream connectivity logs', baseline: '70.0%', target: '> 90.0%', source: 'Device Diagnostics Sub-board', owner: 'ZappOS Tech Lead', reviewDate: '2026-08-10', approved: true },
    { id: 'sc_delivery', metric: 'Telemetry packet delivery rate', method: 'Lightstream transmission logs', baseline: '85.0%', target: '> 95.0%', source: 'Lightstream telemetry logs', owner: 'ZappOS Tech Lead', reviewDate: '2026-08-10', approved: true },
    { id: 'sc_dispatcher', metric: 'Dispatcher response time to delays', method: 'Audit log action timestamps', baseline: '22 minutes', target: '< 10 minutes', source: 'DevOps Audit Timeline', owner: 'Operations Manager', reviewDate: '2026-08-10', approved: false },
    { id: 'sc_visibility', metric: 'Delay root-cause visibility', method: 'Zapp Brain category resolution matches', baseline: 'Unknown', target: '100% visible', source: 'Zapp Brain Analytics', owner: 'Operations Manager', reviewDate: '2026-08-10', approved: false },
    { id: 'sc_manual_action', metric: 'Manual action completion rate', method: 'Acknowledge logs to action ratio', baseline: '30%', target: '> 85%', source: 'Operations Center logs', owner: 'Operations Manager', reviewDate: '2026-08-10', approved: false },
    { id: 'sc_compliance', metric: 'Active compliance risk warnings', method: 'Driving license & COF check matching', baseline: '0% tracked', target: '100% tracked', source: 'Compliance Board', owner: 'Safety Officer', reviewDate: '2026-08-10', approved: true },
    { id: 'sc_maintenance', metric: 'Unresolved engine DTC diagnostic alerts', method: 'Engine fault SPN/FMI warning matching', baseline: 'Manual report', target: '100% immediate', source: 'Maintenance Dashboard', owner: 'Workshop Manager', reviewDate: '2026-08-10', approved: true },
    { id: 'sc_false_alarms', metric: 'Bypass false panic alarms rate', method: 'Zapp Brain Panic Bypass overrides ratio', baseline: 'High alert volume', target: '< 5.0%', source: 'Incident Center Logs', owner: 'Safety Officer', reviewDate: '2026-08-10', approved: false }
  ]);

  const toggleSuccessCriteriaApproved = (id: string) => {
    setSuccessCriteria(prev => prev.map(sc => sc.id === id ? { ...sc, approved: !sc.approved } : sc));
  };

  const [newCriteriaMetric, setNewCriteriaMetric] = useState('');
  const [newCriteriaTarget, setNewCriteriaTarget] = useState('');
  const [newCriteriaOwner, setNewCriteriaOwner] = useState('');

  const handleAddCriteria = () => {
    if (!newCriteriaMetric || !newCriteriaTarget) return;
    const newId = `sc_custom_${Date.now()}`;
    setSuccessCriteria(prev => [
      ...prev,
      {
        id: newId,
        metric: newCriteriaMetric,
        method: 'Custom Presenter Definition',
        baseline: 'Unmeasured',
        target: newCriteriaTarget,
        source: 'Custom Pilot Scope',
        owner: newCriteriaOwner || 'Unassigned',
        reviewDate: '2026-08-15',
        approved: true
      }
    ]);
    setNewCriteriaMetric('');
    setNewCriteriaTarget('');
    setNewCriteriaOwner('');
  };

  const handleDeleteCriteria = (id: string) => {
    setSuccessCriteria(prev => prev.filter(sc => sc.id !== id));
  };

  // 5. Customer Discovery Form State
  const [discoveryForm, setDiscoveryForm] = useState({
    companyName: 'Nairobi Freight Logistics Ltd',
    fleetSize: '25',
    vehicleTypes: 'Scania Heavy Tippers, Volvo Cargo haulers',
    routes: 'Nairobi Industrial ➔ Mombasa Corridor, Nakuru Bypass Corridor',
    currentTracker: 'Standard GPS Trackers (no diagnostic links)',
    dispatchProcess: 'Dispatchers call drivers on WhatsApp or cellular voice lines',
    delayCauses: 'Unannounced road bottlenecks, customs delays, tire punctures',
    bottlenecks: 'Mombasa Pipeline Terminal wait times, highway checkpoints',
    compliancePains: 'Driver license (PrDP) expired without central registry knowing',
    maintenancePains: 'Ignored engine warning codes causing sudden highway blowouts',
    networkCoverage: 'Poor cellular signal sectors on Maungu Rift descent',
    driverCommunication: 'Cellular phone voice call checks every 2 hours',
    reportingNeeds: 'Weekly delay hours report and vehicle fuel efficiency summaries',
    delayCostEstimate: '5400', // USD per month estimated
    decisionMaker: 'Director Francis Ndegwa (Operations Sponsor)',
    successCriteriaText: 'Telemetry uptime > 90%, cellular blackout cached recovery'
  });

  const handleDiscoveryChange = (field: keyof typeof discoveryForm, val: string) => {
    setDiscoveryForm(prev => ({ ...prev, [field]: val }));
  };

  // Computations for Discovery Output
  const discoveryOutput = useMemo(() => {
    const fSize = parseInt(discoveryForm.fleetSize) || 0;
    const delayCost = parseFloat(discoveryForm.delayCostEstimate) || 0;
    const isWeakData = !discoveryForm.companyName || fSize === 0 || !discoveryForm.decisionMaker;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (fSize > 50) riskLevel = 'high';
    else if (fSize > 15 || discoveryForm.networkCoverage.toLowerCase().includes('poor')) riskLevel = 'medium';

    return {
      summary: `Discovery Complete for ${discoveryForm.companyName || 'Unnamed Prospect'}. Operations manage ${fSize} heavy-duty commercial assets. Target routes span high-value logistics paths, with critical bottlenecks centering waiting hubs. Driver interaction is currently highly unstructured (voice checks).`,
      recommendedPilotScope: `Deploy 8 physical simulated Zapp Box P1 Pro telemetry units on active Scania and Volvo long-haul assets traversing the high-value ${discoveryForm.routes.split(',')[0]} route. Establish a custom staging workspace using OneDrive files to ingest driver lists. Mapped dispatcher seat count: 2.`,
      missingInformation: [
        !discoveryForm.delayCostEstimate ? 'Precise operator cost per delay hour is missing' : null,
        !discoveryForm.vehicleTypes ? 'Specific diagnostic ECU protocols of fleet are unlisted' : null,
        !discoveryForm.decisionMaker ? 'Confirmation of pilot budget sign-off owner needed' : null
      ].filter(Boolean) as string[],
      riskLevel,
      suggestedNextStep: `Prepare a customized 30-Day Pilot Agreement for ${discoveryForm.decisionMaker || 'operations decision-maker'}, using the standard checklist with specialized geofence trackers on Maungu transit points.`,
      isWeakData
    };
  }, [discoveryForm]);

  // 6. Interactive Demo Walkthrough Carousel State
  const [walkthroughIndex, setWalkthroughIndex] = useState(0);

  const demoSteps = [
    {
      title: "Commercial Pilot Overview",
      screen: "Commercial Pilot Tab ➔ Subtab: Onboarding Recommendation",
      clickAction: "Review onboarding summary block, recommended vehicles setup, and estimated complexity index.",
      talkingPoints: [
        "ZappOS is designed from the ground up for commercial logistics. We begin with a structured onboarding scoping.",
        "We ingest your current fleet parameters—fleet size, regional focus, tracker types—to calibrate your command deck.",
        "We establish clear parameters for simulated testing before deploying any physical hardware."
      ],
      value: "Ensures the customer receives a tailored operational experience instead of generic dashboards. Aligns expectations immediately.",
      limitation: "All hardware deployment calculations in this phase are analytical simulations.",
      question: "Can we add custom vehicle types that are not listed?",
      answer: "Yes, our flexible vehicle model schemas support adding custom long-haul, tipper, or tankers on the sub-board."
    },
    {
      title: "Pilot Fleet Operations Dashboard",
      screen: "Pilot Fleet Operations Tab ➔ 10-Vehicle List Map",
      clickAction: "Point to the 10 virtual vehicles, showing their fuel level percentages and regional depots (e.g., Mombasa Terminal).",
      talkingPoints: [
        "This is the active command console for your pilot. You see all 10 vehicles in real-time.",
        "Each line displays current coordinates, active driver on-duty state, and key telemetry alerts.",
        "The interface removes traditional spreadsheet clutter to focus dispatcher eyes only on active delays."
      ],
      value: "Reduces dispatcher cognitive load. Gives immediate visual awareness of fleet layout and locations in under 2 seconds.",
      limitation: "Vehicle movements are driven by a high-fidelity coordinates simulation stream.",
      question: "Are these GPS dots updated in real-time?",
      answer: "Yes, the telemetry updates correspond to our high-frequency packet stream, fully caching data during network dropouts."
    },
    {
      title: "Live Telemetry Operations & Dropout",
      screen: "Live Telemetry Operations Tab ➔ Active Ingestion Console",
      clickAction: "Trigger a simulated Cellular Dropout event on vehicle KCD 203B, then highlight the connection health bar.",
      talkingPoints: [
        "One of the biggest issues in regional transit is cellular coverage dropout. Traditional trackers simply lose this data.",
        "With Zapp Lightstream, if vehicle KCD 203B enters a blackout zone, telemetry packets are securely cached in local device memory.",
        "The moment signal is recovered, the cached logs flush to the server with zero coordinate gaps."
      ],
      value: "Guarantees 100% integrity of tracking history. Eliminates fuel-theft and route-bypass blindspots on remote corridors.",
      limitation: "Deep rural cellular blackout recovery is simulated using network shadow zone coordinate mapping.",
      question: "How much data can the device store during a blackout?",
      answer: "The Zapp Box local memory holds up to 72 hours of complete telemetry logs before automated FIFO cycling begins."
    },
    {
      title: "Zapp Brain Heuristic Insight",
      screen: "Main Dashboard ➔ Active Insight Stream",
      clickAction: "Click on any active delay alert card in the Insight Stream list.",
      talkingPoints: [
        "ZappOS is not a silent tracker. The Zapp Brain engine actively correlates multiple telemetry data streams.",
        "If a truck stops outside a designated geofence, Zapp Brain doesn't just ping. It analyzes coordinates, driver hours, and past logs.",
        "It then presents the dispatcher with a natural-language diagnosis of what is wrong and a proposed resolution checklist."
      ],
      value: "Improves dispatcher response time by 40%. Guides junior operators with the expertise of seasoned logistics supervisors.",
      limitation: "The Zapp Brain engine operates on heuristic pattern-matching. It does not make unsupervised autonomous decisions.",
      question: "Does the AI automatically call the driver or cancel a job?",
      answer: "Strictly no. ZappOS adheres to a supervisor-in-the-loop paradigm. It suggests the best playbook, but the dispatcher must log actions."
    },
    {
      title: "Incident Timeline Logs",
      screen: "Operations Action Center Tab ➔ Click Incident Case ➔ Detail Timeline",
      clickAction: "Open Panic Case INC_DEMO_SOS_01 and point out the sequence of event logs.",
      talkingPoints: [
        "Stressful incidents require clear accountability. When a panic loop is active, ZappOS creates a central Incident Panel.",
        "The system instantly compiles a micro-timeline: when the switch was pressed, the signal voltage, and the driver status.",
        "Every dispatcher action, phone callback, and supervisor approval is appended to this timeline for post-incident audits."
      ],
      value: "Provides an unalterable operational audit trail. Protects the organization from false alarm overhead and legal liability.",
      limitation: "All incident logging is persisted in secure, sandbox-separated tenant databases.",
      question: "Can we export this timeline for insurance audits?",
      answer: "Yes, you can copy the entire timeline log with one click or export it as a standardized JSON log template."
    },
    {
      title: "Manual Action Queue Override",
      screen: "Operations Action Center Tab ➔ Action Feedback Form",
      clickAction: "Fill out a manual resolution note (e.g., 'Callback complete, driver bumped switch') and submit.",
      talkingPoints: [
        "If Zapp Brain suggests a delay is a geofence exit violation, the operator is never locked out.",
        "Our interface provides simple override feedback controls. If the dispatcher knows a route bypass was authorized by the client, they can override it.",
        "This feedback actively logs to our rule learning records, allowing our team to refine trigger calibrations."
      ],
      value: "Maintains full operational flexibility. Prevents false alarms from slowing down trucks or annoying dispatchers.",
      limitation: "Manual overrides do not train AI weights directly; they log calibration parameters safely.",
      question: "Who can override a high-severity incident?",
      answer: "Access control is role-managed. Dispatchers can override delays, but critical safety bypasses require a Supervisor login context."
    },
    {
      title: "Field Deployment & Device Fitment",
      screen: "Field Deployment Tab ➔ Active Installer Workspace",
      clickAction: "Review device fitment status list, voltage readings, and antenna mount guides.",
      talkingPoints: [
        "Getting hardware deployed can be a major headache. We build dedicated tools for your depot mechanics.",
        "The Field Deployment console shows the active installation checklist for each Zapp Box.",
        "Mechanics can verify device power draw, cellular signal lock, and primary battery voltage before the truck leaves the workshop."
      ],
      value: "Ensures 100% correct physical installation. Avoids expensive truck call-backs due to poorly mounted antennas.",
      limitation: "Installation statuses and diagnostic voltages are generated simulation models.",
      question: "Do we need specialized technicians to fit the Zapp Box?",
      answer: "No, the Zapp Box is designed for simple 3-wire plug-and-play installation, which your workshop mechanics can complete in 45 minutes."
    },
    {
      title: "Integration Hub & OneDrive Staging",
      screen: "Integration Hub Tab ➔ Staging Folder Controls",
      clickAction: "Check the state of the OneDrive staging folder connection.",
      talkingPoints: [
        "You do not need to abandon your current systems to use ZappOS.",
        "Our Integration Hub provides a lightweight staging bridge. You can drop standard CSV rosters or client spreadsheets into a folder.",
        "ZappOS automatically scans the folder, validates column schemas, and populates your active dispatch rosters."
      ],
      value: "Allows immediate data ingestion. Replaces manual typing of 50 drivers and vehicles with a 10-second spreadsheet drop.",
      limitation: "Direct enterprise API endpoints are mapped for staging and do not write to live production ERP databases.",
      question: "How do we know if our data format is wrong?",
      answer: "The ingestion engine runs an active schema validator. If a column is missing, it highlights the exact row with a friendly error."
    },
    {
      title: "Release/Staging Safety Screen",
      screen: "Release Operations Tab ➔ Staging Sandboxing Pane",
      clickAction: "Point to the 49 verified staging database tables and active RLS Policy indicator.",
      talkingPoints: [
        "In modern software, safety is not just about trucks—it is about data integrity. We operate on a dual-stage deployment pipeline.",
        "Our DevOps Staging panel ensures that updates are thoroughly verified in a secure sandbox before touching live dispatcher data.",
        "Every query is governed by strict Row Level Security (RLS) policies, preventing tenant cross-talk.",
        "We simulate security attacks—like malicious tenant data access—to prove that RLS policies block unauthorized requests."
      ],
      value: "Ensures zero service downtime during software updates. Guarantees absolute isolation of your company data.",
      limitation: "The Staging cockpit monitors developer-level sandbox environments.",
      question: "Does our data ever mix with other transport companies using ZappOS?",
      answer: "Absolutely not. PostgreSQL Row Level Security (RLS) is active at the database level, strictly partitioning data by Company ID."
    },
    {
      title: "Honest ROI Estimator",
      screen: "Commercial Pilot Tab ➔ Interactive ROI Review",
      clickAction: "Change the custom vehicle count to 15, and highlight the projected payback period.",
      talkingPoints: [
        "We back our software with real-world savings estimates.",
        "By inputting your active fleet metrics, ZappOS calculates savings from reduced route delays, minimized engine idle, and compliance fines.",
        "We flag calculations with a low confidence warning if we do not have enough client-provided data, ensuring full transparency."
      ],
      value: "Provides your executive board with a clear, defensible business case. Demonstrates average pilot payback in 4.5 months.",
      limitation: "ROI outputs are mathematical models based on default transport industry operational estimates.",
      question: "What assumptions go into the fuel savings calculation?",
      answer: "We assume standard truck idle consumption is 0.8 gallons per hour and value diesel at current regional market prices."
    },
    {
      title: "30-Day Pilot Proposal",
      screen: "Commercial Pilot Tab ➔ Pilot Scope & Draft Contract",
      clickAction: "Scroll through the features included, parties draft agreement, and kickoff timeline.",
      talkingPoints: [
        "Our goal is to prove ZappOS value to you over a controlled, zero-risk 30-day pilot.",
        "We deploy 8 virtual units across your high-value corridor. We handle all dispatcher training and weekly reports.",
        "We agree on explicit success criteria—such as delay visibility—before committing to a full scale-out decision."
      ],
      value: "Provides a structured, risk-free sandbox path to modernization. No long-term commitments or automatic billing during the pilot.",
      limitation: "The proposal is generated as an editable draft for operational review and is non-binding.",
      question: "What happens after the 30-day pilot?",
      answer: "We review the success scorecard together. If criteria are met, we can easily transition the sandbox tenant to production."
    }
  ];

  // Compute Readiness Score
  const readinessMetrics = useMemo(() => {
    const totalKickoff = kickoffItems.length;
    const completedKickoff = kickoffItems.filter(item => item.checked).length;
    const criticalPending = kickoffItems.filter(item => item.critical && !item.checked);

    const totalSafety = safetyItems.length;
    const completedSafety = safetyItems.filter(item => item.checked).length;
    const safetyPending = safetyItems.filter(item => !item.checked);

    // Calculate score out of 100
    // Kickoff checklist weighs 50%, Safety checklist weighs 50%
    const kickoffScore = Math.round((completedKickoff / totalKickoff) * 50);
    const safetyScore = Math.round((completedSafety / totalSafety) * 50);
    const overallScore = kickoffScore + safetyScore;

    const blockers: string[] = [];
    if (criticalPending.length > 0) {
      blockers.push(`${criticalPending.length} Critical Kickoff items pending`);
    }
    if (safetyPending.length > 0) {
      blockers.push(`${safetyPending.length} Pre-demo Safety items unverified`);
    }
    if (successCriteria.filter(sc => !sc.approved).length > 0) {
      blockers.push(`Some Pilot Success Criteria lack explicit dispatcher/customer approval`);
    }

    let nextAction = "Verify all pre-demo safety checks to lock down the presenter dashboard.";
    if (criticalPending.length > 0) {
      nextAction = `Resolve critical pilot kickoff items: "${criticalPending[0].text}".`;
    } else if (successCriteria.filter(sc => !sc.approved).length > 0) {
      nextAction = "Get operations team sign-off on the pending pilot success criteria metrics.";
    }

    return {
      overallScore,
      blockers,
      nextAction,
      completedKickoff,
      totalKickoff,
      completedSafety,
      totalSafety
    };
  }, [kickoffItems, safetyItems, successCriteria]);

  // Support SOP Pack Data
  const supportSOPs = [
    {
      title: "Dispatcher Console Issue",
      severity: "Medium",
      time: "Under 30 Mins",
      firstResponse: "Verify dispatcher cellular connection and internet gateway latency. Check if the browser local storage is cleared.",
      logs: "Check console logs for session token exceptions or connection network latency warnings.",
      workaround: "Instruct operator to hard-refresh browser (Ctrl+F5) to clear cached application routes.",
      escalation: "Escalate to ZappOS Tech Lead if session refresh loops persist.",
      closure: "Dispatcher logs back into console and completes one action queue override successfully."
    },
    {
      title: "Login & Access Issue",
      severity: "High",
      time: "Under 15 Mins",
      firstResponse: "Check active user role mapping and tenant context profile configuration.",
      logs: "Inspect DB user authorization tables and audit logs for tenancy cross-talk rejects.",
      workaround: "Re-assign role explicitly in Tenant context selector; check if user is on authorized dispatcher list.",
      escalation: "Escalate to Database Administrator for database Row-Level Security (RLS) credential inspection.",
      closure: "User completes sign-in flow successfully without access-denied warnings."
    },
    {
      title: "Telemetry Data Issue",
      severity: "High",
      time: "Under 1 Hour",
      firstResponse: "Check active coordinates telemetry stream feed state. Verify Lightstream connection packet status.",
      logs: "Audit Lightstream ingestion packet server logs for unrecognized serial packets.",
      workaround: "Toggle device Virtual Stream simulator switch to restart automated packet sequence.",
      escalation: "Escalate to Embedded Telemetry Engineer if coordinator sockets are frozen.",
      closure: "Active vehicle map markers update coordinate strings with fresh timestamps."
    },
    {
      title: "Device / Simulator Issue",
      severity: "Medium",
      time: "Under 2 Hours",
      firstResponse: "Check simulated hardware serial key. Verify if diagnostic battery voltage drops below 9V.",
      logs: "Review Device Lab voltage logs and signal strength status buffers.",
      workaround: "Click 'Reset Device Lab' to flush virtual component loop cycles.",
      escalation: "Escalate to Hardware Lab Technician for firmware flashing logs review.",
      closure: "Device diagnostics pane registers 'v2.4.13-pilot' firmware status."
    },
    {
      title: "Data Import Issue",
      severity: "Low",
      time: "Within 24 Hours",
      firstResponse: "Validate CSV/JSON spreadsheet columns against standard Nairobi Freight staging schemas.",
      logs: "Check Staging Hub column alignment errors and missing row value alerts.",
      workaround: "Provide client with pre-formatted Excel template with correctly aligned headers.",
      escalation: "Escalate to Data Ingestion Specialist.",
      closure: "OneDrive staging validator displays '100% of rows successfully parsed' confirmation."
    },
    {
      title: "Report / Export Issue",
      severity: "Low",
      time: "Within 12 Hours",
      firstResponse: "Check if selected pilot vehicle counts have completed active telemetry jobs.",
      logs: "Audit template variable bindings and calculated fuel/delay totals.",
      workaround: "Manually extract JSON data string from export text block for custom Excel imports.",
      escalation: "Escalate to Frontend Developer.",
      closure: "Customer copy-ready textbox correctly populates with weekly statistics."
    },
    {
      title: "Customer Escalation",
      severity: "Critical",
      time: "Under 1 Hour",
      firstResponse: "Trigger high-priority phone callback to Director Francis Ndegwa. Acknowledge issue immediately.",
      logs: "Assess all active telemetry, compliance warnings, and system uptime logs.",
      workaround: "Activate manual fallback WhatsApp check-call logs while technical diagnostics execute.",
      escalation: "Immediate escalation to ZappOS Account Executive and Operations Lead.",
      closure: "Sponsor signs off on written incident resolution report with documented root-cause."
    },
    {
      title: "Security / Access Concern",
      severity: "Critical",
      time: "Under 30 Mins",
      firstResponse: "Immediately isolate suspicious tenant context. Block active logins if breach is suspected.",
      logs: "Audit Row Level Security (RLS) policies violation logs and unauthorized tenant query attempts.",
      workaround: "Enforce strict tenant separation rules on current Express session tokens.",
      escalation: "Immediate escalation to Principal Security Architect.",
      closure: "Test suite confirms 100% of malicious tenant RLS injection attempts are blocked."
    }
  ];

  // Objection handling playbook drill state
  const [revealedObjections, setRevealedObjections] = useState<Record<number, boolean>>({});

  const objectionsDrill = [
    {
      id: 1,
      objection: "We already use Cartrack / Netstar / MiX.",
      honestAnswer: "We don't just track where vehicles are. Traditional systems provide raw coordinates; ZappOS provides dispatcher-supervised diagnostic playbooks that tell operators exactly how to resolve delays and compliance issues in real-time.",
      whatToShow: "Show the active Zapp Brain Insights Stream, focusing on the dynamic natural-language diagnostic and step-by-step dispatch playbooks.",
      whatNotToOverpromise: "Do not claim we replace physical vehicle tracker hardware if they want to keep their existing telemetry devices; instead, highlight that ZappOS acts as an overlay orchestrator.",
      followUp: "How much time do your dispatchers spend calling drivers on the phone to find out why they are delayed?"
    },
    {
      id: 2,
      objection: "We do not trust automated AI systems.",
      honestAnswer: "We agree completely—unsupervised AI control is dangerous in heavy logistics. ZappOS operates strictly under a human-supervised paradigm. Zapp Brain generates advisory guides, but dispatchers have 100% override authority.",
      whatToShow: "Show the Operations Center override form where dispatchers can ignore, modify, or log manual bypass notes.",
      whatNotToOverpromise: "Do not claim Zapp Brain has autonomous driving or automated rerouting steering controls; it is an advisory helper.",
      followUp: "Would you feel comfortable if the system acted strictly as a checklist creator that requires your staff's manual approval before taking action?"
    },
    {
      id: 3,
      objection: "We cannot install hardware units right now.",
      honestAnswer: "That's exactly why we start with a virtual staging pilot. We configure simulated telemetry streams to match your active routes first, validating the software dashboard workflow before mounting a single wire.",
      whatToShow: "Open the Device Operations Lab and the Field Deployment panel to show the step-by-step diagnostic verification mechanics.",
      whatNotToOverpromise: "Do not say that physical hardware is completely optional for long-term deployment; physical Zapp Boxes are required to read real engine DTC fault codes later.",
      followUp: "Can we begin with a 30-day simulated sandbox run using your historical route spreadsheets?"
    },
    {
      id: 4,
      objection: "Our network coverage is extremely poor on some routes.",
      honestAnswer: "Logistics routes often traverse shadow zones. Rather than losing connection, the Zapp Box runs Lightstream caching: logging coordinates locally in memory and flushing them upon signal re-acquisition with zero data loss.",
      whatToShow: "Open the Live Telemetry Operations panel and trigger a simulated Cellular Dropout event to demonstrate the local caching.",
      whatNotToOverpromise: "Do not claim the device can transmit live video or telemetry without cellular networks; transmission is strictly cached until coverage returns.",
      followUp: "On which specific mountain passes or border posts do your dispatchers typically lose tracking coordinates?"
    },
    {
      id: 5,
      objection: "Our dispatchers are already too busy.",
      honestAnswer: "Manual check-calls and phone-logs are what keep dispatchers busy. ZappOS standardizes communication into clean, single-click updates, saving operators up to 2 hours of repetitive phone tasks per shift.",
      whatToShow: "Point out the copy-ready summary text widgets and the automated incident checklist boards.",
      whatNotToOverpromise: "Do not promise that dispatchers will need zero training; they will need a 30-minute walkthrough to adapt to the command console.",
      followUp: "How many hours a day do your dispatchers spend typing manual updates into client-facing emails?"
    },
    {
      id: 6,
      objection: "We do not have clean fleet data to start.",
      honestAnswer: "No one does. That is why we include an ingestion staging hub. You can drop in raw Excel rosters, and our schema validator will highlight the exact rows that have formatting errors.",
      whatToShow: "Show the Integration Hub and upload a draft CSV/JSON file to demonstrate the column-mapping checks.",
      whatNotToOverpromise: "Do not promise that the system can automatically correct corrupted client spreadsheets; it detects and flags errors for quick manual fixing.",
      followUp: "Can you provide a simple spreadsheet with just your vehicle license plates and driver names to start?"
    },
    {
      id: 7,
      objection: "How is our sensitive fleet data protected?",
      honestAnswer: "Security is built-in. ZappOS runs on a dual-stage sandbox architecture. Every tenant query is governed by strict PostgreSQL Row Level Security (RLS) policies, preventing any unauthorized cross-talk.",
      whatToShow: "Navigate to the Release Operations Staging screen and run the Adversarial RLS attack suite to show unauthorized queries being blocked.",
      whatNotToOverpromise: "Do not claim we hold governmental defense-grade military clearance; we hold enterprise-standard SaaS data isolation frameworks.",
      followUp: "Are there specific client SLA data privacy requirements you need us to integrate into our compliance parameters?"
    },
    {
      id: 8,
      objection: "What happens if the system is wrong?",
      honestAnswer: "Because we have a human-in-the-loop design, a system miscalculation is harmless. If Zapp Brain incorrectly flags a geofence exit, the dispatcher simply logs a single-click override.",
      whatToShow: "Show the manual action override console and describe how override reasons are logged for calibration.",
      whatNotToOverpromise: "Do not claim the heuristic engine is 100% flawless; default heuristic rules are calibrated during the first week of the pilot.",
      followUp: "What is your current procedure when a driver has to take an unauthorized detour due to heavy road construction?"
    },
    {
      id: 9,
      objection: "How much will this cost?",
      honestAnswer: "We are fully transparent about costs. We have a simple SaaS subscription model based on vehicle count, dispatcher seats, and active devices. During the pilot, we waive long-term contracts and offer a 15% setup discount.",
      whatToShow: "Open the interactive Pricing Snapshot on the Commercial Pilot panel and adjust the parameters to see the MRR breakdown.",
      whatNotToOverpromise: "Do not give a binding quote on the spot without scoping; explain that this is a pilot estimate.",
      followUp: "If we can prove that reduced delays save more than the licensing cost in under 6 months, would your board approve a permanent roll-out?"
    },
    {
      id: 10,
      objection: "What happens after the 30-day pilot?",
      honestAnswer: "We review the success criteria scorecard together. If we meet the target of >90% telemetry uptime and improved dispatcher response, you can choose to transition to production or easily exit.",
      whatToShow: "Show the Customer Success Scorecard and the Success Criteria builder.",
      whatNotToOverpromise: "Do not claim that scaling up is instantaneous; physical hardware procurement and vehicle fitment takes up to 2 weeks for large fleets.",
      followUp: "Who else on your finance or operations board would need to sign off on the pilot review scorecard?"
    }
  ];

  // Report templates
  const [selectedReportType, setSelectedReportType] = useState<
    | 'daily'
    | 'weekly'
    | 'incident'
    | 'telemetry'
    | 'compliance'
    | 'maintenance'
    | 'roi'
    | 'scale'
  >('daily');

  const reportTemplatesData = {
    daily: {
      title: "Daily Pilot Summary Report",
      description: "Automated daily dispatch overview for logistics supervisors.",
      text: `DAILY PILOT STATUS SUMMARY: ${discoveryForm.companyName}
DATE: 2026-07-12
TENANT CONTEXT: co_nairobi_freight (Staging Sandbox)

1. DISPATCH METRICS:
   - Total Jobs Tracked: 4 active pilot routes
   - Completed Routes: 1 (JOB_DEMO_902)
   - Active In-Transit: 2
   - Flagged Delay Incidents: 1 (JOB_DEMO_903)

2. COMPLIANCE & SAFETY STATUS:
   - Expired Driver Credentials Detected: 1 (Grace Muthoni - expired PrDP May 10, 2026)
   - Pending Certificate of Fitness (COF): 1 vehicle (KCD 104X expires in 4 days)
   - Safety Bypass Overrides Logged: 1 (Approved by Supervisor James Mwangi)

3. ENGINE HEALTH (DTC ALERTS):
   - Active Fault SPN warnings: 2 (KBY 980P fuel filter warning, KCD 456E low coolant alert)
   - Workshop repair bookings triggered: 1 (Scheduled for Nairobi Workshop)

4. TELEMETRY CONNECTION STATUS:
   - Average Signal Strength: -72 dBm (Healthy Corridor Coverage)
   - Lightstream Network Blackout Packets cached: 14 packets stored during Rift Valley descent

NOTE: This daily summary is compiled from the ZappOS staging sandbox and is supervised by human dispatchers. No autonomous driving actions were executed.`,
      json: JSON.stringify({
        report_type: "daily_pilot_summary",
        company: "Nairobi Freight Logistics Ltd",
        date: "2026-07-12",
        active_jobs: 4,
        completed_jobs: 1,
        incidents: [{ id: "JOB_DEMO_903", delay_type: "cellular_dropout_holding" }],
        compliance: { expired_drivers: 1, warnings: 1 },
        telemetry: { avg_signal_dbm: -72, cached_packets: 14 }
      }, null, 2)
    },
    weekly: {
      title: "Weekly Executive Pilot Summary",
      description: "High-level board summary highlighting operational progress.",
      text: `WEEKLY PILOT PERFORMANCE REPORT: WEEK 2 REVIEW
PARTNER: ${discoveryForm.companyName}
PILOT ID: PL_NBO_STAGING_01

1. PILOT PERFORMANCE HIGHLIGHTS:
   - Average Telemetry Connection Uptime: 92.4% (Target > 90.0%) - PASSED
   - Telemetry Packet Delivery Rate: 96.1% (Target > 95.0%) - PASSED
   - Average Dispatcher Reaction Time: 6.8 minutes (Target < 10.0 minutes) - PASSED
   - Redundant Phone Check-calls Avoided: 112 calls saved this week (Est. 5.6 hours operator time)

2. FINANCIAL EFFICIENCY PROJECTED:
   - Projected Weekly Fuel Savings (idle optimization): $142.50
   - Projected Delay Cost Penalties Avoided: $840.00
   - Total Estimated Monthly Pilot Savings: $3,930.00 (Based on 10 active vehicles)

3. COMPLIANCE AUDIT REDUCTION:
   - Expired certifications proactively blocked: 3 instances
   - Roadside breakdown risks avoided (DTC low coolant flags): 2 events caught before dispatch

STATUS SUMMARY: The 30-day pilot is operating on target. Security and tenant isolation remain 100% active. Ready to proceed to Week 3 scale planning.`,
      json: JSON.stringify({
        report_type: "weekly_executive_summary",
        week: 2,
        metrics: { telemetry_uptime_pct: 92.4, packet_delivery_pct: 96.1, avg_reaction_mins: 6.8 },
        financials: { weekly_fuel_savings: 142.50, delays_avoided_value: 840.00, projected_monthly_savings: 3930.00 },
        compliance_blocks: 3,
        critical_faults_caught: 2
      }, null, 2)
    },
    incident: {
      title: "Detailed Incident History Report",
      description: "Standard audit report detailing single incident diagnostics and overrides.",
      text: `ZAPPOS DETAILED INCIDENT AUDIT REPORT
INCIDENT ID: INC_DEMO_SOS_01
VEHICLE PLATE: KBY 980P (Volvo Fuel Tanker)
ACTIVE DRIVER: David Mwangi
STATUS: Investigating - Supervisor Review Pending

1. DETECTED METRIC SEQUENCE:
   - 08:15:02 - Driver triggered primary cabin safety switch (Panic loop active)
   - 08:15:15 - Ingestion engine verifies cellular signal is stable at -70 dBm
   - 08:15:30 - Diagnostic check shows primary battery voltage normal (12.6V)
   - 08:15:45 - Zapp Brain heuristic triggers bypass warning: "Panic loop active. Likely accidental press. Voltage stable."

2. WORKFLOW LOGS:
   - 08:16:10 - Dispatcher James Mwangi initiated voice callback to driver cabin
   - 08:17:05 - Driver confirmed accidental trigger while reaching for logbook
   - 08:17:30 - Dispatcher submitted manual override: 'Verified accidental cabin switch press. Threat cleared.'

CONCLUSION: Incident resolved correctly. Panic bypass prevented costly false security dispatch.`,
      json: JSON.stringify({
        incident_id: "INC_DEMO_SOS_01",
        vehicle: "KBY 980P",
        driver: "David Mwangi",
        status: "resolved_by_dispatcher",
        zapp_brain_advice: "Accidental switch bypass suggested",
        timeline: [
          { time: "08:15", event: "panic_switch_pressed" },
          { time: "08:16", event: "voice_callback_initiated" },
          { time: "08:17", event: "dispatcher_override_submitted", note: "Accidental press confirmed" }
        ]
      }, null, 2)
    },
    telemetry: {
      title: "Zapp Lightstream Telemetry Health",
      description: "Technical health report tracking signal strength and cached packet recovery.",
      text: `ZAPP LIGHTSTREAM HEALTH REPORT: CORRIDOR RELIABILITY
LOGISTICS RUN: Mombasa Corridor transit
VEHICLE ID: KCD 203B

1. CONNECTION HEALTH METRICS:
   - Total Transmission Hours: 14.5 hrs
   - Uptime Percentage: 91.2%
   - Average Signal Quality: -74 dBm (Excellent)
   - Connection Blackout Incidents: 1 (Maungu descent sector)

2. LIGHTSTREAM LOCAL CACHE LOGS:
   - Signal Lost: 11:24:00 (Rift shadow zone)
   - In-Memory Packets Saved: 14 logs (Full coordinate strings, fuel parameters, diagnostic DTCs)
   - Signal Re-acquired: 11:42:15
   - Cache Flush Status: 100% SUCCESSFUL (Uploaded 14 packets in single lightweight compressed stream)

TECHNICAL COMPLIANCE: Uptime exceeds standard SLA parameters. Blackout caching prevented telemetry gaps.`,
      json: JSON.stringify({
        telemetry_health: "lightstream_v2",
        vehicle_id: "KCD 203B",
        run_hours: 14.5,
        connection_uptime_pct: 91.2,
        blackouts: [{ duration_mins: 18, packets_cached: 14, upload_status: "success" }]
      }, null, 2)
    },
    compliance: {
      title: "Proactive Compliance Visibility Report",
      description: "Weekly audit of driver licensing and vehicle fitness certs.",
      text: `PROACTIVE COMPLIANCE MONITORING SUMMARY
CLIENT: ${discoveryForm.companyName}
DATE: 2026-07-12

1. ACTIVE RISK SUMMARY:
   - Monitored Driver Licenses (PrDP): 12 active
   - Expired Driver Licenses Detected: 1 (Grace Muthoni - Expired May 10, 2026)
   - Monitored Vehicle COF Certificates: 10 active
   - Critical COF Renewals Pending: 1 (KCD 104X - Expires in 4 days)

2. DISPATCH INTERCEPT TRIGGERS:
   - Driver Grace Muthoni was flagged 'suspended' in system roster, preventing active job scheduling.
   - Vehicle KCD 104X received a dashboard reminder notice, alerting depot manager.

COMPLIANCE ASSURANCE: Proactive warning rules successfully eliminated corporate statutory liability.`,
      json: JSON.stringify({
        compliance_summary: "proactive_checks",
        drivers_monitored: 12,
        expired_found: ["Grace Muthoni (Expired 2026-05-10)"],
        vehicles_monitored: 10,
        pending_renewals: [{ plate: "KCD 104X", days_remaining: 4 }]
      }, null, 2)
    },
    maintenance: {
      title: "Predictive Maintenance & DTC Audit",
      description: "Workshop report tracking engine trouble codes and failure prevention.",
      text: `PREDICTIVE MAINTENANCE & VEHICLE ENGINE TROUBLE CODES
PARTNER: ${discoveryForm.companyName}
REPORTING PERIOD: Weekly Pilot View

1. PARSED DTC SPN ENGINE CODES:
   - KBY 980P: 'SPN 94 FMI 17' - Low Fuel Delivery Pressure (Severity: Medium)
   - KCD 456E: 'SPN 111 FMI 1' - Coolant Level Critical Low (Severity: High)

2. WORKSHOP ACTIONS TRIGGERED:
   - KBY 980P: Scheduled filter replacement during Nairobi terminal overnight stop.
   - KCD 456E: High-severity alert triggered immediate dispatch lock. Refilled coolant at depot workshop.

SAVINGS AUDIT: High-severity coolant intercept prevented a major road blowout, saving an estimated $3,200 towing and repair event.`,
      json: JSON.stringify({
        maintenance_dtc_audit: "predictive_alerts",
        active_codes: [
          { plate: "KBY 980P", code: "SPN 94 FMI 17", system: "Fuel delivery", action: "schedule_overnight_filter" },
          { plate: "KCD 456E", code: "SPN 111 FMI 1", system: "Cooling circuit", action: "immediate_workshop_refill" }
        ],
        estimated_road_breakdowns_prevented: 1,
        projected_costs_avoided: 3200
      }, null, 2)
    },
    roi: {
      title: "Board-Level Pilot ROI Review",
      description: "Financial projection summarizing direct cost savings of the pilot.",
      text: `BOARD-LEVEL PILOT SAVINGS & ROI ASSESSMENT
CLIENT: ${discoveryForm.companyName}
DECOY METRIC BENCHMARK: 10 Pilot Vehicles

1. OPERATIONAL ASSUMPTIONS (CLIENT APPROVED):
   - Average cost per route delay hour: $45.00
   - Idle diesel cost: $3.80 / gallon
   - Catastrophic breakdown penalty: $3,200.00

2. CALCULATED MONTHLY SAVINGS:
   - reduced delays (reduced 24.5% hours): $1,280.00
   - idle optimization (reduced heavy idle hours): $480.00
   - missed delivery prevention (saved 2 cargo penalties): $500.00
   - predictive maintenance (prevented 1 major road failure): $3,200.00
   - compliance fine prevention (blocked expired vehicle scheduling): $850.00
   - dispatcher productivity (saved 22 dispatcher admin hours): $407.00

TOTAL ESTIMATED MONTHLY PILOT SAVINGS: $6,717.00
PILOT MONTHLY LICENSING & LEASE COST: $550.00
PROJECTED INVESTMENT PAYBACK PERIOD: 0.1 months (Immediate ROI)`,
      json: JSON.stringify({
        roi_audit: "financial_case",
        vehicles: 10,
        assumptions: { delay_hr_cost: 45, fuel_gal: 3.8, catastrophic_breakdown: 3200 },
        monthly_savings: { delays: 1280, idle: 480, missed: 500, maintenance: 3200, compliance: 850, dispatcher_admin: 407 },
        total_monthly_savings: 6717,
        pilot_monthly_cost: 550,
        payback_months: 0.1
      }, null, 2)
    },
    scale: {
      title: "30-Day Pilot Success & Scale-Readiness",
      description: "Review sheet indicating success criteria met and next scale-up recommendations.",
      text: `ZAPPOS 30-DAY PILOT SCALE-READINESS REPORT
CLIENT: ${discoveryForm.companyName}
DATE: 2026-07-12

1. SUCCESS CRITERIA CHECKLIST:
   - SC-01: Telemetry connection signal uptime > 90.0%: MET (92.4% avg)
   - SC-02: Telemetry packet delivery rate > 95.0%: MET (96.1% avg)
   - SC-03: Dispatcher response time to delay < 10 mins: MET (6.8 mins avg)
   - SC-04: Expired driving certifications flagged: MET (100% driver roster validated)
   - SC-05: Proactive engine DTC preventative catch: MET (Coolant circuit catch)

2. COMMERCIAL STAGING SCORECARD:
   - Overall Customer Success Score: 84 / 100 (Status: HIGHLY READY)
   - Dispatcher Console Adoption Rate: 88.0%

3. RECOMMENDED SCALE PLAN:
   - Transition Nairobi Freight sandbox tenant to production database.
   - Procure 25 additional Zapp Box P1 Pro telemetry units for long-haul fleet.
   - Standardize automated daily CSV driver roster synchronization via OneDrive staging.

COMMERCIAL CONCLUSION: Pilot success criteria fully satisfied. Highly recommended to transition pilot to standard commercial agreement.`,
      json: JSON.stringify({
        scale_readiness: "success_criteria_satisfied",
        success_score: 84,
        criteria_passed: ["SC-01", "SC-02", "SC-03", "SC-04", "SC-05"],
        next_steps: { transition_sandbox_to_prod: true, additional_devices: 25, automated_onedrive_synced: true }
      }, null, 2)
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top Banner - Pitch Prep Header */}
      <div className="bg-indigo-900 text-white p-6 rounded-t-xl border-b border-indigo-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Phase 20 Ready
            </span>
            <span className="text-slate-300 text-xs font-mono">Pilot Ingestion & Staging Tools</span>
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight mt-1 flex items-center gap-2">
            <Award className="text-yellow-400" />
            First Customer Demo & Pilot Readiness Pack
          </h1>
          <p className="text-indigo-200 text-xs mt-0.5 max-w-2xl">
            Prepare, scope, and close a controlled 30-day pilot with your first logistics partner. Backed by honest data calculations, pre-demo safety checks, and interactive objection drills.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-950/50 p-3 rounded-lg border border-indigo-800">
          <div className="text-right">
            <div className="text-[10px] text-indigo-300 font-mono font-bold uppercase tracking-wider">Readiness Score</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">{readinessMetrics.overallScore}%</div>
          </div>
          <div className="w-2 h-10 bg-indigo-800 rounded-full overflow-hidden flex flex-col justify-end">
            <div
              className={`w-full rounded-full transition-all duration-500 ${
                readinessMetrics.overallScore > 80 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ height: `${readinessMetrics.overallScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Subtab Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
            Pack Framework
          </div>
          {[
            { id: 'dashboard', label: 'Readiness Dashboard', icon: ShieldCheck },
            { id: 'demo-walkthrough', label: 'Guided Demo Walkthrough', icon: Play },
            { id: 'demo-script', label: 'Presenter Copy Script', icon: FileCode },
            { id: 'discovery', label: 'Discovery Questionnaire', icon: Users },
            { id: 'data-checklist', label: 'Pilot Data Request', icon: FileSpreadsheet },
            { id: 'agreement', label: '30-Day Pilot Agreement', icon: FileText },
            { id: 'success-criteria', label: 'Success Criteria Builder', icon: Award },
            { id: 'roi-assumptions', label: 'ROI Assumption Review', icon: TrendingUp },
            { id: 'kickoff', label: 'Kickoff Checklist', icon: ListTodo },
            { id: 'support-sop', label: 'SOP Helpdesk Cards', icon: Wrench },
            { id: 'report-templates', label: 'Report Templates Pack', icon: BookOpen },
            { id: 'objections', label: 'Objection Drill Suite', icon: HelpCircle },
            { id: 'safety-review', label: 'Pre-Demo Safety Audit', icon: Shield }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-900 font-bold border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Active Panel */}
        <div className="lg:col-span-9 space-y-6">
          {/* SUCCESS BANNER */}
          {copiedText && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2 animate-bounce">
              <CheckCircle size={16} className="text-emerald-600" />
              <span>Copied <strong>{copiedText}</strong> to your clipboard successfully!</span>
            </div>
          )}

          {/* 1. READINESS DASHBOARD VIEW */}
          {activeSubTab === 'dashboard' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <ShieldCheck size={20} className="text-indigo-600" />
                  Pilot Readiness & Client Pitch Command Center
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ensure 100% administrative and technical alignment before presenting to Nairobi Freight.
                </p>
              </div>

              {/* Status Metric Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <ListTodo size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Kickoff Tasks</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {readinessMetrics.completedKickoff} / {readinessMetrics.totalKickoff} Completed
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Safety Verifications</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {readinessMetrics.completedSafety} / {readinessMetrics.totalSafety} Passed
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Award size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Agreed Goals</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {successCriteria.filter(sc => sc.approved).length} / {successCriteria.length} Approved
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings and Blockers Checklist */}
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 font-mono">
                  <AlertTriangle size={16} />
                  ACTIVE PRE-PILOT LAUNCH BLOCKERS ({readinessMetrics.blockers.length})
                </h3>
                {readinessMetrics.blockers.length === 0 ? (
                  <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                    <Check size={16} /> All systems clear! Zero blockers identified. Perfect launch condition.
                  </p>
                ) : (
                  <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
                    {readinessMetrics.blockers.map((b, i) => (
                      <li key={i} className="font-medium">{b}</li>
                    ))}
                  </ul>
                )}
                <div className="border-t border-amber-200 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Next Recommended Launch Action:</span>
                  <span className="text-amber-900 font-extrabold uppercase font-mono">{readinessMetrics.nextAction}</span>
                </div>
              </div>

              {/* Subtab quick links */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Readiness Launch Pack Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'demo-walkthrough', label: 'Guided Demo Presenter Hub', desc: 'Step-by-step presentation outline with interactive cues.' },
                    { id: 'demo-script', label: 'Client Script Copywriter', desc: 'Copy-ready narrative framing for operations directors.' },
                    { id: 'discovery', label: 'Discovery Ingestion Scoping', desc: 'Active client questionnaire with automated scoping estimations.' },
                    { id: 'data-checklist', label: 'CSV/Roster Ingestion Sheets', desc: 'Client checklist for OneDrive staging templates.' },
                    { id: 'agreement', label: '30-Day Contract Agreement Draft', desc: 'Client-ready trial terms detailing simulated boundaries.' },
                    { id: 'success-criteria', label: 'Interactive Criteria Scorecard', desc: 'Build measurable SLAs for pilot progression.' },
                    { id: 'roi-assumptions', label: 'Financial Assumptions Ledger', desc: 'Log fuel, delay, and mechanic costs transparently.' },
                    { id: 'kickoff', label: 'Depot Team Checklist', icon: ListTodo, desc: 'Tracks technical staging and personnel onboarding status.' },
                    { id: 'support-sop', label: 'Dispatcher SLA Support Cards', desc: 'Operational SLAs for browser dropouts and voltage errors.' },
                    { id: 'report-templates', label: 'Executive PDF/JSON Reports Pack', desc: 'Copy-ready summaries for Board review.' }
                  ].map(lnk => (
                    <button
                      key={lnk.id}
                      onClick={() => setActiveSubTab(lnk.id as any)}
                      className="p-3 bg-slate-50 border border-slate-200 hover:border-indigo-400 text-left rounded-xl transition-all cursor-pointer group flex justify-between items-center"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-950">{lnk.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{lnk.desc}</div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. GUIDED DEMO PRESENTATION MODE */}
          {activeSubTab === 'demo-walkthrough' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                    <Play size={20} className="text-indigo-600 animate-pulse" />
                    Guided Live Presenter Walkthrough
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Step-by-step dashboard roadmap to convert first demo into a 30-day pilot.
                  </p>
                </div>
                <div className="text-xs bg-indigo-100 text-indigo-800 font-mono font-bold px-3 py-1 rounded-md">
                  Step {walkthroughIndex + 1} of {demoSteps.length}
                </div>
              </div>

              {/* Progress Tracker bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full flex gap-1">
                {demoSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setWalkthroughIndex(idx)}
                    className={`flex-1 h-full rounded-full transition-all cursor-pointer ${
                      idx === walkthroughIndex
                        ? 'bg-indigo-600'
                        : idx < walkthroughIndex
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Card Contents */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest font-mono">Active Scene Focus</span>
                  <h3 className="text-base font-extrabold text-slate-800 mt-0.5">
                    {demoSteps[walkthroughIndex].title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white border border-slate-200 p-3.5 rounded-lg space-y-2">
                    <div className="font-bold text-indigo-900 flex items-center gap-1.5 font-mono">
                      <Settings size={14} /> Screen to Open
                    </div>
                    <p className="text-slate-800 font-medium">{demoSteps[walkthroughIndex].screen}</p>

                    <div className="font-bold text-indigo-900 pt-2 flex items-center gap-1.5 font-mono">
                      <Zap size={14} /> What to Click
                    </div>
                    <p className="text-slate-700 font-medium">{demoSteps[walkthroughIndex].clickAction}</p>
                  </div>

                  <div className="bg-white border border-slate-200 p-3.5 rounded-lg space-y-2">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5 font-mono">
                      <Award size={14} /> Customer Outcome Value
                    </div>
                    <p className="text-slate-700 font-medium">{demoSteps[walkthroughIndex].value}</p>

                    <div className="font-bold text-amber-800 pt-2 flex items-center gap-1.5 font-mono">
                      <Shield size={14} /> Honest Limitation to Mention
                    </div>
                    <p className="text-slate-600 font-semibold italic">"{demoSteps[walkthroughIndex].limitation}"</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2">
                  <div className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 font-mono">
                    <Terminal size={14} className="text-slate-500" />
                    Presenter Verbal Talking Points
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-700">
                    {demoSteps[walkthroughIndex].talkingPoints.map((tp, i) => (
                      <li key={i} className="leading-relaxed">{tp}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-xs space-y-1">
                  <div className="font-extrabold text-indigo-950 flex items-center gap-1 font-mono">
                    <HelpCircle size={14} /> Expected Customer Question
                  </div>
                  <p className="text-indigo-900 italic font-semibold">"{demoSteps[walkthroughIndex].question}"</p>
                  <div className="font-extrabold text-emerald-950 pt-1 flex items-center gap-1 font-mono">
                    <CheckCircle size={14} className="text-emerald-600" />
                    Honest Answer (No Overpromise)
                  </div>
                  <p className="text-emerald-900 font-medium">{demoSteps[walkthroughIndex].answer}</p>
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex justify-between items-center pt-2">
                <button
                  disabled={walkthroughIndex === 0}
                  onClick={() => setWalkthroughIndex(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  disabled={walkthroughIndex === demoSteps.length - 1}
                  onClick={() => setWalkthroughIndex(prev => prev + 1)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  Next Scene <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 3. COPY-READY PRESENTATION SCRIPT */}
          {activeSubTab === 'demo-script' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                    <FileCode size={20} className="text-indigo-600" />
                    Presenter Copy-Ready Sales Script
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Direct, honest, professional sales script tailored for operations managers and fleet directors.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const fullText = `
ZAPPOS DEMO PRESENTER SALES SCRIPT
=================================

1. INTRODUCTION & HOOK:
"Thank you for taking the time to join us today. In regional logistics, the difference between a highly profitable quarter and deep operational loss comes down to minutes. We designed ZappOS not to add more coordinate graphs, but to give your dispatch team immediate, supervised diagnostic directions to secure your fleet operations."

2. CUSTOMER PAIN-POINT FRAMING:
"Traditional GPS trackers show dots on a map, but they do not tell your team what is actually happening. When a truck goes offline or takes an unexpected detour, your dispatchers end up on endless WhatsApp messages and phone check-calls, while delivery SLAs are breached. We solve that exact blind spot."

3. ZAPPOS POSITIONING:
"ZappOS is a dispatcher-supervised operational intelligence overlay. It integrates with your current staging rosters, processes lightweight cached packet telemetry during regional network dropouts, and outputs clear step-by-step playbooks so your team can act within 10 minutes."

4. DASHBOARD & LIVE OPERATIONS WALKTHROUGH:
"Look at our active Pilot Command Deck. Here, instead of clutter, we show you 10 active vehicles with critical alerts categorized. You see who is on-duty, fuel capacity levels, and whether their telemetry connections are healthy. The interface replaces manual spreadsheets with one responsive screen."

5. DISPATCH WORKFLOW DEMONSTRATION:
"When an issue arises—like vehicle KCD 203B encountering a network blackout corridor—our system runs Zapp Lightstream. It caches coordinates locally in device memory and immediately flushes the back-log once connectivity recovers, ensuring 100% telemetry data integrity for audit logs."

6. INCIDENT HANDLING WORKFLOW:
"Look at case INC_DEMO_SOS_01. A driver triggers the safety switch. Traditional systems set off high-cost panic dispatches immediately. Zapp Brain, however, analyzes the telemetry first: checking if battery voltage is stable. It outputs a bypass advice suggesting an accidental press, and guides the dispatcher through a standard voice callback checklist."

7. FIELD DEPLOYMENT WORKFLOW:
"To make sure deployment is friction-free, your mechanics get a dedicated Installer Panel. Before a truck leaves your depot workshop, your mechanic verifies battery voltage lines, device power draw, and satellite signal locks to ensure 100% hardware readiness."

8. INTEGRATION HUB (NO OVERPROMISE):
"You do not need to replace your current spreadsheet systems. Our staging folder bridge accepts standard CSV driver and vehicle rosters, validating column alignment with clean warnings before importing rows."

9. SAFETY AND REASONABLE LIMITATIONS:
"Let us be fully honest about system boundaries: ZappOS does not steer your vehicles or make autonomous decisions. We do not integrate live financial databases or production billing APIs in this sandbox pilot. Our intelligence is 100% supervisor-in-the-loop."

10. ROI DISCUSSIONS & PROSPECTIVE INVESTMENT PAYBACK:
"Based on our initial discovery of your 25-vehicle fleet, optimizing idle time and catching expired driver licenses before dispatch will save Nairobi Freight an estimated $6,717.00 per month, completely offsetting the standard software licensing in under 3 weeks."

11. 30-DAY PILOT CLOSE:
"We suggest beginning a controlled, risk-free 30-day pilot across 8 of your trucks. We will configure your Nairobi staging tenant, handle operator training in Week 1, and review a customer success scorecard in Week 4. There are no automated billing commitments. Shall we initiate the OneDrive roster sync tomorrow?"
                    `;
                    triggerCopy(fullText, 'Presenter Script');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy size={14} /> Copy Full Script
                </button>
              </div>

              {/* Readable script scroll blocks */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 space-y-4">
                {[
                  { section: "1. Introduction & Hook", text: "Thank you for taking the time to join us today. In regional logistics, the difference between a highly profitable quarter and deep operational loss comes down to minutes. We designed ZappOS not to add more coordinate graphs, but to give your dispatch team immediate, supervised diagnostic directions to secure your fleet operations." },
                  { section: "2. Customer Pain-Point Framing", text: "Traditional GPS trackers show dots on a map, but they do not tell your team what is actually happening. When a truck goes offline or takes an unexpected detour, your dispatchers end up on endless WhatsApp messages and phone check-calls, while delivery SLAs are breached. We solve that exact blind spot." },
                  { section: "3. ZappOS Positioning", text: "ZappOS is a dispatcher-supervised operational intelligence overlay. It integrates with your current staging rosters, processes lightweight cached packet telemetry during regional network dropouts, and outputs clear step-by-step playbooks so your team can act within 10 minutes." },
                  { section: "4. Dashboard & Live Operations Walkthrough", text: "Look at our active Pilot Command Deck. Here, instead of clutter, we show you 10 active vehicles with critical alerts categorized. You see who is on-duty, fuel capacity levels, and whether their telemetry connections are healthy. The interface replaces manual spreadsheets with one responsive screen." },
                  { section: "5. Dispatch Workflow Demonstration", text: "When an issue arises—like vehicle KCD 203B encountering a network blackout corridor—our system runs Zapp Lightstream. It caches coordinates locally in device memory and immediately flushes the back-log once connectivity recovers, ensuring 100% telemetry data integrity for audit logs." },
                  { section: "6. Incident Handling Workflow", text: "Look at case INC_DEMO_SOS_01. A driver triggers the safety switch. Traditional systems set off high-cost panic dispatches immediately. Zapp Brain, however, analyzes the telemetry first: checking if battery voltage is stable. It outputs a bypass advice suggesting an accidental press, and guides the dispatcher through a standard voice callback checklist." },
                  { section: "7. Field Deployment Workflow", text: "To make sure deployment is friction-free, your mechanics get a dedicated Installer Panel. Before a truck leaves your depot workshop, your mechanic verifies battery voltage lines, device power draw, and satellite signal locks to ensure 100% hardware readiness." },
                  { section: "8. Integration Hub (No Overpromise)", text: "You do not need to replace your current spreadsheet systems. Our staging folder bridge accepts standard CSV driver and vehicle rosters, validating column alignment with clean warnings before importing rows." },
                  { section: "9. Safety and Reasonable Limitations", text: "Let us be fully honest about system boundaries: ZappOS does not steer your vehicles or make autonomous decisions. We do not integrate live financial databases or production billing APIs in this sandbox pilot. Our intelligence is 100% supervisor-in-the-loop." },
                  { section: "10. ROI Discussions & Prospective Investment Payback", text: "Based on our initial discovery of your 25-vehicle fleet, optimizing idle time and catching expired driver licenses before dispatch will save Nairobi Freight an estimated $6,717.00 per month, completely offsetting the standard software licensing in under 3 weeks." },
                  { section: "11. 30-Day Pilot Close", text: "We suggest beginning a controlled, risk-free 30-day pilot across 8 of your trucks. We will configure your Nairobi staging tenant, handle operator training in Week 1, and review a customer success scorecard in Week 4. There are no automated billing commitments. Shall we initiate the OneDrive roster sync tomorrow?" }
                ].map((sec, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed">
                    <div className="font-extrabold text-indigo-900 border-b border-slate-200 pb-1.5 mb-2 font-mono flex justify-between items-center">
                      <span>{sec.section}</span>
                      <button
                        onClick={() => triggerCopy(sec.text, sec.section)}
                        className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={12} /> Copy Section
                      </button>
                    </div>
                    <p className="text-slate-800 font-medium font-sans">"{sec.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. CUSTOMER DISCOVERY QUESTIONNAIRE */}
          {activeSubTab === 'discovery' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" />
                  Prospect Customer Discovery Questionnaire
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Complete these questions with your first client to generate structured pilot setup recommendation outputs.
                </p>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  { field: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., Nairobi Freight Logistics Ltd' },
                  { field: 'fleetSize', label: 'Total Fleet Size (active vehicles)', type: 'number', placeholder: 'e.g., 25' },
                  { field: 'vehicleTypes', label: 'Primary Vehicle Models', type: 'text', placeholder: 'e.g., Scania Tippers, Volvo Cargo haulers' },
                  { field: 'routes', label: 'Key Operating Routes', type: 'text', placeholder: 'e.g., Nairobi-Mombasa corridor' },
                  { field: 'currentTracker', label: 'Current Vehicle Tracker', type: 'text', placeholder: 'e.g., Cartrack / None' },
                  { field: 'dispatchProcess', label: 'Current Dispatch Loop Workflow', type: 'text', placeholder: 'e.g., Manual WhatsApp check-calls' },
                  { field: 'delayCauses', label: 'Biggest Operational Delay Causes', type: 'text', placeholder: 'e.g., Custom checks, breakdowns' },
                  { field: 'bottlenecks', label: 'Key Terminal Bottlenecks', type: 'text', placeholder: 'e.g., Mombasa waiting terminal' },
                  { field: 'compliancePains', label: 'Key Compliance/Licensing Pains', type: 'text', placeholder: 'e.g., Expired PrDP licenses' },
                  { field: 'maintenancePains', label: 'Workshop/Maintenance Pains', type: 'text', placeholder: 'e.g., sudden cooling failures' },
                  { field: 'networkCoverage', label: 'Known Cellular Coverage Issues', type: 'text', placeholder: 'e.g., Maungu mountain pass blackout' },
                  { field: 'driverCommunication', label: 'Primary Driver Communication', type: 'text', placeholder: 'e.g., Telephone voice check calls' },
                  { field: 'reportingNeeds', label: 'Primary Reporting Requirements', type: 'text', placeholder: 'e.g., Weekly idle/delay logs' },
                  { field: 'delayCostEstimate', label: 'Est. Monthly Delay Costs ($)', type: 'number', placeholder: 'e.g., 5400' },
                  { field: 'decisionMaker', label: 'Pilot Decision-Maker (Sponsor)', type: 'text', placeholder: 'e.g., Director Francis Ndegwa' },
                  { field: 'successCriteriaText', label: 'Prospect Success Criteria', type: 'text', placeholder: 'e.g., Telemetry signal uptime > 90%' }
                ].map(inp => (
                  <div key={inp.field} className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 font-mono text-[10px] uppercase tracking-wider">{inp.label}</label>
                    <input
                      type={inp.type}
                      value={discoveryForm[inp.field as keyof typeof discoveryForm]}
                      onChange={e => handleDiscoveryChange(inp.field as any, e.target.value)}
                      placeholder={inp.placeholder}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800"
                    />
                  </div>
                ))}
              </div>

              {/* Dynamic computed recommendation output */}
              <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-indigo-950 uppercase font-mono flex items-center gap-1.5">
                    <Activity size={16} /> Dynamic Pilot Scope Scoping Summary
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                    discoveryOutput.riskLevel === 'high' ? 'bg-rose-100 text-rose-800' :
                    discoveryOutput.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    Scoping Risk: {discoveryOutput.riskLevel}
                  </span>
                </div>

                <div className="space-y-2 text-slate-800 font-medium">
                  <div>
                    <span className="font-bold text-indigo-900 block font-mono">1. Discovery summary:</span>
                    <p className="mt-0.5 text-slate-700">{discoveryOutput.summary}</p>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-900 block font-mono">2. Recommended pilot scope:</span>
                    <p className="mt-0.5 text-slate-700">{discoveryOutput.recommendedPilotScope}</p>
                  </div>
                  {discoveryOutput.missingInformation.length > 0 && (
                    <div>
                      <span className="font-bold text-rose-800 block font-mono">3. Missing key parameters checklist:</span>
                      <ul className="list-disc list-inside text-rose-800 space-y-0.5 mt-0.5 font-semibold">
                        {discoveryOutput.missingInformation.map((mi, idx) => (
                          <li key={idx}>{mi}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-indigo-900 block font-mono">4. Suggested immediate next step:</span>
                    <p className="mt-0.5 text-slate-700">{discoveryOutput.suggestedNextStep}</p>
                  </div>
                </div>

                {discoveryOutput.isWeakData && (
                  <div className="bg-amber-100 border border-amber-200 p-3 rounded-lg text-[10px] text-amber-800 font-semibold flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>Warning: Weak discovery parameters. Ensure Company Name, Fleet size, and Decision Maker are filled to calibrate the pilot scope.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. PILOT DATA REQUEST CHECKLIST */}
          {activeSubTab === 'data-checklist' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-indigo-600" />
                  Client Data Request Checklist (CSV Ingestion)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Share this specific checklists with Nairobi Freight to compile their onboarding spreadsheets.
                </p>
              </div>

              {/* Data Items Required */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  { title: "1. Vehicle Inventory List", items: ["License Plate number", "Vehicle Make & Model", "Payload Capacity (tons)", "Current Odometer (km)", "Active depot assignment"] },
                  { title: "2. Driver Roster List", items: ["Full Legal Name", "Professional Driver Permit (PrDP) Expiry", "Mobile cellular phone number", "Assigned vehicle plate", "Roster shift assignment"] },
                  { title: "3. Depot & Terminal Directory", items: ["Depot Name", "Latitude / Longitude coordinates", "Maximum parking capacity", "Designated regional hub category"] },
                  { title: "4. Customer Locations Directory", items: ["Client Company Name", "Delivery site address", "Precise GPS coordinates", "Priority flag status (critical/standard)"] },
                  { title: "5. Recent Historical Jobs Log", items: ["Job unique reference ID", "Assigned Driver ID", "Destination location", "Planned start vs actual arrival times", "Documented delay minutes"] },
                  { title: "6. Device / Tracker Details", items: ["Current physical tracker provider", "Device serial keys if available", "ECU interface cabling type", "Corridor mobile cellular carrier"] }
                ].map((req, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h3 className="font-extrabold text-slate-800 font-sans">{req.title}</h3>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside">
                      {req.items.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Ingestion Guidelines Banner */}
              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl space-y-3 text-xs text-indigo-950 font-medium">
                <h4 className="font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                  <Info size={14} /> Data Formatting, Privacy & Cleaning Guidelines
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-indigo-900 font-mono text-[10px]">Accepted Formats:</div>
                    <p className="text-slate-700">Standard spreadsheet templates formatted in <strong>.csv</strong>, <strong>.xlsx</strong>, or structured <strong>.json</strong> maps. Columns must match the specified staging templates.</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-indigo-900 font-mono text-[10px]">Strict Privacy Guardrail:</div>
                    <p className="text-slate-700">All pilot company credentials, driver cell numbers, and coordinates are isolated inside the sandbox database using Row Level Security (RLS).</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-indigo-900 font-mono text-[10px]">Data Ingestion Cleaning Notice:</div>
                    <p className="text-slate-700">Empty cells, special character strings, or malformed coordinate floats will be caught by our dynamic column validator and reported in the Staging hub.</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-rose-900 font-mono text-[10px]">“Raw Data Will Not Train AI directly” Notice:</div>
                    <p className="text-rose-950 font-semibold bg-rose-100/50 p-1.5 rounded-md border border-rose-200">
                      ZappOS strictly separates historical log imports from core AI model parameters. Your proprietary fleet dispatch telemetry is never used to train global AI weights or models autonomously.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. PILOT AGREEMENT DRAFT */}
          {activeSubTab === 'agreement' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                    <FileText size={20} className="text-indigo-600" />
                    30-Day Commercial Pilot Agreement Draft
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Copy-ready, editable non-legal trial terms establishing a controlled 30-day sandbox pilot.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const text = `
30-DAY COMMERCIAL PILOT WORKSHOP AGREEMENT (DRAFT)
==================================================

1. PARTIES:
This non-binding Pilot Exploration is established between ZappOS Fleet Intelligence Systems ("ZappOS") and ${discoveryForm.companyName || '[CUSTOMER_NAME]'} ("Partner").

2. PILOT PURPOSE & MANDATE:
The purpose of this 30-day pilot is to validate the operational utility, dispatcher reaction time improvements, and network dropout logging integrity of the ZappOS Fleet Command platform in a simulated, controlled sandbox workspace.

3. PILOT DURATION:
This pilot shall run for exactly thirty (30) consecutive calendar days from the agreed Start Date. There shall be no automatic renewal or immediate billing transition.

4. PILOT FLEET SCOPE:
The active scope shall center on exactly eight (8) designated vehicles from Partner's fleet, testing virtual telemetry, compliance checklists, and DTC warning monitors on high-value regional corridors.

5. FEATURES INCLUDED:
- Live Telemetry command deck simulations
- Lightstream network dropout caching protocols
- Zapp Brain heuristic advisory playbooks
- Professional Driver Permit (PrDP) compliance notifications
- Staging Hub CSV synchronization folders

6. SAFETY LIMITATIONS & HUMAN-IN-THE-LOOP MANDATE:
- NO AUTONOMOUS CONTROL: ZappOS does not perform unsupervised dispatch, vehicle steering, speed governing, driver suspension, or job cancellation. All final operational decisions remain under the manual, absolute authority of Partner's human dispatchers.
- SIMULATED TELEMETRY: Hardware voltages and connection signals in this pilot are simulated for testing purposes, representing virtual diagnostics.

7. PRIVACY & TENANT ISOLATION:
PostgreSQL Row Level Security (RLS) is active, strictly isolating Partner data from all other logistics users. Under no circumstances shall raw Partner rosters be used to train external AI models.

8. SUCCESS CRITERIA:
- Telemetry signal connection uptime exceeding 90.0%
- Average dispatcher response to flagged delay alerts under 10 minutes
- 100% of expired driving certifications flagged prior to route scheduling

9. ESTIMATED FEES (PLACEHOLDER):
The 30-day pilot is offered as a risk-free exploration. If Partner chooses to transition to production at Week 4, monthly licensing shall follow standard SaaS tiers (approx. $40/vehicle/month base), subject to a 15% setup discount.
                    `;
                    triggerCopy(text, 'Pilot Agreement Draft');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy size={14} /> Copy Agreement text
                </button>
              </div>

              {/* Editable Agreement Box */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Editable draft workspace</span>
                <textarea
                  className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  defaultValue={`30-DAY COMMERCIAL PILOT WORKSHOP AGREEMENT (DRAFT)
==================================================

1. PARTIES:
This non-binding Pilot Exploration is established between ZappOS Fleet Intelligence Systems ("ZappOS") and ${discoveryForm.companyName} ("Partner").

2. PILOT PURPOSE & MANDATE:
The purpose of this 30-day pilot is to validate the operational utility, dispatcher reaction time improvements, and network dropout logging integrity of the ZappOS Fleet Command platform in a simulated, controlled sandbox workspace.

3. PILOT DURATION:
The pilot shall commence on 2026-07-20 and terminate exactly 30 days thereafter. There shall be no automatic billing or contracts.

4. PILOT FLEET SCOPE:
The active scope shall center on exactly eight (8) designated vehicles from Partner's fleet of ${discoveryForm.fleetSize} assets.

5. SAFETY LIMITATIONS & DISCLAIMERS:
- NO AUTONOMOUS CONTROL: ZappOS does not autonomously steer vehicles, cancel active driver duties, or schedule jobs. All actions are human-supervised.
- SIMULATED HARDWARE: Real telemetry devices are represented as sandboxed simulations.

6. PRIVACY & TENANT SECURITY:
We guarantee absolute data isolation. RLS policies are fully active. Under no circumstances shall raw client rosters be used to train global AI models.`}
                />
              </div>
            </div>
          )}

          {/* 7. PILOT SUCCESS CRITERIA BUILDER */}
          {activeSubTab === 'success-criteria' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <Award className="text-indigo-600" />
                  Pilot Success Criteria Builder & Scorecard
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Define and approve measurable goals with the client. Ticking 'Approved' locks the parameter into the customer-facing scorecard.
                </p>
              </div>

              {/* Criteria Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Measurable Goal</th>
                      <th className="p-3">Measurement Method</th>
                      <th className="p-3">Baseline</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Owner</th>
                      <th className="p-3 text-center">Approved in UI</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {successCriteria.map(sc => (
                      <tr key={sc.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{sc.metric}</td>
                        <td className="p-3 text-slate-500">{sc.method}</td>
                        <td className="p-3 font-mono text-slate-600">{sc.baseline}</td>
                        <td className="p-3 font-mono font-bold text-indigo-600">{sc.target}</td>
                        <td className="p-3 text-slate-600">{sc.owner}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleSuccessCriteriaApproved(sc.id)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase cursor-pointer ${
                              sc.approved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {sc.approved ? 'Approved' : 'Pending'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteCriteria(sc.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Criteria Form */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <h3 className="font-bold text-slate-800 font-mono text-[10px] uppercase tracking-wider">Add Custom SLA Success Criteria</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newCriteriaMetric}
                    onChange={e => setNewCriteriaMetric(e.target.value)}
                    placeholder="Metric Name (e.g., Geofence exit alarm accuracy)"
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newCriteriaTarget}
                    onChange={e => setNewCriteriaTarget(e.target.value)}
                    placeholder="Target Goal (e.g., > 98.0%)"
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newCriteriaOwner}
                    onChange={e => setNewCriteriaOwner(e.target.value)}
                    placeholder="Owner (e.g., Workshop Manager)"
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddCriteria}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Add SLA Parameter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 8. CUSTOMER ROI ASSUMPTION REVIEW */}
          {activeSubTab === 'roi-assumptions' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" />
                  Prospect ROI Assumptions Review
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust default economic assumptions. Low-confidence metrics display warning alerts to ensure honest presentation.
                </p>
              </div>

              {/* Assumptions List */}
              <div className="space-y-4">
                {roiAssumptions.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1 max-w-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs font-sans">{item.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider ${
                          item.confidence === 'high' ? 'bg-emerald-100 text-emerald-800' :
                          item.confidence === 'medium' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.confidence} confidence ({item.source})
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="text"
                        value={item.value}
                        onChange={e => updateRoiAssumption(item.id, e.target.value)}
                        className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-right font-mono font-bold text-slate-800 focus:outline-none"
                      />
                      <span className="font-bold text-slate-500 font-mono text-[10px] w-16">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning box for Low Confidence items */}
              {roiAssumptions.some(item => item.confidence === 'low') && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-amber-800 flex items-center gap-1.5 font-mono">
                    <AlertTriangle size={16} />
                    ROI ESTIMATOR TRANSPARENCY WARNING
                  </h4>
                  <p className="text-amber-950 font-medium leading-relaxed">
                    Some variables are labeled <strong>"Demo Placeholder"</strong> with low confidence. These represent standard regional defaults. We highly recommend asking Nairobi Freight for their precise missed delivery SLA penalties to replace placeholders before Board presentations.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 9. PILOT KICKOFF CHECKLIST */}
          {activeSubTab === 'kickoff' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <ListTodo className="text-indigo-600" />
                  Pilot Technical & Operational Kickoff Checklist
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Step-by-step tasks to complete before initiating the 30-day trial phase.
                </p>
              </div>

              {/* Task Cards */}
              <div className="space-y-2.5">
                {kickoffItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleKickoffItem(item.id)}
                    className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 text-xs">
                      <div className={`p-1 rounded-full border ${
                        item.checked ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-300 text-slate-300'
                      }`}>
                        <Check size={14} className={item.checked ? 'opacity-100' : 'opacity-0'} />
                      </div>
                      <span className={`font-semibold ${item.checked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {item.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.critical && (
                        <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase font-mono tracking-wider">
                          Critical Launch Blocker
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Warning if any Critical Kickoff Task is Unchecked */}
              {kickoffItems.some(item => item.critical && !item.checked) && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 font-medium flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold uppercase font-mono">Launch Blocked by Critical Checklist Parameters</div>
                    <p className="mt-0.5">You have critical pre-pilot tasks pending completion. The 'Pilot Readiness Score' will remain low until these items are checked.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 10. SUPPORT SOP PACK */}
          {activeSubTab === 'support-sop' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <Wrench className="text-indigo-600" />
                  Dispatcher & Technical Support SOP Pack
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Operational Standard Operating Procedures (SOPs) to guide client technicians and dispatchers during the pilot.
                </p>
              </div>

              {/* SOP Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportSOPs.map((sop, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h3 className="font-extrabold text-slate-800 font-sans">{sop.title}</h3>
                      <div className="flex gap-1.5 font-mono text-[9px] font-bold">
                        <span className={`px-2 py-0.5 rounded-full uppercase ${
                          sop.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          sop.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {sop.severity}
                        </span>
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                          SLA: {sop.time}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-slate-700 leading-relaxed font-medium">
                      <div>
                        <span className="font-extrabold text-indigo-900 block font-mono text-[10px] uppercase">First Response Action:</span>
                        <p className="mt-0.5 text-slate-600">{sop.firstResponse}</p>
                      </div>
                      <div>
                        <span className="font-extrabold text-indigo-900 block font-mono text-[10px] uppercase">Logs / Telemetry to check:</span>
                        <p className="mt-0.5 text-slate-600 font-mono text-[11px] bg-slate-100 p-1 rounded border border-slate-200">{sop.logs}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="font-extrabold text-indigo-900 block font-mono text-[10px] uppercase">Workaround:</span>
                          <p className="mt-0.5 text-slate-600">{sop.workaround}</p>
                        </div>
                        <div>
                          <span className="font-extrabold text-rose-800 block font-mono text-[10px] uppercase">Escalation Path:</span>
                          <p className="mt-0.5 text-rose-900 font-semibold">{sop.escalation}</p>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-dashed border-slate-200">
                        <span className="font-extrabold text-emerald-800 block font-mono text-[10px] uppercase">Ticket Closure Requirement:</span>
                        <p className="mt-0.5 text-emerald-900 font-semibold">{sop.closure}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. CUSTOMER REPORT TEMPLATES */}
          {activeSubTab === 'report-templates' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <BookOpen className="text-indigo-600" />
                  Pilot Customer-Facing Report Templates Pack
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Generate copy-ready executive summaries or JSON telemetry logs for weekly client check-ins.
                </p>
              </div>

              {/* Template Selectors */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
                {[
                  { id: 'daily', label: 'Daily summary' },
                  { id: 'weekly', label: 'Weekly Executive' },
                  { id: 'incident', label: 'Incident Audit' },
                  { id: 'telemetry', label: 'Telemetry Health' },
                  { id: 'compliance', label: 'Compliance Audit' },
                  { id: 'maintenance', label: 'Maintenance DTC' },
                  { id: 'roi', label: 'Board ROI Review' },
                  { id: 'scale', label: 'Scale-Readiness' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedReportType(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      selectedReportType === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Template Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {reportTemplatesData[selectedReportType].title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {reportTemplatesData[selectedReportType].description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerCopy(reportTemplatesData[selectedReportType].text, 'Report Template')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={12} /> Copy Template Text
                    </button>
                    <button
                      onClick={() => triggerCopy(reportTemplatesData[selectedReportType].json, 'Report JSON export')}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border border-indigo-200"
                    >
                      <Download size={12} /> Export JSON Data
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                  <div className="lg:col-span-8 bg-white border border-slate-200 p-4 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 pb-1.5 mb-2.5">
                      Copy-Ready Text Template (Future PDF Placeholder)
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-xs">
                      {reportTemplatesData[selectedReportType].text}
                    </pre>
                  </div>

                  <div className="lg:col-span-4 bg-slate-900 border border-slate-950 p-4 rounded-lg font-mono text-[11px] text-indigo-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1.5 mb-2.5">
                      JSON Export String
                    </div>
                    <pre className="whitespace-pre-wrap">{reportTemplatesData[selectedReportType].json}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 12. CUSTOMER OBJECTION DRILL SUITE */}
          {activeSubTab === 'objections' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <HelpCircle className="text-indigo-600 animate-bounce" />
                  Customer Objection Handling Drill Suite
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Click on an objection card below to reveal the honest verbal answer, what specific feature to present in the app, and follow-up discovery questions.
                </p>
              </div>

              {/* Objections List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objectionsDrill.map(item => {
                  const isRevealed = !!revealedObjections[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => setRevealedObjections(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className={`p-4 border rounded-xl text-xs space-y-3 cursor-pointer transition-all ${
                        isRevealed ? 'bg-indigo-50/50 border-indigo-300 shadow-inner' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-indigo-900 font-mono text-[10px]">Objection {item.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                          {isRevealed ? 'Click to collapse' : 'Click to drill'}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-800">"{item.objection}"</h3>

                      {isRevealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2.5 pt-2 border-t border-slate-200 text-slate-700 leading-relaxed font-medium"
                        >
                          <div>
                            <span className="font-extrabold text-indigo-900 block font-mono text-[10px] uppercase">Honest Verbal Answer:</span>
                            <p className="mt-0.5 text-slate-600 font-semibold italic">"{item.honestAnswer}"</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="font-extrabold text-indigo-900 block font-mono text-[10px] uppercase">What to show in the app:</span>
                              <p className="mt-0.5 text-slate-600 font-sans text-[11px] font-semibold text-indigo-950 bg-indigo-100/45 p-1 rounded">{item.whatToShow}</p>
                            </div>
                            <div>
                              <span className="font-extrabold text-rose-800 block font-mono text-[10px] uppercase">What NOT to overpromise:</span>
                              <p className="mt-0.5 text-rose-950 font-sans text-[11px] font-semibold bg-rose-100/50 p-1 rounded">{item.whatNotToOverpromise}</p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-dashed border-slate-200">
                            <span className="font-extrabold text-emerald-800 block font-mono text-[10px] uppercase">Follow-up Discovery Question to ask:</span>
                            <p className="mt-0.5 text-emerald-900 font-semibold">"{item.followUp}"</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 13. PRE-DEMO SAFETY AUDIT */}
          {activeSubTab === 'safety-review' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <Shield className="text-indigo-600" />
                  Pre-Demo Safety & Compliance Review
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Mandatory pre-flight checklist. Verify all items before presenting to clients to avoid data leakages or unpermitted autonomous claims.
                </p>
              </div>

              {/* Safety Checklist Items */}
              <div className="space-y-2">
                {safetyItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleSafetyItem(item.id)}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 text-xs">
                      <div className={`p-1 rounded-full border ${
                        item.checked ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-300 text-slate-300'
                      }`}>
                        <Check size={14} className={item.checked ? 'opacity-100' : 'opacity-0'} />
                      </div>
                      <span className={`font-semibold ${item.checked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {item.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-800 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Audit criteria
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* No Autonomous AI disclaimer block */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-950 text-xs space-y-3">
                <h4 className="font-bold uppercase tracking-wider font-mono text-indigo-300 flex items-center gap-1">
                  <ShieldCheck size={16} /> Strict "Supervised-Only AI" Disclosure Policy
                </h4>
                <p className="text-slate-300 leading-relaxed font-medium">
                  Zapp Brain operates strictly as a <strong>dispatcher-supervised operational intelligence overlay</strong>.
                  All presenting materials, script texts, and on-screen cards must explicitly frame Zapp Brain's insights as diagnostic checklists that require manual dispatcher review and confirmation logs.
                </p>
                <div className="bg-indigo-950 p-3 rounded-lg border border-indigo-900/50 text-[11px] text-indigo-200">
                  <strong>PROHIBITED CLAIMS AUDIT:</strong> Do not assert that ZappOS is fully autonomous, performs automatic driving, issues automated driver suspensions, or operates commercial vehicle brakes/steering independently.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
