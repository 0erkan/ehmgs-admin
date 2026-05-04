import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, FileText, CheckCircle, AlertCircle, Wand2, Save } from 'lucide-react';

type ParsedQuestion = {
  id: string;
  body: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correct_index: number;
  explanation: string;
  status: 'valid' | 'invalid';
  errors: string[];
};

export default function BulkUpload() {
  const [inputText, setInputText] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const parseText = () => {
    setIsParsing(true);
    setMessage(null);
    
    // Very basic regex-based parser for Turkish test formats
    // Assumes questions are separated by numbers like "1.", "2." or "Soru 1:"
    // Assumes options are like "A)", "B)"
    // Assumes explanation is "Çözüm:" or "Açıklama:"
    // Assumes answer might be marked somewhere, or we leave it 0
    
    setTimeout(() => {
      try {
        const questions: ParsedQuestion[] = [];
        
        // Split by question numbers (e.g. "1.", "2.", "Soru 1", "Soru 2")
        const blocks = inputText.split(/(?:^|\n)(?:\d+\. |Soru \d+:?)/i).filter(b => b.trim().length > 10);
        
        blocks.forEach((block, idx) => {
          const q: ParsedQuestion = {
            id: `q-${idx}`,
            body: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            optionE: '',
            correct_index: 0, // default A
            explanation: '',
            status: 'valid',
            errors: []
          };
          
          // Extract Explanation
          const solutionMatch = block.match(/(?:Çözüm|Açıklama):\s*([\s\S]*)/i);
          if (solutionMatch) {
            q.explanation = solutionMatch[1].trim();
            block = block.replace(solutionMatch[0], ''); // remove from block
          }
          
          // Extract Options
          const optA = block.match(/A[\)\.]\s*(.+?)(?=\n[B-E][\)\.]|$)/is);
          const optB = block.match(/B[\)\.]\s*(.+?)(?=\n[C-E][\)\.]|$)/is);
          const optC = block.match(/C[\)\.]\s*(.+?)(?=\n[D-E][\)\.]|$)/is);
          const optD = block.match(/D[\)\.]\s*(.+?)(?=\n[E][\)\.]|$)/is);
          const optE = block.match(/E[\)\.]\s*(.+?)(?=\n|$)/is);
          
          if (optA) { q.optionA = optA[1].trim(); block = block.replace(optA[0], ''); } else q.errors.push("A şıkkı bulunamadı");
          if (optB) { q.optionB = optB[1].trim(); block = block.replace(optB[0], ''); } else q.errors.push("B şıkkı bulunamadı");
          if (optC) { q.optionC = optC[1].trim(); block = block.replace(optC[0], ''); } else q.errors.push("C şıkkı bulunamadı");
          if (optD) { q.optionD = optD[1].trim(); block = block.replace(optD[0], ''); } else q.errors.push("D şıkkı bulunamadı");
          if (optE) { q.optionE = optE[1].trim(); block = block.replace(optE[0], ''); } else q.errors.push("E şıkkı bulunamadı");
          
          // What's left is the body
          q.body = block.trim();
          if (q.body.length < 5) q.errors.push("Soru metni çok kısa");
          
          if (q.errors.length > 0) q.status = 'invalid';
          
          questions.push(q);
        });
        
        if (questions.length === 0) {
          setMessage({ type: 'error', text: 'Hiç soru bulunamadı. Lütfen formatı kontrol edin. (Örn: "1. Soru metni \n A) Şık...")' });
        } else {
          setParsedQuestions(questions);
          setMessage({ type: 'success', text: `${questions.length} adet soru başarıyla ayrıştırıldı. Lütfen aşağıdan kontrol edin.` });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Ayrıştırma sırasında bir hata oluştu.' });
      } finally {
        setIsParsing(false);
      }
    }, 500);
  };

  const saveToDatabase = async () => {
    if (!selectedSubject || !selectedSource) {
      setMessage({ type: 'error', text: 'Lütfen veritabanına kaydetmeden önce Ders ve Kaynak seçin.' });
      return;
    }
    
    const validQuestions = parsedQuestions.filter(q => q.status === 'valid');
    if (validQuestions.length === 0) {
      setMessage({ type: 'error', text: 'Kaydedilecek geçerli soru yok.' });
      return;
    }

    setIsSaving(true);
    
    try {
      const formattedData = validQuestions.map(q => ({
        subject_id: selectedSubject,
        source_id: selectedSource,
        body: q.body,
        options: [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE],
        correct_index: q.correct_index,
        explanation: q.explanation || null,
        difficulty: 'medium',
        status: 'published',
        source: 'manual'
      }));

      const { error } = await supabase.from('questions').insert(formattedData);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: `${validQuestions.length} adet soru başarıyla veritabanına eklendi!` });
      setParsedQuestions([]);
      setInputText('');
    } catch (err: any) {
      setMessage({ type: 'error', text: `Kayıt hatası: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Toplu Soru Aktarımı (Metin Analizi)</h1>
        <p className="mt-1 text-sm text-slate-500">
          OCR'dan veya PDF'ten kopyaladığınız ham metni buraya yapıştırın. Sistem otomatik olarak soruları ve şıkları ayıracaktır.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          {message.text}
        </div>
      )}

      {parsedQuestions.length === 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Ham Soru Metni</label>
          <p className="text-xs text-slate-500 mb-4">
            Beklenen Format: Her soru numarası ile başlamalı (Örn: "1. " veya "Soru 1:"). Şıklar "A) ", "B) " şeklinde alt alta olmalı. Çözüm "Çözüm: " başlığı altında olmalı.
          </p>
          <textarea
            rows={15}
            className="w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary font-mono text-sm p-4 border"
            placeholder="1. Türkiye'nin başkenti neresidir?&#10;A) İstanbul&#10;B) Ankara&#10;C) İzmir&#10;D) Bursa&#10;E) Antalya&#10;Çözüm: Ankara, 13 Ekim 1923'te başkent olmuştur."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={parseText}
              disabled={isParsing || inputText.trim().length === 0}
              className="flex items-center justify-center py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
            >
              {isParsing ? 'Analiz ediliyor...' : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Metni Ayrıştır
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {parsedQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-primary" />
              Veritabanı Ayarları
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Aktarılacak Ders</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                >
                  <option value="">-- Ders Seçin --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Soru Kaynağı</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                >
                  <option value="">-- Kaynak Seçin --</option>
                  {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-slate-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Önizleme ({parsedQuestions.length} Soru)
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setParsedQuestions([])}
                  className="py-2 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  İptal Et
                </button>
                <button
                  onClick={saveToDatabase}
                  disabled={isSaving}
                  className="flex items-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? 'Kaydediliyor...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Veritabanına Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {parsedQuestions.map((q, i) => (
                <div key={q.id} className={`p-4 rounded-lg border ${q.status === 'valid' ? 'border-slate-200 bg-slate-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-700">Soru {i + 1}</span>
                    {q.status === 'invalid' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Eksik Alanlar Var
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-900 whitespace-pre-wrap mb-4">{q.body}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-4">
                    <div className="p-2 bg-white rounded border border-slate-100"><span className="font-bold text-slate-800 mr-2">A)</span>{q.optionA}</div>
                    <div className="p-2 bg-white rounded border border-slate-100"><span className="font-bold text-slate-800 mr-2">B)</span>{q.optionB}</div>
                    <div className="p-2 bg-white rounded border border-slate-100"><span className="font-bold text-slate-800 mr-2">C)</span>{q.optionC}</div>
                    <div className="p-2 bg-white rounded border border-slate-100"><span className="font-bold text-slate-800 mr-2">D)</span>{q.optionD}</div>
                    <div className="p-2 bg-white rounded border border-slate-100 md:col-span-2"><span className="font-bold text-slate-800 mr-2">E)</span>{q.optionE}</div>
                  </div>

                  {q.explanation && (
                    <div className="mt-3 p-3 bg-blue-50/50 rounded-md border border-blue-100">
                      <span className="block text-xs font-bold text-blue-800 mb-1">Çözüm / Açıklama:</span>
                      <p className="text-sm text-blue-900">{q.explanation}</p>
                    </div>
                  )}

                  {q.errors.length > 0 && (
                    <div className="mt-3 text-sm text-red-600">
                      <ul className="list-disc pl-5">
                        {q.errors.map((err, j) => <li key={j}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
