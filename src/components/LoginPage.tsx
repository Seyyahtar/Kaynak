import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { storage } from '../utils/storage';
import { toast } from 'sonner@2.0.3';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Lütfen kullanıcı adı girin');
      return;
    }

    const user = {
      username: username.trim(),
      loginDate: new Date().toISOString(),
    };

    storage.saveUser(user);
    onLogin(username.trim());
    toast.success(`Hoş geldiniz, ${username.trim()}!`);
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
              placeholder="Adınızı girin"
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full">
            Giriş Yap
          </Button>
        </form>
      </Card>
    </div>
  );
}
