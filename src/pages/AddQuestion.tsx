import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import MDEditor from '@uiw/react-md-editor';
import { supabase } from '../lib/supabase';
import { Save, AlertCircle } from 'lucide-react';

type FormData = {
  subject_id: string;
  source_id: string;
  body: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correct_index: string;
  explanation: string;
  difficulty: string;
};

export default function AddQuestion() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      difficulty: 'medium',
      correct_index: '0'
    }
  });

  useEffect(() => {
    async function fetchData() {
      const [subsRes, sourcesRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('question_sources').select('*').order('name'),
      ]);
      if (subsRes.data) setSubjects(subsRes.data);
      if (sourcesRes.data) setSources(sourcesRes.data);
    }
    fetchData();
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setMessage(null);

    const options = [
      data.optionA,
      data.optionB,
      data.optionC,
      data.optionD,
      data.optionE,
    ];

    try {
      const { error } = await supabase.from('questions').insert({
        subject_id: data.subject_id,
        source_id: data.source_id,
        body: data.body,
        options: options,
        correct_index: parseInt(data.correct_index, 10),
        explanation: data.explanation || null,
        difficulty: data.difficulty,
        status: 'published',
        source: 'manual'
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Soru başarıyla eklendi!' });
      reset({ ...data, body: '', explanation: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Soru Ekle</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sisteme manuel olarak tekli soru girmek için bu formu kullanın.
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <AlertCircle className="w-5 h-5 mr-2" />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ders/Konu</label>
            <select
              {...register('subject_id', { required: 'Ders seçimi zorunludur' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
            >
              <option value="">Seçiniz...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.subject_id && <p className="mt-1 text-sm text-red-600">{errors.subject_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Soru Kaynağı</label>
            <select
              {...register('source_id', { required: 'Kaynak seçimi zorunludur' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
            >
              <option value="">Seçiniz...</option>
              {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.source_id && <p className="mt-1 text-sm text-red-600">{errors.source_id.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Soru Metni (Zengin Metin / Markdown)</label>
          <div data-color-mode="light">
            <Controller
              name="body"
              control={control}
              rules={{ required: 'Soru metni zorunludur' }}
              render={({ field }) => (
                <MDEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  height={300}
                />
              )}
            />
          </div>
          {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>}
        </div>

        <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Şıklar</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {['A', 'B', 'C', 'D', 'E'].map((letter, index) => (
              <div key={letter} className="flex items-center gap-3">
                <div className="flex items-center h-5">
                  <input
                    id={`correct-${index}`}
                    type="radio"
                    value={index.toString()}
                    {...register('correct_index')}
                    className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                  />
                </div>
                <label htmlFor={`correct-${index}`} className="font-medium text-gray-700 w-6">
                  {letter})
                </label>
                <input
                  type="text"
                  {...register(`option${letter}` as keyof FormData, { required: `${letter} şıkkı zorunludur` })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border bg-white"
                  placeholder={`${letter} şıkkı metni...`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zorluk Seviyesi</label>
            <select
              {...register('difficulty')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
            >
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Çözüm / Açıklama (İsteğe Bağlı)</label>
          <div data-color-mode="light">
            <Controller
              name="explanation"
              control={control}
              render={({ field }) => (
                <MDEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  height={200}
                />
              )}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            {loading ? 'Kaydediliyor...' : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Soruyu Kaydet ve Yeni Soruya Geç
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
