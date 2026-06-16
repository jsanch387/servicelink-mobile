import {
  resolveNextUpCardActionMode,
  resolveNextUpSectionTitle,
} from '../utils/resolveNextUpCardActions';

describe('resolveNextUpCardActionMode', () => {
  it('maps job_status to action modes', () => {
    expect(resolveNextUpCardActionMode('not_started')).toBe('upcoming');
    expect(resolveNextUpCardActionMode('on_the_way')).toBe('en_route');
    expect(resolveNextUpCardActionMode('in_progress')).toBe('working');
    expect(resolveNextUpCardActionMode('completed')).toBe('complete');
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
