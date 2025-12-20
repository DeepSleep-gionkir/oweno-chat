
import { User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'user_1',
    name: '김지민',
    // Fix: Added missing email property to satisfy User interface requirement
    email: 'jimin@example.com',
    avatar: 'https://picsum.photos/seed/jimin/200',
    status: 'online',
    bio: '안녕! 반가워.'
  },
  {
    id: 'user_2',
    name: '이서윤',
    // Fix: Added missing email property to satisfy User interface requirement
    email: 'seoyun@example.com',
    avatar: 'https://picsum.photos/seed/seoyun/200',
    status: 'busy',
    bio: '업무 중입니다. 급한 건 전화주세요.'
  },
  {
    id: 'user_3',
    name: '박도윤',
    // Fix: Added missing email property to satisfy User interface requirement
    email: 'doyun@example.com',
    avatar: 'https://picsum.photos/seed/doyun/200',
    status: 'offline',
    bio: '여행 중입니다 ✈️'
  },
  {
    id: 'user_4',
    name: '최아린',
    // Fix: Added missing email property to satisfy User interface requirement
    email: 'arin@example.com',
    avatar: 'https://picsum.photos/seed/arin/200',
    status: 'online',
    bio: '오늘 하루도 화이팅!'
  }
];

export const CURRENT_USER: User = {
  id: 'me',
  name: '나 (관리자)',
  // Fix: Added missing email property to satisfy User interface requirement
  email: 'admin@example.com',
  avatar: 'https://picsum.photos/seed/me/200',
  status: 'online'
};
