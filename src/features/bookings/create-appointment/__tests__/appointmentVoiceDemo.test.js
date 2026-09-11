import {
  APPOINTMENT_VOICE_TURNS,
  LAST_VOICE_TURN_INDEX,
  isVoiceDemoReady,
  isVoiceReviewPhoneComplete,
  mapSpokenAddonsToCatalog,
  nextVoiceTurnIndex,
  voiceReviewPhoneError,
  visibleVoiceGroups,
  voiceDraftToReviewStepProps,
  voiceTurnAt,
} from '../voice/appointmentVoiceDemo';

describe('appointmentVoiceDemo', () => {
  it('starts empty so the details card stays hidden', () => {
    const open = voiceTurnAt(0);
    expect(open.phase).toBe('idle');
    expect(open.ai).toBe('I’m listening.');
    expect(open.slots).toEqual({});
    expect(visibleVoiceGroups(open.slots)).toEqual([]);
  });

  it('only shows groups that have collected values', () => {
    const groups = visibleVoiceGroups(voiceTurnAt(1).slots);
    expect(groups.map((group) => group.id)).toEqual(['customer', 'job']);
    expect(groups[0].fields.map((field) => field.key)).toEqual(['customer']);
    expect(groups[1].fields.map((field) => field.key)).toEqual(['service']);
  });

  it('fills appointment fields as the script advances', () => {
    expect(voiceTurnAt(2).slots).toMatchObject({
      phone: '512-321-4324',
      vehicleYear: '2019',
      vehicleMake: 'Honda',
      vehicleModel: 'Accord',
    });
    expect(voiceTurnAt(3).slots).toMatchObject({
      address: '412 Oak Street',
      pricing: 'Sedan · $89',
      date: '2026-09-10',
      time: '10:00 AM',
    });
    expect(isVoiceDemoReady(voiceTurnAt(LAST_VOICE_TURN_INDEX))).toBe(true);
  });

  it('maps the finished draft onto the shared review step', () => {
    const props = voiceDraftToReviewStepProps(voiceTurnAt(LAST_VOICE_TURN_INDEX).slots);
    expect(props.jobs[0]).toMatchObject({
      serviceName: 'Full detail',
      optionLabel: 'Sedan',
      priceLabel: '$89',
      vehicleLine: '2019 Honda Accord',
    });
    expect(props.selectedDateKey).toBe('2026-09-10');
    expect(props.selectedTime).toBe('10:00 AM');
    expect(props.customer.fullName).toBe('Jose');
    expect(props.address.street).toBe('412 Oak Street');
    expect(props.vehicle).toEqual({ year: '2019', make: 'Honda', model: 'Accord' });
    expect(props.jobs[0].addonRows).toEqual([
      { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
    ]);
  });

  it('maps spoken add-ons onto catalog rows with prices', () => {
    expect(mapSpokenAddonsToCatalog('ceramic coat')).toEqual([
      { id: 'ceramic-coat', name: 'Ceramic coat', priceLabel: '$149' },
    ]);
    expect(mapSpokenAddonsToCatalog('just a wash')).toEqual([]);
  });

  it('requires a valid US phone before submit', () => {
    expect(isVoiceReviewPhoneComplete('')).toBe(false);
    expect(voiceReviewPhoneError('')).toBe('Phone is required.');
    expect(isVoiceReviewPhoneComplete('512')).toBe(false);
    expect(isVoiceReviewPhoneComplete('512-321-4324')).toBe(true);
    expect(voiceReviewPhoneError('512-321-4324')).toBeNull();
  });

  it('does not advance past the last turn', () => {
    expect(nextVoiceTurnIndex(LAST_VOICE_TURN_INDEX)).toBe(LAST_VOICE_TURN_INDEX);
    expect(voiceTurnAt(99).id).toBe(APPOINTMENT_VOICE_TURNS[LAST_VOICE_TURN_INDEX].id);
  });
});
