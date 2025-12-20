
import React, { useState, useRef, useEffect } from 'react';
import { User, Message } from '../types';
import { db, storage } from '../services/firebaseService';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface ChatRoomProps {
  friend: User;
  currentUser: User;
  onBack: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ friend, currentUser, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 대화방 ID 생성 (알파벳 순으로 정렬하여 항상 동일한 ID 유지)
  const chatId = [currentUser.id, friend.id].sort().join("_");

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text?: string, imageUrl?: string) => {
    if (!text?.trim() && !imageUrl) return;
    
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: currentUser.id,
      text: text || null,
      imageUrl: imageUrl || null,
      timestamp: serverTimestamp()
    });
    
    setInputText('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      }, 
      (error) => {
        console.error("Upload error:", error);
        setIsUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await handleSend(undefined, downloadURL);
        setIsUploading(false);
        setUploadProgress(0);
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F3F6FF] animate-in slide-in-from-bottom duration-300">
      <header className="px-4 py-4 flex items-center glass sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center ml-2 flex-1">
          <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-xl object-cover" />
          <div className="ml-3">
            <h2 className="font-bold text-gray-900 leading-tight">{friend.name}</h2>
            <p className="text-[10px] text-green-500 font-medium">실시간 연결됨</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} animate-in zoom-in-95 duration-200`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
              msg.senderId === currentUser.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
            }`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="전송 이미지" className="rounded-lg mb-2 max-w-full h-auto cursor-pointer" onClick={() => window.open(msg.imageUrl)} />
              )}
              {msg.text && <p>{msg.text}</p>}
              <span className={`text-[9px] mt-1 block opacity-60 text-right ${msg.senderId === currentUser.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isUploading && (
        <div className="px-4 py-2 bg-indigo-50 flex items-center gap-3">
            <div className="flex-1 bg-gray-200 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="text-[10px] text-indigo-600 font-bold">{Math.round(uploadProgress)}%</span>
        </div>
      )}

      <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </button>
        <div className="flex-1 relative">
            <input 
                type="text" 
                placeholder="메시지 입력..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <button 
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim()}
                className={`absolute right-2 top-1.5 p-1.5 rounded-xl transition-all ${
                    inputText.trim() ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-400'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
