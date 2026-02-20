/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Puasa from './components/Puasa';
import Amalan from './components/Amalan';
import Quran from './components/Quran';
import Waktu from './components/Waktu';
import Leaderboard from './components/Leaderboard';
import Inquiry from './components/Inquiry';
import AdminDashboard from './components/AdminDashboard';
import { quotes } from './data/students';
import { 
  getRamadhanDay, 
  getRecord, 
  saveRecord, 
  getTotalExp, 
  getLeaderboard, 
  convertToHijri,
  getUserRecords,
  getAllRecords
} from './utils/ramadhan';
import { AmalanRecord } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('currentUser');
  });
  const [currentClass, setCurrentClass] = useState<string | null>(() => {
    return localStorage.getItem('currentClass');
  });
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('activeSection') || 'home';
  });
  const [currentDay, setCurrentDay] = useState(1);
  const [currentRecord, setCurrentRecord] = useState<AmalanRecord | undefined>(undefined);
  const [totalExp, setTotalExp] = useState(0);
  const [schoolRank, setSchoolRank] = useState<number | string>('-');
  const [classRank, setClassRank] = useState<number | string>('-');
  const [dailyQuote, setDailyQuote] = useState('');
  const [currentDateString, setCurrentDateString] = useState('');
  const [totalQuranPages, setTotalQuranPages] = useState(0);

  // Initialize
  useEffect(() => {
    // Set initial day based on date
    const day = getRamadhanDay();
    setCurrentDay(Math.min(30, Math.max(1, day)));
    
    // Set random quote
    setDailyQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    // Create stars
    const starsContainer = document.getElementById('stars');
    if (starsContainer && starsContainer.childElementCount === 0) {
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star animate-twinkle';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.animationDelay = Math.random() * 2 + 's';
        starsContainer.appendChild(star);
      }
    }

    // Update time
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const gregorian = now.toLocaleDateString('id-ID', options);
      const hijri = convertToHijri(now);
      setCurrentDateString(`📅 ${gregorian} / 📆 ${hijri}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load user data when user or day changes
  useEffect(() => {
    async function loadUserData() {
      if (currentUser && currentUser !== 'admin') {
        const record = await getRecord(currentUser, currentDay);
        setCurrentRecord(record);
        
        const exp = await getTotalExp(currentUser);
        setTotalExp(exp);

        const leaderboard = await getLeaderboard();
        
        // School Rank
        const mySchoolRankIndex = leaderboard.findIndex(r => r.name === currentUser);
        setSchoolRank(mySchoolRankIndex >= 0 ? mySchoolRankIndex + 1 : '-');

        // Class Rank
        if (currentClass) {
          const classLeaderboard = leaderboard.filter(r => r.class === currentClass);
          const myClassRankIndex = classLeaderboard.findIndex(r => r.name === currentUser);
          setClassRank(myClassRankIndex >= 0 ? myClassRankIndex + 1 : '-');
        } else {
          // Fallback if class not set (e.g. old login), try to find from leaderboard data if available
          const userRankData = leaderboard.find(r => r.name === currentUser);
          if (userRankData?.class) {
             const classLeaderboard = leaderboard.filter(r => r.class === userRankData.class);
             const myClassRankIndex = classLeaderboard.findIndex(r => r.name === currentUser);
             setClassRank(myClassRankIndex >= 0 ? myClassRankIndex + 1 : '-');
             // Also update currentClass state if missing
             setCurrentClass(userRankData.class);
             localStorage.setItem('currentClass', userRankData.class);
          } else {
             setClassRank('-');
          }
        }

        // Calculate total quran pages
        const userRecords = await getUserRecords(currentUser);
        const pages = userRecords.reduce((sum, r) => sum + (r.quran_pages || 0), 0);
        setTotalQuranPages(pages);
      }
    }
    loadUserData();
  }, [currentUser, currentDay, activeSection, currentClass]); // Reload on section change to refresh leaderboard/exp

  const handleLogin = (name: string, className?: string) => {
    setCurrentUser(name);
    localStorage.setItem('currentUser', name);
    if (className) {
      setCurrentClass(className);
      localStorage.setItem('currentClass', className);
    }
    setActiveSection('home');
    localStorage.setItem('activeSection', 'home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentClass(null);
    localStorage.removeItem('currentClass');
    setActiveSection('home');
    localStorage.removeItem('activeSection');
  };

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
  };

  const handleSaveRecord = async (record: AmalanRecord) => {
    await saveRecord(record);
    setCurrentRecord(record);
    // Update exp immediately
    const exp = await getTotalExp(currentUser!);
    setTotalExp(exp);
  };

  if (!currentUser) {
    return (
      <div className="h-full overflow-auto scroll-hidden gradient-bg text-white relative">
        <div id="stars" className="fixed inset-0 pointer-events-none z-0"></div>
        <div className="fixed top-8 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-2xl animate-float z-10 opacity-90"></div>
        <div className="relative z-20 flex flex-col min-h-screen">
          <div className="flex-1 flex items-center justify-center">
            <Login onLogin={handleLogin} />
          </div>
          <footer className="p-8 text-center">
            <p className="text-white/40 text-sm">
              Created by: <span className="text-yellow-400/60 font-medium">Teguh Firmansyah Apriliana</span> - <span className="text-emerald-400/60">@goehfirmaan</span>
            </p>
          </footer>
        </div>
      </div>
    );
  }

  if (currentUser === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="h-full overflow-auto scroll-hidden gradient-bg text-white relative font-poppins">
      <div id="stars" className="fixed inset-0 pointer-events-none z-0"></div>
      <div className="fixed top-8 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-2xl animate-float z-10 opacity-90"></div>
      
      <div className="relative z-20 min-h-screen pb-20">
        <Navbar 
          currentUser={currentUser} 
          totalExp={totalExp} 
          activeSection={activeSection} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
          currentDate={currentDateString}
        />

        <main className="max-w-5xl mx-auto p-4">
          {activeSection === 'home' && (
            <Home 
              day={currentDay} 
              exp={totalExp} 
              quranPages={totalQuranPages} 
              schoolRank={schoolRank}
              classRank={classRank}
              className={currentClass || undefined}
              quote={dailyQuote}
              onNavigate={handleNavigate}
            />
          )}
          
          {activeSection === 'puasa' && <Puasa />}
          
          {activeSection === 'amalan' && (
            <Amalan 
              currentUser={currentUser} 
              currentClass={currentClass || undefined}
              currentDay={currentDay} 
              record={currentRecord} 
              onSave={handleSaveRecord}
              onDayChange={setCurrentDay}
            />
          )}
          
          {activeSection === 'quran' && <Quran totalQuranPages={totalQuranPages} />}
          
          {activeSection === 'waktu' && <Waktu currentDate={currentDateString} />}
          
          {activeSection === 'leaderboard' && <Leaderboard currentUser={currentUser} />}

          {activeSection === 'inquiry' && <Inquiry currentUser={currentUser} />}
        </main>

        <footer className="max-w-5xl mx-auto p-8 text-center border-t border-white/10 mt-8">
          <p className="text-white/40 text-sm">
            Created by: <span className="text-yellow-400/60 font-medium">Teguh Firmansyah Apriliana</span> - <span className="text-emerald-400/60">@goehfirmaan</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
