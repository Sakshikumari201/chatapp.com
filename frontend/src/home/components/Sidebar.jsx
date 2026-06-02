import React, { useEffect, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import axios from 'axios';
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'
import { IoArrowBackSharp } from 'react-icons/io5';
import { BiLogOut } from "react-icons/bi";
import userConversation from '../../Zustans/useConversation';
import { useSocketContext } from '../../context/SocketContext';
import ProfileAvatar from './ProfileAvatar';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = ({ onSelectUser }) => {
    const navigate = useNavigate();
    const { authUser, setAuthUser } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [searchUser, setSearchuser] = useState([]);
    const [chatUser, setChatUser] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const { messages, setMessage, selectedConversation, setSelectedConversation } = userConversation();
    const { onlineUser, socket } = useSocketContext();

    useEffect(() => {
        socket?.on("newMessage", (newMessage) => {
            setChatUser(prevUsers => prevUsers.map(user => {
                if (user._id === newMessage.senderId && selectedConversation?._id !== user._id) {
                    return { ...user, unreadCount: (user.unreadCount || 0) + 1 };
                }
                return user;
            }));
        })
        return () => socket?.off("newMessage");
    }, [socket, selectedConversation?._id])

    useEffect(() => {
        const chatUserHandler = async () => {
            setLoading(true)
            try {
                const chatters = await axios.get(`/api/user/currentchatters`)
                const data = chatters.data;
                if (data.success === false) {
                    setLoading(false)
                    console.log(data.message);
                }
                setLoading(false)
                setChatUser(data)
            } catch (error) {
                setLoading(false)
                console.log(error);
            }
        }
        chatUserHandler()
    }, [])

    const handelSearchSubmit = async (e) => {
        e?.preventDefault();
        if (!searchInput) {
            setSearchuser([]);
            return;
        }
        setLoading(true)
        try {
            const search = await axios.get(`/api/user/search?search=${searchInput}`);
            const data = search.data;
            if (data.success === false) {
                setLoading(false)
                console.log(data.message);
            }
            setLoading(false)
            if (data.length === 0) {
                toast.info("User Not Found")
            } else {
                setSearchuser(data)
            }
        } catch (error) {
            setLoading(false)
            console.log(error);
        }
    }

    const handelUserClick = (user) => {
        onSelectUser(user);
        setSelectedConversation(user);
        setSelectedUserId(user._id);
        setChatUser(prevUsers => prevUsers.map(u => {
            if (u._id === user._id) {
                return { ...u, unreadCount: 0 };
            }
            return u;
        }));
    }

    const handSearchback = () => {
        setSearchuser([]);
        setSearchInput('')
    }

    const handelLogOut = async () => {
        const confirmlogout = window.confirm("Are you sure you want to LogOut?");
        if (confirmlogout) {
            setLoading(true)
            try {
                const logout = await axios.post('/api/auth/logout')
                const data = logout.data;
                if (data?.success === false) {
                    setLoading(false)
                    console.log(data?.message);
                }
                toast.info(data?.message)
                localStorage.removeItem('chatapp')
                setAuthUser(null)
                setLoading(false)
                navigate('/login')
            } catch (error) {
                setLoading(false)
                console.log(error);
            }
        }
    }

    return (
        <div className='w-full h-full flex flex-col bg-[#FFFDF7] text-[#4A443D]'>
            <header className="shrink-0 pt-10 px-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={handelLogOut} className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-white text-[#4A443D] pastel-shadow transition-all active:scale-90">
                        <iconify-icon icon="lucide:log-out" class="text-2xl text-red-400"></iconify-icon>
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl font-bold text-[#4A443D]">Chats</h1>
                        <button 
                            onClick={() => setShowCreateGroup(true)}
                            className="text-[10px] font-bold text-[#4FD69C] uppercase tracking-widest hover:underline"
                        >
                            + Create Group
                        </button>
                    </div>
                    <ProfileAvatar 
                        src={authUser?.profilepic} 
                        username={authUser?.username} 
                        onClick={() => navigate(`/profile/${authUser?._id}`)} 
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <form onSubmit={handelSearchSubmit} className="relative flex items-center">
                        <span className="absolute left-4 font-bold text-[#B2A89B] text-sm">To:</span>
                        <input
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                if (!e.target.value) setSearchuser([]);
                            }}
                            type="text"
                            placeholder="Search for people..."
                            className="w-full h-14 pl-12 pr-6 bg-white border-2 border-transparent focus:border-[#D6FFED] rounded-[1.5rem] text-base placeholder:text-[#D1C8BC] focus:outline-none pastel-shadow transition-all"
                        />
                        {searchInput && (
                            <button type="submit" className="absolute right-4 text-[#B2A89B] hover:text-[#4FD69C]">
                                <iconify-icon icon="lucide:search" class="text-xl"></iconify-icon>
                            </button>
                        )}
                    </form>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-6 overflow-hidden">
                <div className="mb-4 overflow-hidden">
                    <h2 className="text-xs font-bold text-[#B2A89B] uppercase tracking-wider mb-4">
                        {searchUser.length > 0 ? 'Search Results' : 'Recent Contacts'}
                    </h2>
                    <div className="flex gap-4 overflow-x-auto custom-scroll pb-2">
                        {(searchUser.length > 0 ? searchUser : chatUser).map((user) => (
                            <div
                                key={user._id}
                                onClick={() => handelUserClick(user)}
                                className="flex flex-col items-center gap-2 cursor-pointer group"
                            >
                                <div className={`w-14 h-14 rounded-full p-0.5 transition-all group-hover:scale-105 ${selectedUserId === user._id ? 'bg-gradient-to-tr from-[#FFD6E8] to-[#D6FFED]' : 'bg-white pastel-shadow'}`}>
                                    <div className="relative w-full h-full">
                                        <ProfileAvatar 
                                            src={user.profilepic} 
                                            username={user.username} 
                                            className="w-full h-full"
                                        />
                                        {onlineUser.includes(user._id) && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                                        )}
                                        {user.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                {user.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-[11px] font-semibold ${selectedUserId === user._id ? 'text-[#D86E9A]' : 'text-[#4A443D]'}`}>
                                    {user.username}
                                </span>
                            </div>
                        ))}
                        {chatUser.length === 0 && searchUser.length === 0 && (
                            <p className="text-xs text-[#B2A89B]">Search for someone to start chatting!</p>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scroll">
                    <h2 className="text-xs font-bold text-[#B2A89B] uppercase tracking-wider mb-4">Messages</h2>
                    <div className="flex flex-col gap-3">
                        {chatUser.map((user) => (
                            <div
                                key={user._id}
                                onClick={() => handelUserClick(user)}
                                className={`flex items-center gap-4 p-4 rounded-[1.5rem] transition-all cursor-pointer ${selectedUserId === user._id ? 'bg-[#D6FFED] pastel-shadow' : 'bg-white hover:bg-[#F8FBF9]'}`}
                            >
                                <ProfileAvatar 
                                    src={user.profilepic} 
                                    username={user.username} 
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm text-[#4A443D]">{user.username}</h3>
                                    <p className="text-xs text-[#B2A89B] line-clamp-1">Tap to chat</p>
                                </div>
                                {user.unreadCount > 0 && (
                                    <div className="w-5 h-5 bg-[#D86E9A] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                        {user.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="shrink-0 bg-white px-8 pt-4 pb-[34px] flex items-center justify-between rounded-t-[2.5rem] pastel-shadow">
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all group-active:scale-90 bg-[#D6FFED] text-[#4FD69C]">
                        <iconify-icon icon="lucide:layout-grid" class="text-2xl"></iconify-icon>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#4FD69C]">Space</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all group-active:scale-90 text-[#B2A89B] hover:bg-[#FFD6E8] hover:text-[#D86E9A]">
                        <iconify-icon icon="lucide:message-circle" class="text-2xl"></iconify-icon>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B2A89B]">Chats</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all group-active:scale-90 text-[#B2A89B] hover:bg-[#EBD6FF] hover:text-[#8E6BBF]">
                        <iconify-icon icon="lucide:phone" class="text-2xl"></iconify-icon>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B2A89B]">Calls</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => navigate(`/profile/${authUser?._id}`)}>
                    <ProfileAvatar 
                        src={authUser?.profilepic} 
                        username={authUser?.username} 
                        className="w-12 h-12"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B2A89B]">Me</span>
                </div>
            </footer>

            <CreateGroupModal 
                isOpen={showCreateGroup} 
                onClose={() => setShowCreateGroup(false)} 
                onGroupCreated={(newGroup) => {
                    setChatUser([newGroup, ...chatUser]);
                    onSelectUser(newGroup);
                }}
            />
        </div>
    )
}

export default Sidebar