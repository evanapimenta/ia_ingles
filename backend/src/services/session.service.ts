import * as fs from 'fs';
import * as path from 'path';
import { Session } from '../types';

export class SessionService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(this.dataDir)) {
      this.dataDir = path.resolve(process.cwd(), '../data');
    }
    if (!fs.existsSync(this.dataDir)) {
      this.dataDir = path.resolve(process.cwd(), 'data');
    }
    this.ensureDirsExist();
  }

  private ensureDirsExist() {
    const sessionsPath = path.join(this.dataDir, 'sessions');
    const studentsPath = path.join(this.dataDir, 'students');
    
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(sessionsPath)) {
      fs.mkdirSync(sessionsPath, { recursive: true });
    }
    if (!fs.existsSync(studentsPath)) {
      fs.mkdirSync(studentsPath, { recursive: true });
    }
  }

  private getSessionPath(id: string): string {
    return path.join(this.dataDir, 'sessions', `${id}.json`);
  }

  async listSessions(): Promise<Session[]> {
    const sessionsPath = path.join(this.dataDir, 'sessions');
    if (!fs.existsSync(sessionsPath)) {
      return [];
    }

    const files = fs.readdirSync(sessionsPath);
    const sessions: Session[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(sessionsPath, file), 'utf-8');
          sessions.push(JSON.parse(content));
        } catch (error) {
          console.error(`Error reading session file ${file}:`, error);
        }
      }
    }

    return sessions.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }


  async getSession(id: string): Promise<Session | null> {
    const filePath = this.getSessionPath(id);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as Session;
    } catch (error) {
      console.error(`Error reading session ${id}:`, error);
      return null;
    }
  }

  async saveSession(session: Session): Promise<void> {
    this.ensureDirsExist();
    const filePath = this.getSessionPath(session.sessionId);
    try {
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error saving session ${session.sessionId}:`, error);
      throw error;
    }
  }

  async createSession(preBlockId: string): Promise<Session> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session: Session = {
      sessionId,
      preBlockId,
      submission: { artifact: '', narrative: '' },
      vfuHistory: [],
      status: 'pending_analysis',
      currentVFUCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.saveSession(session);
    return session;
  }
}
