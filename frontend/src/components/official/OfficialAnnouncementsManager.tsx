import React, { useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { 
  Building, 
  PlusCircle, 
  Calendar, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Megaphone,
  Pin
} from 'lucide-react';

export const OfficialAnnouncementsManager: React.FC = () => {
  const { announcements, createAnnouncement, largeTextMode, currentRole } = useBarangay();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<'Health' | 'Advisory' | 'Event' | 'Program' | 'Emergency'>('Advisory');
  const [targetPurok, setTargetPurok] = useState<string>('All Puroks (General Public)');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      category,
      targetPurok,
      isUrgent
    });

    setShowAddModal(false);
    setTitle('');
    setContent('');
    setIsUrgent(false);
  };

  return (
    <div className={`space-y-6 ${largeTextMode ?'text-lg':'text-base'}`}>
      {/* Header Banner */}
      <div className="bg-surface rounded-card p-6 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-strong text-xs font-bold uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Public Information Office</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink font-heading">
            Official Barangay Advisories & Announcements
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Broadcast health missions, disaster weather warnings, community curfew notices, and civic assemblies.
          </p>
        </div>

        {(currentRole === 'official' || currentRole === 'staff') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-primary-strong hover:bg-primary-strong text-white font-bold rounded-control text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish advisory</span>
          </button>
        )}
      </div>

      {/* Announcements Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {announcements.map((anc) => (
          <div
            key={anc.id}
            className={`p-6 rounded-card border transition-all bg-surface flex flex-col justify-between ${
 anc.isUrgent ?'border-danger-bg ring-1 ring-danger-bg':'border-line'
 }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-label font-bold uppercase px-2.5 py-0.5 rounded-full ${
 anc.isUrgent ?'bg-danger-bg text-danger-fg border border-danger-bg':'bg-info-bg text-navy'
 }`}>
                  {anc.category} {anc.isUrgent && '• URGENT ALERT'}
                </span>
                <span className="text-xs text-muted">{anc.date}</span>
              </div>

              <h3 className="text-base font-bold text-ink font-heading">
                {anc.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">
                {anc.content}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line-soft text-xs text-muted flex items-center justify-between">
              <span>Author: <strong>{anc.author}</strong></span>
              <span className="text-primary-strong font-semibold">{anc.targetPurok}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 ">
          <div className="bg-surface rounded-card max-w-lg w-full p-6 border border-line shadow-float space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-line-soft">
              <h3 className="text-base font-bold text-ink font-heading">
                Publish Official Advisory
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-ink">✕</button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule for Free Senior Flu Vaccination Drive"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-muted border border-line rounded-control text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                  >
                    <option value="Health">Health</option>
                    <option value="Advisory">Advisory</option>
                    <option value="Event">Event</option>
                    <option value="Program">Program</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase mb-1">Target Purok *</label>
                  <select
                    value={targetPurok}
                    onChange={(e) => setTargetPurok(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-muted border border-line rounded-control text-xs"
                  >
                    <option value="All Puroks (General Public)">All Puroks (General Public)</option>
                    <option value="Purok 1 - Centro">Purok 1 - Centro</option>
                    <option value="Purok 2 - Riverside">Purok 2 - Riverside</option>
                    <option value="Purok 3 - Bukidnon">Purok 3 - Bukidnon</option>
                    <option value="Purok 4 - Pag-asa">Purok 4 - Pag-asa</option>
                    <option value="Purok 5 - San Roque">Purok 5 - San Roque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Advisory Content *</label>
                <textarea
                  rows={4}
                  placeholder="Detailed public announcement text..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-muted border border-line rounded-control text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="p-3 bg-surface-muted rounded-control border border-line flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-ink block">Mark as Urgent Advisory</span>
                  <span className="text-label text-muted">Highlights announcement with red banner alert</span>
                </div>
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-danger-fg rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-muted rounded-control"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-strong hover:bg-primary-strong text-white font-bold rounded-control text-xs "
                >
                  Publish advisory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
