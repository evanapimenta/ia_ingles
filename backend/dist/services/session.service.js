"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SessionService {
    dataDir;
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
    ensureDirsExist() {
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
    getSessionPath(id) {
        return path.join(this.dataDir, 'sessions', `${id}.json`);
    }
    async listSessions() {
        const sessionsPath = path.join(this.dataDir, 'sessions');
        if (!fs.existsSync(sessionsPath)) {
            return [];
        }
        const files = fs.readdirSync(sessionsPath);
        const sessions = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(path.join(sessionsPath, file), 'utf-8');
                    sessions.push(JSON.parse(content));
                }
                catch (error) {
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
    async getSession(id) {
        const filePath = this.getSessionPath(id);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            console.error(`Error reading session ${id}:`, error);
            return null;
        }
    }
    async saveSession(session) {
        this.ensureDirsExist();
        const filePath = this.getSessionPath(session.sessionId);
        try {
            fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
        }
        catch (error) {
            console.error(`Error saving session ${session.sessionId}:`, error);
            throw error;
        }
    }
    async createSession(preBlockId) {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const session = {
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
exports.SessionService = SessionService;
