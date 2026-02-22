import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Page, User, UserRole } from '@/types';
import { userService } from '@/services/userService';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';

interface ManageUsersPageProps {
    onNavigate: (page: Page) => void;
    currentUser: string;
}

export default function ManageUsersPage({ onNavigate, currentUser }: ManageUsersPageProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [currentUserData, setCurrentUserData] = useState<User | null>(null);

    useEffect(() => {
        loadUsers();
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        const user = storage.getUser();
        if (user) {
            setCurrentUserData(user as any); // Type assertion or simple pass, actually user from storage may not need 2 args. Ah wait, setCurrentUserData takes user.
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const allUsers = await userService.getAllUsers();
            setUsers(allUsers);
        } catch (error: any) {
            toast.error('Kullanıcılar yüklenemedi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenManage = (user: User) => {
        onNavigate('manage-user-detail', { user });
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-700';
            case 'YONETICI':
                return 'bg-blue-100 text-blue-700';
            case 'DEPO':
                return 'bg-green-100 text-green-700';
            case 'KULLANICI':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getRoleDisplayName = (role: UserRole) => {
        const names: Record<UserRole, string> = {
            ADMIN: 'Admin',
            YONETICI: 'Yönetici',
            DEPO: 'Depo',
            KULLANICI: 'Kullanıcı',
        };
        return names[role] || role;
    };

    const filteredUsers = users.filter(user => {
        if (!searchText.trim()) return true;
        const search = searchText.toLowerCase();
        return (
            user.username.toLowerCase().includes(search) ||
            user.fullName.toLowerCase().includes(search) ||
            (user.email && user.email.toLowerCase().includes(search))
        );
    });

    const isAdmin = currentUserData?.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onNavigate('admin-panel')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-semibold text-slate-800">Kullanıcı Yönetimi</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Search */}
            <div className="p-4 bg-white border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Kullanıcı ara..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* User Count */}
            <div className="p-4 bg-blue-50 border-b">
                <p className="text-sm text-slate-700">
                    Toplam <span className="font-semibold text-blue-600">{filteredUsers.length}</span> kullanıcı
                    {searchText && ` (${users.length} kullanıcı içinde)`}
                </p>
            </div>

            {/* Users List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <Card className="p-8 text-center">
                        <p className="text-slate-500">Kullanıcılar yükleniyor...</p>
                    </Card>
                ) : filteredUsers.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-slate-500">
                            {searchText ? 'Arama sonucu kullanıcı bulunamadı' : 'Henüz kullanıcı bulunmuyor'}
                        </p>
                    </Card>
                ) : (
                    filteredUsers.map((user) => {
                        const isCurrentUser = user.username === currentUser;

                        return (
                            <Card key={user.id} className={`p-4 ${isCurrentUser ? 'border-2 border-blue-400' : ''}`}>
                                <div className="space-y-3">
                                    {/* User Info */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-800">{user.fullName}</h3>
                                                {isCurrentUser && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Siz</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600">@{user.username}</p>
                                            {user.email && (
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded font-medium ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleDisplayName(user.role)}
                                                </span>
                                                {user.active ? (
                                                    <span className="text-xs text-green-600">● Aktif</span>
                                                ) : (
                                                    <span className="text-xs text-red-600">● Pasif</span>
                                                )}
                                            </div>
                                            {user.lastLogin && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Son giriş: {new Date(user.lastLogin).toLocaleString('tr-TR')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions - Only for Admin */}
                                    {isAdmin && !isCurrentUser && (
                                        <div className="pt-3 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleOpenManage(user)}
                                            >
                                                <Shield className="w-4 h-4 mr-2" />
                                                Yönet
                                            </Button>
                                        </div>
                                    )}

                                    {/* Info for non-admin */}
                                    {!isAdmin && (
                                        <p className="text-xs text-slate-500 pt-2 border-t">
                                            Sadece Admin kullanıcıları düzenleyebilir ve silebilir
                                        </p>
                                    )}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Bottom Info */}
            {!isAdmin && (
                <div className="p-4">
                    <Card className="p-4 bg-yellow-50 border-yellow-200">
                        <p className="text-sm text-yellow-800">
                            <strong>Not:</strong> Kullanıcı rolleri değiştirmek ve silmek için Admin yetkisi gereklidir.
                        </p>
                    </Card>
                </div>
            )}
        </div>
    );
}
