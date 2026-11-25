import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBarangay } from '../../context/BarangayContext';
import { UserRole } from '../../types';
import { 

  User, 
  ShieldCheck, 
  ChevronDown, 
  PhoneCall, 
  Bell, 
  Type, 
  Check, 
  Sparkles,
  Search,
  Menu,
  X,
  FileCheck2,
  Users2,
  LogOut
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { BARANGAY } from '../../config/barangay';
import { LogoMark } from '../ui';

export const Header: React.FC = () => {
  const { 
    currentRole, 
    currentUser, 
    switchUserRole, 
    activeTab, 
    setActiveTab, 
    largeTextMode, 
    setLargeTextMode,
    announcements,
    documentRequests,
    queueTickets,
    setIsAuthenticated
  } = useBarangay();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hotlineModalOpen, setHotlineModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const pendingRequestsCount = documentRequests.filter(r => r.status === 'under_review' || r.status === 'submitted').length;
  const activeQueueCount = queueTickets.filter(q => q.status === 'waiting').length;

  const handleRoleSelect = (role: UserRole) => {
    switchUserRole(role);
    setRoleDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-line/80 ">

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand Logo & Barangay Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
            if (currentRole === 'citizen') setActiveTab('home');
            else if (currentRole === 'staff') setActiveTab('dashboard');
            else if (currentRole === 'official') setActiveTab('executive_dashboard');
            else setActiveTab('guest_home');
          }}>
            <LogoMark size={44} />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-navy font-heading">
                  eKapitan
                </span>
                <span className="hidden sm:inline-block bg-primary-tint text-primary-strong text-label font-semibold px-2 py-0.5 rounded-full border border-primary-tint-line">
                  Barangay {BARANGAY}
                </span>
              </div>
              <p className="text-xs text-muted hidden sm:block">
                Citizen Service & Digital Local Governance Portal
              </p>
            </div>
          </div>


          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick QR Verify button */}
            <button
              onClick={() => setActiveTab('qr_verify')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ink hover:text-primary-strong hover:bg-primary-tint border border-line hover:border-primary-tint-line transition-colors cursor-pointer"
              title="Verify an issued Barangay Document QR Code"
              id="verify-document-nav-btn"
            >
              <FileCheck2 className="w-4 h-4 text-primary" />
              <span>Verify a document</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-muted hover:text-ink hover:bg-surface-muted rounded-lg transition-colors relative cursor-pointer"
                title="Notifications"
                id="notifications-bell-btn"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger-fg rounded-full ring-2 ring-white"></span>
              </button>

              {/* Notifications Popover */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-x-4 top-[72px] sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-96 bg-surface rounded-card shadow-float border border-line py-2 z-50 overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-line-soft bg-surface-muted/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">
                        Barangay Advisories & Updates
                      </span>
                      <span className="text-label text-primary font-bold bg-primary-tint px-2 py-0.5 rounded-full">3 Active</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-line-soft custom-scrollbar">
                      {announcements.map((anc) => (
                        <div key={anc.id} className="p-4 hover:bg-surface-muted transition-colors group cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${anc.isUrgent ?'bg-danger-fg':'bg-navy'}`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-label font-bold uppercase px-1.5 py-0.5 rounded-sm ${
 anc.isUrgent ?'bg-danger-bg text-danger-fg':'bg-info-bg text-info-fg'
 }`}>
                                  {anc.category}
                                </span>
                                <span className="text-label text-muted font-medium">{anc.date}</span>
                              </div>
                              <span className="text-sm font-bold text-ink group-hover:text-primary-strong transition-colors line-clamp-1">{anc.title}</span>
                              <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{anc.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-line-soft text-center bg-surface-muted/50">
                      <button
                        onClick={() => {
                          setActiveTab('announcements');
                          setNotificationsOpen(false);
                        }}
                        className="text-xs font-bold text-primary-strong hover:text-primary-strong transition-colors"
                      >
                        View all advisories
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-control border border-line hover:border-field-line hover:bg-surface-muted transition-all cursor-pointer"
                id="user-profile-menu-btn"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-tint text-primary-strong flex items-center justify-center font-bold text-xs overflow-hidden border border-primary-tint-line">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-ink leading-tight line-clamp-1">{currentUser.name}</p>
                  <p className="text-label font-medium text-muted leading-tight">{currentUser.roleTitle}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
              </button>

              {/* Role Dropdown Menu */}
              <AnimatePresence>
                {roleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-64 bg-surface rounded-card shadow-float border border-line py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-line-soft bg-surface-muted/50">
                      <p className="text-sm font-bold text-ink">{currentUser.name}</p>
                      <p className="text-label text-muted font-medium truncate">{currentUser.email}</p>
                    </div>

                    <div className="px-2 py-2 space-y-1">
                      <button
                        onClick={() => setLargeTextMode(v => !v)}
                        aria-pressed={largeTextMode}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-control text-xs font-semibold text-ink hover:bg-surface-muted transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-3">
                          <Type className="w-4 h-4 text-muted" />
                          <span>Large text</span>
                        </span>
                        <span className="text-muted">{largeTextMode ? 'On' : 'Off'}</span>
                      </button>
                    </div>

                    <div className="px-2 pb-1 pt-1 border-t border-line-soft">
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-control text-xs font-bold text-danger-fg hover:bg-danger-bg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


          </div>
        </div>
      </div>



      {/* Emergency Hotlines Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {hotlineModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHotlineModalOpen(false)}
              className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-navy/60 "
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface rounded-card shadow-float max-w-md w-full p-6 border border-line"
              >
                <div className="flex items-center justify-between pb-3 border-b border-line-soft">
                  <div className="flex items-center gap-2 text-danger-fg font-bold text-lg font-heading">
                    <PhoneCall className="w-5 h-5" />
                    <span>Barangay {BARANGAY} Emergency Hotlines</span>
                  </div>
                  <button
                    onClick={() => setHotlineModalOpen(false)}
                    className="text-muted hover:text-ink p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="p-3.5 rounded-control bg-danger-bg border border-danger-bg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-danger-fg">Barangay Emergency Operations (24/7)</p>
                      <p className="text-sm font-bold text-danger-fg mt-0.5">(02) 8642-1111 / 0917-888-5673</p>
                    </div>
                    <span className="text-label font-bold bg-danger-bg text-danger-fg px-2 py-1 rounded-md">24/7 Blue Alert</span>
                  </div>

                  <div className="p-3.5 rounded-control bg-surface-muted border border-line flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-ink">Barangay Tanod Headquarters (Security)</p>
                      <p className="text-sm font-semibold text-ink mt-0.5">(02) 8642-2222</p>
                    </div>
                    <span className="text-label text-muted">Patrol Base</span>
                  </div>

                  <div className="p-3.5 rounded-control bg-surface-muted border border-line flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-ink">Barangay {BARANGAY} Health Center</p>
                      <p className="text-sm font-semibold text-ink mt-0.5">(02) 8642-3333</p>
                    </div>
                    <span className="text-label text-muted">Ambulance Dispatch</span>
                  </div>

                  <div className="p-3.5 rounded-control bg-info-bg border border-line flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-navy">National Emergency Hotline</p>
                      <p className="text-sm font-bold text-info-fg mt-0.5">911 (Police / Fire / Paramedic)</p>
                    </div>
                    <span className="text-label text-navy font-semibold">National</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-line-soft flex justify-end">
                  <button
                    onClick={() => setHotlineModalOpen(false)}
                    className="px-4 py-2 bg-navy text-white rounded-control text-xs font-semibold hover:bg-navy transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
      document.body)}

      {/* Logout Confirmation Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {logoutModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogoutModalOpen(false)}
              className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-navy/60 "
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface rounded-card shadow-float max-w-sm w-full p-6 sm:p-8 border border-line text-center"
              >
                <div className="w-16 h-16 bg-danger-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-danger-bg ">
                  <LogOut className="w-8 h-8 text-danger-fg ml-1" />
                </div>
                <h3 className="text-xl font-bold text-ink font-heading mb-2">Sign out</h3>
                <p className="text-sm text-muted mb-8">
                  Are you sure you want to sign out? You will need to sign in again, or continue as a guest, to use barangay services.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setLogoutModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-control font-bold text-ink bg-surface-muted hover:bg-line transition-colors cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setLogoutModalOpen(false);
                      setIsAuthenticated(false);
                    }}
                    className="flex-1 px-4 py-3 rounded-control font-bold text-white bg-danger-fg hover:bg-danger-fg transition-all cursor-pointer text-sm"
                  >
                    Sign out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
      document.body)}
    </header>
  );
};
