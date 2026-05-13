export { AuthProvider, useAuth } from './context/AuthContext';
export { ensureUserProfileRow, pickFullNameFromUserMetadata } from './api/ensureUserProfile';
export {
  AUTH_SESSION_CALLBACK_URL,
  completeAuthSessionFromUrl,
  getEmailConfirmationRedirectUrl,
  getGoogleOAuthRedirectUrl,
  getOAuthRedirectUrl,
  getSession,
  isAuthSessionDeepLink,
  onAuthStateChange,
  resendSignupConfirmationEmail,
  signInWithAppleOAuth,
  signInWithEmailPassword,
  signInWithGoogleOAuth,
  signInWithOAuthProvider,
  signOut,
  signUpWithEmailPassword,
  validateSessionWithServerOrSignOut,
} from './api/auth';
export { getAuthErrorMessage } from './utils/authErrors';
