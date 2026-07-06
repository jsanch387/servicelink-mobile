import {
  resolveNextUpCardActionMode,
  resolveNextUpSectionTitle,
  resolveNextUpWorkingPhase,
} from '../utils/resolveNextUpCardActions';

describe('resolveNextUpCardActionMode', () => {
  it('maps job_status to action modes', () => {
    expect(resolveNextUpCardActionMode('not_started')).toBe('upcoming');
    expect(resolveNextUpCardActionMode('on_the_way')).toBe('en_route');
    expect(resolveNextUpCardActionMode('in_progress')).toBe('working');
    expect(resolveNextUpCardActionMode('completed')).toBe('complete');
  });
});

describe('resolveNextUpWorkingPhase', () => {
  it('returns handoff until work handoff status is set', () => {
    expect(resolveNextUpWorkingPhase('in_progress', null)).toBe('handoff');
    expect(resolveNextUpWorkingPhase('in_progress', undefined)).toBe('handoff');
    expect(resolveNextUpWorkingPhase('in_progress', 'notified')).toBe('ready');
    expect(resolveNextUpWorkingPhase('in_progress', 'skipped')).toBe('ready');
    expect(resolveNextUpWorkingPhase('on_the_way', null)).toBeNull();
  });
});

describe('resolveNextUpSectionTitle', () => {
  it('maps action modes to section labels', () => {
    expect(resolveNextUpSectionTitle('upcoming')).toBe('Next Up');
    expect(resolveNextUpSectionTitle('en_route')).toBe('Next Up');
    expect(resolveNextUpSectionTitle('working')).toBe('In progress');
    expect(resolveNextUpSectionTitle('complete')).toBe('Next Up');
  });
});
