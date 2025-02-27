// src/components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import { useSession } from 'next-auth/react';

interface UserProfileData {
  name: string;
  email: string;
  image?: string;
  bio?: string;
  skills?: string[];
  department?: string;
  phoneNumber?: string;
}

const UserProfile: React.FC = () => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    image: session?.user?.image || '',
    bio: '',
    skills: [],
    department: '',
    phoneNumber: ''
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: (updatedProfile) => {
      setProfileData({
        name: updatedProfile.name || '',
        email: updatedProfile.email || '',
        image: updatedProfile.image || '',
        bio: updatedProfile.bio || '',
        skills: updatedProfile.skills || [],
        department: updatedProfile.department || '',
        phoneNumber: updatedProfile.phoneNumber || ''
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Failed to update profile', error);
      alert('Failed to update profile. Please try again.');
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setProfileData(prev => ({
      ...prev,
      skills
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      name: profileData.name,
      bio: profileData.bio,
      skills: profileData.skills,
      department: profileData.department,
      phoneNumber: profileData.phoneNumber
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Profile</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              disabled
              className="w-full px-3 py-2 border rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block mb-2">Bio</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
          <div>
            <label className="block mb-2">Skills (comma-separated)</label>
            <input
              type="text"
              name="skills"
              value={profileData.skills?.join(', ') || ''}
              onChange={handleSkillsChange}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g., React, Node.js, Python"
            />
          </div>
          <div>
            <label className="block mb-2">Department</label>
            <input
              type="text"
              name="department"
              value={profileData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={profileData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
              pattern="[0-9]{10}"
              placeholder="10-digit phone number"
            />
          </div>
          <button 
            type="submit"
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={updateProfileMutation.isLoading}
          >
            {updateProfileMutation.isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <strong>Name:</strong> {profileData.name}
          </div>
          <div>
            <strong>Email:</strong> {profileData.email}
          </div>
          {profileData.bio && (
            <div>
              <strong>Bio:</strong> {profileData.bio}
            </div>
          )}
          {profileData.skills && profileData.skills.length > 0 && (
            <div>
              <strong>Skills:</strong> {profileData.skills.join(', ')}
            </div>
          )}
          {profileData.department && (
            <div>
              <strong>Department:</strong> {profileData.department}
            </div>
          )}
          {profileData.phoneNumber && (
            <div>
              <strong>Phone:</strong> {profileData.phoneNumber}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;