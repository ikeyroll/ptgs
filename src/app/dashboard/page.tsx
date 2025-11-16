"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getDashboardStats, getMonthlyStats } from '@/lib/api/applications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, FileText, XCircle, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardStats {
  total: number;
  baharu: number;
  pembaharuan: number;
  tidakRenew: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  byMonth: { month: string; count: number }[];
  lastUpdated: string;
}

// Helper function to get session in format YYYY/YYYY+2 from a date
const getSessionFromDate = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    const year = new Date(dateString).getFullYear();
    return `${year}/${year + 2}`;
  } catch (e) {
    return '';
  }
};

// Function to get unique sessions from stats data
const getUniqueSessions = (stats: DashboardStats | null): string[] => {
  if (!stats) return [];
  
  // Always include current and next session
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // If we're in the second half of the year (July-December), include next year's session
  const sessions = new Set<string>();
  const currentSession = currentMonth >= 6 
    ? `${currentYear + 1}/${currentYear + 3}`
    : `${currentYear}/${currentYear + 2}`;
  
  sessions.add(currentSession);
  
  // Add sessions from the last 5 years
  const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  for (let i = 0; i <= 5; i++) {
    const year = startYear - i;
    sessions.add(`${year}/${year + 2}`);
  }
  
  // Sort sessions in descending order (newest first)
  return Array.from(sessions).sort((a, b) => {
    const yearA = parseInt(a.split('/')[0]);
    const yearB = parseInt(b.split('/')[0]);
    return yearB - yearA;
  });
};

export default function Dashboard() {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the current session based on the current date (2-year period)
  const getCurrentSession = () => {
    const currentYear = new Date().getFullYear();
    // If we're in the second half of the year, use next year as start
    const startYear = new Date().getMonth() >= 6 ? currentYear + 1 : currentYear;
    const endYear = startYear + 2; // 2-year period
    return `${startYear}/${endYear}`;
  };
  
  const [selectedSession, setSelectedSession] = useState('');
  const [availableSessions, setAvailableSessions] = useState<string[]>([]);
  
  // Initialize sessions after component mounts and when stats change
  useEffect(() => {
    if (stats) {
      const sessions = getUniqueSessions(stats);
      setAvailableSessions(sessions);
      
      // Set selected session if not already set
      if (!selectedSession && sessions.length > 0) {
        setSelectedSession(sessions[0]);
      }
    }
  }, [stats]);

  useEffect(() => {
    // Extract the start year from the selected session (e.g., '2023/2024' -> 2023)
    const year = selectedSession ? parseInt(selectedSession.split('/')[0]) : new Date().getFullYear();
    loadDashboardData(year.toString());
  }, [selectedSession]);

  const loadDashboardData = async (year: string) => {
    if (!year) return; // Don't load if no year is selected
    
    setIsLoading(true);
    
    try {
      // Get stats from Supabase
      const statsData = await getDashboardStats(parseInt(year));
      const monthlyData = await getMonthlyStats(parseInt(year));
      
      // Map to dashboard format
      const dashboardData: DashboardStats = {
        total: statsData?.total || 0,
        baharu: statsData?.baharu || 0,
        pembaharuan: statsData?.pembaharuan || 0,
        tidakRenew: statsData?.tidak_diperbaharui || 0,
        byStatus: {
          pending: statsData?.dalam_proses || 0,
          approved: statsData?.diluluskan || 0,
          rejected: statsData?.tidak_berjaya || 0,
        },
        byMonth: monthlyData?.map((m: any) => ({
          month: m.month,
          count: m.count
        })) || [],
        lastUpdated: new Date().toLocaleString('ms-MY'),
      };
      
      setStats(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Set empty data on error
      setStats({
        total: 0,
        baharu: 0,
        pembaharuan: 0,
        tidakRenew: 0,
        byStatus: { pending: 0, approved: 0, rejected: 0 },
        byMonth: [],
        lastUpdated: new Date().toLocaleString('ms-MY'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = {
    baharu: '#3b82f6',
    pembaharuan: '#10b981',
    tidakRenew: '#ef4444',
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
  };

  const applicationTypeData = stats ? [
    { name: language === 'ms' ? 'Permohonan Baharu' : 'New Applications', value: stats.baharu, color: COLORS.baharu },
    { name: language === 'ms' ? 'Pembaharuan' : 'Renewals', value: stats.pembaharuan, color: COLORS.pembaharuan },
    { name: language === 'ms' ? 'Tidak Diperbaharui' : 'Not Renewed', value: stats.tidakRenew, color: COLORS.tidakRenew },
  ] : [];


  // Prepare data for the application status chart
  // Now showing three statuses: Dalam Proses, Diluluskan, and Tidak Lengkap
  const statusData = [
    { 
      name: 'Dalam Proses', 
      value: stats?.byStatus.pending || 0, 
      color: '#f59e0b'  // Yellow
    },
    { 
      name: 'Diluluskan', 
      value: stats?.byStatus.approved || 0,
      color: '#10b981'  // Green
    },
    { 
      name: 'Tidak Lengkap', 
      value: stats?.byStatus.rejected || 0,
      color: '#ef4444'  // Red
    }
  ];
  
  // Calculate total from all statuses
  const totalFromStatuses = statusData.reduce((sum, item) => sum + item.value, 0);
  const totalFromStats = stats?.total || 0;
  
  // Log the status counts for debugging
  console.log('Status counts for session', selectedSession, ':', {
    'Dalam Proses': stats?.byStatus.pending,
    'Diluluskan': stats?.byStatus.approved,
    'Tidak Lengkap': stats?.byStatus.rejected,
    'Total from statuses': totalFromStatuses,
    'Total from stats': totalFromStats,
    'Match': totalFromStatuses === totalFromStats ? '✅' : '❌'
  });
  
  // Status colors mapping
  const statusColors = {
    'Dalam Proses': '#f59e0b',  // Yellow
    'Diluluskan': '#10b981',    // Green
    'Tidak Lengkap': '#ef4444'  // Red
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-gradient-to-br from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Pilih Sesi" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSessions.map(session => (
                      <SelectItem key={session} value={session}>
                        Sesi {session}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.totalApplications')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total}</div>
                <p className="text-xs text-muted-foreground">Sesi {selectedSession}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.newApplications')}</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats?.baharu}</div>
                <p className="text-xs text-muted-foreground">
                  {stats && ((stats.baharu / stats.total) * 100).toFixed(1)}% {t('dashboard.ofTotal')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.renewals')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.pembaharuan}</div>
                <p className="text-xs text-muted-foreground">
                  {stats && ((stats.pembaharuan / stats.total) * 100).toFixed(1)}% daripada jumlah
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.notRenewed')}</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.tidakRenew}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.expired')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pie Chart - Application Types */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.applicationTypes')}</CardTitle>
                <CardDescription>{t('dashboard.applicationTypesDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {applicationTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {applicationTypeData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stacked Bar Chart - Application Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status Permohonan</CardTitle>
                <CardDescription>Taburan status untuk semua permohonan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} permohonan`, 'Jumlah']}
                        labelFormatter={(label) => `Status: ${label}`}
                      />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="Jumlah Permohonan"
                        radius={[4, 4, 0, 0]}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-semibold">
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="text-sm text-muted-foreground col-span-2">
                    * Tidak termasuk permohonan yang ditandakan sebagai Tidak Lengkap
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart - Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Bulanan</CardTitle>
              <CardDescription>Permohonan mengikut bulan (Sesi {selectedSession})</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Bilangan Permohonan"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
