"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple authentication (for demo - replace with real auth later)
    setTimeout(() => {
      if (username === 'admin' && password === 'ptgs2025') {
        // Set session
        localStorage.setItem('adminLoggedIn', 'true');
        document.cookie = 'adminLoggedIn=true; path=/';
        toast.success('Login berjaya!');
        setTimeout(() => {
          router.push('/admin');
        }, 500);
      } else {
        toast.error('Username atau password salah');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative h-20 w-20">
              <Image
                src="/mphs.png"
                alt="MPHS Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Majlis Perbandaran Hulu Selangor
            <br />
            Sistem e-Stiker Khas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log Masuk'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="font-semibold text-blue-900 mb-1">Demo Credentials:</p>
            <p className="text-blue-700">Username: <code className="bg-white px-2 py-1 rounded">admin</code></p>
            <p className="text-blue-700">Password: <code className="bg-white px-2 py-1 rounded">ptgs2025</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
