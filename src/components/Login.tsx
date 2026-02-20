import React, { useState } from 'react';
import { studentsData } from '../data/students';

interface LoginProps {
  onLogin: (name: string, className?: string) => void;
}

const CLASSES = [
  'Kelas 1A', 'Kelas 1B', 
  'Kelas 2A', 'Kelas 2B', 'Kelas 2C', 
  'Kelas 3', 
  'Kelas 4A', 'Kelas 4B', 'Kelas 4C', 
  'Kelas 5A', 'Kelas 5B', 'Kelas 5C', 
  'Kelas 6A', 'Kelas 6B'
];

export default function Login({ onLogin }: LoginProps) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');

  const handleLogin = () => {
    if (isAdminMode) {
      if (adminUsername === 'admin' && password === '11223344') {
        onLogin('admin');
      } else {
        setError('Username atau Password Admin salah!');
      }
      return;
    }

    if (!selectedClass) {
      setError('Pilih kelas terlebih dahulu!');
      return;
    }

    // Determine if we have data for this class
    const classData = studentsData[selectedClass];
    const hasClassData = !!classData;

    const nameToLogin = hasClassData ? selectedName : customName;

    if (!nameToLogin) {
      setError('Nama siswa harus diisi!');
      return;
    }
    
    if (!password) {
      setError('Password harus diisi!');
      return;
    }

    // Validation
    if (hasClassData) {
      // Check against stored password
      if (classData[nameToLogin] !== password) {
        setError('Password salah! Silakan cek kembali.');
        return;
      }
    } else {
      // For classes without data, we currently accept any password (or you could add logic)
      // Just ensuring it's not empty
    }
    
    // Login success
    onLogin(nameToLogin, selectedClass);
  };

  const resetForm = () => {
    setSelectedClass('');
    setSelectedName('');
    setCustomName('');
    setPassword('');
    setError('');
  };

  const availableStudents = selectedClass && studentsData[selectedClass] 
    ? Object.keys(studentsData[selectedClass]) 
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-gradient rounded-3xl p-8 max-w-md w-full border border-white/20 animate-slide-in">
        <div className="text-center mb-6">
          <img 
            src="https://i.ibb.co.com/YswcXgP/LOGO-PEKAYON-09.png" 
            alt="Logo SDN Pekayon 09" 
            className="w-24 h-24 mx-auto drop-shadow-[0_0_20px_rgba(251,191,36,0.3)] object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl font-bold mt-4 bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            {isAdminMode ? 'Admin Panel' : 'Petualangan Ramadhan'}
          </h1>
          <p className="text-yellow-200/80 mt-2">SDN Pekayon 09</p>
        </div>
        
        <div className="space-y-4">
          {isAdminMode ? (
            <div>
              <label className="block text-yellow-200 mb-2 font-medium">👤 Username Admin</label>
              <input 
                type="text" 
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Masukkan username admin" 
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-yellow-400 transition"
              />
              <div className="mt-4">
                <label className="block text-yellow-200 mb-2 font-medium">🔐 Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password" 
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Class Selection */}
              <div>
                <label className="block text-yellow-200 mb-2 font-medium">🏫 Pilih Kelas</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedName('');
                    setCustomName('');
                    setPassword('');
                    setError('');
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:border-yellow-400 transition"
                >
                  <option value="" className="text-gray-800">-- Pilih Kelas --</option>
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls} className="text-gray-800">{cls}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Name Input (Shown only after class selected) */}
              {selectedClass && (
                <div className="animate-slide-in">
                  <label className="block text-yellow-200 mb-2 font-medium">👤 Nama Siswa</label>
                  {availableStudents.length > 0 ? (
                    <select 
                      value={selectedName}
                      onChange={(e) => setSelectedName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:border-yellow-400 transition"
                    >
                      <option value="" className="text-gray-800">-- Pilih Nama --</option>
                      {availableStudents.map((name) => (
                        <option key={name} value={name} className="text-gray-800">{name}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Masukkan nama lengkap..." 
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-yellow-400 transition"
                    />
                  )}
                </div>
              )}

              {/* Step 3: Password Input (Shown only after name filled) */}
              {((availableStudents.length > 0 && selectedName) || (availableStudents.length === 0 && customName)) && (
                <div className="animate-slide-in">
                  <label className="block text-yellow-200 mb-2 font-medium">🔐 Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password" 
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-yellow-400 transition"
                  />
                </div>
              )}
            </>
          )}

          <button 
            onClick={handleLogin}
            className="w-full py-4 golden-gradient text-gray-900 font-bold rounded-xl hover:opacity-90 transition transform hover:scale-[1.02] active:scale-[0.98] mt-6 cursor-pointer"
          >
            {isAdminMode ? '🔓 Masuk Admin' : '✨ Masuk Petualangan Ramadhan ✨'}
          </button>
          
          {error && <p className="text-red-400 text-center mt-2">{error}</p>}

          <div className="text-center mt-4">
            <button 
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                resetForm();
              }}
              className="text-sm text-white/50 hover:text-white underline cursor-pointer"
            >
              {isAdminMode ? 'Kembali ke Login Siswa' : 'Masuk sebagai Admin'}
            </button>
          </div>
        </div>
        
        {!isAdminMode && (
          <p className="text-center text-white/60 text-sm mt-6">
            "Barangsiapa berpuasa Ramadhan dengan iman dan mengharap pahala, diampuni dosa-dosanya yang telah lalu" - HR. Bukhari
          </p>
        )}
      </div>
    </div>
  );
}
