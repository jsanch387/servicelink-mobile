/** Scripted voice demo — swap for a real agent without changing the session UI. */

export const VOICE_LISTEN_MS = 420;

export const APPOINTMENT_VOICE_SLOTS = Object.freeze([
  { key: 'customer', label: 'Who' },
  { key: 'when', label: 'When' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'address', label: 'Where' },
  { key: 'addons', label: 'Add-ons' },
]);

export const APPOINTMENT_VOICE_TURNS = Object.freeze([
  {
    id: 'open',
    phase: 'idle',
    ai: 'I’m listening.',
    user: null,
    slots: {},
  },
  {
    id: 'who-when',
    phase: 'ask',
    user: 'Create an appointment for Jose at 3:30 tomorrow',
    ai: 'What vehicle, and what’s the address?',
    slots: {
      customer: 'Jose',
      when: 'Tomorrow 3:30',
    },
  },
  {
    id: 'vehicle-address',
    phase: 'ask',
    user: 'Silver Camry at 412 Oak Street',
    ai: 'Got it. Want to add any add-ons?',
    slots: {
      customer: 'Jose',
      when: 'Tomorrow 3:30',
      vehicle: 'Silver Camry',
      address: '412 Oak Street',
    },
  },
  {
    id: 'addons',
    phase: 'ready',
    user: 'No, that’s all',
    ai: 'Ready — Jose tomorrow at 3:30, Silver Camry on Oak Street.',
    slots: {
      customer: 'Jose',
      when: 'Tomorrow 3:30',
      vehicle: 'Silver Camry',
      address: '412 Oak Street',
      addons: 'None',
    },
  },
]);

export const LAST_VOICE_TURN_INDEX = APPOINTMENT_VOICE_TURNS.length - 1;

export function voiceTurnAt(index) {
  const safeIndex = Math.max(0, Math.min(index, LAST_VOICE_TURN_INDEX));
  return APPOINTMENT_VOICE_TURNS[safeIndex];
}

export function nextVoiceTurnIndex(index) {
  if (index >= LAST_VOICE_TURN_INDEX) {
    return LAST_VOICE_TURN_INDEX;
  }
  return index + 1;
}

export function isVoiceDemoReady(turn) {
  return turn?.phase === 'ready';
}
