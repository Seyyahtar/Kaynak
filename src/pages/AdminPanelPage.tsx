import React from 'react';
import { ArrowLeft, UserPlus, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Page } from '@/types';

interface AdminPanelPageProps {
    onNavigate: (page: Page) => void;
    currentUser: string;
}

export default function AdminPanelPage({ onNavigate, currentUser }: AdminPanelPageProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onNavigate('home')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-semibold text-slate-800">Yönetici Paneli</h1>
                    <div className="w-10" /> {/* Spacer for alignment */}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">


                {/* Actions */}
                <div className="grid gap-4">
                    {/* Add User Card */}
                    <Card
                        className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => onNavigate('add-user')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-green-100 rounded-full">
                                <UserPlus className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-800">Yeni Kullanıcı Ekle</h3>
                                <p className="text-slate-600">Sisteme yeni kullanıcı ekleyin ve rol atayın</p>
                            </div>
                        </div>
                    </Card>

                    {/* Manage Users Card */}
                    <Card
                        className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => onNavigate('manage-users')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-blue-100 rounded-full">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-800">Kullanıcıları Yönet</h3>
                                <p className="text-slate-600">Mevcut kullanıcıları görüntüleyin, düzenleyin veya silin</p>
                            </div>
                        </div>
                    </Card>

                    {/* Product List Card */}
                    <Card
                        className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => onNavigate('product-list')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-purple-100 rounded-full">
                                <Package className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-800">Ürün Listesi</h3>
                                <p className="text-slate-600">Ürün tanımlarını görüntüleyin ve dinamik alanlar ekleyin</p>
                            </div>
                        </div>
                    </Card>
                </div>


            </div>
        </div>
    );
}
