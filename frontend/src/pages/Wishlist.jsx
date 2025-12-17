// src/pages/Wishlist.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../store/api/api';
import { toast } from 'react-toastify';

const Wishlist = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchWishlists();
  }, [token]);

  const fetchWishlists = async () => {
    try {
      const res = await api.get('/wishlist');
      // Ensure array
      const data = Array.isArray(res.data) ? res.data : (res.data.data ? res.data.data : [res.data]);
      setWishlists(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      // toast.error('Failed to load wishlists');
    } finally {
      setLoading(false);
    }
  };

  // Action Handlers
  const confirmDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this wishlist? This action cannot be undone.')) {
      try {
        await api.delete(`/wishlist/${id}`);
        toast.success('Wishlist deleted');
        fetchWishlists();
      } catch (err) {
        toast.error('Failed to delete wishlist');
      }
    }
  };

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const startEdit = (list) => {
    setEditId(list._id);
    setEditName(list.name);
    setShowCreateModal(true); // Reuse modal
  };

  const handleCreateOrUpdate = async () => {
    const nameToUse = editId ? editName : newName;
    if (!nameToUse.trim()) return;

    try {
      if (editId) {
        await api.patch(`/wishlist/${editId}`, { name: nameToUse });
        toast.success('Wishlist renamed');
      } else {
        await api.post('/wishlist', { name: nameToUse });
        toast.success('Wishlist created');
      }

      closeModal();
      fetchWishlists();
    } catch (err) {
      toast.error(editId ? 'Failed to rename' : 'Failed to create');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditId(null);
    setEditName('');
    setNewName('');
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Wishlists</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          + Create New List
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlists.map(list => (
          <div key={list._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
            <div onClick={() => navigate(`/wishlists/${list._id}`)} className="cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${list.privacy === 'public' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {list.privacy === 'public' ? '🌎' : '🔒'}
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{list.items?.length || list.productIds?.length || 0} ITEMS</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{list.name}</h3>
              <p className="text-gray-500 text-sm mt-2">
                {list.privacy === 'public' ? 'Shared with anyone' : 'Private list'}
              </p>
            </div>

            {/* Manage Actions */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); startEdit(list); }}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
                title="Rename"
              >
                ✏️
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); confirmDelete(list._id); }}
                className="p-2 bg-red-50 hover:bg-red-100 rounded-full text-red-600"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {wishlists.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-dashed border-2 border-gray-200">
            <p className="text-gray-500 mb-4">You don't have any wishlists yet.</p>
            <button onClick={() => setShowCreateModal(true)} className="text-indigo-600 font-bold hover:underline">Create your first one</button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editId ? 'Rename Wishlist' : 'Create New Wishlist'}</h3>
            <input
              type="text"
              placeholder="List Name"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={editId ? editName : newName}
              onChange={(e) => editId ? setEditName(e.target.value) : setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg">Cancel</button>
              <button onClick={handleCreateOrUpdate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold">
                {editId ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;