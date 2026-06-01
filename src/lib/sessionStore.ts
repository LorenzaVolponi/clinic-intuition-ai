import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';

const STORAGE_KEY = 'dr-ia:last-clinical-session:v1';

export interface StoredClinicalSession {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  patientData: PatientData;
  diagnosis: ClinicalAssessment;
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function saveClinicalSession(patientData: PatientData, diagnosis: ClinicalAssessment) {
  if (!canUseLocalStorage()) return;

  const now = new Date().toISOString();
  const previous = getStoredClinicalSession();
  const payload: StoredClinicalSession = {
    sessionId: previous?.sessionId || crypto.randomUUID(),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    patientData,
    diagnosis,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getStoredClinicalSession(): StoredClinicalSession | null {
  if (!canUseLocalStorage()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredClinicalSession;
    if (!parsed?.patientData || !parsed?.diagnosis) return null;
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearStoredClinicalSession() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
