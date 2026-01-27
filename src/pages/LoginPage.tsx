import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { storage } from '@/utils/storage';
import { toast } from 'sonner@2.0.3';
import { Capacitor } from '@capacitor/core';
import { userService } from '@/services/userService';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Lütfen kullanıcı adı ve şifre girin');
      return;
    }

    setLoading(true);
    try {
      // Authenticate with backend using standardized service
      const response = await userService.login({ username: username.trim(), password: password.trim() });
      if (response && response.token) {
        const user = {
          id: response.id,
          username: response.username,
          fullName: response.fullName,
          email: response.email,
          role: response.role,
          active: response.active,
          createdAt: response.createdAt,
          lastLogin: response.lastLogin,
          loginDate: new Date().toISOString(),
        };

        // Save to local storage
        storage.setToken(response.token);
        storage.saveUser(user);
        onLogin(user.username);
        toast.success(`Hoş geldiniz, ${user.fullName || user.username}!`);
      } else {
        toast.error('Giriş başarısız');
      }
    } catch (error: any) {
      console.error('Login error', error);
      // Show actual error message if available, otherwise generic
      toast.error(error.message || 'Sunucuyla iletişim kurulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-800 mb-2">Medikal Envanter Yönetimi</h1>
          <p className="text-slate-600">Devam etmek için giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınız"
              autoFocus
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifreniz"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
