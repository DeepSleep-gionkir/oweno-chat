
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  bio?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  timestamp: any; // Firestore Timestamp
}

export type AppView = 'login' | 'chatList' | 'chatRoom';
