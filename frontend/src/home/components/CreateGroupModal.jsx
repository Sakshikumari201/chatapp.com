import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProfileAvatar from './ProfileAvatar';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const fetchUsers = async () => {
                try {
                    const res = await axios.get(`/api/user/search?search=${searchTerm}`);
                    setSearchResults(res.data);
                } catch (error) {
                    console.error(error);
                }
            };
            fetchUsers();
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const handleSelectUser = (user) => {
        if (selectedUsers.some(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreate = async () => {
        if (!groupName || selectedUsers.length < 2) {
            return toast.warn("Group name and at least 2 members are required");
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/message/group', {
                groupName,
                groupDescription,
                participants: selectedUsers.map(u => u._id)
            });
            toast.success("Group created!");
            onGroupCreated(res.data);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#FFFDF7] w-full max-w-md rounded-[2.5rem] pastel-shadow p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#4A443D]">Create New Group</h2>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white pastel-shadow active:scale-90 transition-all">
                        <iconify-icon icon="lucide:x" class="text-xl text-[#B2A89B]"></iconify-icon>
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        placeholder="Group Name" 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full h-12 px-6 rounded-2xl bg-white border-none focus:ring-2 focus:ring-[#D6FFED] pastel-shadow text-sm"
                    />
                    <textarea 
                        placeholder="Group Description (optional)" 
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-white border-none focus:ring-2 focus:ring-[#D6FFED] pastel-shadow text-sm h-24 resize-none"
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-[#B2A89B] ml-2">Add Members (min. 2)</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 px-6 rounded-2xl bg-white border-none focus:ring-2 focus:ring-[#D6FFED] pastel-shadow text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto custom-scroll">
                        {selectedUsers.map(user => (
                            <div key={user._id} className="flex items-center gap-2 bg-[#D6FFED] px-3 py-1.5 rounded-full border-2 border-white pastel-shadow">
                                <span className="text-[10px] font-bold text-[#4A443D]">{user.username}</span>
                                <button onClick={() => handleSelectUser(user)}>
                                    <iconify-icon icon="lucide:x" class="text-xs text-[#4FD69C]"></iconify-icon>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="max-h-40 overflow-y-auto custom-scroll space-y-2">
                        {searchResults.map(user => (
                            <div 
                                key={user._id} 
                                onClick={() => handleSelectUser(user)}
                                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedUsers.some(u => u._id === user._id) ? 'bg-[#D6FFED]' : 'bg-white hover:bg-[#F8FBF9]'}`}
                            >
                                <ProfileAvatar src={user.profilepic} username={user.username} className="w-8 h-8" />
                                <span className="text-sm font-bold text-[#4A443D]">{user.username}</span>
                                {selectedUsers.some(u => u._id === user._id) && (
                                    <iconify-icon icon="lucide:check" class="ml-auto text-[#4FD69C]"></iconify-icon>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleCreate}
                    disabled={loading || !groupName || selectedUsers.length < 2}
                    className={`w-full h-14 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${loading || !groupName || selectedUsers.length < 2 ? 'bg-[#F0ECE4] text-[#B2A89B]' : 'bg-[#4FD69C] text-white pastel-shadow'}`}
                >
                    {loading ? <div className="loading loading-spinner"></div> : (
                        <>
                            <iconify-icon icon="lucide:users" class="text-xl"></iconify-icon>
                            Create Group
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreateGroupModal;
