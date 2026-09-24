import { createContext, useContext } from 'react';
import { useTeamMembersUi } from '../hooks/useTeamMembersUi';

const TeamMembersContext = createContext(null);

export function TeamMembersProvider({ children }) {
  const team = useTeamMembersUi();
  return <TeamMembersContext.Provider value={team}>{children}</TeamMembersContext.Provider>;
}

export function useTeamMembers() {
  const ctx = useContext(TeamMembersContext);
  if (!ctx) {
    throw new Error('useTeamMembers must be used within TeamMembersProvider');
  }
  return ctx;
}
