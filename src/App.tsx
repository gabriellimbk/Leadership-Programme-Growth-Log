import { useState, useEffect } from 'react';
import { FormConfig, TeacherEntry, ViewMode } from './types';
import StudentConsole from './components/StudentConsole';
import TeacherConsole from './components/TeacherConsole';
import AdminConsole from './components/AdminConsole';
import LandingPage from './components/LandingPage';
import { storageService } from './services/storageService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isAdminTeacherEmail } from './auth/adminAccess';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut } from 'lucide-react';
import { isLocalDataPreview, isReadOnlyMode } from './runtimeConfig';
import { loadLocalConfigDraft, saveLocalConfigDraft } from './services/localConfigDraft';

function AppContent() {
  const [view, setView] = useState<ViewMode>(isLocalDataPreview ? 'admin' : 'landing');
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [teachers, setTeachers] = useState<TeacherEntry[]>([]);
  const { studentUser, teacherSession, signOutStudent, signOutTeacher } = useAuth();
  const canAccessAdmin = isLocalDataPreview || isAdminTeacherEmail(teacherSession?.user.email);

  useEffect(() => {
    storageService.getConfig().then(remoteConfig => {
      setConfig(isLocalDataPreview ? loadLocalConfigDraft(remoteConfig) : remoteConfig);
    });
    storageService.getTeachers().then(setTeachers).catch(err => {
      console.error('Failed to load teachers:', err);
      setTeachers([]);
    });
  }, []);

  const handleConfigUpdate = (updatedConfig: FormConfig) => {
    if (isLocalDataPreview) saveLocalConfigDraft(updatedConfig);
    setConfig(updatedConfig);
  };

  const handleSignOut = async () => {
    if (isLocalDataPreview) {
      setView('landing');
      return;
    }
    if (view === 'student') await signOutStudent();
    if (view === 'teacher' || view === 'admin') await signOutTeacher();
    setView('landing');
  };

  const isAuthed =
    (view === 'student' && !!studentUser) ||
    ((view === 'teacher' || view === 'admin') && (!!teacherSession || isLocalDataPreview));

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <img
              src="/Gryphon.png"
              alt="Griffin"
              className="w-10 h-10 md:w-14 md:h-14 object-contain"
            />
            <h1 className="hidden sm:block text-xs md:text-sm font-black tracking-[0.05em] text-[#1a1a1a] uppercase leading-tight">
              RAFFLES <br />
              <span className="text-[#004d33] font-black">LEADERSHIP</span> PROGRAMME
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200 mx-2"></div>
          <div className="flex bg-slate-100 rounded-md p-1">
            <button
              onClick={() => setView('student')}
              className={`px-3 md:px-6 py-2 text-[10px] md:text-xs font-black uppercase rounded transition-all ${view === 'student' ? 'bg-[#004d33] text-white shadow-md' : 'text-slate-500 hover:text-[#004d33]'}`}
            >
              STUDENT
            </button>
            <button
              onClick={() => setView('teacher')}
              className={`px-3 md:px-6 py-2 text-[10px] md:text-xs font-black uppercase rounded transition-all ${view === 'teacher' ? 'bg-[#004d33] text-white shadow-md' : 'text-slate-500 hover:text-[#004d33]'}`}
            >
              TEACHER
            </button>
            {canAccessAdmin && (
              <button
                onClick={() => setView('admin')}
                className={`px-3 md:px-6 py-2 text-[10px] md:text-xs font-black uppercase rounded transition-all ${view === 'admin' ? 'bg-[#004d33] text-white shadow-md' : 'text-slate-500 hover:text-[#004d33]'}`}
              >
                ADMIN
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isAuthed && !isLocalDataPreview && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"
            >
              <LogOut size={13} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <LandingPage onSelect={setView} />
            </motion.div>
          )}
          {view === 'student' && (
            <motion.div key="student" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <StudentConsole config={config} teachers={teachers} />
            </motion.div>
          )}
          {view === 'teacher' && (
            <motion.div key="teacher" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <TeacherConsole
                config={config}
                onConfigUpdate={handleConfigUpdate}
                teachers={teachers}
                readOnly={isLocalDataPreview}
                allowConfigEditing={isLocalDataPreview}
              />
            </motion.div>
          )}
          {view === 'admin' && (
            <motion.div key="admin" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <AdminConsole config={config} onConfigUpdate={handleConfigUpdate} teachers={teachers} onTeachersUpdate={setTeachers} previewMode={isLocalDataPreview} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-6 py-2 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          2026 Raffles Institution Student Leadership Development
        </span>
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isReadOnlyMode ? 'bg-amber-500' : 'bg-green-500'}`}></div>
          <span className="text-[9px] font-bold text-slate-400">{isReadOnlyMode ? 'READ-ONLY PREVIEW' : 'SYNCED'}</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
