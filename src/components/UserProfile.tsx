// src/components/UserProfile.tsx
import React, { useState } from 'react';
import { trpc } from '~/utils/trpc';

interface UserProfileProps {
  userData?: any;
}

export default function UserProfile({ userData }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    bio: userData?.bio || '',
    department: userData?.department || '',
    phoneNumber: userData?.phoneNumber || '',
    skills: userData?.skills?.join(', ') || '',
  });
  
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      // Refetch user data
      refetch();
    },
  });
  
  const { refetch } = trpc.user.getProfile.useQuery(undefined, {
    initialData: userData,
    enabled: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        bio: formData.bio,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const startEditing = () => {
    setFormData({
      name: userData?.name || '',
      bio: userData?.bio || '',
      department: userData?.department || '',
      phoneNumber: userData?.phoneNumber || '',
      skills: userData?.skills?.join(', ') || '',
    });
    setIsEditing(true);
  };

  if (!userData) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
            {!isEditing && (
              <button
                onClick={startEditing}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {isEditing ? (
            // Edit Profile Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Project Management, UI Design, JavaScript"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={updateProfileMutation.isLoading}
                >
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            // Profile Display
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 text-3xl font-bold">
                  {userData.name?.charAt(0) || 'U'}
                </div>
                <div className="mt-4 md:mt-0 md:ml-6">
                  <h3 className="text-2xl font-bold text-gray-800">{userData.name || 'User'}</h3>
                  <p className="text-gray-600">{userData.email}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Bio</h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {userData.bio || 'No bio provided.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Department</h4>
                  <p className="text-gray-600">{userData.department || 'Not specified'}</p>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Phone Number</h4>
                  <p className="text-gray-600">{userData.phoneNumber || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Skills</h4>
                {userData.skills && userData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No skills listed.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}