import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  UserProfile, 
  Resident, 
  Household, 
  DocumentRequest, 
  ServiceItem, 
  QueueTicket, 
  IncidentReport, 
  Appointment, 
  Announcement, 
  AuditLog, 
  KnowledgeBaseItem, 
  PriorityCriteriaConfig,
  DuplicateRecordFlag,
  RequestStatus,
  IncidentStatus,
  Official,
  PrintRequest,
  PrintStatus,
  CourtReservation,
  CourtReservationStatus,
  CourtSlot,
  CourtClosure,
  Personnel,
  AccessArea
} from '../types';
import { 
  INITIAL_SERVICES, 
  INITIAL_RESIDENTS, 
  INITIAL_HOUSEHOLDS, 
  INITIAL_DUPLICATE_FLAGS, 
  INITIAL_DOCUMENT_REQUESTS, 
  INITIAL_QUEUE, 
  INITIAL_INCIDENTS, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_PRIORITY_CRITERIA, 
  INITIAL_KNOWLEDGE_BASE, 
  INITIAL_AUDIT_LOGS,
  INITIAL_OFFICIALS,
  INITIAL_PRINT_REQUESTS,
  INITIAL_PERSONNEL,
  COURT_SLOTS,
  INITIAL_COURT_RESERVATIONS,
  INITIAL_COURT_CLOSURES
} from '../data/mockData';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface BarangayContextType {
  // Authentication / Role
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile;
  switchUserRole: (role: UserRole) => void;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Accessibility
  largeTextMode: boolean;
  setLargeTextMode: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Data
  services: ServiceItem[];
  residents: Resident[];
  households: Household[];
  duplicateFlags: DuplicateRecordFlag[];
  officials: Official[];
  documentRequests: DocumentRequest[];
  queueTickets: QueueTicket[];
  incidents: IncidentReport[];
  appointments: Appointment[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  knowledgeBase: KnowledgeBaseItem[];
  priorityCriteria: PriorityCriteriaConfig[];

  // Interactive Operations
  createDocumentRequest: (data: Partial<DocumentRequest>) => DocumentRequest;
  updateDocumentRequestStatus: (id: string, status: RequestStatus, staffNotes?: string, rejectionReason?: string) => void;
  assignDocumentRequest: (id: string, staffName: string) => void;
  /** Names of active staff, for "Assigned to" lists. */
  barangayStaff: string[];
  /** Active staff who have access to one area (e.g. only staff who handle documents). */
  staffFor: (area: AccessArea) => string[];
  personnel: Personnel[];
  addPersonnel: (data: Omit<Personnel, 'id' | 'addedOn' | 'lastActive'>) => Personnel;
  updatePersonnel: (id: string, updates: Partial<Personnel>) => void;
  
  createQueueTicket: (data: Partial<QueueTicket>) => QueueTicket;
  callQueueTicket: (ticketId: string, counterNumber?: number) => void;
  callNextQueueTicket: (counterNumber: number) => void;
  completeQueueTicket: (ticketId: string) => void;
  dismissQueueTicket: (ticketId: string) => void;
  
  createIncidentReport: (data: Partial<IncidentReport>) => IncidentReport;
  updateIncidentReportStatus: (id: string, status: IncidentStatus, note: string, assignedTo?: string) => void;
  setIncidentInternalNote: (id: string, note: string) => void;
  
  registerResident: (data: Omit<Resident, 'id' | 'residentNumber' | 'registeredDate'>) => Resident;
  updateResident: (id: string, updates: Partial<Resident>) => void;
  addService: (data: Omit<ServiceItem, 'id'>) => ServiceItem;
  updateService: (id: string, updates: Partial<ServiceItem>) => void;
  recordResidentAccess: (id: string) => void;
  resolveDuplicateFlag: (flagId: string, resolution: 'merge' | 'keep_separate' | 'false_positive', notes: string) => void;
  
  updatePriorityConfig: (id: string, updates: Partial<PriorityCriteriaConfig>) => void;
  addKnowledgeItem: (item: Omit<KnowledgeBaseItem, 'id' | 'lastUpdated'>) => void;
  updateKnowledgeItem: (id: string, updates: Partial<KnowledgeBaseItem>) => void;
  removeKnowledgeItem: (id: string) => void;
  
  bookAppointment: (data: Omit<Appointment, 'id' | 'referenceNumber'>) => Appointment;

  // Printing
  printRequests: PrintRequest[];
  createPrintRequest: (data: Omit<PrintRequest, 'id' | 'referenceNumber' | 'status' | 'submittedAt'>) => PrintRequest;
  updatePrintRequestStatus: (id: string, status: PrintStatus, notes?: string) => void;

  // Court reservation
  courtSlots: CourtSlot[];
  courtReservations: CourtReservation[];
  courtClosures: CourtClosure[];
  createCourtReservation: (data: Pick<CourtReservation, 'date' | 'slotId' | 'activity'>) => CourtReservation;
  updateCourtReservationStatus: (id: string, status: CourtReservationStatus, notes?: string) => void;
  closeCourtDate: (date: string, reason: string) => void;
  reopenCourtDate: (date: string) => void;

  // Resident account
  readNotificationIds: string[];
  markNotificationsRead: (ids: string[]) => void;
  smsUpdates: boolean;
  setSmsUpdates: (val: boolean) => void;
  updateResidentContact: (residentId: string, contact: { contactNumber: string; email?: string }) => void;
  createAnnouncement: (data: Partial<Announcement>) => void;

  updateOfficial: (id: string, updates: Partial<Official>) => void;
  addOfficial: (data: Omit<Official, 'id'>) => Official;

  // Certificate viewer (opened from resident and admin screens)
  selectedDocumentForPrint: DocumentRequest | null;
  setSelectedDocumentForPrint: (doc: DocumentRequest | null) => void;

  // Toast Alerts
  toasts: ToastMessage[];
  addToast: (title: string, description: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const BarangayContext = createContext<BarangayContextType | undefined>(undefined);

const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  citizen: {
    id: 'user-maria',
    name: 'Maria Corazon Santos',
    role: 'citizen',
    roleTitle: 'Resident / Citizen (Purok 2)',
    email: 'maria.santos@email.ph',
    residentId: 'res-001',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  staff: {
    id: 'user-elena',
    name: 'Elena Ramos',
    role: 'staff',
    roleTitle: 'Barangay Desk Officer & Records Custodian',
    email: 'elena.records@brgy4a.gov.ph',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  official: {
    id: 'user-roberto',
    name: 'Hon. Roberto V. Gomez',
    role: 'official',
    roleTitle: 'Punong Barangay / Chief Administrator',
    email: 'captain.gomez@brgy4a.gov.ph',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  guest: {
    id: 'user-guest',
    name: 'Public Guest',
    role: 'guest',
    roleTitle: 'Unregistered Guest / Non-Resident',
    email: 'guest@public.web'
  },
  // Demo administrator (no real login yet). Opens the redesigned Admin shell.
  admin: {
    id: 'user-admin',
    name: 'Administrator',
    role: 'admin',
    roleTitle: 'System Administrator',
    email: 'admin@ekapitan.local'
  }
};

export const BarangayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');
  const [currentUser, setCurrentUser] = useState<UserProfile>(ROLE_PROFILES.citizen);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [largeTextMode, setLargeTextMode] = useState<boolean>(false);

  // Data states
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [residents, setResidents] = useState<Resident[]>(INITIAL_RESIDENTS);
  const [households] = useState<Household[]>(INITIAL_HOUSEHOLDS);
  const [duplicateFlags, setDuplicateFlags] = useState<DuplicateRecordFlag[]>(INITIAL_DUPLICATE_FLAGS);
  const [officials, setOfficials] = useState<Official[]>(INITIAL_OFFICIALS);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>(INITIAL_DOCUMENT_REQUESTS);
  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>(INITIAL_QUEUE);
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'apt-001',
      residentName: 'Eduardo Villanueva Reyes Sr.',
      residentId: 'res-003',
      contactNumber: '0918-222-4411',
      serviceTitle: 'Certificate of Residency',
      date: '2026-09-10',
      timeSlot: '09:00 AM - 10:00 AM',
      status: 'confirmed',
      referenceNumber: 'APT-2026-0044'
    }
  ]);
  const [printRequests, setPrintRequests] = useState<PrintRequest[]>(INITIAL_PRINT_REQUESTS);
  const [courtSlots] = useState<CourtSlot[]>(COURT_SLOTS);
  const [courtReservations, setCourtReservations] = useState<CourtReservation[]>(INITIAL_COURT_RESERVATIONS);
  const [courtClosures, setCourtClosures] = useState<CourtClosure[]>(INITIAL_COURT_CLOSURES);
  const [personnel, setPersonnel] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [smsUpdates, setSmsUpdates] = useState<boolean>(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem[]>(INITIAL_KNOWLEDGE_BASE);
  const [priorityCriteria, setPriorityCriteria] = useState<PriorityCriteriaConfig[]>(INITIAL_PRIORITY_CRITERIA);

  // Certificate viewer
  const [selectedDocumentForPrint, setSelectedDocumentForPrint] = useState<DocumentRequest | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAudit = (action: string, category: 'Records' | 'Documents' | 'Queue' | 'Security' | 'Configuration', details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('en-US', { hour12: false }),
      userName: currentUser.name,
      userRole: currentUser.roleTitle,
      action,
      category,
      details,
      ipAddress: '192.168.1.45 (Local Node)'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchUserRole = (role: UserRole) => {
    setCurrentRole(role);
    setCurrentUser(ROLE_PROFILES[role]);
    // Set natural starting tab
    if (role === 'citizen') {
      setActiveTab('home');
    } else if (role === 'guest') {
      // Guests browse the public website; nobody "signs in", so no welcome toast.
      setActiveTab('guest_home');
      return;
    } else if (role === 'staff') {
      setActiveTab('dashboard');
    } else if (role === 'admin') {
      setActiveTab('admin_overview');
    } else {
      setActiveTab('executive_dashboard');
    }
    addToast(
      `Welcome, ${ROLE_PROFILES[role].name.split(' ')[0]}`,
      `Signed in as ${ROLE_PROFILES[role].roleTitle}.`,
      'info'
    );
  };

  const createDocumentRequest = (data: Partial<DocumentRequest>): DocumentRequest => {
    const refNum = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const verCode = `VER-B4A-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(10 + Math.random() * 90)}`;
    
    const newReq: DocumentRequest = {
      id: 'req-' + Date.now(),
      referenceNumber: refNum,
      documentType: data.documentType || 'barangay_clearance',
      documentTitle: data.documentTitle || 'Barangay Clearance',
      residentId: data.residentId || currentUser.residentId || 'res-001',
      residentName: data.residentName || currentUser.name,
      purok: data.purok || 'Purok 2 - Riverside',
      contactNumber: data.contactNumber || '0917-555-0123',
      purpose: data.purpose || 'General Requirement',
      status: 'submitted',
      submittedAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      fee: data.fee !== undefined ? data.fee : 50,
      isFreeDueToExemption: !!data.isFreeDueToExemption,
      exemptionReason: data.exemptionReason,
      processingMethod: data.processingMethod || 'pickup',
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      verificationCode: verCode,
      requirementsSubmitted: data.requirementsSubmitted || [
        { name: 'Valid Government ID', submitted: true, verified: false },
        { name: 'Proof of Residency or Billing', submitted: true, verified: false }
      ]
    };

    setDocumentRequests((prev) => [newReq, ...prev]);

    // Also auto-generate a queue ticket if express counter or scheduled for today
    if (data.processingMethod === 'express_counter') {
      createQueueTicket({
        residentName: newReq.residentName,
        residentId: newReq.residentId,
        serviceTitle: newReq.documentTitle,
        documentType: newReq.documentType,
        isSenior: false,
        isPWD: false,
        isPregnant: false,
        isEmergency: false,
        hasAppointment: true
      });
    }

    logAudit('Submitted Document Request', 'Documents', `Reference ${refNum} for ${newReq.residentName} (${newReq.documentTitle})`);
    addToast('Request submitted', `Reference ${refNum}. You can follow it in My Requests.`, 'success');
    return newReq;
  };

  const updateDocumentRequestStatus = (id: string, status: RequestStatus, staffNotes?: string, rejectionReason?: string) => {
    setDocumentRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          const updated: DocumentRequest = {
            ...req,
            status,
            updatedAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            staffNotes: staffNotes !== undefined ? staffNotes : req.staffNotes,
            rejectionReason: rejectionReason !== undefined ? rejectionReason : req.rejectionReason,
            assignedStaffName: req.assignedStaffName ?? currentUser.name,
            completedAt: status === 'completed' ? new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : req.completedAt
          };
          return updated;
        }
        return req;
      })
    );

    const statusLabels: Record<RequestStatus, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      ready_for_release: 'Ready for Release',
      completed: 'Completed',
      rejected: 'Rejected',
      returned: 'Returned for correction'
    };

    const ref = documentRequests.find((r) => r.id === id)?.referenceNumber ?? id;
    logAudit(`Updated Document Status to ${statusLabels[status]}`, 'Documents', `Request ${ref}. Staff: ${currentUser.name}`);
    addToast(`${ref}: ${statusLabels[status].toLowerCase()}`, 'The resident will see the update in My Requests.', 'success');
  };

  const assignDocumentRequest = (id: string, staffName: string) => {
    setDocumentRequests((prev) => prev.map((r) => (r.id === id ? { ...r, assignedStaffName: staffName } : r)));
    const ref = documentRequests.find((r) => r.id === id)?.referenceNumber ?? id;
    logAudit('Assigned Document Request', 'Documents', `Request ${ref} assigned to ${staffName} by ${currentUser.name}`);
  };

  const calculatePriority = (params: {
    isSenior?: boolean;
    isPWD?: boolean;
    isPregnant?: boolean;
    isEmergency?: boolean;
    hasAppointment?: boolean;
  }) => {
    let score = 20; // baseline wait score
    const factors: { factor: string; points: number; description: string }[] = [
      { factor: 'Base Citizen Queue', points: 20, description: 'General citizen arrival order' }
    ];

    if (params.isEmergency) {
      score += 50;
      factors.push({ factor: 'Emergency Medical / Urgent', points: 50, description: 'Urgent hospital or crisis endorsement' });
    }
    if (params.isSenior) {
      score += 30;
      factors.push({ factor: 'Senior Citizen Priority (RA 9994)', points: 30, description: 'Senior citizen lane entitlement' });
    }
    if (params.isPWD) {
      score += 30;
      factors.push({ factor: 'PWD Priority (RA 7277)', points: 30, description: 'Magna Carta for Persons with Disability' });
    }
    if (params.isPregnant) {
      score += 25;
      factors.push({ factor: 'Expectant Mother Priority', points: 25, description: 'Maternal health convenience lane' });
    }
    if (params.hasAppointment) {
      score += 15;
      factors.push({ factor: 'Online Scheduled Appointment', points: 15, description: 'Pre-booked time window via eKapitan portal' });
    }

    return { score, factors };
  };

  const createQueueTicket = (data: Partial<QueueTicket>): QueueTicket => {
    const nextNum = 'Q-' + (100 + queueTickets.length + 1);
    const { score, factors } = calculatePriority({
      isSenior: data.isSenior,
      isPWD: data.isPWD,
      isPregnant: data.isPregnant,
      isEmergency: data.isEmergency,
      hasAppointment: data.hasAppointment
    });

    const newTicket: QueueTicket = {
      id: 'q-' + Date.now(),
      ticketNumber: nextNum,
      residentName: data.residentName || 'Citizen Visitor',
      residentId: data.residentId,
      serviceTitle: data.serviceTitle || 'General Barangay Inquiry',
      documentType: data.documentType,
      priorityScore: score,
      priorityFactors: factors,
      isSenior: !!data.isSenior,
      isPWD: !!data.isPWD,
      isPregnant: !!data.isPregnant,
      isEmergency: !!data.isEmergency,
      hasAppointment: !!data.hasAppointment,
      status: 'waiting',
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedWaitMinutes: Math.max(3, Math.round((100 - score) / 5))
    };

    setQueueTickets((prev) => [...prev, newTicket]);
    logAudit('Generated Queue Ticket', 'Queue', `Ticket ${nextNum} for ${newTicket.residentName} (Priority: ${score})`);
    addToast(`Queue Ticket Issued: ${nextNum}`, `Estimated wait: ~${newTicket.estimatedWaitMinutes} minutes.`, 'info');
    return newTicket;
  };

  const callQueueTicket = (ticketId: string, counterNumber: number = 1) => {
    setQueueTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'in_service',
            calledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            counterNumber
          };
        }
        return t;
      })
    );
    const ticket = queueTickets.find((t) => t.id === ticketId);
    logAudit('Called Queue Ticket', 'Queue', `Ticket ${ticket?.ticketNumber} to Counter ${counterNumber}`);
    addToast(`Calling ${ticket?.ticketNumber}`, `Resident: ${ticket?.residentName} to Counter ${counterNumber}`, 'info');
  };

  const completeQueueTicket = (ticketId: string) => {
    setQueueTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'completed',
            completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return t;
      })
    );
    const ticket = queueTickets.find((t) => t.id === ticketId);
    logAudit('Completed Queue Service', 'Queue', `Ticket ${ticket?.ticketNumber} served successfully.`);
    addToast('Service Completed', `Ticket ${ticket?.ticketNumber} marked as served.`, 'success');
  };

  const dismissQueueTicket = (ticketId: string) => {
    setQueueTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'no_show' } : t))
    );
    addToast('Ticket Marked as No Show', 'Ticket skipped and archived.', 'warning');
  };

  const createIncidentReport = (data: Partial<IncidentReport>): IncidentReport => {
    const refNum = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInc: IncidentReport = {
      id: 'inc-' + Date.now(),
      referenceNumber: refNum,
      category: data.category || 'Other Community Concern',
      title: data.title || 'Barangay Concern Report',
      description: data.description || '',
      location: data.location || 'Barangay 4A',
      purok: data.purok || 'Purok 1 - Centro',
      incidentDateTime: data.incidentDateTime || new Date().toISOString().substring(0, 16).replace('T', ' '),
      reporterName: data.isAnonymous ? 'Anonymous Resident' : (data.reporterName || currentUser.name),
      reporterContact: data.isAnonymous ? '' : (data.reporterContact || currentUser.email),
      isAnonymous: !!data.isAnonymous,
      status: 'received',
      statusHistory: [
        {
          status: 'received',
          updatedAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          updatedBy: currentUser.name,
          note: 'Report submitted via eKapitan Citizen Portal and queued for staff review.'
        }
      ],
      submittedAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    setIncidents((prev) => [newInc, ...prev]);
    logAudit('Submitted Community Incident Report', 'Records', `Incident Ref ${refNum}: ${newInc.title}`);
    addToast('Report submitted', `Tracking number ${refNum}. Barangay staff will review it.`, 'success');
    return newInc;
  };

  const updateIncidentReportStatus = (id: string, status: IncidentStatus, note: string, assignedTo?: string) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const updatedHistory = [
            ...inc.statusHistory,
            {
              status,
              updatedAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              updatedBy: currentUser.name,
              note
            }
          ];
          return {
            ...inc,
            status,
            statusHistory: updatedHistory,
            assignedTo: assignedTo || inc.assignedTo,
            resolutionSummary: status === 'resolved' ? note : inc.resolutionSummary
          };
        }
        return inc;
      })
    );
    const ref = incidents.find((i) => i.id === id)?.referenceNumber ?? id;
    logAudit(`Updated Incident Status to ${status}`, 'Records', `Incident ${ref}. Staff: ${currentUser.name}`);
    addToast(`${ref} updated`, 'The resident will see the update in their report progress.', 'success');
  };

  /** Staff-only note on a report. Never shown to residents. */
  const setIncidentInternalNote = (id: string, note: string) => {
    setIncidents((prev) => prev.map((inc) => (inc.id === id ? { ...inc, internalNotes: note } : inc)));
    const ref = incidents.find((i) => i.id === id)?.referenceNumber ?? id;
    logAudit('Updated Internal Note', 'Records', `Incident ${ref}. Staff: ${currentUser.name}`);
  };

  const registerResident = (data: Omit<Resident, 'id' | 'residentNumber' | 'registeredDate'>): Resident => {
    const resNum = `B4A-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newResident: Resident = {
      ...data,
      id: 'res-' + Date.now(),
      residentNumber: resNum,
      registeredDate: new Date().toISOString().split('T')[0]
    };

    // Automated duplicate check simulation
    const match = residents.find((r) => 
      (r.lastName.toLowerCase() === data.lastName.toLowerCase() && r.birthDate === data.birthDate) ||
      (r.contactNumber && r.contactNumber === data.contactNumber)
    );

    if (match) {
      // List only the fields that really match, and score from them (advisory only).
      const fields: string[] = [];
      if (match.lastName.toLowerCase() === data.lastName.toLowerCase()) fields.push(`Same last name: ${data.lastName}`);
      if (match.firstName.toLowerCase().split(' ')[0] === data.firstName.toLowerCase().split(' ')[0]) fields.push(`Same first name: ${data.firstName.split(' ')[0]}`);
      if (match.birthDate === data.birthDate) fields.push(`Same birthdate: ${data.birthDate}`);
      if (data.contactNumber && match.contactNumber === data.contactNumber) fields.push(`Same mobile number: ${data.contactNumber}`);
      if (match.purok === data.purok) fields.push(`Same purok: ${data.purok}`);
      const newFlag: DuplicateRecordFlag = {
        id: 'dup-' + Date.now(),
        sourceResidentId: newResident.id,
        matchedResidentId: match.id,
        matchScore: Math.min(95, 40 + fields.length * 15),
        matchingFields: fields,
        status: 'pending_review',
        detectedDate: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        resolutionNotes: 'Profile matching algorithm detected potential duplicate record upon registration.'
      };
      setDuplicateFlags((prev) => [newFlag, ...prev]);
      addToast(
        'Possible duplicate record',
        `A similar record exists for ${match.firstName} ${match.lastName}. It was flagged for staff review; nothing was merged.`,
        'warning'
      );
    }

    setResidents((prev) => [newResident, ...prev]);
    logAudit('Registered New Resident', 'Records', `Resident ${resNum}: ${newResident.firstName} ${newResident.lastName}`);
    addToast('Resident added', `Resident number ${resNum}.`, 'success');
    return newResident;
  };

  const addService = (data: Omit<ServiceItem, 'id'>): ServiceItem => {
    const item: ServiceItem = { ...data, id: 'svc-' + Date.now() };
    setServices((prev) => [...prev, item]);
    logAudit('Added Service', 'Configuration', `${item.title} (fee ${item.fee}). By ${currentUser.name}`);
    addToast('Service added', `${item.title} ${item.availableOnline ? 'can now be requested online' : 'is saved but hidden from residents'}.`, 'success');
    return item;
  };

  const updateService = (id: string, updates: Partial<ServiceItem>) => {
    const before = services.find((s) => s.id === id);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    logAudit('Updated Service', 'Configuration', `${before?.title ?? id}: ${Object.keys(updates).join(', ')} changed. By ${currentUser.name}`);
    addToast('Service saved', `${before?.title ?? 'The service'} was updated.`, 'success');
  };

  /** Staff edit of a resident record (audit-logged). */
  const updateResident = (id: string, updates: Partial<Resident>) => {
    const r = residents.find((x) => x.id === id);
    setResidents((prev) => prev.map((x) => (x.id === id ? { ...x, ...updates } : x)));
    logAudit('Updated Resident Record', 'Records', `${r?.residentNumber ?? id} (${Object.keys(updates).join(', ')}). Staff: ${currentUser.name}`);
    addToast('Resident record saved', `${r ? `${r.firstName} ${r.lastName}` : 'The record'} was updated.`, 'success');
  };

  /** Data Privacy Act: every time staff open a resident record, it is written to the audit log. */
  const recordResidentAccess = (id: string) => {
    const r = residents.find((x) => x.id === id);
    logAudit('Viewed Resident Record', 'Security', `${r?.residentNumber ?? id} opened by ${currentUser.name}`);
  };

  const resolveDuplicateFlag = (flagId: string, resolution: 'merge' | 'keep_separate' | 'false_positive', notes: string) => {
    setDuplicateFlags((prev) =>
      prev.map((f) => {
        if (f.id === flagId) {
          const statusMap = {
            merge: 'resolved_merged' as const,
            keep_separate: 'resolved_kept_separate' as const,
            false_positive: 'false_positive' as const
          };
          return {
            ...f,
            status: statusMap[resolution],
            reviewedBy: currentUser.name,
            resolutionNotes: notes
          };
        }
        return f;
      })
    );
    logAudit(`Resolved Duplicate Advisory (${resolution})`, 'Records', `Flag ID ${flagId}. Reviewer: ${currentUser.name}. Notes: ${notes}`);
    addToast('Duplicate Advisory Resolved', `Action recorded: ${resolution.replace('_', ' ')}`, 'success');
  };

  const updatePriorityConfig = (id: string, updates: Partial<PriorityCriteriaConfig>) => {
    setPriorityCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    logAudit('Updated Priority Criteria', 'Configuration', `Modified criterion ${id}: ${JSON.stringify(updates)}`);
    addToast('Priority Weight Updated', 'Queue calculation formula updated.', 'info');
  };

  const addKnowledgeItem = (item: Omit<KnowledgeBaseItem, 'id' | 'lastUpdated'>) => {
    const newItem: KnowledgeBaseItem = {
      ...item,
      id: 'kb-' + Date.now(),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setKnowledgeBase((prev) => [newItem, ...prev]);
    logAudit('Added AI Knowledge Item', 'Configuration', `New FAQ added: "${item.question}"`);
    addToast('Knowledge Base Updated', 'AI Citizen Assistant will now incorporate this entry.', 'success');
  };

  const updateKnowledgeItem = (id: string, updates: Partial<KnowledgeBaseItem>) => {
    setKnowledgeBase((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : item))
    );
    logAudit('Updated AI Knowledge Item', 'Configuration', `Edited FAQ item ${id}`);
    addToast('Knowledge Base Entry Updated', 'Changes saved successfully.', 'success');
  };

  const removeKnowledgeItem = (id: string) => {
    const item = knowledgeBase.find((k) => k.id === id);
    setKnowledgeBase((prev) => prev.filter((k) => k.id !== id));
    logAudit('Removed AI Knowledge Item', 'Configuration', `"${item?.question ?? id}" removed by ${currentUser.name}`);
    addToast('Answer removed', 'Ka-Barangay AI will no longer use it.', 'success');
  };

  const bookAppointment = (data: Omit<Appointment, 'id' | 'referenceNumber'>): Appointment => {
    const refNum = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApt: Appointment = {
      ...data,
      id: 'apt-' + Date.now(),
      referenceNumber: refNum
    };
    setAppointments((prev) => [newApt, ...prev]);
    logAudit('Scheduled Citizen Appointment', 'Queue', `Appointment ${refNum} on ${data.date} (${data.timeSlot})`);
    addToast('Appointment booked', `${data.date}, ${data.timeSlot}. Reference ${refNum}.`, 'success');
    return newApt;
  };

  const createPrintRequest = (
    data: Omit<PrintRequest, 'id' | 'referenceNumber' | 'status' | 'submittedAt'>
  ): PrintRequest => {
    const refNum = `PRT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq: PrintRequest = {
      ...data,
      id: 'prt-' + Date.now(),
      referenceNumber: refNum,
      status: 'pending',
      submittedAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    setPrintRequests((prev) => [newReq, ...prev]);
    logAudit('Submitted Print Request', 'Documents', `Reference ${refNum} for ${newReq.residentName} (${newReq.pages} pages x ${newReq.copies})`);
    addToast('Print request submitted', `Reference ${refNum}. We will tell you when it is ready.`, 'success');
    return newReq;
  };

  const updatePrintRequestStatus = (id: string, status: PrintStatus, notes?: string) => {
    setPrintRequests((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, notes: notes ?? p.notes, rejectionReason: status === 'rejected' ? notes : p.rejectionReason } : p))
    );
    const ref = printRequests.find((p) => p.id === id)?.referenceNumber ?? id;
    const labels: Record<PrintStatus, string> = {
      pending: 'pending',
      processing: 'printing',
      ready_for_pickup: 'ready for pickup',
      completed: 'picked up',
      rejected: 'not accepted',
    };
    logAudit('Updated Print Request', 'Documents', `Print request ${ref} set to ${status}. Staff: ${currentUser.name}`);
    addToast(`${ref}: ${labels[status]}`, 'The resident will see the update in My Requests.', 'success');
  };

  const createCourtReservation = (data: Pick<CourtReservation, 'date' | 'slotId' | 'activity'>): CourtReservation => {
    const refNum = `CRT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRes: CourtReservation = {
      ...data,
      id: 'crt-' + Date.now(),
      referenceNumber: refNum,
      residentId: currentUser.residentId || currentUser.id,
      residentName: currentUser.name,
      status: 'pending',
      submittedAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    setCourtReservations((prev) => [newRes, ...prev]);
    const slot = COURT_SLOTS.find((s) => s.id === data.slotId);
    logAudit('Submitted Court Reservation', 'Queue', `Reservation ${refNum} on ${data.date} (${slot?.label ?? data.slotId})`);
    addToast('Reservation request sent', `Reference ${refNum}. We will tell you once the barangay approves it.`, 'success');
    return newRes;
  };

  const updateCourtReservationStatus = (id: string, status: CourtReservationStatus, notes?: string) => {
    setCourtReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status, notes: notes ?? r.notes } : r)));
    const ref = courtReservations.find((r) => r.id === id)?.referenceNumber ?? id;
    logAudit('Updated Court Reservation', 'Queue', `Court reservation ${ref} set to ${status}. Staff: ${currentUser.name}`);
    addToast(`${ref}: ${status}`, 'The resident will see the update in My Requests.', 'success');
  };

  const closeCourtDate = (date: string, reason: string) => {
    setCourtClosures((prev) => [...prev.filter((c) => c.date !== date), { date, reason }]);
    // Bookings on that day can't go ahead: cancel them and tell the residents why.
    const affected = courtReservations.filter((r) => r.date === date && (r.status === 'pending' || r.status === 'approved'));
    if (affected.length) {
      setCourtReservations((prev) =>
        prev.map((r) => (affected.some((a) => a.id === r.id) ? { ...r, status: 'cancelled', notes: `Court closed: ${reason}` } : r))
      );
    }
    logAudit('Closed Court Date', 'Configuration', `Court closed on ${date}: ${reason}. ${affected.length} booking(s) cancelled. Staff: ${currentUser.name}`);
    addToast(
      'Court closed for that day',
      affected.length ? `${affected.length} booking${affected.length === 1 ? ' was' : 's were'} cancelled and the residents will be told why.` : 'Residents can no longer book it.',
      'success'
    );
  };

  const reopenCourtDate = (date: string) => {
    setCourtClosures((prev) => prev.filter((c) => c.date !== date));
    logAudit('Reopened Court Date', 'Configuration', `Court reopened on ${date}. Staff: ${currentUser.name}`);
    addToast('Court reopened for that day', 'Residents can book it again.', 'success');
  };

  const addPersonnel = (data: Omit<Personnel, 'id' | 'addedOn' | 'lastActive'>): Personnel => {
    const p: Personnel = { ...data, id: 'stf-' + Date.now(), addedOn: new Date().toISOString().slice(0, 10) };
    setPersonnel((prev) => [p, ...prev]);
    logAudit('Added Staff Account', 'Security', `${p.name} (${p.position}), role ${p.role}, access: ${p.access.join(', ')}. By ${currentUser.name}`);
    addToast('Staff account added', `${p.name} can now be assigned work.`, 'success');
    return p;
  };

  const updatePersonnel = (id: string, updates: Partial<Personnel>) => {
    const before = personnel.find((p) => p.id === id);
    setPersonnel((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    logAudit('Updated Staff Account', 'Security', `${before?.name ?? id}: ${Object.keys(updates).join(', ')} changed. By ${currentUser.name}`);
    addToast('Staff account saved', `${before?.name ?? 'The account'} was updated.`, 'success');
  };

  const markNotificationsRead = (ids: string[]) => {
    setReadNotificationIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const updateResidentContact = (residentId: string, contact: { contactNumber: string; email?: string }) => {
    setResidents((prev) => prev.map((r) => (r.id === residentId ? { ...r, ...contact } : r)));
    if (currentUser.residentId === residentId && contact.email) {
      setCurrentUser((u) => ({ ...u, email: contact.email ?? u.email }));
    }
    logAudit('Updated Contact Details', 'Records', `Resident ${residentId} updated their contact details`);
  };

  const updateOfficial = (id: string, updates: Partial<Official>) => {
    setOfficials((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
    logAudit('Update Official', 'Records', `Updated official record for ID: ${id}`);
    addToast('Official Updated', 'The barangay official record has been updated successfully.', 'success');
  };

  const addOfficial = (data: Omit<Official, 'id'>) => {
    const newOfficial: Official = {
      ...data,
      id: `off-${Date.now()}`
    };
    setOfficials((prev) => [...prev, newOfficial]);
    logAudit('Add Official', 'Records', `Added new official: ${data.name}`);
    addToast('Official Added', 'A new barangay official has been added to the directory.', 'success');
    return newOfficial;
  };

  const createAnnouncement = (data: Partial<Announcement>) => {
    const newAnnouncement: Announcement = {
      id: 'ann-' + Date.now(),
      title: data.title || '',
      content: data.content || '',
      category: data.category as any || 'Advisory',
      targetPurok: data.targetPurok || 'All',
      isUrgent: !!data.isUrgent,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      author: currentUser.name
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    logAudit('Add Announcement', 'Configuration', `Created announcement: ${data.title}`);
    addToast('Announcement Posted', 'The advisory is now visible to the public.', 'success');
  };

  const callNextQueueTicket = (counterNumber: number) => {
    const nextTicket = queueTickets.find(t => t.status === 'waiting');
    if (nextTicket) {
      callQueueTicket(nextTicket.id, counterNumber);
    } else {
      addToast('Queue Empty', 'There are no waiting tickets in the queue.', 'info');
    }
  };

  return (
    <BarangayContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        currentRole,
        setCurrentRole,
        currentUser,
        switchUserRole,
        activeTab,
        setActiveTab,
        largeTextMode,
        setLargeTextMode,
        services,
        residents,
        households,
        duplicateFlags,
        officials,
        documentRequests,
        queueTickets,
        incidents,
        appointments,
        announcements,
        auditLogs,
        knowledgeBase,
        priorityCriteria,
        createDocumentRequest,
        updateDocumentRequestStatus,
        assignDocumentRequest,
        barangayStaff: personnel.filter((p) => p.status === 'active').map((p) => p.name),
        staffFor: (area: AccessArea) => personnel.filter((p) => p.status === 'active' && p.access.includes(area)).map((p) => p.name),
        personnel,
        addPersonnel,
        updatePersonnel,
        createQueueTicket,
        callQueueTicket,
        callNextQueueTicket,
        completeQueueTicket,
        dismissQueueTicket,
        createIncidentReport,
        updateIncidentReportStatus,
        setIncidentInternalNote,
        registerResident,
        resolveDuplicateFlag,
        updateResident,
        addService,
        updateService,
        recordResidentAccess,
        updatePriorityConfig,
        addKnowledgeItem,
        updateKnowledgeItem,
        removeKnowledgeItem,
        bookAppointment,
        printRequests,
        createPrintRequest,
        updatePrintRequestStatus,
        courtSlots,
        courtReservations,
        courtClosures,
        createCourtReservation,
        updateCourtReservationStatus,
        closeCourtDate,
        reopenCourtDate,
        readNotificationIds,
        markNotificationsRead,
        smsUpdates,
        setSmsUpdates,
        updateResidentContact,
        createAnnouncement,
        updateOfficial,
        addOfficial,
        selectedDocumentForPrint,
        setSelectedDocumentForPrint,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </BarangayContext.Provider>
  );
};

export const useBarangay = () => {
  const context = useContext(BarangayContext);
  if (!context) {
    throw new Error('useBarangay must be used within a BarangayProvider');
  }
  return context;
};
