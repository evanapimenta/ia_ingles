import { Router } from 'express';
import { PreBlockService } from '../services/preblock.service';
import { SessionService } from '../services/session.service';
import { EvaluationService } from '../services/evaluation.service';

import { PreBlockController } from '../controllers/preblock.controller';
import { SessionController } from '../controllers/session.controller';
import { EvaluationController } from '../controllers/evaluation.controller';
import { DemoController } from '../controllers/demo.controller';

const router = Router();

// Instantiate Services
const preBlockService = new PreBlockService();
const sessionService = new SessionService();
const evaluationService = new EvaluationService(preBlockService, sessionService);

// Instantiate Controllers
const preBlockController = new PreBlockController(preBlockService);
const sessionController = new SessionController(sessionService);
const evaluationController = new EvaluationController(evaluationService);
const demoController = new DemoController();

// Pre-block Endpoints
router.get('/preblocks', preBlockController.listPreBlocks);
router.get('/preblocks/:id', preBlockController.getPreBlock);

// Session Endpoints
router.post('/sessions', sessionController.createSession);
router.get('/sessions', sessionController.listSessions);
router.get('/sessions/:id', sessionController.getSession);

// Evaluation Flow Endpoints
router.post('/sessions/:id/submit', evaluationController.submitAssessment);
router.post('/sessions/:id/vfu', evaluationController.submitVFUAnswer);
router.get('/sessions/:id/suggested-answer', evaluationController.getSuggestedAnswer);

// Demo Cases Endpoints
router.get('/demo-cases', demoController.listDemoCases);
router.post('/demo-cases/initialize', demoController.initializeDemoCases);

// Config Endpoint
router.get('/config', (req, res) => {
  res.json({ demoMode: process.env.DEMO_MODE === 'true' });
});

export default router;
