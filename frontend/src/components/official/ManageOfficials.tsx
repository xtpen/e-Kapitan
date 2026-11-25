import React, { useState } from 'react';
import { useBarangay } from '../../context/BarangayContext';
import { Users, Edit, Save, Plus, ShieldCheck, X } from 'lucide-react';
import { Official } from '../../types';

export const ManageOfficials: React.FC = () => {
  const { officials, updateOfficial, addOfficial, largeTextMode } = useBarangay();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Official>>({});
  const [isAdding, setIsAdding] = useState(false);

  const handleEditClick = (official: Official) => {
    setEditingId(official.id);
    setEditForm(official);
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (editingId && editForm.name) {
      updateOfficial(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleAddNew = () => {
    if (editForm.name && editForm.position) {
      addOfficial(editForm as Omit<Official, 'id'>);
      setIsAdding(false);
      setEditForm({});
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ status: 'Active (Incumbent)', position: 'Barangay Kagawad' });
  };

  return (
    <div className={`space-y-6 ${largeTextMode ?'text-lg':'text-base'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-navy">
          <Users className="w-6 h-6" />
          <h2 className="text-xl sm:text-2xl font-bold font-heading">Manage Officials Directory</h2>
        </div>
        {!isAdding && (
          <button 
            onClick={startAdding}
            className="flex items-center gap-2 bg-navy hover:bg-navy-deep text-white px-4 py-2 rounded-control text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add official</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface rounded-card border border-line p-6 mb-6">
          <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-info-fg" /> Add New Official
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Full Name</label>
              <input 
                type="text" 
                className="w-full bg-surface-muted border border-line rounded-lg px-3 py-2 text-sm"
                value={editForm.name || ''}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                placeholder="e.g. Hon. Juan Dela Cruz"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Position</label>
              <input 
                type="text" 
                className="w-full bg-surface-muted border border-line rounded-lg px-3 py-2 text-sm"
                value={editForm.position || ''}
                onChange={e => setEditForm({...editForm, position: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Committee / Responsibility</label>
              <input 
                type="text" 
                className="w-full bg-surface-muted border border-line rounded-lg px-3 py-2 text-sm"
                value={editForm.committee || ''}
                onChange={e => setEditForm({...editForm, committee: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Contact Details</label>
              <input 
                type="text" 
                className="w-full bg-surface-muted border border-line rounded-lg px-3 py-2 text-sm"
                value={editForm.contactDetails || ''}
                onChange={e => setEditForm({...editForm, contactDetails: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={handleCancelEdit} className="px-4 py-2 text-muted hover:bg-surface-muted rounded-control text-sm font-semibold cursor-pointer">Cancel</button>
            <button onClick={handleAddNew} className="px-4 py-2 bg-navy text-white rounded-control text-sm font-semibold hover:bg-navy flex items-center gap-1.5 cursor-pointer">
              <Save className="w-4 h-4" /> Save official
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-card border border-line overflow-hidden ">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-muted border-b border-line">
              <tr>
                <th className="px-6 py-4 font-bold text-ink">Official Name & Position</th>
                <th className="px-6 py-4 font-bold text-ink">Committee</th>
                <th className="px-6 py-4 font-bold text-ink">Status</th>
                <th className="px-6 py-4 font-bold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {officials.map(official => (
                <tr key={official.id} className="hover:bg-surface-muted/50">
                  <td className="px-6 py-4">
                    {editingId === official.id ? (
                      <div className="flex flex-col gap-2 min-w-[240px]">
                        <input 
                          type="text" 
                          className="w-full bg-surface border border-line rounded-md px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-navy outline-none"
                          value={editForm.name || ''}
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                        />
                        <input 
                          type="text" 
                          className="w-full bg-surface border border-line rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-navy outline-none"
                          value={editForm.position || ''}
                          onChange={e => setEditForm({...editForm, position: e.target.value})}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-ink">{official.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          {official.position}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === official.id ? (
                      <div className="flex flex-col gap-2 min-w-[240px]">
                        <input 
                          type="text" 
                          className="w-full bg-surface border border-line rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-navy outline-none"
                          value={editForm.committee || ''}
                          onChange={e => setEditForm({...editForm, committee: e.target.value})}
                        />
                        <input 
                          type="text" 
                          className="w-full bg-surface border border-line rounded-md px-2 py-1 text-xs text-muted focus:ring-2 focus:ring-navy outline-none"
                          value={editForm.contactDetails || ''}
                          onChange={e => setEditForm({...editForm, contactDetails: e.target.value})}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-ink">{official.committee}</div>
                        <div className="text-xs text-muted mt-0.5">{official.contactDetails}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === official.id ? (
                      <select 
                        className="bg-surface border border-line rounded-md px-2 py-1 text-sm outline-none"
                        value={editForm.status || 'Active (Incumbent)'}
                        onChange={e => setEditForm({...editForm, status: e.target.value as Official['status']})}
                      >
                        <option value="Active (Incumbent)">Active (Incumbent)</option>
                        <option value="Inactive (Former)">Inactive</option>
                        <option value="Suspended">Suspended</option>
                        <option value="On Leave (Absent)">On Leave (Absent)</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-label font-bold ${
 official.status ==='Active (Incumbent)'?'bg-primary-tint text-primary-strong': 
 official.status ==='On Leave (Absent)'?'bg-warning-bg text-warning-fg':
'bg-surface-muted text-muted'
 }`}>
                        {official.status.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === official.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={handleCancelEdit} className="p-1.5 text-muted hover:bg-line rounded-lg cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={handleSaveEdit} className="p-1.5 text-white bg-navy hover:bg-navy rounded-lg cursor-pointer">
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditClick(official)}
                        className="p-1.5 text-muted hover:text-info-fg hover:bg-info-bg rounded-lg transition-colors cursor-pointer inline-flex"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
