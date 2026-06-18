"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationController = void 0;
class EvaluationController {
    evaluationService;
    constructor(evaluationService) {
        this.evaluationService = evaluationService;
    }
    submitAssessment = async (req, res) => {
        try {
            const { id } = req.params;
            const { artifact, narrative } = req.body;
            if (artifact === undefined || narrative === undefined) {
                res.status(400).json({ error: 'artifact and narrative are required' });
                return;
            }
            const session = await this.evaluationService.handleInitialSubmission(id, artifact, narrative);
            res.json(session);
        }
        catch (error) {
            console.error(`Error in submitAssessment for session ${req.params.id}:`, error);
            res.status(500).json({ error: error.message || 'Failed to process initial submission' });
        }
    };
    submitVFUAnswer = async (req, res) => {
        try {
            const { id } = req.params;
            const { answer } = req.body;
            if (!answer) {
                res.status(400).json({ error: 'answer is required' });
                return;
            }
            const session = await this.evaluationService.handleVFUAnswer(id, answer);
            res.json(session);
        }
        catch (error) {
            console.error(`Error in submitVFUAnswer for session ${req.params.id}:`, error);
            res.status(500).json({ error: error.message || 'Failed to process VFU answer' });
        }
    };
    getSuggestedAnswer = async (req, res) => {
        try {
            const { id } = req.params;
            const suggestedAnswer = await this.evaluationService.generateSuggestedAnswer(id);
            res.json({ suggestedAnswer });
        }
        catch (error) {
            console.error(`Error in getSuggestedAnswer for session ${req.params.id}:`, error);
            res.status(500).json({ error: error.message || 'Failed to generate suggested answer' });
        }
    };
}
exports.EvaluationController = EvaluationController;
