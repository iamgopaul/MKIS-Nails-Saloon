/**
 * Mirror Supabase's password requirements (set in dashboard → Auth → Email):
 * lowercase, uppercase, digits, symbols, minimum 8 characters.
 */

export const PASSWORD_HINT =
  "At least 8 characters with a lowercase letter, uppercase letter, digit, and symbol.";

export function validatePassword(pwd: string): string | null {
  if (pwd.length < 8)               return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(pwd))           return "Add at least one lowercase letter.";
  if (!/[A-Z]/.test(pwd))           return "Add at least one uppercase letter.";
  if (!/\d/.test(pwd))              return "Add at least one digit.";
  if (!/[^A-Za-z0-9]/.test(pwd))    return "Add at least one symbol (e.g. !@#$%).";
  return null;
}
