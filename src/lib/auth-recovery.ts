// Password recovery: the email link signs the user in with type=recovery in the URL. Without a
// dedicated step the app sent people straight to /app and the new password was never asked for.
export const RECOVERY_FLAG = 'thinkpost:password-recovery';

export function isRecoveryUrl(hash: string, search = '') {
  return /(^|[#&?])type=recovery(&|$)/.test(hash) || /(^|[?&])type=recovery(&|$)/.test(search);
}

/** Runs before the app renders, while the recovery token is still in the URL. */
export function captureRecoveryFromUrl(location: Pick<Location, 'hash' | 'search'> = window.location) {
  if (!isRecoveryUrl(location.hash, location.search)) return false;
  markRecovery();
  return true;
}

export function markRecovery() { try { sessionStorage.setItem(RECOVERY_FLAG, '1'); } catch { /* storage blocked: the event still drives the UI */ } }
export function recoveryPending() { try { return sessionStorage.getItem(RECOVERY_FLAG) === '1'; } catch { return false; } }
export function clearRecovery() { try { sessionStorage.removeItem(RECOVERY_FLAG); } catch { /* nothing to clear */ } }
