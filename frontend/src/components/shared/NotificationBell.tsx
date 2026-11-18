/**
 * Real-time notification bell using Socket.IO.
 * Subscribes to new request events and shows an unread count badge.
 */
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

interface NotificationBellProps {
  onClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('request:new', () => setUnread(n => n + 1));
    socket.on('payment:success', () => setUnread(n => n + 1));
    socket.on('request:status-changed', () => setUnread(n => n + 1));

    return () => { socket.disconnect(); };
  }, [user?._id]);

  return (
    <button
      onClick={() => { setUnread(0); onClick?.(); }}
      className="relative p-2 rounded-lg transition-colors"
      style={{ color: '#94a3b8' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-2xs font-bold text-white px-1"
          style={{ background: '#f97316', fontSize: '10px' }}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
