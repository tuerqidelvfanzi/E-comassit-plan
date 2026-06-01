import { getDb } from '../db/index.js';
import { uid } from '../lib/response.js';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface UserAuth {
  user_id: string;
  auth_type: 'email' | 'phone';
  email: string | null;
  phone: string | null;
  password_hash: string | null;
  email_verified: number;
  phone_verified: number;
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  token_quota: number;
  token_used: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

export function createEmailUser(email: string, password: string): { user: User; auth: UserAuth } | null {
  const db = getDb();
  const userId = uid('u');
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);
  const existing = db.prepare('SELECT user_id FROM user_auth WHERE email = ?').get(email);
  if (existing) return null;
  db.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(userId, email, passwordHash, now);
  db.prepare('INSERT INTO user_auth (user_id, auth_type, email, password_hash, email_verified, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(userId, email, passwordHash, now);
  const teamId = uid('t');
  db.prepare('INSERT INTO teams (id, name, owner_id, plan, token_quota, balance, created_at, updated_at) VALUES (?, ?, ?, ?, 100, 0, ?, ?)').run(teamId, email.split('@')[0] + '的团队', userId, 'free', now, now);
  db.prepare('INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)').run(teamId, userId, 'owner', now);
  const user: User = { id: userId, username: email, created_at: now };
  const auth: UserAuth = { user_id: userId, auth_type: 'email', email, phone: null, password_hash: passwordHash, email_verified: 1, phone_verified: 0 };
  return { user, auth };
}

export function createPhoneUser(phone: string): { user: User; auth: UserAuth } | null {
  const db = getDb();
  const userId = uid('u');
  const now = new Date().toISOString();
  const username = 'user_' + phone.slice(-4);
  const existing = db.prepare('SELECT user_id FROM user_auth WHERE phone = ?').get(phone) as { user_id: string } | undefined;
  if (existing) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.user_id) as User;
    const auth = db.prepare('SELECT * FROM user_auth WHERE user_id = ?').get(existing.user_id) as UserAuth;
    return { user, auth };
  }
  db.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(userId, username, '', now);
  db.prepare('INSERT INTO user_auth (user_id, auth_type, phone, phone_verified, created_at) VALUES (?, ?, ?, 0, ?)').run(userId, phone, now);
  const teamId = uid('t');
  db.prepare('INSERT INTO teams (id, name, owner_id, plan, token_quota, balance, created_at, updated_at) VALUES (?, ?, ?, ?, 100, 0, ?, ?)').run(teamId, '团队' + phone.slice(-4), userId, 'free', now, now);
  db.prepare('INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)').run(teamId, userId, 'owner', now);
  const user: User = { id: userId, username, created_at: now };
  const auth: UserAuth = { user_id: userId, auth_type: 'phone', email: null, phone, password_hash: null, email_verified: 0, phone_verified: 0 };
  return { user, auth };
}

export function loginWithEmail(email: string, password: string): User | null {
  const db = getDb();
  const row = db.prepare("SELECT u.* FROM users u JOIN user_auth ua ON u.id = ua.user_id WHERE ua.email = ?").get(email) as User | undefined;
  if (!row) return null;
  const auth = db.prepare('SELECT * FROM user_auth WHERE user_id = ?').get(row.id) as UserAuth;
  if (!auth.password_hash || !bcrypt.compareSync(password, auth.password_hash)) return null;
  return row;
}

export function loginWithPhone(phone: string): User | null {
  const db = getDb();
  const row = db.prepare("SELECT u.* FROM users u JOIN user_auth ua ON u.id = ua.user_id WHERE ua.phone = ? AND ua.phone_verified = 1").get(phone) as User | undefined;
  return row || null;
}

export function createSmsCode(phone: string): { success: boolean; code?: string } {
  const db = getDb();
  const now = new Date();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  db.prepare('DELETE FROM sms_codes WHERE phone = ?').run(phone);
  db.prepare('INSERT INTO sms_codes (phone, code, expires_at, created_at) VALUES (?, ?, ?, ?)').run(phone, code, expiresAt.toISOString(), now.toISOString());
  console.log('[SMS] 验证码已生成: ' + phone + ' -> ' + code);
  return { success: true, code };
}

export function verifySmsCode(phone: string, code: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const row = db.prepare('SELECT * FROM sms_codes WHERE phone = ? AND code = ? AND expires_at > ? AND used = 0').get(phone, code, now) as { phone: string; code: string } | undefined;
  if (!row) return false;
  db.prepare('UPDATE sms_codes SET used = 1 WHERE phone = ? AND code = ?').run(phone, code);
  db.prepare('UPDATE user_auth SET phone_verified = 1 WHERE phone = ?').run(phone);
  return true;
}

export function getUserTeams(userId: string): Team[] {
  const db = getDb();
  return db.prepare("SELECT t.* FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.user_id = ?").all(userId) as Team[];
}

export function getTeamMembers(teamId: string): Array<{ user_id: string; username: string; role: string; joined_at: string }> {
  const db = getDb();
  return db.prepare("SELECT tm.user_id, u.username, tm.role, tm.joined_at FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = ?").all(teamId) as any[];
}

export function recordUsage(userId: string, teamId: string | null, action: string, model: string, inputTokens: number, outputTokens: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  const id = uid('u');
  const cost = (inputTokens * 0.004 + outputTokens * 0.012) / 1000;
  db.prepare('INSERT INTO usage_records (id, user_id, team_id, action, model, input_tokens, output_tokens, cost, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, userId, teamId, action, model, inputTokens, outputTokens, cost, now);
  if (teamId) {
    db.prepare('UPDATE teams SET token_used = token_used + ? WHERE id = ?').run(inputTokens + outputTokens, teamId);
    db.prepare('UPDATE teams SET balance = balance - ? WHERE id = ? AND balance >= ?').run(cost, teamId, cost);
  }
}

export function getUserBalance(userId: string): { teamId: string; balance: number; tokenUsed: number; tokenQuota: number } | null {
  const db = getDb();
  return db.prepare("SELECT t.id as teamId, t.balance, t.token_used as tokenUsed, t.token_quota as tokenQuota FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.user_id = ? AND tm.role = 'owner' LIMIT 1").get(userId) as any || null;
}
