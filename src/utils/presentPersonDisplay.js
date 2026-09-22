/**
 * Real names stay as-is. Emails become a short name (`jesus.sanchez@x.com` → `Jesus Sanchez`).
 *
 * @param {unknown} rawLabel
 * @param {unknown} [email]
 * @returns {{ title: string; subtitle: string; initial: string }}
 */
export function presentPersonDisplay(rawLabel, email = '') {
  const value = String(rawLabel ?? '').trim();
  const mail = String(email ?? '').trim();
  if (!value && !mail) {
    return { title: '', subtitle: '', initial: '?' };
  }
  if (value && !value.includes('@')) {
    return {
      title: value,
      subtitle: mail && mail !== value ? mail : '',
      initial: value.charAt(0).toUpperCase() || '?',
    };
  }
  const source = value.includes('@') ? value : mail;
  const local = source.slice(0, Math.max(0, source.indexOf('@')));
  const title =
    local
      .split(/[._+\-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ') || source;
  return {
    title,
    subtitle: mail || source,
    initial: title.charAt(0).toUpperCase() || '?',
  };
}
