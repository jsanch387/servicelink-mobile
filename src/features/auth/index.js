export { AuthProvider, useAuth } from './context/AuthContext';
export { ensureUserProfileRow, pickFullNameFromUserMetadata } from './api/ensureUserProfile';
export {
  sendEmailLoginOtp,
  verifyEmailLoginOtp,
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
export { getAuthErrorMessage, getLoginCodeSentMessage } from './utils/authErrors';
