/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModernLayout } from './components/ModernLayout';
import { ActiveTab } from './components/Navbar';
import { AuthModal } from './components/AuthModal';

import { DashboardView } from './views/DashboardView';
import { ClassesView } from './views/ClassesView';
import { ClassDetailView } from './views/ClassDetailView';
import { GradingView } from './views/GradingView';
import { AttendanceView } from './views/AttendanceView';
import { DailyLessonView } from './views/DailyLessonView';
import { PedagogicalUnitsView } from './views/PedagogicalUnitsView';
import { PhysicalTestsView } from './views/PhysicalTestsView';
import { StatsReportsView } from './views/StatsReportsView';
import { SchoolSettingsView } from './views/SchoolSettingsView';
import { EquipmentView } from './views/EquipmentView';
import { InjuriesView } from './views/InjuriesView';
import { LegalRegulationsView } from './views/LegalRegulationsView';

import { dataRepository } from './services/dataService';
import { SchoolClass } from './types';

function MainApp() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [detailedClassId, setDetailedClassId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [assignedClasses, setAssignedClasses] = useState<SchoolClass[]>(
    dataRepository.getTeacherAssignedClasses()
  );

  const refreshData = () => {
    setAssignedClasses(dataRepository.getTeacherAssignedClasses());
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  // Compute metrics for assigned classes
  const assignedClassIds = new Set(assignedClasses.map((c) => c.id));
  const allStudents = dataRepository.getAllStudents();
  const studentsInAssigned = allStudents.filter((s) => assignedClassIds.has(s.class_id));

  // Compute overall average across assigned classes
  let totalScore = 0;
  let countOfClassAverages = 0;
  assignedClasses.forEach((cls) => {
    const marksData = dataRepository.getAllMarksForClassAndTrimester(cls.id, 1);
    if (marksData.classAverage > 0) {
      totalScore += marksData.classAverage;
      countOfClassAverages++;
    }
  });
  const overallAverage = countOfClassAverages > 0 ? totalScore / countOfClassAverages : 14.02;

  const currentProfile = user || dataRepository.getProfile();

  const handleNavigate = (tab: ActiveTab, classId?: string) => {
    if (classId) {
      setDetailedClassId(classId);
      setActiveTab('classes');
    } else {
      setDetailedClassId(null);
      setActiveTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ModernLayout
      activeTab={activeTab}
      onSelectTab={handleNavigate}
      assignedClasses={assignedClasses}
      selectedClassId={detailedClassId}
      profile={currentProfile}
      onOpenAuth={() => setShowAuthModal(true)}
      onOpenSettings={() => handleNavigate('settings')}
    >
      {activeTab === 'dashboard' && (
        <DashboardView
          profile={currentProfile}
          assignedClasses={assignedClasses}
          totalStudentsInAssigned={studentsInAssigned.length}
          overallAverage={overallAverage}
          attendanceRate={94}
          onNavigate={handleNavigate}
          onOpenSettings={() => handleNavigate('settings')}
        />
      )}

      {activeTab === 'classes' && (
        <>
          {detailedClassId ? (
            <ClassDetailView
              classId={detailedClassId}
              profile={currentProfile}
              assignedClasses={assignedClasses}
              onBack={() => setDetailedClassId(null)}
              onClassesUpdated={refreshData}
            />
          ) : (
            <ClassesView
              assignedClasses={assignedClasses}
              onSelectClass={(id) => setDetailedClassId(id)}
              onOpenSettings={() => handleNavigate('settings')}
              onClassesUpdated={refreshData}
            />
          )}
        </>
      )}

      {activeTab === 'grading' && (
        <GradingView profile={currentProfile} assignedClasses={assignedClasses} />
      )}

      {activeTab === 'attendance' && (
        <AttendanceView profile={currentProfile} assignedClasses={assignedClasses} />
      )}

      {activeTab === 'lesson' && (
        <DailyLessonView profile={currentProfile} assignedClasses={assignedClasses} />
      )}

      {activeTab === 'pedagogical' && <PedagogicalUnitsView />}

      {activeTab === 'tests' && <PhysicalTestsView assignedClasses={assignedClasses} />}

      {activeTab === 'stats' && (
        <StatsReportsView profile={currentProfile} assignedClasses={assignedClasses} />
      )}

      {activeTab === 'equipment' && <EquipmentView profile={currentProfile} />}

      {activeTab === 'injuries' && (
        <InjuriesView profile={currentProfile} assignedClasses={assignedClasses} />
      )}

      {activeTab === 'regulations' && <LegalRegulationsView />}

      {activeTab === 'settings' && (
        <SchoolSettingsView
          profile={currentProfile}
          onUpdateProfile={updateProfile}
          onClassesUpdated={refreshData}
        />
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </ModernLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
