import React from 'react';
import { Package, FileText, History, Settings, ClipboardCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Page } from '../types';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  currentUser: string;
}

export default function HomePage({ onNavigate, currentUser }: HomePageProps) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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
          </div>
          
          {/* Ayarlar - Tam genişlik */}
          {menuItems.slice(4).map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onNavigate(item.id)}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className={`${item.color} p-4 rounded-full`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-slate-800">{item.label}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
