
import React, { useState, useEffect } from 'react';
import { User, AppView } from './types';
import Login from './components/Login';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import { auth, db } from './services/firebaseService';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>('login');
  const [activeChatFriend, setActiveChatFriend] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        } else {
          // 신규 유저 정보 생성
          const newUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || "익명",
            email: fbUser.email || "",
            avatar: `https://picsum.photos/seed/${fbUser.uid}/200`,
            status: 'online',
            bio: '안녕하세요!'
          };
          await setDoc(doc(db, "users", fbUser.uid), newUser);
          setCurrentUser(newUser);
        }
        setView('chatList');
      } else {
        setCurrentUser(null);
        setView('login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openChat = (user: User) => {
    setActiveChatFriend(user);
    setView('chatRoom');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
      {view === 'login' && <Login />}
      
      {view === 'chatList' && currentUser && (
        <ChatList 
          currentUser={currentUser}
          onChatSelect={openChat} 
        />
      )}

      {view === 'chatRoom' && activeChatFriend && currentUser && (
        <ChatRoom 
          friend={activeChatFriend} 
          currentUser={currentUser}
          onBack={() => setView('chatList')}
        />
      )}
    </div>
  );
};

export default App;
