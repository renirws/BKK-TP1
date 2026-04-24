import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { StorageService } from './services/storageService';
import { AdminDashboard } from './components/AdminDashboard';
import { AlumniDashboard } from './components/AlumniDashboard';
import { IndustryDashboard } from './components/IndustryDashboard';
import { LogOut, GraduationCap, Building2, ShieldCheck, ArrowRight, X, Loader2, UserPlus, Briefcase } from 'lucide-react';

// Helper to check credentials against Google Sheet
const verifyAdminCredentials = async (username: string, pass: string): Promise<boolean> => {
  const SHEET_ID = '1-vVmdjxt_MaqiupVJMB4GdpIB1smP5NFD8ucvVQhdqE';
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) return false;

    const text = await response.text();
    const rows = text.split('\n').map(row => {
      const cells = row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim());
      return cells;
    });

    const isValid = rows.some(row => {
      if (row.length < 2) return false;
      return row[0] === username && row[1] === pass;
    });

    return isValid;
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return false;
  }
};

// Helper to check Alumni credentials against specific Google Sheet
const verifyAlumniCredentials = async (username: string, pass: string): Promise<User | null> => {
  // Sumber Data Kredensial: https://docs.google.com/spreadsheets/d/1IskwA8NhOyYw2BGSOgO4Jt_6e4TkGKo6KHFLmgNeSf0/edit?usp=sharing
  const SHEET_ID = '1IskwA8NhOyYw2BGSOgO4Jt_6e4TkGKo6KHFLmgNeSf0';
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) return null;

    const text = await response.text();
    const rows = text.split('\n').map(row => {
      // Robust CSV parsing for quoted strings containing commas
      const cells: string[] = [];
      let inQuote = false;
      let currentCell = '';
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          // End of cell
          cells.push(currentCell);
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      // Push the last cell
      cells.push(currentCell);
      
      // Clean up quotes and trim
      return cells.map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    });

    // Assume Columns: Username(0), Password(1), Nama(2), Jurusan(3), Tahun(4)
    const matchedRow = rows.find(row => {
      if (row.length < 2) return false;
      const sheetUser = row[0] || '';
      const sheetPass = row[1] || '';
      // Case-insensitive username check, exact password check
      return sheetUser.toLowerCase() === username.trim().toLowerCase() && sheetPass === pass;
    });

    if (matchedRow) {
      // Parse year safely (remove non-digits)
      let year = undefined;
      if (matchedRow[4]) {
        const yearMatch = matchedRow[4].match(/\d{4}/);
        if (yearMatch) year = parseInt(yearMatch[0]);
      }

      return {
        id: `alumni-${Date.now()}`, 
        email: matchedRow[0], // Username
        password: matchedRow[1], // Store password for sync
        name: matchedRow[2] || 'Siswa',
        role: UserRole.ALUMNI,
        major: matchedRow[3] || '',
        graduationYear: year,
        isValidated: true // Data from school sheet is considered automatically validated
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching alumni credentials:", error);
    return null;
  }
};

// Helper to check Industry credentials
const verifyIndustryCredentials = async (username: string, pass: string): Promise<User | null> => {
  const SHEET_ID = '1voQ4RX8Z6OfMe6-VA7I7EtCgWVVQhMsUM3LNYiUaZoc';
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) return null;

    const text = await response.text();
    const rows = text.split('\n').map(row => {
      const cells = [];
      let inQuote = false;
      let currentCell = '';
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
          cells.push(currentCell.trim().replace(/^"|"$/g, ''));
          currentCell = '';
        } else currentCell += char;
      }
      cells.push(currentCell.trim().replace(/^"|"$/g, ''));
      return cells;
    });

    // Assume Columns: Username(0), Password(1), Nama PT(2), Bidang(3)
    const matchedRow = rows.find(row => {
      if (row.length < 2) return false;
      return row[0] === username && row[1] === pass;
    });

    if (matchedRow) {
      return {
        id: `industry-${Date.now()}`,
        email: matchedRow[0],
        password: matchedRow[1], // Store password
        name: matchedRow[2] || 'Mitra Industri',
        role: UserRole.INDUSTRY,
        isValidated: true // Industry added via sheet is considered valid
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching industry credentials:", error);
    return null;
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin Login State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  // Alumni Login State
  const [showAlumniLogin, setShowAlumniLogin] = useState(false);
  const [alumniUsername, setAlumniUsername] = useState('');
  const [alumniPass, setAlumniPass] = useState('');
  
  // Industry Login State
  const [showIndustryLogin, setShowIndustryLogin] = useState(false);
  const [industryUser, setIndustryUser] = useState('');
  const [industryPass, setIndustryPass] = useState('');

  // Registration State
  const [showRegistration, setShowRegistration] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    username: '',
    password: '',
    major: '',
    year: ''
  });
  const [majors, setMajors] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Initialize Data
  useEffect(() => {
    StorageService.init();
    const storedUser = StorageService.getCurrentUser();
    if (storedUser) {
      setCurrentUser(storedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (email: string) => {
    const user = StorageService.login(email);
    if (user) {
      setCurrentUser(user);
    } else {
      alert("User not found");
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsVerifying(true);

    const isValid = await verifyAdminCredentials(adminUser, adminPass);

    setIsVerifying(false);
    if (isValid) {
      handleLogin('admin@smk1.sch.id');
      setShowAdminLogin(false);
      setAdminUser('');
      setAdminPass('');
    } else {
      setLoginError("login salah !");
    }
  };

  const handleAlumniLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsVerifying(true);

    // 1. Try Google Sheet Verification (Legacy/School Data)
    let alumniData = await verifyAlumniCredentials(alumniUsername, alumniPass);

    // 2. If not in sheet, try Local Storage (New Registrations)
    if (!alumniData) {
      alumniData = StorageService.authenticateLocal(alumniUsername, alumniPass);
    }

    setIsVerifying(false);
    if (alumniData) {
      StorageService.syncUser(alumniData);
      setCurrentUser(alumniData);
      setShowAlumniLogin(false);
      setAlumniUsername('');
      setAlumniPass('');
    } else {
      setLoginError("login salah !");
    }
  };

  const handleIndustryLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsVerifying(true);

    const industryData = await verifyIndustryCredentials(industryUser, industryPass);

    setIsVerifying(false);
    if (industryData) {
      StorageService.syncUser(industryData);
      setCurrentUser(industryData);
      setShowIndustryLogin(false);
      setIndustryUser('');
      setIndustryPass('');
    } else {
      setLoginError("login salah !");
    }
  };

  const openRegistration = () => {
    setMajors(StorageService.getMajors());
    setYears(StorageService.getYears());
    setShowAlumniLogin(false);
    setShowRegistration(true);
    setLoginError('');
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.major || !regForm.year) {
      setLoginError("Mohon lengkapi semua data.");
      return;
    }

    const newUser: User = {
      id: `reg-${Date.now()}`,
      name: regForm.name,
      email: regForm.username, // Using Username as ID
      password: regForm.password,
      role: UserRole.ALUMNI,
      major: regForm.major,
      graduationYear: parseInt(regForm.year),
      isValidated: false, // Default pending
    };

    const success = StorageService.registerUser(newUser);
    if (success) {
      alert("Registrasi Berhasil! Silahkan login. Akun Anda berstatus 'Menunggu Validasi Admin'.");
      setShowRegistration(false);
      setShowAlumniLogin(true);
      setRegForm({ name: '', username: '', password: '', major: '', year: '' });
    } else {
      setLoginError("Username sudah terdaftar.");
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading BKK System...</div>;

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900 p-4">
        
        {/* Admin Login Modal */}
        {showAdminLogin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
              <button onClick={() => { setShowAdminLogin(false); setLoginError(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Login Admin Sekolah</h2>
              </div>
              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none" placeholder="Username" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none" placeholder="Password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} />
                </div>
                {loginError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">{loginError}</div>}
                <button type="submit" disabled={isVerifying} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
                  {isVerifying ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Dashboard'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Alumni Login Modal */}
        {showAlumniLogin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
              <button onClick={() => { setShowAlumniLogin(false); setLoginError(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
              <div className="text-center mb-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <GraduationCap size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Login Siswa / Alumni</h2>
              </div>
              <form onSubmit={handleAlumniLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none" placeholder="Masukkan Username" value={alumniUsername} onChange={(e) => setAlumniUsername(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none" placeholder="Password" value={alumniPass} onChange={(e) => setAlumniPass(e.target.value)} />
                </div>
                {loginError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">{loginError}</div>}
                <button type="submit" disabled={isVerifying} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
                  {isVerifying ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Dashboard'}
                </button>
                <div className="text-center pt-4 border-t border-slate-100">
                   <p className="text-sm text-slate-500 mb-2">Belum punya akun?</p>
                   <button type="button" onClick={openRegistration} className="text-green-600 font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
                     <UserPlus size={16} /> Daftar Akun Baru
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Industry Login Modal */}
        {showIndustryLogin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
              <button onClick={() => { setShowIndustryLogin(false); setLoginError(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
              <div className="text-center mb-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                  <Briefcase size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Login Mitra Industri</h2>
                <p className="text-slate-500 text-sm">Akses untuk perusahaan rekanan.</p>
              </div>
              <form onSubmit={handleIndustryLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none" placeholder="Username Perusahaan" value={industryUser} onChange={(e) => setIndustryUser(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none" placeholder="Password" value={industryPass} onChange={(e) => setIndustryPass(e.target.value)} />
                </div>
                {loginError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">{loginError}</div>}
                <button type="submit" disabled={isVerifying} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
                  {isVerifying ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Portal Mitra'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* REGISTRATION MODAL */}
        {showRegistration && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
              <button onClick={() => { setShowRegistration(false); setLoginError(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
              <div className="text-center mb-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                  <UserPlus size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Registrasi Alumni</h2>
                <p className="text-slate-500 text-sm">Lengkapi data diri untuk membuat akun.</p>
              </div>
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Buat Username" value={regForm.username} onChange={(e) => setRegForm({...regForm, username: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                     <input type="password" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Buat Password" value={regForm.password} onChange={(e) => setRegForm({...regForm, password: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nama sesuai ijazah" value={regForm.name} onChange={(e) => setRegForm({...regForm, name: e.target.value})} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Jurusan</label>
                      <select required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={regForm.major} onChange={(e) => setRegForm({...regForm, major: e.target.value})}>
                         <option value="">Pilih Jurusan</option>
                         {majors.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Lulus</label>
                      <select required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={regForm.year} onChange={(e) => setRegForm({...regForm, year: e.target.value})}>
                         <option value="">Pilih Tahun</option>
                         {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                   </div>
                </div>
                {loginError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">{loginError}</div>}
                <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 mt-2">Daftar Sekarang</button>
                <div className="text-center pt-2">
                   <button type="button" onClick={() => {setShowRegistration(false); setShowAlumniLogin(true);}} className="text-slate-500 hover:text-slate-800 text-sm">
                     Sudah punya akun? Login
                   </button>
                </div>
              </form>
            </div>
           </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full flex flex-col md:flex-row overflow-hidden">
          {/* Left Side: Info */}
          <div className="md:w-1/2 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100">
            <div className="mb-6">
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs tracking-wide">BKK ONLINE</span>
              <h1 className="text-4xl font-extrabold text-slate-900 mt-2 leading-tight">SMK Tanjung Priok 1</h1>
              <p className="text-slate-500 mt-4 text-lg">Platform Bursa Kerja Khusus terintegrasi untuk Alumni, Sekolah, dan Mitra Industri.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
               <div className="p-3 bg-slate-50 rounded-lg"><h3 className="font-bold text-xl text-blue-600">500+</h3><p className="text-xs text-slate-500">Alumni</p></div>
               <div className="p-3 bg-slate-50 rounded-lg"><h3 className="font-bold text-xl text-green-600">50+</h3><p className="text-xs text-slate-500">Mitra</p></div>
               <div className="p-3 bg-slate-50 rounded-lg"><h3 className="font-bold text-xl text-purple-600">100+</h3><p className="text-xs text-slate-500">Loker</p></div>
            </div>
          </div>

          {/* Right Side: Login Options */}
          <div className="md:w-1/2 p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Masuk Sebagai</h2>
            <div className="space-y-3">
              <button onClick={() => setShowAdminLogin(true)} className="w-full group relative flex items-center p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-blue-500 transition-all shadow-sm hover:shadow-md">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"><ShieldCheck size={24} /></div>
                <div className="text-left flex-1"><h3 className="font-bold text-slate-900">Admin Sekolah</h3><p className="text-xs text-slate-500">Kelola data & Validasi</p></div>
                <ArrowRight className="text-slate-300 group-hover:text-blue-500" />
              </button>
              <button onClick={() => setShowAlumniLogin(true)} className="w-full group relative flex items-center p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-green-500 transition-all shadow-sm hover:shadow-md">
                <div className="bg-green-100 p-3 rounded-full text-green-600 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors"><GraduationCap size={24} /></div>
                <div className="text-left flex-1"><h3 className="font-bold text-slate-900">Alumni / Siswa</h3><p className="text-xs text-slate-500">Cari Kerja & Update CV</p></div>
                <ArrowRight className="text-slate-300 group-hover:text-green-500" />
              </button>
              <button onClick={() => setShowIndustryLogin(true)} className="w-full group relative flex items-center p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-purple-500 transition-all shadow-sm hover:shadow-md">
                <div className="bg-purple-100 p-3 rounded-full text-purple-600 mr-4 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Building2 size={24} /></div>
                <div className="text-left flex-1"><h3 className="font-bold text-slate-900">Mitra Industri</h3><p className="text-xs text-slate-500">Pasang Iklan & Rekrut</p></div>
                <ArrowRight className="text-slate-300 group-hover:text-purple-500" />
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-6">Demo Version • SMK Tanjung Priok 1</p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN LAYOUT AFTER LOGIN
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <img 
                src="https://lh3.googleusercontent.com/d/1jzEQMGw4tEbkBsubQ3HB5Xg__X_0lIFA" 
                alt="Logo SMK" 
                className="h-10 w-auto" 
              />
              <div>
                 <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white font-bold rounded px-1.5 py-0.5 text-xs">BKK</span>
                    <span className="font-bold text-slate-900 text-lg leading-none">SMK Tanjung Priok 1</span>
                 </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser.role.toLowerCase()}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Logout"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="py-6">
        {currentUser.role === UserRole.ADMIN && <AdminDashboard />}
        {currentUser.role === UserRole.ALUMNI && <AlumniDashboard currentUser={currentUser} onUpdateUser={setCurrentUser} />}
        {currentUser.role === UserRole.INDUSTRY && <IndustryDashboard currentUser={currentUser} />}
      </main>
    </div>
  );
}
