import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Page, UserRole } from '@/types';
import { userService } from '@/services/userService';
import { toast } from 'sonner';

interface AddUserPageProps {
    onNavigate: (page: Page) => void;
    currentUser: string;
}

export default function AddUserPage({ onNavigate, currentUser }: AddUserPageProps) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        phone: '',
        region: '',
        role: 'KULLANICI' as UserRole,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.username.trim()) {
            toast.error('Kullanıcı adı boş olamaz');
            return;
        }

        if (formData.username.length < 3) {
            toast.error('Kullanıcı adı en az 3 karakter olmalıdır');
            return;
        }

        if (!formData.password) {
            toast.error('Şifre boş olamaz');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Şifre en az 6 karakter olmalıdır');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Şifreler eşleşmiyor');
            return;
        }

        if (!formData.fullName.trim()) {
            toast.error('Tam ad boş olamaz');
            return;
        }

        try {
            setLoading(true);
            await userService.createUser({
                username: formData.username.trim(),
                password: formData.password,
                fullName: formData.fullName.trim(),
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                region: formData.region.trim() || undefined,
                role: formData.role,
            });

            toast.success('Kullanıcı başarıyla oluşturuldu');
            onNavigate('manage-users');
        } catch (error: any) {
            toast.error(error.message || 'Kullanıcı oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

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
                    <h1 className="text-xl font-semibold text-slate-800">Yeni Kullanıcı Ekle</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Form */}
            <div className="p-6">
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Kullanıcı Adı *</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Kullanıcı adı"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                required
                            />
                            <p className="text-xs text-slate-500">En az 3 karakter olmalıdır</p>
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Tam Ad *</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Ad Soyad"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@email.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                            <p className="text-xs text-slate-500">Opsiyonel</p>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Şifre"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">En az 6 karakter olmalıdır</p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Şifre tekrar"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="05XX XXX XX XX"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                            <p className="text-xs text-slate-500">Opsiyonel</p>
                        </div>

                        {/* Region */}
                        <div className="space-y-2">
                            <Label htmlFor="region">Bölge</Label>
                            <Input
                                id="region"
                                type="text"
                                placeholder="Şehir veya bölge"
                                value={formData.region}
                                onChange={(e) => handleInputChange('region', e.target.value)}
                            />
                            <p className="text-xs text-slate-500">Opsiyonel</p>
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol *</Label>
                            <select
                                id="role"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.role}
                                onChange={(e) => handleInputChange('role', e.target.value)}
                                required
                            >
                                <option value="KULLANICI">Kullanıcı</option>
                                <option value="DEPO">Depo</option>
                                <option value="YONETICI">Yönetici</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <div className="text-xs text-slate-600 space-y-1 mt-2">
                                <p><strong>Kullanıcı:</strong> Temel işlemler, sadece kendi verilerini görür</p>
                                <p><strong>Depo:</strong> Stok yönetimi ve vaka girişi</p>
                                <p><strong>Yönetici:</strong> Kullanıcı ekleyebilir, tüm verileri görür</p>
                                <p><strong>Admin:</strong> Tam yetki, rol değiştirme ve kullanıcı silme</p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => onNavigate('admin-panel')}
                                disabled={loading}
                            >
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={loading}
                            >
                                {loading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
