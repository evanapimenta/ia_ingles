"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const preblock_service_1 = require("../services/preblock.service");
const session_service_1 = require("../services/session.service");
const evaluation_service_1 = require("../services/evaluation.service");
const preblock_controller_1 = require("../controllers/preblock.controller");
const session_controller_1 = require("../controllers/session.controller");
const evaluation_controller_1 = require("../controllers/evaluation.controller");
const demo_controller_1 = require("../controllers/demo.controller");
const router = (0, express_1.Router)();
// Instantiate Services
const preBlockService = new preblock_service_1.PreBlockService();
const sessionService = new session_service_1.SessionService();
const evaluationService = new evaluation_service_1.EvaluationService(preBlockService, sessionService);
// Instantiate Controllers
const preBlockController = new preblock_controller_1.PreBlockController(preBlockService);
const sessionController = new session_controller_1.SessionController(sessionService);
const evaluationController = new evaluation_controller_1.EvaluationController(evaluationService);
const demoController = new demo_controller_1.DemoController();
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
exports.default = router;
