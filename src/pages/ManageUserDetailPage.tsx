import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Page, User, UserRole } from '@/types';
import { userService } from '@/services/userService';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';

interface ManageUserDetailPageProps {
    onNavigate: (page: Page) => void;
    user: User;
    currentUser: string;
}

export default function ManageUserDetailPage({ onNavigate, user, currentUser }: ManageUserDetailPageProps) {
    const [selectedUser, setSelectedUser] = useState<User>(user);
    const [editFormData, setEditFormData] = useState({
        username: user.username || '',
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        region: user.region || ''
    });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        // Sync state if user prop changes
        setSelectedUser(user);
        setEditFormData({
            username: user.username || '',
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            region: user.region || ''
        });
    }, [user]);

    const handleRoleChange = async (newRole: UserRole) => {
        if (selectedUser.username === currentUser) {
            toast.error('Kendi rolünüzü değiştiremezsiniz!');
            return;
        }
        try {
            const updatedUser = await userService.updateUserRole(selectedUser.id, newRole);
            toast.success('Kullanıcı rolü güncellendi');
            setSelectedUser(updatedUser);
        } catch (error: any) {
            toast.error('Rol güncellenemedi: ' + error.message);
        }
    };

    const handleUpdateDetails = async () => {
        try {
            const updated = await userService.updateUserDetails(selectedUser.id, editFormData);
            toast.success('Kullanıcı bilgileri güncellendi');
            setSelectedUser(updated);
        } catch (error: any) {
            toast.error('Bilgiler güncellenemedi: ' + error.message);
        }
    };

    const handleToggleActive = async (active: boolean) => {
        if (selectedUser.username === currentUser) {
            toast.error('Kendi hesabınızı pasife alamazsınız!');
            return;
        }
        try {
            const updated = await userService.updateUserActiveStatus(selectedUser.id, active);
            toast.success(active ? 'Kullanıcı aktif edildi' : 'Kullanıcı pasife alındı');
            setSelectedUser(updated);
        } catch (error: any) {
            toast.error('Durum güncellenemedi: ' + error.message);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) return;
        try {
            await userService.resetUserPassword(selectedUser.id, newPassword);
            toast.success('Kullanıcı şifresi başarıyla sıfırlandı');
            setNewPassword('');
        } catch (error: any) {
            toast.error('Şifre sıfırlanamadı: ' + error.message);
        }
    };

    const handleViewHistory = () => {
        localStorage.setItem('history_focus_user_id', selectedUser.id);
        onNavigate('history');
    };

    const handleDeleteUser = async () => {
        if (selectedUser.username === currentUser) {
            toast.error('Kendinizi silemezsiniz!');
            return;
        }
        const confirmed = window.confirm(
            `"${selectedUser.fullName}" kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
        );
        if (!confirmed) return;

        try {
            await userService.deleteUser(selectedUser.id);
            toast.success('Kullanıcı başarıyla silindi');
            onNavigate('manage-users');
        } catch (error: any) {
            toast.error('Kullanıcı silinemedi: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onNavigate('manage-users')}
                        className="mr-2"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-slate-800 line-clamp-1">{selectedUser.fullName}</h1>
                        <p className="text-sm text-slate-500">@{selectedUser.username} Yönetimi</p>
                    </div>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto">
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="flex w-full mb-6 bg-slate-100 border p-1 rounded-lg h-11 items-center gap-1">
                        <TabsTrigger value="details" className="flex-1 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Bilgiler</TabsTrigger>
                        <TabsTrigger value="password" className="flex-1 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Şifre</TabsTrigger>
                        <TabsTrigger value="other" className="flex-1 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Diğer</TabsTrigger>
                    </TabsList>

                    {/* DETAILS TAB */}
                    <TabsContent value="details" className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Status Toggle */}
                        <Card className="p-4 border shadow-sm">
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-base text-slate-800">Hesap Durumu</Label>
                                    <p className="text-sm text-slate-500 mb-2">
                                        Sisteme giriş yapabilmesi için aktif olmalıdır.
                                    </p>
                                </div>
                                <select
                                    className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                                    value={selectedUser.active ? 'true' : 'false'}
                                    onChange={(e) => handleToggleActive(e.target.value === 'true')}
                                >
                                    <option value="true">Aktif</option>
                                    <option value="false">Pasif</option>
                                </select>
                            </div>
                        </Card>

                        {/* Role */}
                        <Card className="p-4 border shadow-sm space-y-3">
                            <div>
                                <Label className="text-base text-slate-800">Kullanıcı Rolü</Label>
                                <p className="text-sm text-slate-500 mb-2">
                                    Kullanıcının sistemdeki yetki seviyesini belirler.
                                </p>
                            </div>
                            <select
                                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                                value={selectedUser.role}
                                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                            >
                                <option value="KULLANICI">Kullanıcı</option>
                                <option value="DEPO">Depo</option>
                                <option value="YONETICI">Yönetici</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </Card>

                        {/* Form */}
                        <Card className="p-4 border shadow-sm space-y-4">
                            <h3 className="font-medium text-slate-800 mb-2">Kişisel Bilgiler</h3>
                            <div className="space-y-2">
                                <Label>Kullanıcı Adı</Label>
                                <Input
                                    value={editFormData.username}
                                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ad Soyad</Label>
                                <Input
                                    value={editFormData.fullName}
                                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>E-posta</Label>
                                <Input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bölge</Label>
                                <Input
                                    value={editFormData.region}
                                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleUpdateDetails} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                                Değişiklikleri Kaydet
                            </Button>
                        </Card>
                    </TabsContent>

                    {/* PASSWORD TAB */}
                    <TabsContent value="password" className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        <Card className="p-5 border-orange-200 bg-orange-50 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-orange-600" />
                                <h3 className="font-medium text-orange-900">Şifre Sıfırlama</h3>
                            </div>
                            <p className="text-sm text-orange-800 mb-6">
                                Bu menüden kullanıcının şifresini doğrudan değiştirebilirsiniz. Unutulan şifreler için geçici bir şifre (örn. 123456) belirleyip kullanıcıya iletebilirsiniz.
                            </p>
                            <div className="space-y-4 relative">
                                <div className="space-y-2">
                                    <Label className="text-orange-900">Yeni Şifre</Label>
                                    <Input
                                        type="text"
                                        placeholder="Yeni şifreyi girin"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-white border-orange-300 focus-visible:ring-orange-500"
                                    />
                                </div>
                                <Button
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={handleResetPassword}
                                    disabled={!newPassword || newPassword.length < 3}
                                >
                                    Şifreyi Sıfırla
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* OTHER TAB */}
                    <TabsContent value="other" className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        {/* History */}
                        <Card className="p-5 border shadow-sm">
                            <h3 className="font-medium text-slate-800 mb-2">İşlem Geçmişi</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Bu kullanıcının yaptığı tüm stok ekleme, çıkarma ve vaka kayıtlarını Geçmiş sayfasında sadece bu kullanıcıya göre filtrelenmiş şekilde inceleyebilirsiniz.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={handleViewHistory}
                            >
                                Kullanıcının İşlemlerini Gör
                            </Button>
                        </Card>

                        {/* Delete */}
                        <Card className="p-6 border-red-200 bg-red-50/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Trash2 className="w-5 h-5 text-red-600" />
                                <h3 className="font-bold text-red-800">Tehlikeli Alan: Kullanıcıyı Sil</h3>
                            </div>
                            <p className="text-sm text-red-600 mb-6 leading-relaxed">
                                Bu işlem geri alınamaz! Kullanıcıyı sildiğinizde sisteme tekrar erişemez.
                                <span className="block mt-1 font-semibold">Tüm işlem geçmişi veritabanında saklı kalacaktır.</span>
                            </p>
                            <Button
                                variant="destructive"
                                className="w-full h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg shadow-sm border-none"
                                onClick={handleDeleteUser}
                            >
                                KULLANICIYI ŞİMDİ SİL
                            </Button>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
