import React, { useEffect, useState,useRef  } from 'react'
import userConversation from '../../Zustans/useConversation';
import { useAuth } from '../../context/AuthContext';
import { TiMessages } from "react-icons/ti";
import { IoArrowBackSharp, IoSend } from 'react-icons/io5';
import { FaImage } from 'react-icons/fa';
import axios from 'axios';
import { useSocketContext } from '../../context/SocketContext';
import notify from '../../assets/sound/notification.mp3';

const MessageContainer = ({ onBackUser }) => {
    const { messages, selectedConversation, setMessage, setSelectedConversation } = userConversation();
    const {socket} = useSocketContext();
    const { authUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [sending , setSending] = useState(false);
    const [sendData , setSnedData] = useState("")
    const [selectedImage, setSelectedImage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const lastMessageRef = useRef();
    const fileInputRef = useRef(null);

    useEffect(()=>{
      socket?.on("newMessage",(newMessage)=>{
        const sound = new Audio(notify);
        sound.play();
        setMessage([...messages,newMessage])
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

      return ()=> {
          socket?.off("newMessage");
          socket?.off("userTyping");
          socket?.off("userStoppedTyping");
          socket?.off("messagesRead");
      }
    },[socket,setMessage,messages, selectedConversation?._id])

    useEffect(()=>{
        setTimeout(()=>{
            lastMessageRef?.current?.scrollIntoView({behavior:"smooth"})
        },100)
    },[messages])

    useEffect(() => {
        const getMessages = async () => {
            setLoading(true);
            try {
                const get = await axios.get(`/api/message/${selectedConversation?._id}`);
                const data = await get.data;
                if (data.success === false) {
                    setLoading(false);
                    console.log(data.message);
                }
                setLoading(false);
                setMessage(data);
            } catch (error) {
                setLoading(false);
                console.log(error);

            }
        }

        if (selectedConversation?._id) getMessages();
    }, [selectedConversation?._id, setMessage])
    console.log(messages);

    const handelMessages=(e)=>{
        setSnedData(e.target.value)
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
        }
    };

    const handelSubmit=async(e)=>{
        e.preventDefault();
        if (!sendData.trim() && !selectedImage) return;

        setSending(true);
        try {
            const res =await axios.post(`/api/message/send/${selectedConversation?._id}`,{
                messages:sendData,
                image: selectedImage
            });
            const data = await res.data;
            if (data.success === false) {
                setSending(false);
                console.log(data.message);
            }
            setSending(false);
            setSnedData('')
            setSelectedImage(null)
            setMessage([...messages,data])
        } catch (error) {
            setSending(false);
            console.log(error);
        }
    }

    return (
        <div className='md:min-w-[500px] h-[99%] flex flex-col py-2'>
        {selectedConversation === null ? (
          <div className='flex items-center justify-center w-full h-full'>
            <div className='px-4 text-center text-2xl text-gray-950 font-semibold 
            flex flex-col items-center gap-2'>
              <p className='text-2xl'>Welcome!!👋 {authUser.username}😉</p>
              <p className="text-lg">Select a chat to start messaging</p>
              <TiMessages className='text-6xl text-center' />
            </div>
          </div>
        ) : (
          <>
            <div className='flex justify-between gap-1 bg-sky-600 md:px-2 rounded-lg h-10 md:h-12'>
              <div className='flex gap-2 md:justify-between items-center w-full'>
                <div className='md:hidden ml-1 self-center'>
                  <button onClick={() => onBackUser(true)} className='bg-white rounded-full px-2 py-1
                   self-center'>
                    <IoArrowBackSharp size={25} />
                  </button>
                </div>
                <div className='flex justify-between mr-2 gap-2'>
                  <div className='self-center'>
                    <img className='rounded-full w-6 h-6 md:w-10 md:h-10 cursor-pointer' src={selectedConversation?.profilepic} />
                  </div>
                  <span className='text-gray-950 self-center text-sm md:text-xl font-bold'>
                    {selectedConversation?.username}
                  </span>
                </div>
              </div>
            </div>
      
            <div className='flex-1 overflow-auto'>
              {loading && (
                <div className="flex w-full h-full flex-col items-center justify-center 
                gap-4 bg-transparent">
                  <div className="loading loading-spinner"></div>
                </div>
              )}
              {!loading && messages?.length === 0 && (
                <p className='text-center text-white items-center'>Send a message to 
                start Conversation</p>
              )}
              {!loading && messages?.length > 0 && messages?.map((message) => (
                <div className='text-white' key={message?._id} ref={lastMessageRef}>
                  <div className={`chat ${message.senderId === authUser._id ? 'chat-end' : 'chat-start'}`}>
                    <div className='chat-image avatar'></div>
                    <div className={`chat-bubble ${message.senderId === authUser._id ? 'bg-sky-600' : ''

                    }`}>
                      {message.imageUrl && (
                          <img src={message.imageUrl} alt="attachment" className="w-48 h-auto rounded-lg mb-2 cursor-pointer" onClick={() => window.open(message.imageUrl, '_blank')} />
                      )}
                      {message?.message}
                    </div>
                    <div className="chat-footer text-[10px] opacity-80 flex gap-1 items-center">
                      {new Date(message?.createdAt).toLocaleDateString('en-IN')}
                      {new Date(message?.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute:
                         'numeric' })}
                      {message.senderId === authUser._id && (
                          <span className={message.isRead ? "text-blue-500 font-bold" : "text-gray-400 font-bold"}>
                              {message.isRead ? "✓✓" : "✓"}
                          </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                  <div className='chat chat-start'>
                      <div className='chat-image avatar'></div>
                      <div className='chat-bubble bg-gray-500 opacity-70 text-sm'>
                          typing...
                      </div>
                  </div>
              )}
            </div>
            <form onSubmit={handelSubmit} className='rounded-full text-black'>
            {selectedImage && (
                <div className="relative mb-2 w-24">
                    <img src={selectedImage} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
                    <button type="button" onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs translate-x-1/2 -translate-y-1/2">✕</button>
                </div>
            )}
            <div className='w-full rounded-full flex items-center bg-white pr-1'>
              <FaImage size={24} className="text-gray-500 ml-4 cursor-pointer hover:text-sky-600" onClick={() => fileInputRef.current?.click()} />
              <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
              <input value={sendData} onChange={handelMessages} id='message' type='text' placeholder='Type a message'
              className='w-full bg-transparent outline-none px-4 py-3 rounded-full'/>
              <button type='submit'>
                {sending ? <div className='loading loading-spinner'></div>:
                <IoSend size={25}
                className='text-sky-700 cursor-pointer rounded-full bg-gray-800 w-10 h-auto p-1'/>
                }
              </button>
            </div>
            </form>
          </>
        )}
      </div>
    )
}

export default MessageContainer