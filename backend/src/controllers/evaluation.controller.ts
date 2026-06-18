import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluation.service';

export class EvaluationController {
  private evaluationService: EvaluationService;

  constructor(evaluationService: EvaluationService) {
    this.evaluationService = evaluationService;
  }

  submitAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { artifact, narrative } = req.body;
      
      if (artifact === undefined || narrative === undefined) {
        res.status(400).json({ error: 'artifact and narrative are required' });
        return;
      }

      const session = await this.evaluationService.handleInitialSubmission(id, artifact, narrative);
      res.json(session);
    } catch (error: any) {
      console.error(`Error in submitAssessment for session ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Failed to process initial submission' });
    }
  };

  submitVFUAnswer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { answer } = req.body;

      if (!answer) {
        res.status(400).json({ error: 'answer is required' });
        return;
      }

      const session = await this.evaluationService.handleVFUAnswer(id, answer);
      res.json(session);
    } catch (error: any) {
      console.error(`Error in submitVFUAnswer for session ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Failed to process VFU answer' });
    }
  };

  getSuggestedAnswer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const suggestedAnswer = await this.evaluationService.generateSuggestedAnswer(id);
      res.json({ suggestedAnswer });
    } catch (error: any) {
      console.error(`Error in getSuggestedAnswer for session ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Failed to generate suggested answer' });
    }
  };
}
