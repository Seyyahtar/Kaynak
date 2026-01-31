import React, { useEffect, useState } from 'react';
import { User, Bell, Check, X, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
    AppNotification,
    notificationService,
    NotificationActionStatus,
    NotificationType,
} from '../services/notificationService';
import { storage } from '../utils/storage';
import { toast } from 'sonner';

interface NotificationListProps {
    onClose: () => void;
}

export default function NotificationList({ onClose }: NotificationListProps) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentUser = storage.getUser();

    const loadNotifications = async () => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            const data = await notificationService.getUserNotifications(currentUser.id);
            setNotifications(data);
        } catch (err: any) {
            console.error('Failed to load notifications', err);
            setError(err.message || 'Bildirimler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();

        // Refresh list while open
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, [currentUser?.id]);

    const handleAction = async (notificationId: string, action: NotificationActionStatus) => {
        try {
            await notificationService.processAction(notificationId, action);
            toast.success(action === NotificationActionStatus.APPROVED ? 'İşlem onaylandı' : 'İşlem reddedildi');
            loadNotifications(); // Reload list
        } catch (error) {
            toast.error('İşlem gerçekleştirilemedi');
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId);
            // Update local state to reflect read status without full reload if preferred
            // loadNotifications();
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="absolute top-16 right-4 w-80 sm:w-96 z-50">
            <Card className="shadow-xl border-slate-200 flex flex-col max-h-[80vh]">
                <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg sticky top-0">
                    <h3 className="font-semibold text-slate-800">Bildirimler</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="overflow-y-auto p-2 space-y-2 bg-slate-50 flex-1">
                    {loading ? (
                        <div className="text-center py-4 text-slate-500 text-sm">Yükleniyor...</div>
                    ) : error ? (
                        <div className="text-center py-4 text-red-500 text-sm">
                            <p>{error}</p>
                            <Button variant="ghost" size="sm" onClick={loadNotifications} className="mt-2">
                                Tekrar Dene
                            </Button>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Bildiriminiz yok</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-3 rounded-lg border text-sm transition-colors ${notification.status === 'PENDING' ? 'bg-white border-blue-100 shadow-sm' : 'bg-slate-100 border-slate-200'
                                    }`}
                            // onClick={() => { if(notification.status === 'PENDING') handleMarkAsRead(notification.id) }} // Optional: mark read on click
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1 min-w-[2rem] h-8 rounded-full flex items-center justify-center ${notification.type === NotificationType.TRANSFER_REQUEST ? 'bg-blue-100 text-blue-600' :
                                        notification.type === NotificationType.TRANSFER_RESULT ?
                                            (notification.actionStatus === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600') :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {notification.type === 'TRANSFER_REQUEST' ? <User className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{notification.title}</p>
                                        <p className="text-slate-600 mt-1">{notification.content.startsWith('[') ? 'Transfer detayları için tıklayın' : notification.content}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {new Date(notification.createdAt).toLocaleString('tr-TR')}
                                        </p>

                                        {/* Action Buttons for Transfer Requests */}
                                        {notification.type === NotificationType.TRANSFER_REQUEST && notification.actionStatus === 'WAITING' && (
                                            <div className="flex gap-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 h-8 flex-1"
                                                    onClick={() => handleAction(notification.id, NotificationActionStatus.APPROVED)}
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Onayla
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 flex-1"
                                                    onClick={() => handleAction(notification.id, NotificationActionStatus.REJECTED)}
                                                >
                                                    <X className="w-4 h-4 mr-1" /> Reddet
                                                </Button>
                                            </div>
                                        )}

                                        {notification.actionStatus !== 'WAITING' && notification.type === NotificationType.TRANSFER_REQUEST && (
                                            <div className={`mt-2 text-xs font-semibold ${notification.actionStatus === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {notification.actionStatus === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
