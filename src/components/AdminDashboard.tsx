import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllRecords, calculateExp } from '../utils/ramadhan';
import { studentsData } from '../data/students';
import { AmalanRecord } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface StudentSummary {
  name: string;
  className: string;
  totalExp: number;
  totalQuranPages: number;
  daysFilled: number;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<AmalanRecord[]>([]);
  const [sortBy, setSortBy] = useState<'exp' | 'az'>('exp');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const classes = Object.keys(studentsData).sort();

  useEffect(() => {
    async function fetchData() {
      try {
        const records = await getAllRecords();
        setAllRecords(records);

        const summaryMap = new Map<string, StudentSummary>();

        // Initialize all students with 0
        Object.entries(studentsData).forEach(([className, classStudents]) => {
          Object.keys(classStudents).forEach(studentName => {
            summaryMap.set(studentName, {
              name: studentName,
              className: className,
              totalExp: 0,
              totalQuranPages: 0,
              daysFilled: 0
            });
          });
        });

        // Aggregate data
        records.forEach(record => {
          const summary = summaryMap.get(record.student_name);
          if (summary) {
            summary.totalExp += calculateExp(record);
            summary.totalQuranPages += (record.quran_pages || 0);
            summary.daysFilled += 1;
          }
        });

        const summaryList = Array.from(summaryMap.values());
        setSummaries(summaryList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredSummaries = summaries.filter(s => 
    selectedClass === 'all' || s.className === selectedClass
  );

  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    if (sortBy === 'exp') {
      return b.totalExp - a.totalExp;
    } else {
      // Sort by name A-Z
      return a.name.localeCompare(b.name);
    }
  });

  const downloadIndividualReport = (studentName: string) => {
    const doc = new jsPDF();
    const studentRecords = allRecords.filter(r => r.student_name === studentName).sort((a, b) => a.day - b.day);
    const summary = summaries.find(s => s.name === studentName);
    const totalPuasa = studentRecords.filter(r => r.puasa).length;
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Logo (Center)
    try {
      const logoUrl = "https://i.ibb.co.com/trFqzRQ/LOGO-PEKAYON-09.png";
      // Using a small size for the logo
      doc.addImage(logoUrl, 'PNG', (pageWidth / 2) - 10, 10, 20, 20);
    } catch (e) {
      console.warn("Logo could not be loaded in PDF:", e);
    }

    // 2. Title (Center)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Laporan Jurnal Ramadhan 1447 H', pageWidth / 2, 40, { align: 'center' });
    doc.text('SDN Pekayon 09', pageWidth / 2, 47, { align: 'center' });

    // 3. Total EXP (Top Right - Large)
    doc.setFontSize(32);
    doc.setTextColor(234, 179, 8); // Yellow-500
    doc.text(`${summary?.totalExp || 0}`, pageWidth - 14, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL EXP', pageWidth - 14, 32, { align: 'right' });

    // 4. Student Info (Left)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let infoY = 60;
    doc.text(`Nama Siswa: ${studentName}`, 14, infoY);
    doc.text(`Kelas: ${summary?.className || '-'}`, 14, infoY + 7);
    doc.text(`Hari Terisi: ${summary?.daysFilled || 0} / 30`, 14, infoY + 14);
    doc.text(`Total Puasa: ${totalPuasa} Hari`, 14, infoY + 21);
    doc.text(`Total Halaman Quran: ${summary?.totalQuranPages || 0}`, 14, infoY + 28);

    // Table
    const tableData = studentRecords.map(record => [
      `Hari ke-${record.day}`,
      record.sholat_subuh ? (record.sholat_subuh === 'jamaah' ? 'Jamaah' : 'Munfarid') : '-',
      record.sholat_dzuhur ? (record.sholat_dzuhur === 'jamaah' ? 'Jamaah' : 'Munfarid') : '-',
      record.sholat_ashar ? (record.sholat_ashar === 'jamaah' ? 'Jamaah' : 'Munfarid') : '-',
      record.sholat_maghrib ? (record.sholat_maghrib === 'jamaah' ? 'Jamaah' : 'Munfarid') : '-',
      record.sholat_isya ? (record.sholat_isya === 'jamaah' ? 'Jamaah' : 'Munfarid') : '-',
      record.sholat_tarawih ? (record.sholat_tarawih === 'jamaah' ? 'Jamaah' : 'Munfarid') : '-',
      record.tausiyah_ustadz || '-',
      record.tausiyah_tema || '-',
      record.quran_pages || 0,
      calculateExp(record)
    ]);

    autoTable(doc, {
      startY: 100,
      head: [['Hari', 'Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Tarawih', 'Ustadz', 'Materi', 'Quran', 'EXP']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 179, 8] }, // Yellow-500 color
    });

    doc.save(`Laporan_${studentName.replace(/\s+/g, '_')}.pdf`);
  };

  const downloadClassReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(selectedClass === 'all' ? 'Laporan Seluruh Kelas' : `Laporan Kelas ${selectedClass}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Total Siswa: ${sortedSummaries.length}`, 14, 32);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 38);

    // Table
    const tableData = sortedSummaries.map((s, index) => [
      index + 1,
      s.name,
      s.className,
      s.daysFilled,
      s.totalQuranPages,
      s.totalExp
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['No', 'Nama Siswa', 'Kelas', 'Hari Terisi', 'Total Halaman Quran', 'Total EXP']],
      body: tableData,
    });

    doc.save(selectedClass === 'all' ? 'Laporan_Seluruh_Siswa.pdf' : `Laporan_Kelas_${selectedClass.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-poppins">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">Admin Dashboard</h1>
            <p className="text-gray-400">Overview Amalan Siswa</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setSortBy('exp')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${sortBy === 'exp' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
              >
                Sort by EXP
              </button>
              <button
                onClick={() => setSortBy('az')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${sortBy === 'az' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
              >
                Sort A-Z
              </button>
            </div>
            <button 
              onClick={downloadClassReport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              📄 Download Laporan
            </button>
            <button 
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              🚪 Keluar
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Siswa</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4 text-center">Hari Terisi</th>
                  <th className="px-6 py-4 text-center">Halaman Quran</th>
                  <th className="px-6 py-4 text-center">Total EXP</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedSummaries.map((student, index) => (
                  <tr key={student.name} className="hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-400">#{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{student.className}</td>
                    <td className="px-6 py-4 text-center text-blue-300">{student.daysFilled} / 30</td>
                    <td className="px-6 py-4 text-center text-amber-300">{student.totalQuranPages}</td>
                    <td className="px-6 py-4 text-center font-bold text-yellow-400">{student.totalExp}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => downloadIndividualReport(student.name)}
                        className="text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-3 py-1 rounded border border-blue-500/30 transition"
                      >
                        ⬇️ PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <footer className="max-w-7xl mx-auto p-8 text-center border-t border-gray-800 mt-8">
        <p className="text-gray-500 text-sm">
          Created by: <span className="text-yellow-400/60 font-medium">Teguh Firmansyah Apriliana</span> - <span className="text-emerald-400/60">@goehfirmaan</span>
        </p>
      </footer>
    </div>
  );
}
