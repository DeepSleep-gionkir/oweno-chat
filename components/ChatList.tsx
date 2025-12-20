
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db, auth } from '../services/firebaseService';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";

interface ChatListProps {
  currentUser: User;
  onChatSelect: (user: User) => void;
}

const ChatList: React.FC<ChatListProps> = ({ currentUser, onChatSelect }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // 본인을 제외한 모든 가입된 사용자 가져오기
    const q = query(collection(db, "users"), where("id", "!=", currentUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => doc.data() as User);
      setUsers(userList);
    });
    return () => unsubscribe();
  }, [currentUser.id]);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in slide-in-from-right duration-300">
      <header className="px-6 py-6 flex justify-between items-center border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">대화</h1>
        <div className="flex items-center gap-3">
            <button onClick={() => signOut(auth)} className="text-xs text-gray-400 hover:text-red-500">로그아웃</button>
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-indigo-100">
                <img src={currentUser.avatar} alt="Me" />
            </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-2 pb-20">
        <div className="p-4">
          <div className="space-y-1">
            {users.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">등록된 친구가 없습니다.</p>
            ) : (
                users.map(user => (
                    <div 
                      key={user.id} 
                      onClick={() => onChatSelect(user)}
                      className="flex items-center p-3 rounded-2xl hover:bg-indigo-50 active:bg-indigo-100 cursor-pointer transition-colors group"
                    >
                      <div className="relative">
                        <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-300'} border-2 border-white rounded-full`}></span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{user.bio}</p>
                      </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 glass h-20 px-8 flex justify-center items-center border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium tracking-tight">FIREBASE REALTIME CHAT v1.0</p>
      </nav>
    </div>
  );
};

export default ChatList;
