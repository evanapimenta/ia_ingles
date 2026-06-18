import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';

export class SessionController {
  private sessionService: SessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { preBlockId } = req.body;
      if (!preBlockId) {
        res.status(400).json({ error: 'preBlockId is required' });
        return;
      }
      const session = await this.sessionService.createSession(preBlockId);
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  };

  listSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessions = await this.sessionService.listSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error listing sessions:', error);
      res.status(500).json({ error: 'Failed to list sessions' });
    }
  };

  getSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const session = await this.sessionService.getSession(id);
      if (!session) {
        res.status(404).json({ error: `Session ${id} not found` });
        return;
      }
      res.json(session);
    } catch (error) {
      console.error(`Error getting session ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  };
}
