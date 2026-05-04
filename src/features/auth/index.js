export { AuthProvider, useAuth } from './context/AuthContext';
export { ensureUserProfileRow, pickFullNameFromUserMetadata } from './api/ensureUserProfile';
export {
  getSession,
  onAuthStateChange,
  signInWithEmailPassword,
  signInWithGoogleOAuth,
  signOut,
  signUpWithEmailPassword,
  validateSessionWithServerOrSignOut,
} from './api/auth';
export { getAuthErrorMessage } from './utils/authErrors';
