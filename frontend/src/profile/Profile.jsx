import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ProfileAvatar from '../home/components/ProfileAvatar';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authUser, setAuthUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullname: "",
        username: "",
        bio: ""
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const res = await axios.get(`/api/user/${id}`);
                setUser(res.data);
                setFormData({
                    fullname: res.data.fullname,
                    username: res.data.username,
                    bio: res.data.bio || "Hello there! I am using ChatApp."
                });
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load profile");
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, [id]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put('/api/user/update', formData);
            if (res.data.success) {
                toast.success("Profile updated!");
                setUser(res.data.user);
                setAuthUser(res.data.user);
                localStorage.setItem('chatapp', JSON.stringify(res.data.user));
                setIsEditing(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                handleImageUpload(reader.result);
            };
        }
    };

    const handleImageUpload = async (base64Image) => {
        setUploading(true);
        try {
            const res = await axios.post('/api/user/update-profile-pic', { profilepic: base64Image });
            if (res.data.success) {
                toast.success("Profile picture updated!");
                setUser(res.data.user);
                // Update AuthContext and LocalStorage
                const updatedAuthUser = { ...authUser, profilepic: res.data.user.profilepic };
                setAuthUser(updatedAuthUser);
                localStorage.setItem('chatapp', JSON.stringify(updatedAuthUser));
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#FFFDF7]">
            <div className="loading loading-spinner text-[#4FD69C]"></div>
        </div>
    );

    if (!user) return (
        <div className="flex items-center justify-center h-screen bg-[#FFFDF7]">
            <p className="text-[#4A443D] font-bold">User not found</p>
        </div>
    );

    return (
        <div className="w-full h-screen flex flex-col bg-[#FFFDF7] text-[#4A443D]">
            <header className="shrink-0 pt-10 px-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-white text-[#4A443D] pastel-shadow transition-all active:scale-90">
                        <iconify-icon icon="lucide:chevron-left" class="text-2xl"></iconify-icon>
                    </button>
                    <h1 className="text-xl font-bold text-[#4A443D]">Profile</h1>
                    <div className="w-12 h-12"></div> {/* Spacer */}
                </div>
            </header>

            <main className="flex-1 px-6 overflow-y-auto custom-scroll">
                <div className="bg-white rounded-[2.5rem] pastel-shadow p-8 flex flex-col items-center mb-8">
                    <div className="relative group">
                        <ProfileAvatar 
                            src={user.profilepic} 
                            username={user.username} 
                            className={`w-32 h-32 mb-6 ${uploading ? 'opacity-50' : ''}`}
                            onClick={() => setShowPreview(true)}
                        />
                        {authUser._id === user._id && !isEditing && (
                            <>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute bottom-6 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#D86E9A] pastel-shadow hover:scale-110 transition-transform active:scale-90"
                                >
                                    {uploading ? (
                                        <div className="loading loading-spinner loading-xs"></div>
                                    ) : (
                                        <iconify-icon icon="lucide:camera" class="text-xl"></iconify-icon>
                                    )}
                                </button>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    hidden 
                                    ref={fileInputRef} 
                                    onChange={handleImageChange} 
                                />
                            </>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className="w-full flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-[#B2A89B] ml-2">Full Name</label>
                                <input 
                                    type="text" 
                                    value={formData.fullname}
                                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                                    className="w-full h-12 px-6 rounded-2xl bg-[#FFFDF7] border-none focus:ring-2 focus:ring-[#D6FFED] text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-[#B2A89B] ml-2">Username</label>
                                <input 
                                    type="text" 
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full h-12 px-6 rounded-2xl bg-[#FFFDF7] border-none focus:ring-2 focus:ring-[#D6FFED] text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-[#B2A89B] ml-2">Bio</label>
                                <textarea 
                                    value={formData.bio}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    className="w-full p-4 rounded-2xl bg-[#FFFDF7] border-none focus:ring-2 focus:ring-[#D6FFED] text-sm h-24 resize-none"
                                />
                            </div>
                            <div className="flex gap-4 mt-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-12 rounded-2xl bg-[#F0ECE4] font-bold text-sm transition-all active:scale-95">Cancel</button>
                                <button type="submit" className="flex-1 h-12 rounded-2xl bg-[#4FD69C] text-white font-bold text-sm transition-all active:scale-95">Save Changes</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-[#4A443D] mb-1">{user.fullname}</h2>
                            <p className="text-[#B2A89B] font-medium mb-4">@{user.username}</p>
                            <p className="text-[#4A443D] text-sm text-center mb-6 max-w-xs">{user.bio || "Hello there! I am using ChatApp."}</p>
                            
                            {authUser._id === user._id && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="w-full h-12 rounded-2xl bg-[#D6FFED] text-[#4FD69C] font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <iconify-icon icon="lucide:edit-3"></iconify-icon>
                                    Edit Profile
                                </button>
                            )}
                        </>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex flex-col gap-4 mb-10">
                        <div className="flex gap-4">
                            <div className="flex-1 bg-white rounded-[2rem] p-6 pastel-shadow flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-[#B2A89B] uppercase tracking-widest">Gender</span>
                                <span className="text-[#4A443D] font-bold capitalize">{user.gender}</span>
                            </div>
                            <div className="flex-1 bg-white rounded-[2rem] p-6 pastel-shadow flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-[#B2A89B] uppercase tracking-widest">Status</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span className="text-[#4A443D] font-bold">Active</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 pastel-shadow flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-[#F0ECE4] flex items-center justify-center text-[#B2A89B]">
                                <iconify-icon icon="lucify:mail" class="text-xl"></iconify-icon>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[#B2A89B] uppercase tracking-widest">Email</span>
                                <span className="text-[#4A443D] font-bold text-sm">{user.email}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 pastel-shadow flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-[#F0ECE4] flex items-center justify-center text-[#B2A89B]">
                                <iconify-icon icon="lucify:calendar" class="text-xl"></iconify-icon>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[#B2A89B] uppercase tracking-widest">Joined</span>
                                <span className="text-[#4A443D] font-bold text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {showPreview && (
                <div 
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setShowPreview(false)}
                >
                    <button className="absolute top-10 right-6 text-white text-3xl">
                        <iconify-icon icon="lucide:x"></iconify-icon>
                    </button>
                    <img 
                        src={user.profilepic || `https://ui-avatars.com/api/?name=${user.username}&background=random&size=512`} 
                        className="max-w-full max-h-full rounded-2xl shadow-2xl" 
                        alt="Preview" 
                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=random&size=512`}
                    />
                </div>
            )}
        </div>
    );
};

export default Profile;
