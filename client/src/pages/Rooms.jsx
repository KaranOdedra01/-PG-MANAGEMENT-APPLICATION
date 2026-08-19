import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  DoorOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Bed, 
  Sparkles, 
  X, 
  DollarSign, 
  Layers, 
  Check, 
  RefreshCw 
} from 'lucide-react';

const AVAILABLE_AMENITIES = [
  'AC',
  'Attached Bathroom',
  'High-Speed WiFi',
  'Balcony',
  'Wardrobe',
  'Study Table & Chair',
  'Geyser / Hot Water',
  'Smart TV',
  'Mini Fridge'
];

export const Rooms = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: 1,
    type: 'double',
    capacity: 2,
    rent: 7500,
    amenities: ['High-Speed WiFi', 'Attached Bathroom']
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm state
  const [deletingRoomId, setDeletingRoomId] = useState(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rooms');
      if (res.data?.success) {
        setRooms(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Filtered rooms calculation
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = r.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFloor = selectedFloor === 'all' || r.floor === Number(selectedFloor);
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesType = selectedType === 'all' || r.type === selectedType;
    return matchesSearch && matchesFloor && matchesStatus && matchesType;
  });

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({
      roomNumber: '',
      floor: 1,
      type: 'double',
      capacity: 2,
      rent: 7500,
      amenities: ['High-Speed WiFi', 'Attached Bathroom']
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      floor: room.floor,
      type: room.type,
      capacity: room.capacity,
      rent: room.rent,
      amenities: room.amenities || []
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType) => {
    let defaultCap = 2;
    if (newType === 'single') defaultCap = 1;
    if (newType === 'double') defaultCap = 2;
    if (newType === 'triple') defaultCap = 3;
    if (newType === 'dormitory') defaultCap = 4;
    setFormData({ ...formData, type: newType, capacity: defaultCap });
  };

  const toggleAmenity = (amenity) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      setFormData({ ...formData, amenities: current.filter(a => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...current, amenity] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, formData);
      } else {
        await api.post('/rooms', formData);
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (room) => {
    const nextStatus = room.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      await api.patch(`/rooms/${room._id}/status`, { status: nextStatus });
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/rooms/${id}`);
      setDeletingRoomId(null);
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete room');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Module 3 • Room & Bed Inventory
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <DoorOpen className="w-7 h-7 text-indigo-500" />
            Room Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage rooms, bed allocation capacity, rental rates, and amenities.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Room
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Room #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Floor filter */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Floors</option>
            <option value="1">1st Floor</option>
            <option value="2">2nd Floor</option>
            <option value="3">3rd Floor</option>
          </select>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Sharing Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="dormitory">Dormitory</option>
          </select>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['all', 'available', 'occupied', 'maintenance'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchRooms}
            title="Reload Rooms"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading rooms inventory...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <DoorOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No rooms found matching your filters</p>
          <p className="text-xs text-slate-500 mt-1">Try changing your search keyword or floor filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const isFull = room.occupiedBeds >= room.capacity;
            return (
              <div
                key={room._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg relative group"
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-slate-100 tracking-tight">Room #{room.roomNumber}</span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                          Floor {room.floor}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-400 font-medium capitalize mt-0.5">
                        {room.type} Sharing
                      </p>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        room.status === 'available'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : room.status === 'occupied'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  {/* Bed Occupancy Slots Visualization */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 my-3">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-indigo-400" />
                        Bed Slots ({room.occupiedBeds || 0}/{room.capacity})
                      </span>
                      <span className="font-semibold text-slate-200">
                        {room.capacity - (room.occupiedBeds || 0)} Vacant
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {Array.from({ length: room.capacity }).map((_, idx) => {
                        const isBedOccupied = idx < (room.occupiedBeds || 0);
                        return (
                          <div
                            key={idx}
                            title={isBedOccupied ? 'Occupied Bed' : 'Available Bed'}
                            className={`py-1.5 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors ${
                              isBedOccupied
                                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            Bed {idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rent Info */}
                  <div className="flex items-baseline justify-between py-2 border-y border-slate-800/60 my-3">
                    <span className="text-xs text-slate-400">Monthly Rent:</span>
                    <span className="text-lg font-black text-emerald-400">₹{room.rent.toLocaleString()}<span className="text-[10px] text-slate-500 font-normal"> / bed</span></span>
                  </div>

                  {/* Amenities Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Amenities</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(room.amenities && room.amenities.length > 0 ? room.amenities : ['WiFi', 'Bathroom']).map((amenity, i) => (
                        <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions (Admin & Staff) */}
                {(isAdmin || isStaff) && (
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStatus(room)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Wrench className="w-3 h-3 text-amber-400" />
                      {room.status === 'maintenance' ? 'Set Available' : 'Maintenance'}
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(room)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 transition-colors"
                          title="Edit Room"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRoomId(room._id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 transition-colors"
                          title="Delete Room"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT ROOM MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-indigo-400" />
                {editingRoom ? `Edit Room #${editingRoom.roomNumber}` : 'Add New Room'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. 101, 204"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Floor Level *</label>
                  <select
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>1st Floor</option>
                    <option value={2}>2nd Floor</option>
                    <option value={3}>3rd Floor</option>
                    <option value={4}>4th Floor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sharing Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="single">Single Sharing (1 Bed)</option>
                    <option value="double">Double Sharing (2 Beds)</option>
                    <option value="triple">Triple Sharing (3 Beds)</option>
                    <option value="dormitory">Dormitory (4 Beds)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: Number(e.target.value) })}
                    placeholder="7500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Amenity multi-checkbox selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Room Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_AMENITIES.map((amenity) => {
                    const isChecked = formData.amenities?.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{amenity}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingRoomId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Delete Room?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently remove this room? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeletingRoomId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingRoomId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
              >
                Yes, Delete Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
