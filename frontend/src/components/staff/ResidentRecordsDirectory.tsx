import React, { useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { Resident } from '../../types';
import { 
  Users, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  MapPin, 
  HeartHandshake, 
  FileText,
  AlertTriangle,
  X,
  Edit,
  Save
} from 'lucide-react';
import { BARANGAY, CITY, PROVINCE } from '../../config/barangay';

export const ResidentRecordsDirectory: React.FC = () => {
  const { 
    residents, 
    registerResident, 
    documentRequests, 
    largeTextMode 
  } = useBarangay();

  const [selectedResidentId, setSelectedResidentId] = useState<string>(residents[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPurok, setFilterPurok] = useState<string>('All');
  const [filterSpecial, setFilterSpecial] = useState<string>('All'); // All, Senior, PWD, Voter
  
  // Duplicate Flags
  const [showDuplicates, setShowDuplicates] = useState<boolean>(true);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  
  // Edit State
  const [isEditingActiveResident, setIsEditingActiveResident] = useState<boolean>(false);

  // Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newFirstName, setNewFirstName] = useState<string>('');
  const [newLastName, setNewLastName] = useState<string>('');
  const [newMiddleName, setNewMiddleName] = useState<string>('');
  const [newPurok, setNewPurok] = useState<string>('Purok 1 - Centro');
  const [newBirthdate, setNewBirthdate] = useState<string>('1995-05-14');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [newOccupation, setNewOccupation] = useState<string>('Retail Associate');
  const [newContact, setNewContact] = useState<string>('0917-555-9988');
  const [isSenior, setIsSenior] = useState<boolean>(false);
  const [isPWD, setIsPWD] = useState<boolean>(false);
  const [isVoter, setIsVoter] = useState<boolean>(true);

  const filteredResidents = residents.filter((r) => {
    const matchesPurok = filterPurok === 'All' || r.purok === filterPurok;
    const matchesSpecial = 
      filterSpecial === 'All' ? true :
      filterSpecial === 'Senior' ? r.isSenior :
      filterSpecial === 'PWD' ? r.isPWD :
      filterSpecial === 'Voter' ? r.isVoter : true;

    const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      r.residentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.householdId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPurok && matchesSpecial && matchesSearch;
  });

  const activeResident = residents.find(r => r.id === selectedResidentId) || filteredResidents[0];

  // Document history for active resident
  const residentDocs = documentRequests.filter(
    d => d.residentId === activeResident?.id || 
         d.residentName.toLowerCase() === `${activeResident?.firstName} ${activeResident?.lastName}`.toLowerCase()
  );

  const handleAddResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim()) return;

    const created = registerResident({
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      middleName: newMiddleName.trim() || undefined,
      birthDate: newBirthdate,
      gender: newGender,
      civilStatus: 'Single',
      address: `${newPurok}, Barangay ${BARANGAY}, ${CITY}, ${PROVINCE}`,
      purok: newPurok,
      householdId: `HH-2026-00${residents.length + 1}`,
      isHouseholdHead: false,
      contactNumber: newContact,
      email: `${newFirstName.toLowerCase()}@example.ph`,
      occupation: newOccupation,
      isSenior,
      isPWD,
      isVoter,
      status: 'active'
    });

    setSelectedResidentId(created.id);
    setShowAddModal(false);
    setNewFirstName('');
    setNewLastName('');
    setNewMiddleName('');
  };

  return (
    <div className={`space-y-6 ${largeTextMode ?'text-lg':'text-base'}`}>
      {/* Header Bar */}
      <div className="bg-surface rounded-card p-6 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-info-fg text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Barangay {BARANGAY} Civil Masterlist</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink font-heading">
            Resident Information & Household Records
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Centralized registry of bonafide residents, household profiling, demographic classifications, and aid beneficiaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-navy hover:bg-navy-deep text-white font-bold rounded-control text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            id="register-resident-btn"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add resident</span>
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banner */}
      {showDuplicates && (
        <div className="bg-warning-bg border border-warning-bg rounded-control p-4 sm:p-5 flex items-start gap-3 ">
          <AlertTriangle className="w-5 h-5 text-warning-fg shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-warning-fg">System Alert: Potential Duplicate Records Detected</h4>
            <p className="text-xs sm:text-sm text-warning-fg mt-1 leading-relaxed">
              The AI profile-matching algorithm has flagged <strong>1</strong> potential duplicate entry (Name Similarity: 92%, Birth Date Match: 100%, Same Address).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button 
                onClick={() => setShowDuplicateModal(true)} 
                className="px-4 py-1.5 bg-warning-fg hover:bg-warning-fg text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Review duplicates
              </button>
              <button 
                onClick={() => setShowDuplicates(false)} 
                className="px-4 py-1.5 bg-surface text-warning-fg border border-warning-bg text-xs font-bold rounded-lg hover:bg-warning-bg transition-colors cursor-pointer"
              >
                Not a duplicate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-surface rounded-card p-4 border border-line flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, ID, or household..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-muted border border-line rounded-control text-xs sm:text-sm focus:bg-surface focus:outline-navy"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={filterPurok}
            onChange={(e) => setFilterPurok(e.target.value)}
            className="px-3 py-2 bg-surface-muted border border-line rounded-control text-xs font-semibold text-ink"
          >
            <option value="All">All Puroks (1-6)</option>
            <option value="Purok 1 - Centro">Purok 1 - Centro</option>
            <option value="Purok 2 - Riverside">Purok 2 - Riverside</option>
            <option value="Purok 3 - Bukidnon">Purok 3 - Bukidnon</option>
            <option value="Purok 4 - Pag-asa">Purok 4 - Pag-asa</option>
            <option value="Purok 5 - San Roque">Purok 5 - San Roque</option>
            <option value="Purok 6 - Industrial Zone">Purok 6 - Industrial Zone</option>
          </select>

          <select
            value={filterSpecial}
            onChange={(e) => setFilterSpecial(e.target.value)}
            className="px-3 py-2 bg-surface-muted border border-line rounded-control text-xs font-semibold text-ink"
          >
            <option value="All">All Classifications</option>
            <option value="Senior">Senior Citizens (60+)</option>
            <option value="PWD">PWD (Persons with Disability)</option>
            <option value="Voter">Registered Voters</option>
          </select>
        </div>
      </div>

      {/* Main Split Dossier View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Residents */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          {filteredResidents.map((res) => {
            const isSelected = activeResident?.id === res.id;
            const fullName = `${res.firstName} ${res.lastName}`;
            return (
              <div
                key={res.id}
                onClick={() => {
                  setSelectedResidentId(res.id);
                  setIsEditingActiveResident(false);
                }}
                className={`p-4 rounded-control border transition-all cursor-pointer ${
 isSelected
 ?'border-navy bg-info-bg/70 ring-1 ring-navy'
 :'border-line bg-surface hover:border-field-line'
 }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-navy bg-info-bg px-2 py-0.5 rounded">
                    {res.residentNumber}
                  </span>
                  <span className="text-xs text-muted">HH: {res.householdId}</span>
                </div>

                <h4 className="text-sm font-bold text-ink mt-1">{fullName}</h4>
                <p className="text-xs text-muted">{res.purok} • {res.occupation}</p>

                <div className="mt-2 pt-2 border-t border-line/60 flex items-center gap-1.5 flex-wrap">
                  {res.isSenior && (
                    <span className="text-label font-bold bg-warning-bg text-warning-fg px-2 py-0.5 rounded">
                      Senior Citizen
                    </span>
                  )}
                  {res.isPWD && (
                    <span className="text-label font-bold bg-danger-bg text-danger-fg px-2 py-0.5 rounded">
                      PWD
                    </span>
                  )}
                  {res.isVoter && (
                    <span className="text-label font-semibold bg-surface-muted text-ink px-2 py-0.5 rounded">
                      Voter
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredResidents.length === 0 && (
            <div className="p-8 text-center text-muted text-xs bg-surface rounded-control border border-line">
              No resident records match the filters.
            </div>
          )}
        </div>

        {/* Right Detailed Resident Dossier */}
        {activeResident ? (
          <div className="lg:col-span-7 bg-surface rounded-card border border-line p-6 space-y-6">
            {/* Header Profile Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-card bg-info-bg text-navy flex items-center justify-center font-bold text-xl font-heading ">
                  {activeResident.firstName[0]}{activeResident.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy">{activeResident.residentNumber}</span>
                    <span className="text-label bg-primary-tint text-primary-strong px-2 py-0.5 rounded-full font-bold">
                      Verified Resident
                    </span>
                  </div>
                  {isEditingActiveResident ? (
                    <div className="mt-1 flex gap-2">
                      <input type="text" className="bg-surface border border-field-line rounded px-2 py-1 text-sm font-bold text-ink w-24" defaultValue={activeResident.firstName} />
                      <input type="text" className="bg-surface border border-field-line rounded px-2 py-1 text-sm font-bold text-ink w-24" defaultValue={activeResident.lastName} />
                    </div>
                  ) : (
                    <h3 className="text-xl font-bold text-ink font-heading mt-0.5">
                      {activeResident.firstName} {activeResident.middleName || ''} {activeResident.lastName}
                    </h3>
                  )}
                  {isEditingActiveResident ? (
                    <input type="text" className="bg-surface border border-field-line rounded px-2 py-1 mt-1 text-xs text-muted w-full" defaultValue={activeResident.occupation} />
                  ) : (
                    <p className="text-xs text-muted">
                      {activeResident.occupation} • {activeResident.civilStatus}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right flex flex-col sm:items-end justify-between h-full">
                <div>
                  <span className="text-label uppercase font-bold text-muted block">Household Assignment</span>
                  <span className="text-xs font-bold text-ink ">{activeResident.householdId}</span>
                  {activeResident.isHouseholdHead && (
                    <span className="text-label font-bold text-primary-strong block">Head of Household</span>
                  )}
                </div>
                
                {isEditingActiveResident ? (
                  <button 
                    onClick={() => setIsEditingActiveResident(false)} 
                    className="mt-3 px-3 py-1.5 bg-navy hover:bg-navy text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3 h-3" />
                    Save changes
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditingActiveResident(true)} 
                    className="mt-3 px-3 py-1.5 bg-surface-muted hover:bg-line text-ink text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit className="w-3 h-3" />
                    Edit record
                  </button>
                )}
              </div>
            </div>

            {/* Demographic & Contact Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Gender</span>
                {isEditingActiveResident ? (
                  <select className="w-full bg-surface border border-field-line rounded px-2 py-1 mt-1 text-xs font-semibold text-ink" defaultValue={activeResident.gender}>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                ) : (
                  <span className="font-bold text-ink mt-0.5 block">{activeResident.gender}</span>
                )}
              </div>
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Birthdate</span>
                <span className="font-semibold text-ink mt-0.5 block">{activeResident.birthDate}</span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Residency Area</span>
                {isEditingActiveResident ? (
                  <select className="w-full bg-surface border border-field-line rounded px-2 py-1 mt-1 text-xs font-semibold text-ink" defaultValue={activeResident.purok}>
                    <option>Purok 1 - Centro</option>
                    <option>Purok 2 - Riverside</option>
                    <option>Purok 3 - Bukidnon</option>
                    <option>Purok 4 - Pag-asa</option>
                    <option>Purok 5 - San Roque</option>
                    <option>Purok 6 - Industrial</option>
                  </select>
                ) : (
                  <span className="font-semibold text-ink mt-0.5 block">{activeResident.purok}</span>
                )}
              </div>
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Contact Number</span>
                {isEditingActiveResident ? (
                  <input type="text" className="w-full bg-surface border border-field-line rounded px-2 py-1 mt-1 text-xs font-semibold text-ink" defaultValue={activeResident.contactNumber} />
                ) : (
                  <span className="font-semibold text-ink mt-0.5 block">{activeResident.contactNumber}</span>
                )}
              </div>
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">COMELEC Voter</span>
                <span className="font-semibold text-ink mt-0.5 block">
                  {activeResident.isVoter ? 'Registered Voter' : 'Non-Voter'}
                </span>
              </div>
              <div className="p-3 bg-surface-muted rounded-control border border-line">
                <span className="text-muted block text-label uppercase font-bold">Address</span>
                <span className="font-semibold text-ink mt-0.5 block truncate">{activeResident.address}</span>
              </div>
            </div>

            {/* Historical Document Applications */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Document Requests History on Record ({residentDocs.length}):
              </h4>

              <div className="space-y-2">
                {residentDocs.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-control border border-line bg-surface-muted flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className=" font-bold text-ink">{doc.referenceNumber}</span>
                        <span className="text-label font-bold text-primary-strong bg-primary-tint px-2 py-0.5 rounded">
                          {doc.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-ink font-bold mt-0.5">{doc.documentTitle}</p>
                      <p className="text-muted text-label">{doc.purpose}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-ink">{doc.isFreeDueToExemption ? 'FREE' : `₱${doc.fee}.00`}</span>
                      <span className="text-label text-muted block">{doc.submittedAt}</span>
                    </div>
                  </div>
                ))}

                {residentDocs.length === 0 && (
                  <p className="text-xs text-muted italic">No previous document requests recorded.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-surface rounded-card border border-line p-12 text-center">
            <p className="text-sm font-semibold text-ink">Select a resident to view profile.</p>
          </div>
        )}
      </div>

      {/* Add Resident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 overflow-y-auto">
          <div className="bg-surface rounded-card max-w-xl w-full p-6 border border-line shadow-float space-y-4 animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-line-soft">
              <h3 className="text-lg font-bold text-ink font-heading">
                Add resident
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddResident} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-label font-bold text-ink uppercase mb-1">First Name *</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-label font-bold text-ink uppercase mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={newMiddleName}
                    onChange={(e) => setNewMiddleName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                  />
                </div>
                <div>
                  <label className="block text-label font-bold text-ink uppercase mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-label font-bold text-ink uppercase mb-1">Birthdate *</label>
                  <input
                    type="date"
                    value={newBirthdate}
                    onChange={(e) => setNewBirthdate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-label font-bold text-ink uppercase mb-1">Gender *</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-label font-bold text-ink uppercase mb-1">Purok Area *</label>
                  <select
                    value={newPurok}
                    onChange={(e) => setNewPurok(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                  >
                    <option value="Purok 1 - Centro">Purok 1 - Centro</option>
                    <option value="Purok 2 - Riverside">Purok 2 - Riverside</option>
                    <option value="Purok 3 - Bukidnon">Purok 3 - Bukidnon</option>
                    <option value="Purok 4 - Pag-asa">Purok 4 - Pag-asa</option>
                    <option value="Purok 5 - San Roque">Purok 5 - San Roque</option>
                    <option value="Purok 6 - Industrial Zone">Purok 6 - Industrial Zone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label font-bold text-ink uppercase mb-1">Occupation</label>
                  <input
                    type="text"
                    value={newOccupation}
                    onChange={(e) => setNewOccupation(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                  />
                </div>
                <div>
                  <label className="block text-label font-bold text-ink uppercase mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                  />
                </div>
              </div>

              {/* Special Toggles */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line-soft text-xs">
                <label className="flex items-center gap-2 p-2 bg-surface-muted rounded-lg border border-line cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVoter}
                    onChange={(e) => setIsVoter(e.target.checked)}
                    className="text-info-fg rounded"
                  />
                  <span>Voter</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-surface-muted rounded-lg border border-line cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSenior}
                    onChange={(e) => setIsSenior(e.target.checked)}
                    className="text-info-fg rounded"
                  />
                  <span>Senior (60+)</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-surface-muted rounded-lg border border-line cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPWD}
                    onChange={(e) => setIsPWD(e.target.checked)}
                    className="text-info-fg rounded"
                  />
                  <span>PWD</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted rounded-control"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy hover:bg-navy-deep text-white font-bold rounded-control text-xs "
                >
                  Save resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Review Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-float animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-line-soft flex items-center justify-between sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning-bg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-warning-fg" />
                </div>
                <div>
                  <h3 className="font-bold text-ink font-heading">Resolve Duplicate Records</h3>
                  <p className="text-xs text-muted">The Jaro-Winkler algorithm detected similar entries.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="p-2 hover:bg-surface-muted rounded-full text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-surface-muted">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Record A */}
                <div className="bg-surface border-2 border-primary rounded-control p-4 relative">
                  <div className="absolute top-0 right-0 bg-primary text-white text-label font-bold px-2 py-1 rounded-bl-lg rounded-tr-control">
                    RECOMMENDED ACTIVE
                  </div>
                  <h4 className="font-bold text-ink text-sm mb-3">Record A (Existing)</h4>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 border-b border-line-soft pb-1">
                      <span className="text-muted font-semibold">Name</span>
                      <span className="col-span-2 font-bold text-ink">Juan D. Dela Cruz</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-line-soft pb-1">
                      <span className="text-muted font-semibold">Birth Date</span>
                      <span className="col-span-2 text-ink">1985-04-12</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-line-soft pb-1">
                      <span className="text-muted font-semibold">Purok</span>
                      <span className="col-span-2 text-ink">Purok 1 - Centro</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-line-soft pb-1">
                      <span className="text-muted font-semibold">Contact</span>
                      <span className="col-span-2 text-ink">0917-555-0001</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-muted font-semibold">ID Ref</span>
                      <span className="col-span-2 text-ink ">RES-2023-0042</span>
                    </div>
                  </div>
                </div>

                {/* Record B */}
                <div className="bg-surface border-2 border-warning-bg rounded-control p-4 relative opacity-90">
                  <div className="absolute top-0 right-0 bg-warning-bg text-warning-fg text-label font-bold px-2 py-1 rounded-bl-lg rounded-tr-control">
                    FLAGGED DUPLICATE
                  </div>
                  <h4 className="font-bold text-ink text-sm mb-3">Record B (New Entry)</h4>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 border-b border-line-soft pb-1">
                      <span className="text-muted font-semibold">Name</span>
                      <span className="col-span-2 font-bold text-ink bg-warning-bg">Juanito Dela Cruz</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-line-soft pb-1">
                      <span className="text-muted font-semibold">Birth Date</span>
                      <span className="col-span-2 text-ink">1985-04-12</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-line-soft pb-1">
                      <span className="text-muted font-semibold">Purok</span>
                      <span className="col-span-2 text-ink">Purok 1 - Centro</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-line-soft pb-1">
                      <span className="text-muted font-semibold">Contact</span>
                      <span className="col-span-2 text-ink">None</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-muted font-semibold">ID Ref</span>
                      <span className="col-span-2 text-ink ">RES-2026-0891</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-info-bg border border-line text-xs text-navy">
                <strong>AI Analysis:</strong> 92% Name Similarity. Identical birth date and purok. Highly likely to be the same individual re-registered by a family member.
              </div>
            </div>

            <div className="p-4 border-t border-line-soft flex justify-end gap-3 bg-surface">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-xs font-bold text-muted hover:bg-surface-muted rounded-control transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Record B archived. Record A retained as the active master record.');
                  setShowDuplicateModal(false);
                  setShowDuplicates(false);
                }}
                className="px-5 py-2 bg-warning-fg hover:bg-warning-fg text-white font-bold rounded-control text-xs transition-colors"
              >
                Merge records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
