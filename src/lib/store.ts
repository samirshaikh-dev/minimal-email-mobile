import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TrackedJob } from './types';

const URL_KEY = 'minimal-email.base-url';
const JOBS_KEY = 'minimal-email.jobs';
const MAX_JOBS = 40;

export async function readBaseUrl() {
  return AsyncStorage.getItem(URL_KEY);
}

export async function writeBaseUrl(value: string | null) {
  if (value) {
    await AsyncStorage.setItem(URL_KEY, value);
  } else {
    await AsyncStorage.removeItem(URL_KEY);
  }
}

export async function readJobs(): Promise<TrackedJob[]> {
  const raw = await AsyncStorage.getItem(JOBS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrackedJob[]) : [];
  } catch {
    return [];
  }
}

export async function writeJobs(jobs: TrackedJob[]) {
  await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs.slice(0, MAX_JOBS)));
}

export async function trackJob(job: TrackedJob) {
  const jobs = await readJobs();
  await writeJobs([job, ...jobs.filter((item) => item.id !== job.id)]);
}

export async function untrackJob(id: string) {
  const jobs = await readJobs();
  await writeJobs(jobs.filter((item) => item.id !== id));
}

export async function untrackJobs(ids: string[]) {
  const drop = new Set(ids);
  const jobs = await readJobs();
  await writeJobs(jobs.filter((item) => !drop.has(item.id)));
}

export async function clearJobs() {
  await AsyncStorage.removeItem(JOBS_KEY);
}
