import React, { useState, useEffect } from 'react';
import { Package, FileText, History, Settings, ClipboardCheck, Lock } from 'lucide-react';
import NotificationList from '@/components/NotificationList';
import { Bell } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Page, User } from '@/types';
import { storage } from '@/utils/storage';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  currentUser: string;
}

export default function HomePage({ onNavigate, currentUser }: HomePageProps) {
  const [userData, setUserData] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = storage.getUser();
    setUserData(user);

    // Check unread notifications
    if (user) {
      notificationService.getUnreadNotifications(user.id)
        .then(data => setUnreadCount(data.length))
        .catch(err => console.error(err));

      // Polling every 5 seconds
      const interval = setInterval(() => {
        notificationService.getUnreadNotifications(user.id)
          .then(data => setUnreadCount(data.length))
          .catch(err => console.error(err));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);
  const menuItems = [
    {
      id: 'stock' as Page,
      label: 'Stok',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      id: 'case-entry' as Page,
      label: 'Vaka',
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      id: 'checklist' as Page,
      label: 'Kontrol Listesi',
      icon: ClipboardCheck,
      color: 'bg-purple-500',
    },
    {
      id: 'history' as Page,
      label: 'Geçmiş',
      icon: History,
      color: 'bg-orange-500',
    },
    {
      id: 'settings' as Page,
      label: 'Ayarlar',
      icon: Settings,
      color: 'bg-gray-500',
    },
  ];

  // Only show admin panel for ADMIN and YONETICI roles
  const canAccessAdminPanel = userData?.role === 'ADMIN' || userData?.role === 'YONETICI';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header with Notification Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white shadow-sm relative hover:bg-slate-50"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
        {showNotifications && <NotificationList onClose={() => setShowNotifications(false)} />}
      </div>

      <div className="max-w-md mx-auto pt-12">
        <div className="text-center mb-12">
          <h1 className="text-slate-800 mb-2">Medikal Envanter Yönetimi</h1>
          <p className="text-slate-600">Hoş Geldiniz, {currentUser}</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onNavigate(item.id)}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`${item.color} p-4 rounded-full`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-slate-800 text-center">{item.label}</span>
                  </div>
                </Card>
              );
            })}

            {/* Ayarlar - Full Width */}
            {menuItems.slice(4).map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer col-span-2"
                  onClick={() => onNavigate(item.id)}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`${item.color} p-4 rounded-full`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-slate-800 text-center">{item.label}</span>
                  </div>
                </Card>
              );
            })}

            {/* Admin Panel - Full Width - Yellow Background */}
            {canAccessAdminPanel && (
              <Card
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer col-span-2"
                onClick={() => onNavigate('admin-panel')}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="bg-yellow-600 p-4 rounded-full shadow-lg border-2 border-white"
                    style={{ backgroundColor: '#d97706' }}
                  >
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-slate-800 text-center font-semibold">Yönetici Paneli</span>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
