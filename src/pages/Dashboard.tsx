import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, FileText, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    publishedQuestions: 0,
    sources: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [questionsRes, publishedRes, sourcesRes] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('question_sources').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalQuestions: questionsRes.count || 0,
        publishedQuestions: publishedRes.count || 0,
        sources: sourcesRes.count || 0,
      });
    }

    fetchStats();
  }, []);

  const statCards = [
    { name: 'Toplam Soru', value: stats.totalQuestions, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Yayındaki Sorular', value: stats.publishedQuestions, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Soru Kaynakları', value: stats.sources, icon: Database, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-md p-3 ${stat.bg}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd>
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hızlı Eylemler</h3>
        <p className="text-gray-500 text-sm">Sisteme yeni soru eklemek için sol menüden "Soru Ekle" sekmesine gidebilirsiniz.</p>
      </div>
    </div>
  );
}
