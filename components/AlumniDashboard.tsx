import React, { useState, useEffect } from 'react';
import { User, JobVacancy } from '../types';
import { StorageService } from '../services/storageService';
import { 
  Briefcase, GraduationCap, MapPin, CheckCircle, 
  FileText, ChevronRight, UserCircle, Star, ExternalLink,
  Info, Sparkles, ShieldCheck, ArrowRight
} from 'lucide-react';

interface Props {
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

export const AlumniDashboard: React.FC<Props> = ({ currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'jobs' | 'tracer'>('profile');
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tracerStatus, setTracerStatus] = useState(currentUser.tracerStatus || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<User>({ ...currentUser });

  // LINK TUJUAN PROFIL & CV
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzuRXXxiu8ywe4LMKjuZLaqEl6m5u7fkjFnSpM8qslIgCjFrGI17LRU__-kBgNQXRhK/exec';
  const LOGO_URL = 'https://lh3.googleusercontent.com/d/1dERcrdAuXmsJoFb0s-cKSIS5M6VMg0Q2';

  useEffect(() => {
    setJobs(StorageService.getJobs().filter(j => j.isApproved));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          cvFileName: file.name,
          cvBase64: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const syncToGoogleSheet = async (data: User) => {
    setIsSyncing(true);
    
    // Construct the exactly named payload for GSheet
    const payload = {
      "USERNAME": data.email || "",
      "PASSWORD": data.password || "",
      "NAMA SISWA": data.name || "",
      "TEMPAT LAHIR": data.birthPlace || "",
      "TGL LAHIR": data.birthDate || "",
      "ALAMAT LENGKAP": data.address || "",
      "JENIS KELAMIN": data.gender || "",
      "NO. WHATSAPP": data.whatsapp || "",
      "FILE CV": data.cvBase64 || "", // Base64 Content
      "RINGKASAN PROFESIONAL": data.cvSummary || "",
      "SKILL UTAMA": data.skills?.join(', ') || "",
      "KELAS": data.className || "",
      "TAHUN LULUS": data.graduationYear?.toString() || "",
      "JURUSAN": data.major || "",
      "EMAIL": data.email || "",
      "NO_Tlp": data.noTlp || "",
    };

    try {
      // Use fetch with 'no-cors' if we expect a redirect or just simple submission, 
      // but for JSON it's better to use regular fetch if the script handles CORS.
      // Most Apps Scripts need a specific header configuration for CORS.
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps script usually doesn't return CORS headers but succeeds
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Since 'no-cors' won't let us see the body/status, we assume success if no error thrown
      onUpdateUser(data);
      StorageService.saveUser(data);
      StorageService.setCurrentUser(data);
      alert('Profil & CV berhasil disinkronkan ke pusat data!');
      setShowProfileForm(false);
    } catch (error) {
       console.error('Sync error:', error);
       alert('Gagal menyinkronkan data. Silakan coba lagi.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateTracer = () => {
    if (!tracerStatus) return alert('Pilih status Anda saat ini.');
    const updated = { ...currentUser, tracerStatus: tracerStatus as any };
    StorageService.saveUser(updated);
    onUpdateUser(updated);
    alert('Status Tracer Study berhasil diperbarui!');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-white rounded-3xl shadow-xl shadow-blue-100 mb-6 transform hover:scale-105 transition-transform duration-300">
             <img 
               src={LOGO_URL} 
               alt="Logo SMK Tanjung Priok 1" 
               className="h-20 w-auto object-contain" 
             />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard Alumni</h1>
          <p className="text-slate-500 mt-2 text-lg">BKK SMK Tanjung Priok 1</p>
          <div className="flex justify-center mt-4 gap-2">
            <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
            <div className="h-1 w-4 bg-blue-300 rounded-full"></div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8 max-w-lg mx-auto">
          {[
            { id: 'profile', icon: UserCircle, label: 'Profil & CV' },
            { id: 'jobs', icon: Briefcase, label: 'Lowongan' },
            { id: 'tracer', icon: GraduationCap, label: 'Tracer' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={18} /> <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* TAB 1: PORTAL PROFIL & CV */}
          {activeTab === 'profile' && (
            <div className="p-8 md:p-12">
              {!showProfileForm ? (
                <div className="text-center space-y-8">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                    <div className="relative bg-blue-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto text-blue-600 shadow-inner rotate-3">
                      <FileText size={48} />
                    </div>
                  </div>
                  
                  <div className="max-w-md mx-auto space-y-4">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">Lengkapi Profil & CV Profesional Anda</h2>
                    <p className="text-slate-500 text-lg leading-relaxed">
                      Data Anda akan disinkronkan langsung dengan database pusat BKK Sekolah untuk memudahkan mitra industri menemukan bakat Anda.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto my-10">
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <Sparkles className="text-amber-500 mb-3" size={24} />
                      <h4 className="font-bold text-slate-800 text-sm mb-1">AI Optimized</h4>
                      <p className="text-[11px] text-slate-500">Format CV yang disesuaikan dengan standar industri modern.</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <ShieldCheck className="text-green-500 mb-3" size={24} />
                      <h4 className="font-bold text-slate-800 text-sm mb-1">Data Terverifikasi</h4>
                      <p className="text-[11px] text-slate-500">Menjamin keaslian data lulusan SMK Tanjung Priok 1.</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <ArrowRight className="text-blue-500 mb-3" size={24} />
                      <h4 className="font-bold text-slate-800 text-sm mb-1">Update Langsung</h4>
                      <p className="text-[11px] text-slate-500">Formulir terintegrasi langsung dalam dashboard Anda.</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => setShowProfileForm(true)}
                      className="group relative w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-3xl font-bold text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mx-auto"
                    >
                      <span>Lengkapi Profil Sekarang</span>
                      <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <button onClick={() => setShowProfileForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <h2 className="text-2xl font-black text-slate-900">Edit Profil & CV</h2>
                  </div>

                  <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); syncToGoogleSheet(formData); }}>
                    {/* Section 1: Data Utama */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-blue-600 uppercase tracking-wider text-xs flex items-center gap-2">
                        <UserCircle size={16} /> Data Identitas Sekolah
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Nama Lengkap</label>
                           <input 
                            type="text" value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="Contoh: Budi Santoso"
                            required
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Username (Email)</label>
                           <input 
                            type="text" value={formData.email} 
                            readOnly
                            className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none text-slate-500 font-medium"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Kelas</label>
                           <input 
                            type="text" value={formData.className || ''} 
                            onChange={(e) => setFormData({...formData, className: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="Contoh: XII TKJ 1"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Jurusan</label>
                           <input 
                            type="text" value={formData.major || ''} 
                            onChange={(e) => setFormData({...formData, major: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="Contoh: TKJ"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Tahun Lulus</label>
                           <input 
                            type="number" value={formData.graduationYear || ''} 
                            onChange={(e) => setFormData({...formData, graduationYear: parseInt(e.target.value)})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="2024"
                           />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Data Kelahiran */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-blue-600 uppercase tracking-wider text-xs flex items-center gap-2">
                         Data Kelahiran & Kontak
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Tempat Lahir</label>
                           <input 
                            type="text" value={formData.birthPlace || ''} 
                            onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="Jakarta"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Tanggal Lahir</label>
                           <input 
                            type="date" value={formData.birthDate || ''} 
                            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Jenis Kelamin</label>
                           <select 
                            value={formData.gender || ''} 
                            onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                           >
                             <option value="">Pilih Jenis Kelamin</option>
                             <option value="Laki-laki">Laki-laki</option>
                             <option value="Perempuan">Perempuan</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">No. WhatsApp</label>
                           <input 
                            type="text" value={formData.whatsapp || ''} 
                            onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                            placeholder="0812XXXXXXXX"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">No. Telepon Rumah (Opsional)</label>
                           <input 
                            type="text" value={formData.noTlp || ''} 
                            onChange={(e) => setFormData({...formData, noTlp: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                           />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Alamat Lengkap</label>
                        <textarea 
                          value={formData.address || ''} 
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium min-h-[100px]"
                          placeholder="Jl. Nama Jalan No. XX, RT XX/XX..."
                        />
                      </div>
                    </div>

                    {/* Section 3: CV & Profesional */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-blue-600 uppercase tracking-wider text-xs flex items-center gap-2">
                         Ringkasan & CV Digital
                      </h3>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Ringkasan Profesional</label>
                        <textarea 
                          value={formData.cvSummary || ''} 
                          onChange={(e) => setFormData({...formData, cvSummary: e.target.value})}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium min-h-[120px]"
                          placeholder="Ceritakan tentang diri Anda, pengalaman, dan keahlian secara singkat..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 px-1 uppercase">Skill Utama (Pisahkan dengan koma)</label>
                        <input 
                          type="text" 
                          value={formData.skills?.join(', ') || ''} 
                          onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                          placeholder="Node.js, React, UI/UX Design..."
                        />
                      </div>
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-center space-y-4">
                        <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-blue-600">
                           <FileText size={32} />
                        </div>
                        <div className="space-y-1">
                           <p className="font-bold text-slate-700">Upload File CV (PDF/Gambar)</p>
                           <p className="text-xs text-slate-400">Pastikan file terbaca dengan jelas oleh sistem.</p>
                        </div>
                        <input 
                          type="file" 
                          onChange={handleFileChange}
                          id="cv-upload"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <div className="flex flex-col items-center gap-3">
                          <label 
                            htmlFor="cv-upload"
                            className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            Pilih File
                          </label>
                          {formData.cvFileName && (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-full">
                               <CheckCircle size={14} /> {formData.cvFileName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                       <button 
                        type="button"
                        onClick={() => setShowProfileForm(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200"
                       >
                         Batal
                       </button>
                       <button 
                        type="submit"
                        disabled={isSyncing}
                        className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isSyncing ? (
                           <>Sedang Sinkronisasi...</>
                         ) : (
                           <><Sparkles size={20} /> Simpan & Sinkronisasi</>
                         )}
                       </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOWONGAN KERJA */}
          {activeTab === 'jobs' && (
            <div className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                 <h2 className="text-2xl font-bold text-slate-800">Lowongan Tersedia</h2>
                 <div className="relative w-full md:w-80">
                    <input 
                      type="text" 
                      placeholder="Cari lowongan kerja..." 
                      className="w-full p-3 pl-10 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 </div>
              </div>
              
              <div className="grid gap-6">
                 {jobs.length === 0 ? (
                   <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-500">Belum ada lowongan terbaru saat ini.</p>
                   </div>
                 ) : (
                   jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase())).map(job => (
                     <div key={job.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                              <p className="text-blue-600 font-bold text-sm">{job.companyName}</p>
                           </div>
                           <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">{job.type}</span>
                        </div>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{job.description}</p>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                           <div className="flex items-center text-slate-400 text-xs gap-1">
                              <MapPin size={12} /> {job.location}
                           </div>
                           <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-2">
                              Lamar Pekerjaan <ChevronRight size={14} />
                           </button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
            </div>
          )}

          {/* TAB 3: TRACER STUDY */}
          {activeTab === 'tracer' && (
            <div className="p-10 max-w-2xl mx-auto text-center space-y-10">
               <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-inner">
                  <GraduationCap size={48} />
               </div>
               <div className="space-y-3">
                  <h2 className="text-3xl font-black text-slate-900">Tracer Study Alumni</h2>
                  <p className="text-slate-500">Update status kesibukan Anda untuk membantu sekolah melacak keterserapan lulusan di dunia industri.</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  {['Belum Bekerja', 'Bekerja', 'Kuliah', 'Wirausaha'].map(status => (
                    <button 
                      key={status}
                      onClick={() => setTracerStatus(status)}
                      className={`p-6 rounded-[2rem] border-2 font-bold transition-all flex flex-col items-center gap-2 ${
                        tracerStatus === status 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200 scale-[1.05]' 
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200'
                      }`}
                    >
                      {tracerStatus === status && <CheckCircle size={20} className="text-white mb-1" />}
                      {status}
                    </button>
                  ))}
               </div>
               
               <button 
                  onClick={handleUpdateTracer}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold shadow-2xl shadow-slate-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={24} /> Perbarui Status Tracer
                </button>
            </div>
          )}
        </div>

        {/* Footer Branding */}
        <footer className="text-center mt-12 opacity-40">
           <div className="flex items-center justify-center gap-2 mb-2">
              <Star size={14} className="text-blue-600" />
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">Sistem Informasi Alumni Terintegrasi</p>
              <Star size={14} className="text-blue-600" />
           </div>
           <p className="text-[9px] text-slate-500">© 2024 BKK SMK TANJUNG PRIOK 1 - JAKARTA UTARA</p>
        </footer>
      </div>
    </div>
  );
};