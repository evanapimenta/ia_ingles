"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
class SessionController {
    sessionService;
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    createSession = async (req, res) => {
        try {
            const { preBlockId } = req.body;
            if (!preBlockId) {
                res.status(400).json({ error: 'preBlockId is required' });
                return;
            }
            const session = await this.sessionService.createSession(preBlockId);
            res.status(201).json(session);
        }
        catch (error) {
            console.error('Error creating session:', error);
            res.status(500).json({ error: 'Failed to create session' });
        }
    };
    listSessions = async (req, res) => {
        try {
            const sessions = await this.sessionService.listSessions();
            res.json(sessions);
        }
        catch (error) {
            console.error('Error listing sessions:', error);
            res.status(500).json({ error: 'Failed to list sessions' });
        }
    };
    getSession = async (req, res) => {
        try {
            const { id } = req.params;
            const session = await this.sessionService.getSession(id);
            if (!session) {
                res.status(404).json({ error: `Session ${id} not found` });
                return;
            }
            res.json(session);
        }
        catch (error) {
            console.error(`Error getting session ${req.params.id}:`, error);
            res.status(500).json({ error: 'Failed to get session' });
        }
    };
}
exports.SessionController = SessionController;
