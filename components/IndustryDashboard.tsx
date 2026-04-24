import React, { useState, useEffect } from 'react';
import { User, JobVacancy, JobType, UserRole } from '../types';
import { StorageService } from '../services/storageService';
import { Plus, Users, Briefcase, Upload, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface Props {
  currentUser: User;
}

export const IndustryDashboard: React.FC<Props> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [candidates, setCandidates] = useState<User[]>([]);
  
  // Job Form State
  const [newJob, setNewJob] = useState<Partial<JobVacancy>>({ 
    title: '', description: '', requirements: [], deadline: '' 
  });
  const [posterPreview, setPosterPreview] = useState<string>('');
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Load jobs posted by this industry
    setJobs(StorageService.getJobs().filter(j => j.postedBy === currentUser.id));
    // Load candidates (validated alumni)
    setCandidates(StorageService.getUsers().filter(u => u.role === UserRole.ALUMNI && u.isValidated));
  }, [currentUser.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostJob = () => {
    if(!newJob.title || !newJob.description || !newJob.deadline) {
      alert("Mohon lengkapi judul, deskripsi, dan batas waktu.");
      return;
    }

    const job: JobVacancy = {
      id: Date.now().toString(),
      title: newJob.title,
      companyName: currentUser.name,
      location: 'Jakarta', // Simplified
      type: JobType.FULL_TIME,
      description: newJob.description,
      requirements: ['SMK'],
      postedBy: currentUser.id,
      createdAt: new Date().toISOString(),
      isApproved: false, // Needs admin approval
      deadline: newJob.deadline,
      posterUrl: posterPreview,
      rejectionReason: undefined // Clear any old rejection data
    };
    StorageService.saveJob(job);
    setJobs([...jobs, job]);
    setModalOpen(false);
    setNewJob({ title: '', description: '', deadline: '' });
    setPosterPreview('');
    alert('Lowongan berhasil diajukan! Menunggu review Admin Sekolah.');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{currentUser.name}</h1>
          <p className="text-slate-500">Mitra Industri</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Kelola Lowongan
          </button>
           <button 
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'candidates' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Lihat Kandidat
          </button>
        </div>
      </header>

      {activeTab === 'jobs' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Plus size={18} /> Ajukan Lowongan Baru
            </button>
          </div>
          <div className="grid gap-4">
             {jobs.length === 0 && <p className="text-slate-500 text-center py-10">Belum ada lowongan yang diajukan.</p>}
             {jobs.map(job => (
               <div key={job.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {job.posterUrl && (
                        <img src={job.posterUrl} alt="Poster" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                        <p className="text-xs text-slate-500 mb-2">Diajukan: {new Date(job.createdAt).toLocaleDateString()}</p>
                        <p className="text-slate-600 line-clamp-2">{job.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {job.isApproved ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-800 font-medium">
                          <CheckCircle size={12}/> Published
                        </span>
                      ) : job.rejectionReason ? (
                         <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-100 text-red-800 font-medium">
                          <AlertCircle size={12}/> Ditolak
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-medium">
                          <Clock size={12}/> Menunggu Review
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {job.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100 flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Alasan Penolakan:</span> {job.rejectionReason}
                        <div className="mt-1 text-xs opacity-75">Silahkan buat pengajuan baru yang direvisi.</div>
                      </div>
                    </div>
                  )}
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
           {candidates.map(candidate => (
             <div key={candidate.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{candidate.name}</h3>
                    <p className="text-xs text-slate-500">{candidate.major} - Lulus {candidate.graduationYear}</p>
                  </div>
                </div>
                {candidate.cvSummary && (
                  <p className="text-sm text-slate-600 italic mb-4">"{candidate.cvSummary}"</p>
                )}
                <div className="flex flex-wrap gap-1 mb-4">
                  {candidate.skills?.map((skill, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{skill}</span>
                  ))}
                </div>
                <button className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium">
                  Lihat Profil Lengkap
                </button>
             </div>
           ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Pengajuan Lowongan Kerja</h2>
              <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Judul Posisi</label>
                   <input 
                    type="text" 
                    placeholder="Contoh: Teknisi Mesin" 
                    className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newJob.title}
                    onChange={e => setNewJob({...newJob, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batas Waktu Lamaran</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newJob.deadline}
                    onChange={e => setNewJob({...newJob, deadline: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi & Syarat</label>
                   <textarea 
                    placeholder="Jelaskan detail pekerjaan dan kualifikasi yang dibutuhkan..." 
                    className="w-full border border-slate-300 p-2 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newJob.description}
                    onChange={e => setNewJob({...newJob, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload Poster (Opsional)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                    <p className="text-xs text-slate-500">{posterPreview ? 'Ganti Poster' : 'Klik untuk upload gambar'}</p>
                  </div>
                  {posterPreview && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 mb-1">Preview:</p>
                      <img src={posterPreview} alt="Preview" className="h-20 rounded border" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Batal</button>
                <button onClick={handlePostJob} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Ajukan Lowongan</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};