import React, { useEffect, useState, useRef } from 'react'
import userConversation from '../../Zustans/useConversation';
import { useAuth } from '../../context/AuthContext';
import { IoArrowBackSharp } from 'react-icons/io5';
import axios from 'axios';
import { useSocketContext } from '../../context/SocketContext';
import notify from '../../assets/sound/notification.mp3';
import { encryptMessage, decryptMessage } from '../../utils/encryption';
import ProfileAvatar from './ProfileAvatar';

const MessageContainer = ({ onBackUser }) => {
    const { messages, selectedConversation, setMessage } = userConversation();
    const { socket } = useSocketContext();
    const { authUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendData, setSendData] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const lastMessageRef = useRef();
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileMetadata, setFileMetadata] = useState({ name: "", type: "" });
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showGallery, setShowGallery] = useState(false);
    const [galleryMedia, setGalleryMedia] = useState([]);

    useEffect(() => {
        socket?.on("newMessage", (newMessage) => {
            if (selectedConversation?._id === newMessage.senderId) {
                const sound = new Audio(notify);
                sound.play();
                setMessage([...messages, newMessage])
            }
        })

        socket?.on("userTyping", (data) => {
            if (selectedConversation?._id === data.userId) {
                setIsTyping(true);
            }
        });

        socket?.on("userStoppedTyping", (data) => {
            if (selectedConversation?._id === data.userId) {
                setIsTyping(false);
            }
        });

        socket?.on("messagesRead", (data) => {
            if (selectedConversation?._id === data.readerId) {
                setMessage(prevMessages =>
                    prevMessages.map(m => ({ ...m, isRead: true }))
                );
            }
        });

        return () => {
            socket?.off("newMessage");
            socket?.off("userTyping");
            socket?.off("userStoppedTyping");
            socket?.off("messagesRead");
        }
    }, [socket, setMessage, messages, selectedConversation?._id])

    useEffect(() => {
        setTimeout(() => {
            lastMessageRef?.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }, [messages, isTyping])

    useEffect(() => {
        const getMessages = async () => {
            setLoading(true);
            try {
                const get = await axios.get(`/api/message/${selectedConversation?._id}`);
                const data = await get.data;
                setLoading(false);
                setMessage(data);
            } catch (error) {
                setLoading(false);
                console.log(error);
            }
        }

        if (selectedConversation?._id) getMessages();
    }, [selectedConversation?._id, setMessage])

    const handleMessages = (e) => {
        setSendData(e.target.value)
        if (socket && selectedConversation) {
            socket.emit("typing", selectedConversation._id);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stopTyping", selectedConversation._id);
            }, 2000);
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileMetadata({ name: file.name, type: file.type });
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                if (file.type.startsWith('image/')) {
                    setSelectedImage(reader.result);
                    setSelectedFile(null);
                } else {
                    setSelectedFile(reader.result);
                    setSelectedImage(null);
                }
            };
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const res = await axios.get(`/api/message/search/${selectedConversation._id}?query=${query}`);
                setSearchResults(res.data);
            } catch (error) {
                console.error(error);
            }
        } else {
            setSearchResults([]);
        }
    }

    const handleOpenGallery = async () => {
        try {
            const res = await axios.get(`/api/message/search/${selectedConversation._id}?mediaOnly=true`);
            setGalleryMedia(res.data);
            setShowGallery(true);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load gallery");
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sendData.trim() && !selectedImage && !selectedFile) return;

        setSending(true);
        try {
            const encryptedText = sendData.trim() 
                ? encryptMessage(sendData, authUser._id, selectedConversation._id) 
                : "";

            const res = await axios.post(`/api/message/send/${selectedConversation?._id}`, {
                messages: encryptedText,
                image: selectedImage,
                file: selectedFile,
                fileName: fileMetadata.name,
                fileType: fileMetadata.type,
                isEncrypted: !!encryptedText
            });
            const data = await res.data;
            setSending(false);
            setSendData('')
            setSelectedImage(null)
            setSelectedFile(null)
            setFileMetadata({ name: "", type: "" })
            setMessage([...messages, data])
        } catch (error) {
            setSending(false);
            console.log(error);
        }
    }

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await axios.delete(`/api/message/delete/${messageId}`);
            setMessage(messages.filter(m => m._id !== messageId));
            toast.success("Message deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete message");
        }
    }

    if (!selectedConversation) {
        return (
            <div className="w-full h-screen flex flex-col bg-[#FFFDF7] text-[#4A443D] items-center justify-center p-6">
                <div className="w-20 h-20 bg-[#D6FFED] rounded-[2rem] flex items-center justify-center mb-6 pastel-shadow">
                    <iconify-icon icon="lucide:message-circle" class="text-4xl text-[#4FD69C]"></iconify-icon>
                </div>
                <h1 className="text-2xl font-bold mb-2">Welcome, {authUser.username}!</h1>
                <p className="text-[#B2A89B] text-center max-w-[200px]">Select a contact from the sidebar to start a conversation</p>
            </div>
        )
    }

    return (
        <div className="w-full h-screen flex flex-col bg-[#FFFDF7] text-[#4A443D]">
            <header className="shrink-0 pt-10 px-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => onBackUser(true)} className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-white text-[#4A443D] pastel-shadow transition-all active:scale-90">
                        <iconify-icon icon="lucide:chevron-left" class="text-2xl"></iconify-icon>
                    </button>
                    <h1 className="text-xl font-bold text-[#4A443D] truncate max-w-[150px]">
                        {selectedConversation?.isGroup ? selectedConversation.groupName : (selectedConversation?.fullname || "Chat")}
                    </h1>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleOpenGallery}
                            className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-white text-[#4A443D] pastel-shadow transition-all active:scale-90"
                        >
                            <iconify-icon icon="lucide:image" class="text-2xl"></iconify-icon>
                        </button>
                        <button 
                            onClick={() => {
                                setShowSearch(!showSearch);
                                if (showSearch) {
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }
                            }} 
                            className={`w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-white text-[#4A443D] pastel-shadow transition-all active:scale-90 ${showSearch ? 'text-[#4FD69C]' : ''}`}
                        >
                            <iconify-icon icon={showSearch ? "lucide:x" : "lucide:search"} class="text-2xl"></iconify-icon>
                        </button>
                        <ProfileAvatar 
                            src={selectedConversation?.isGroup ? selectedConversation.groupPic : selectedConversation?.profilepic} 
                            username={selectedConversation?.isGroup ? selectedConversation.groupName : selectedConversation?.username} 
                        />
                    </div>
                </div>

                {showSearch && (
                    <div className="mb-4 animate-in slide-in-from-top duration-300">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search messages..." 
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-full h-12 pl-12 pr-4 rounded-[1.25rem] bg-white border-none focus:ring-2 focus:ring-[#D6FFED] pastel-shadow text-sm"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B2A89B]">
                                <iconify-icon icon="lucide:search" class="text-xl"></iconify-icon>
                            </div>
                        </div>
                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-white rounded-[1.25rem] pastel-shadow p-2 max-h-40 overflow-y-auto custom-scroll">
                                {searchResults.map((msg, idx) => (
                                    <div key={idx} className="p-2 hover:bg-[#F8FBF9] rounded-xl cursor-pointer text-xs" onClick={() => {
                                        // Scroll to message logic could be added here
                                        setShowSearch(false);
                                    }}>
                                        <p className="line-clamp-1">{decryptMessage(msg.messages, msg.senderId, msg.receiverId)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <div className="relative flex items-center">
                        <span className="absolute left-4 font-bold text-[#B2A89B] text-sm">To:</span>
                        <div className="w-full h-14 pl-12 pr-6 bg-white border-2 border-transparent rounded-[1.5rem] flex items-center pastel-shadow transition-all">
                            <span className="text-[#4FD69C] font-bold bg-[#D6FFED] px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                {selectedConversation.username}
                                <iconify-icon icon="lucide:check" class="text-xs"></iconify-icon>
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col px-6 overflow-hidden">
                <div className="flex-1 bg-white rounded-[2rem] pastel-shadow mb-4 p-6 flex flex-col overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto custom-scroll mb-4 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="loading loading-spinner text-[#4FD69C]"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-30">
                                <iconify-icon icon="lucide:message-square" class="text-5xl mb-2"></iconify-icon>
                                <p>No messages yet</p>
                            </div>
                        ) : (
                                messages.map((message) => {
                                const isMine = message.senderId === authUser._id;
                                const displayMessage = message.isEncrypted 
                                    ? decryptMessage(message.message, message.senderId, message.reciverId) 
                                    : message.message;

                                return (
                                    <div
                                        key={message._id}
                                        ref={lastMessageRef}
                                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-[1.5rem] px-4 py-3 pastel-shadow relative group/msg ${isMine ? 'bg-[#D6FFED] text-[#4A443D] rounded-tr-none' : 'bg-[#F0ECE4] text-[#4A443D] rounded-tl-none'}`}>
                                            {isMine && (
                                                <button 
                                                    onClick={() => handleDeleteMessage(message._id)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-red-400 opacity-0 group-hover/msg:opacity-100 transition-opacity pastel-shadow"
                                                >
                                                    <iconify-icon icon="lucide:trash-2" class="text-xs"></iconify-icon>
                                                </button>
                                            )}
                                            {message.imageUrl && (
                                                <img
                                                    key={message.imageUrl}
                                                    src={message.imageUrl}
                                                    alt="attachment"
                                                    className="w-full max-w-[200px] h-auto rounded-[1rem] mb-2 cursor-pointer"
                                                    onClick={() => window.open(message.imageUrl, '_blank')}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        toast.error("Failed to load image");
                                                    }}
                                                />
                                            )}
                                            {message.fileUrl && (
                                                <div 
                                                    className="flex items-center gap-2 p-2 bg-white/50 rounded-lg mb-2 cursor-pointer hover:bg-white/80 transition-colors"
                                                    onClick={() => window.open(message.fileUrl, '_blank')}
                                                >
                                                    <iconify-icon icon="lucide:file-text" class="text-xl text-[#4FD69C]"></iconify-icon>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-xs font-bold truncate">{message.fileName || "File"}</span>
                                                        <span className="text-[10px] opacity-60 uppercase">{message.fileType?.split('/')[1] || "DOC"}</span>
                                                    </div>
                                                    <iconify-icon icon="lucide:download" class="text-sm ml-auto opacity-40"></iconify-icon>
                                                </div>
                                            )}
                                            <p className="text-sm leading-relaxed">
                                                {displayMessage}
                                                {message.isEncrypted && (
                                                    <iconify-icon icon="lucide:lock" class="text-[10px] ml-1 opacity-30" title="End-to-End Encrypted"></iconify-icon>
                                                )}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-1 opacity-40 text-[10px]">
                                                <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMine && (
                                                    <iconify-icon icon={message.isRead ? "lucide:check-check" : "lucide:check"} class={message.isRead ? "text-blue-500" : ""}></iconify-icon>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-[#F0ECE4] rounded-[1.5rem] rounded-tl-none px-4 py-2 pastel-shadow">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-[#B2A89B] rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-[#B2A89B] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-[#B2A89B] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="pt-4 border-t border-[#FFFDF7]">
                        {selectedImage && (
                            <div className="relative mb-4 inline-block">
                                <img src={selectedImage} alt="preview" className="w-20 h-20 object-cover rounded-[1rem] pastel-shadow" />
                                <button
                                    type="button"
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-white text-[#D86E9A] rounded-full w-6 h-6 flex items-center justify-center pastel-shadow text-xs"
                                >
                                    <iconify-icon icon="lucide:x"></iconify-icon>
                                </button>
                            </div>
                        )}
                        {selectedFile && (
                            <div className="relative mb-4 inline-flex items-center gap-3 bg-[#F0ECE4] px-4 py-3 rounded-[1rem] pastel-shadow border border-white/50">
                                <iconify-icon icon="lucide:file" class="text-2xl text-[#4FD69C]"></iconify-icon>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold truncate max-w-[150px]">{fileMetadata.name}</span>
                                    <span className="text-[10px] opacity-60 uppercase">{fileMetadata.type?.split('/')[1] || "FILE"}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedFile(null); setFileMetadata({ name: "", type: "" }); }}
                                    className="ml-2 bg-white/50 text-[#D86E9A] rounded-full w-5 h-5 flex items-center justify-center hover:bg-white transition-colors"
                                >
                                    <iconify-icon icon="lucide:x" class="text-xs"></iconify-icon>
                                </button>
                            </div>
                        )}
                        <div className="flex items-end gap-3">
                            <div className="flex-1 min-h-[56px] relative">
                                <textarea
                                    value={sendData}
                                    onChange={handleMessages}
                                    placeholder="Write your message here..."
                                    className="w-full min-h-[56px] max-h-32 py-4 px-0 bg-transparent resize-none text-base text-[#4A443D] placeholder:text-[#D1C8BC] focus:outline-none leading-relaxed"
                                    rows="1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                ></textarea>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-10 h-10 flex items-center justify-center text-[#B2A89B] active:scale-90 transition-transform"
                                >
                                    <iconify-icon icon="lucide:paperclip" class="text-xl"></iconify-icon>
                                </button>
                                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />
                                <button
                                    type="submit"
                                    disabled={sending || (!sendData.trim() && !selectedImage && !selectedFile)}
                                    className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center pastel-shadow active:scale-95 transition-all ${sending || (!sendData.trim() && !selectedImage && !selectedFile) ? 'bg-gray-100 text-gray-300' : 'bg-[#FFD6E8] text-[#D86E9A]'}`}
                                >
                                    {sending ? (
                                        <div className="loading loading-spinner loading-sm"></div>
                                    ) : (
                                        <iconify-icon icon="lucide:send" class="text-2xl"></iconify-icon>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
            {showGallery && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[#FFFDF7] w-full max-w-4xl max-h-[80vh] rounded-[2.5rem] pastel-shadow flex flex-col overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[#4A443D]">Shared Media</h2>
                            <button onClick={() => setShowGallery(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white pastel-shadow">
                                <iconify-icon icon="lucide:x" class="text-xl text-[#B2A89B]"></iconify-icon>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scroll">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {galleryMedia.length > 0 ? galleryMedia.map((msg, idx) => (
                                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden pastel-shadow bg-white group cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')}>
                                        <img src={msg.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Gallery item" />
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 flex flex-col items-center gap-4 text-[#B2A89B]">
                                        <iconify-icon icon="lucide:image-off" class="text-4xl"></iconify-icon>
                                        <p>No media shared yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MessageContainer