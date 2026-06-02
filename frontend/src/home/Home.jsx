import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import MessageContainer from './components/MessageContainer';

const Home = () => {

  const [selectedUser , setSelectedUser] = useState(null);
  const [isSidebarVisible , setIsSidebarVisible]= useState(true);

  const handelUserSelect=(user)=>{
    setSelectedUser(user);
    setIsSidebarVisible(false);
  }
  const handelShowSidebar=()=>{
    setIsSidebarVisible(true);
    setSelectedUser(null);
  }
  return (
    <div className='flex justify-between w-full h-screen bg-[#FFFDF7]'>
      <div className={`w-full h-full md:w-1/3 border-r border-[#F0ECE4] ${isSidebarVisible ? 'block' : 'hidden md:block'}`}>
        <Sidebar onSelectUser={handelUserSelect} />
      </div>
      <div className={`flex-1 h-full ${!isSidebarVisible ? 'block' : 'hidden md:block'}`}>
        <MessageContainer onBackUser={handelShowSidebar} />
      </div>
    </div>
  );

};

export default Home;