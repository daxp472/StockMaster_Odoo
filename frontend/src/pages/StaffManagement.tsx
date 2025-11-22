import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, User, Mail, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { registerStaff, updateStaffStatus, deleteWarehouseStaff, fetchWarehouseStaff } from '../store/slices/authSlice';

export const StaffManagement: React.FC = () => {
  const { warehouseStaff, user } = useTypedSelector((state) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  
  // Fetch staff on mount
  useEffect(() => {
    dispatch(fetchWarehouseStaff());
  }, [dispatch]);

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const staffData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: 'warehouse_staff' as const,
    };

    try {
      await dispatch(registerStaff(staffData)).unwrap();
      
      setShowModal(false);
      setEditingStaff(null);
      setFormData({ name: '', email: '', password: '', isActive: true });
      
      // Refresh staff list
      dispatch(fetchWarehouseStaff());
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to create staff'));
    }
  };

  const handleEdit = (staff: any) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '',
      isActive: staff.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await dispatch(deleteWarehouseStaff(id)).unwrap();
      } catch (error: any) {
        alert('Error: ' + (error.message || 'Failed to delete staff'));
      }
    }
  };

  const toggleStaffStatus = async (staff: any) => {
    try {
      await dispatch(updateStaffStatus({ staffId: staff.id, isActive: !staff.isActive })).unwrap();
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to update status'));
    }
  };

  const StaffModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {editingStaff ? 'Edit Warehouse Staff' : 'Add New Warehouse Staff'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1 w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              {editingStaff ? 'New Password (optional)' : 'Password'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingStaff}
              className="mt-1 w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4"
            />
            <label className="ml-2 text-sm">Active Account</label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingStaff(null);
              }}
              className="px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-md"
            >
              {editingStaff ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Warehouse Staff Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-white bg-purple-600 rounded-md"
        >
          <Plus className="w-4 h-4 inline-block mr-2" /> Add Staff
        </button>
      </div>

      {/* Staff List */}
      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3">Staff Member</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {warehouseStaff.map((staff) => (
              <tr key={staff.id}>
                <td className="px-6 py-4">{staff.name}</td>
                <td className="px-6 py-4">{staff.email}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStaffStatus(staff)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      staff.isActive ? 'bg-green-200' : 'bg-red-200'
                    }`}
                  >
                    {staff.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  {new Date(staff.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 flex space-x-2">
                  <button
                    onClick={() => handleEdit(staff)}
                    className="text-indigo-600"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(staff.id)}
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <StaffModal />}
    </div>
  );
};
