export { AuthProvider, useAuth } from './context/AuthContext';
export { ensureUserProfileRow, pickFullNameFromUserMetadata } from './api/ensureUserProfile';
export {
  AUTH_SESSION_CALLBACK_URL,
  completeAuthSessionFromUrl,
  getEmailConfirmationRedirectUrl,
  getSession,
  isAuthSessionDeepLink,
  onAuthStateChange,
  resendSignupConfirmationEmail,
  signInWithEmailPassword,
  signInWithGoogleOAuth,
  signOut,
  signUpWithEmailPassword,
  validateSessionWithServerOrSignOut,
} from './api/auth';
export { getAuthErrorMessage } from './utils/authErrors';
