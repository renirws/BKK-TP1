import React, { useState, useEffect } from 'react';
import { User, JobVacancy, TracerStatus, JobType, UserRole } from '../types';
import { StorageService } from '../services/storageService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Briefcase, Users, FileCheck, Database, LayoutDashboard, 
  Trash2, CheckCircle, XCircle, Printer, Plus, Search, Building2, Calendar, Image as ImageIcon, AlertCircle 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'validation' | 'jobs' | 'reports'>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  // Master Data Inputs
  const [newMajor, setNewMajor] = useState('');
  const [newYear, setNewYear] = useState('');

  // Job Form State
  const [isJobModalOpen, setJobModalOpen] = useState(false);
  const [newJob, setNewJob] = useState<Partial<JobVacancy>>({
    title: '', companyName: '', location: '', type: JobType.FULL_TIME, description: '', requirements: []
  });
  const [posterPreview, setPosterPreview] = useState<string>('');

  // Filters
  const [alumniSearch, setAlumniSearch] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setStats(StorageService.getStats());
    setUsers(StorageService.getUsers());
    setJobs(StorageService.getJobs());
    setMajors(StorageService.getMajors());
    setYears(StorageService.getYears());
  };

  // --- Master Data Handlers ---
  const handleAddMajor = () => {
    if (newMajor) {
      StorageService.addMajor(newMajor);
      setNewMajor('');
      refreshData();
    }
  };
  const handleDeleteMajor = (major: string) => {
    if(confirm(`Hapus jurusan ${major}?`)) {
      StorageService.deleteMajor(major);
      refreshData();
    }
  };
  const handleAddYear = () => {
    const y = parseInt(newYear);
    if (!isNaN(y)) {
      StorageService.addYear(y);
      setNewYear('');
      refreshData();
    }
  };
  const handleDeleteYear = (year: number) => {
    if(confirm(`Hapus tahun ${year}?`)) {
      StorageService.deleteYear(year);
      refreshData();
    }
  };

  // --- Validation Handlers ---
  const handleValidateUser = (id: string) => {
    StorageService.validateAlumni(id);
    refreshData();
  };

  // --- Job Handlers ---
  const handlePostJob = () => {
    if (!newJob.title || !newJob.companyName) return alert('Data tidak lengkap');
    
    const job: JobVacancy = {
      id: Date.now().toString(),
      title: newJob.title || '',
      companyName: newJob.companyName || '',
      location: newJob.location || 'Jakarta',
      type: newJob.type || JobType.FULL_TIME,
      description: newJob.description || '',
      requirements: newJob.requirements || [],
      postedBy: '1', // Admin ID
      createdAt: new Date().toISOString(),
      isApproved: true, // Admin posted jobs are auto-approved
      salaryRange: newJob.salaryRange,
      posterUrl: posterPreview
    };

    StorageService.saveJob(job);
    setJobModalOpen(false);
    setNewJob({ title: '', companyName: '', location: '', type: JobType.FULL_TIME, description: '', requirements: [] });
    setPosterPreview('');
    refreshData();
  };

  const handleDeleteJob = (id: string) => {
    if(confirm("Hapus lowongan ini?")) {
      StorageService.deleteJob(id);
      refreshData();
    }
  };

  const handleApproveJob = (job: JobVacancy) => {
    const updatedJob = { ...job, isApproved: true, rejectionReason: undefined };
    StorageService.saveJob(updatedJob);
    refreshData();
    alert("Lowongan berhasil diterbitkan.");
  };

  const handleRejectJob = (job: JobVacancy) => {
    const reason = prompt("Masukkan alasan penolakan untuk Mitra Industri:");
    if (reason) {
      const updatedJob = { ...job, isApproved: false, rejectionReason: reason };
      StorageService.saveJob(updatedJob);
      refreshData();
    }
  };

  const handlePrint = () => {
    window.print();
  };

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

  // Stats Data
  const data = stats?.tracerDistribution || [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Users size={24} /></div>
            <div><p className="text-slate-500 text-xs uppercase font-bold">Total Alumni</p><h3 className="text-2xl font-bold">{stats.totalAlumni}</h3></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
             <div className="bg-green-100 p-3 rounded-full text-green-600"><Briefcase size={24} /></div>
             <div><p className="text-slate-500 text-xs uppercase font-bold">Total Loker</p><h3 className="text-2xl font-bold">{stats.totalJobs}</h3></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
             <div className="bg-purple-100 p-3 rounded-full text-purple-600"><Building2 size={24} /></div>
             <div><p className="text-slate-500 text-xs uppercase font-bold">Mitra Industri</p><h3 className="text-2xl font-bold">{stats.totalPartners}</h3></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
             <div className="bg-orange-100 p-3 rounded-full text-orange-600"><FileCheck size={24} /></div>
             <div><p className="text-slate-500 text-xs uppercase font-bold">Belum Validasi</p><h3 className="text-2xl font-bold">{users.filter(u => u.role === UserRole.ALUMNI && !u.isValidated).length}</h3></div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'master', label: 'Data Master', icon: Database },
          { id: 'validation', label: 'Validasi Alumni', icon: FileCheck },
          { id: 'jobs', label: 'Lowongan Kerja', icon: Briefcase },
          { id: 'reports', label: 'Laporan', icon: Printer },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-white border-x border-t border-slate-200 text-blue-600' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 min-h-[500px]">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-800">Selamat Datang di Dashboard Admin</h2>
            <p className="text-slate-500 mt-2">Pilih menu diatas untuk mengelola data BKK SMK Tanjung Priok 1.</p>
          </div>
        )}

        {/* DATA MASTER TAB */}
        {activeTab === 'master' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Majors Management */}
            <div>
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Database size={20}/> Data Jurusan</h3>
               <div className="flex gap-2 mb-4">
                 <input 
                  type="text" 
                  className="flex-1 border p-2 rounded" 
                  placeholder="Nama Jurusan Baru..." 
                  value={newMajor}
                  onChange={e => setNewMajor(e.target.value)}
                />
                 <button onClick={handleAddMajor} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus/></button>
               </div>
               <ul className="space-y-2">
                 {majors.map(m => (
                   <li key={m} className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                     <span>{m}</span>
                     <button onClick={() => handleDeleteMajor(m)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                   </li>
                 ))}
               </ul>
            </div>
            
            {/* Years Management */}
            <div>
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={20}/> Data Tahun Lulus</h3>
               <div className="flex gap-2 mb-4">
                 <input 
                  type="number" 
                  className="flex-1 border p-2 rounded" 
                  placeholder="Tahun..." 
                  value={newYear}
                  onChange={e => setNewYear(e.target.value)}
                />
                 <button onClick={handleAddYear} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus/></button>
               </div>
               <ul className="space-y-2">
                 {years.map(y => (
                   <li key={y} className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                     <span>{y}</span>
                     <button onClick={() => handleDeleteYear(y)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        )}

        {/* VALIDATION TAB */}
        {activeTab === 'validation' && (
           <div>
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Validasi Akun Alumni</h3>
                <div className="relative">
                   <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                   <input 
                    type="text" 
                    placeholder="Cari Nama / Jurusan..." 
                    className="pl-10 pr-4 py-2 border rounded-lg w-64"
                    value={alumniSearch}
                    onChange={e => setAlumniSearch(e.target.value)}
                   />
                </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                     <th className="p-4">Nama</th>
                     <th className="p-4">Jurusan</th>
                     <th className="p-4">Tahun</th>
                     <th className="p-4">Status</th>
                     <th className="p-4">Aksi</th>
                   </tr>
                 </thead>
                 <tbody>
                   {users
                    .filter(u => u.role === UserRole.ALUMNI && u.name.toLowerCase().includes(alumniSearch.toLowerCase()))
                    .map(u => (
                     <tr key={u.id} className="border-b hover:bg-slate-50 transition-colors">
                       <td className="p-4 font-medium">{u.name}</td>
                       <td className="p-4">{u.major}</td>
                       <td className="p-4">{u.graduationYear}</td>
                       <td className="p-4">
                         {u.isValidated ? 
                           <span className="text-green-600 text-xs font-bold px-2 py-1 bg-green-100 rounded-full flex w-fit items-center gap-1"><CheckCircle size={12}/> Valid</span> : 
                           <span className="text-yellow-600 text-xs font-bold px-2 py-1 bg-yellow-100 rounded-full flex w-fit items-center gap-1">Pending</span>
                         }
                       </td>
                       <td className="p-4">
                         {!u.isValidated && (
                           <button onClick={() => handleValidateUser(u.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Validasi</button>
                         )}
                       </td>
                     </tr>
                   ))}
                   {users.filter(u => u.role === UserRole.ALUMNI).length === 0 && (
                     <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data alumni.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg">Kelola Lowongan Kerja</h3>
               <button onClick={() => setJobModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800">
                 <Plus size={18} /> Posting Loker Baru
               </button>
            </div>
            
            <div className="grid gap-4">
              {jobs.map(job => (
                <div key={job.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                       {job.posterUrl && (
                         <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-md overflow-hidden border">
                           <img src={job.posterUrl} alt="Poster" className="w-full h-full object-cover"/>
                         </div>
                       )}
                       <div>
                         <h4 className="font-bold text-lg text-slate-900">{job.title}</h4>
                         <p className="text-sm text-slate-500">{job.companyName} • {job.location}</p>
                         <p className="text-xs text-slate-400 mt-1">Diposting: {new Date(job.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.isApproved ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Published</span>
                      ) : job.rejectionReason ? (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">Ditolak</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold">Perlu Review</span>
                      )}
                      
                      <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-slate-400 hover:text-red-600 rounded">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Industry Approval Actions */}
                  {!job.isApproved && !job.rejectionReason && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                       <button onClick={() => handleApproveJob(job)} className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700">
                         Setujui & Terbitkan
                       </button>
                       <button onClick={() => handleRejectJob(job)} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded text-sm font-medium hover:bg-red-100">
                         Tolak Pengajuan
                       </button>
                    </div>
                  )}

                  {job.rejectionReason && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                      <span className="font-bold">Alasan Penolakan:</span> {job.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Modal Posting Loker Admin */}
            {isJobModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                   <h3 className="font-bold text-xl mb-4">Posting Lowongan Baru</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Judul Posisi" className="border p-2 rounded" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})}/>
                        <input type="text" placeholder="Nama Perusahaan" className="border p-2 rounded" value={newJob.companyName} onChange={e => setNewJob({...newJob, companyName: e.target.value})}/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Lokasi" className="border p-2 rounded" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})}/>
                        <input type="text" placeholder="Gaji (Opsional)" className="border p-2 rounded" value={newJob.salaryRange} onChange={e => setNewJob({...newJob, salaryRange: e.target.value})}/>
                      </div>
                      <textarea placeholder="Deskripsi Pekerjaan..." className="w-full border p-2 rounded h-32" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})}></textarea>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Upload Poster (Opsional)</label>
                        <input type="file" onChange={handleFileChange} />
                        {posterPreview && <img src={posterPreview} className="mt-2 h-32 rounded border" alt="Preview"/>}
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <button onClick={() => setJobModalOpen(false)} className="px-4 py-2 text-slate-600">Batal</button>
                        <button onClick={handlePostJob} className="px-4 py-2 bg-blue-600 text-white rounded">Simpan & Terbitkan</button>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Laporan Keterserapan Alumni</h3>
              <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800">
                <Printer size={18} /> Cetak Laporan
              </button>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-xl flex flex-col items-center justify-center print:bg-white print:p-0">
               <h2 className="text-xl font-bold mb-6 text-center">Grafik Tracer Study</h2>
               <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-8 w-full max-w-md">
                  <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-slate-300 p-2">Status</th>
                        <th className="border border-slate-300 p-2">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((d: any) => (
                        <tr key={d.name}>
                          <td className="border border-slate-300 p-2">{d.name}</td>
                          <td className="border border-slate-300 p-2 text-center">{d.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};