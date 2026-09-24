import { presentTeamMember, teamMemberDisplayName } from '../teamMemberDisplay';

describe('presentTeamMember', () => {
  it('uses the stored name and keeps email smaller', () => {
    expect(presentTeamMember({ name: 'Sam Rivera', email: 'sam@example.com' })).toEqual({
      title: 'Sam Rivera',
      subtitle: 'sam@example.com',
      initial: 'S',
    });
  });

  it('derives a short name from email when no name was saved', () => {
    expect(presentTeamMember({ name: '', email: 'jordan@example.com' })).toEqual({
      title: 'Jordan',
      subtitle: 'jordan@example.com',
      initial: 'J',
    });
    expect(teamMemberDisplayName({ email: 'jesus.sanchez@shop.com' })).toBe('Jesus Sanchez');
  });
});
