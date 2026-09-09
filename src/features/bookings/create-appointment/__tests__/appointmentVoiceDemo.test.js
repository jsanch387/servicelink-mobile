import {
  APPOINTMENT_VOICE_TURNS,
  LAST_VOICE_TURN_INDEX,
  isVoiceDemoReady,
  nextVoiceTurnIndex,
  voiceTurnAt,
} from '../voice/appointmentVoiceDemo';

describe('appointmentVoiceDemo', () => {
  it('starts with a driving-sized opening question', () => {
    const open = voiceTurnAt(0);
    expect(open.phase).toBe('idle');
    expect(open.ai).toBe('I’m listening.');
    expect(open.slots).toEqual({});
  });

  it('fills slots as the scripted conversation advances', () => {
    expect(voiceTurnAt(1).slots).toMatchObject({
      customer: 'Jose',
      when: 'Tomorrow 3:30',
    });
    expect(voiceTurnAt(2).slots).toMatchObject({
      vehicle: 'Silver Camry',
      address: '412 Oak Street',
    });
    expect(isVoiceDemoReady(voiceTurnAt(LAST_VOICE_TURN_INDEX))).toBe(true);
  });

  it('does not advance past the last turn', () => {
    expect(nextVoiceTurnIndex(LAST_VOICE_TURN_INDEX)).toBe(LAST_VOICE_TURN_INDEX);
    expect(voiceTurnAt(99).id).toBe(APPOINTMENT_VOICE_TURNS[LAST_VOICE_TURN_INDEX].id);
  });
});
