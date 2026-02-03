export function isValidJiraId(s: string) {
  // Basic pattern: PROJECT-123 or ZD-CHG-1234 etc (allow letters, dashes, numbers)
  return /^[A-Z0-9][A-Z0-9_-]*-[A-Z0-9_-]*\d+$/i.test(s.trim());
}