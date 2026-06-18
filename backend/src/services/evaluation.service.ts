import { PreBlockService } from './preblock.service';
import { SessionService } from './session.service';
import { LLMProvider, OpenAIProvider, GeminiProvider, MockProvider } from './llm.service';
import { Session, DiagnosticHypothesis, TeacherReport, PreBlockModel, VFUHistory } from '../types';
import { diagnosticPrompt } from '../prompts/diagnostic.prompt';
import { vfuPrompt } from '../prompts/vfu.prompt';
import { classificationPrompt } from '../prompts/classification.prompt';
import { teacherReportPrompt } from '../prompts/teacher-report.prompt';
import { suggestedAnswerPrompt } from '../prompts/suggested-answer.prompt';

class ConfigErrorProvider implements LLMProvider {
  constructor(private errorMessage: string) {}
  async generateJSON<T>(prompt: string): Promise<T> {
    throw new Error(this.errorMessage);
  }
}

export class EvaluationService {
  private preBlockService: PreBlockService;
  private sessionService: SessionService;
  private llmProvider: LLMProvider;

  constructor(
    preBlockService: PreBlockService,
    sessionService: SessionService
  ) {
    this.preBlockService = preBlockService;
    this.sessionService = sessionService;
    
    // Switch between OpenAI, Gemini, or Mock Provider based on DEMO_MODE
    const isDemoMode = process.env.DEMO_MODE === 'true';
    const provider = process.env.LLM_PROVIDER || 'openai';
    const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY' && process.env.OPENAI_API_KEY !== '';
    const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' && process.env.GEMINI_API_KEY !== '';

    if (isDemoMode) {
      console.log('EvaluationService: DEMO_MODE=true. Using Mock Provider.');
      this.llmProvider = new MockProvider();
    } else {
      if (provider === 'openai') {
        if (hasOpenAI) {
          console.log('EvaluationService: Using OpenAI Provider.');
          this.llmProvider = new OpenAIProvider();
        } else {
          console.log('EvaluationService: OpenAI requested but no key found. Using ConfigErrorProvider.');
          this.llmProvider = new ConfigErrorProvider('Chave de API da OpenAI não configurada. Defina a variável OPENAI_API_KEY no arquivo backend/.env com sua chave real, ou ative o modo de demonstração com DEMO_MODE=true.');
        }
      } else if (provider === 'gemini') {
        if (hasGemini) {
          console.log('EvaluationService: Using Gemini Provider.');
          this.llmProvider = new GeminiProvider();
        } else {
          console.log('EvaluationService: Gemini requested but no key found. Using ConfigErrorProvider.');
          this.llmProvider = new ConfigErrorProvider('Chave de API do Gemini não configurada. Defina a variável GEMINI_API_KEY no arquivo backend/.env com sua chave real, ou ative o modo de demonstração com DEMO_MODE=true.');
        }
      } else {
        console.log(`EvaluationService: Invalid provider '${provider}'. Using ConfigErrorProvider.`);
        this.llmProvider = new ConfigErrorProvider(`Provedor de LLM inválido: '${provider}'. Defina LLM_PROVIDER como 'openai' ou 'gemini' no arquivo backend/.env.`);
      }
    }
  }

  private replacePlaceholders(template: string, replacements: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      result = result.replace(new RegExp(`\\$\\{${escapedKey}\\}`, 'g'), value);
    }
    return result;
  }

  private formatVFUHistory(vfuHistory: VFUHistory[]): string {
    if (vfuHistory.length === 0) {
      return 'Nenhum VFU realizado ainda.';
    }
    return vfuHistory
      .map((h, i) => `[Pergunta VFU ${i + 1}]: ${h.question}\n[Resposta Estudante ${i + 1}]: ${h.answer}`)
      .join('\n\n');
  }

  async handleInitialSubmission(sessionId: string, artifact: string, narrative: string): Promise<Session> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const preBlock = await this.preBlockService.getPreBlock(session.preBlockId);
    if (!preBlock) {
      throw new Error(`PreBlock ${session.preBlockId} not found`);
    }

    session.submission = { artifact, narrative };
    session.vfuHistory = [];
    session.currentVFUCount = 0;
    session.status = 'pending_analysis';
    session.updatedAt = new Date().toISOString();

    // Generate Diagnostic Hypothesis
    const filledPrompt = this.replacePlaceholders(diagnosticPrompt, {
      PRE_BLOCK: JSON.stringify(preBlock, null, 2),
      ARTIFACT: artifact,
      NARRATIVE: narrative
    });

    const hypothesis = await this.llmProvider.generateJSON<DiagnosticHypothesis>(filledPrompt);
    session.latestHypothesis = hypothesis;

    // Apply stop rules / VFU policy
    if (hypothesis.needVFU && session.currentVFUCount < preBlock.vfuPolicy.maxVFUs) {
      session.status = 'awaiting_vfu';
    } else {
      session.status = 'completed';
      await this.generateFinalReport(session, preBlock);
    }

    await this.sessionService.saveSession(session);
    return session;
  }

  async handleVFUAnswer(sessionId: string, answer: string): Promise<Session> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const preBlock = await this.preBlockService.getPreBlock(session.preBlockId);
    if (!preBlock) {
      throw new Error(`PreBlock ${session.preBlockId} not found`);
    }

    if (session.status !== 'awaiting_vfu' || !session.latestHypothesis || !session.latestHypothesis.suggestedVFU) {
      throw new Error(`Session ${sessionId} is not awaiting a VFU answer`);
    }

    // Append history
    const currentQuestion = session.latestHypothesis.suggestedVFU;
    const historyItem: VFUHistory = {
      question: currentQuestion,
      answer: answer
    };
    session.vfuHistory.push(historyItem);
    session.currentVFUCount++;
    session.updatedAt = new Date().toISOString();

    // Reanalysis Prompt
    const filledPrompt = this.replacePlaceholders(vfuPrompt, {
      PRE_BLOCK: JSON.stringify(preBlock, null, 2),
      ARTIFACT: session.submission.artifact,
      NARRATIVE: session.submission.narrative,
      VFU_HISTORY: this.formatVFUHistory(session.vfuHistory),
      PREVIOUS_HYPOTHESIS: JSON.stringify(session.latestHypothesis, null, 2),
      CURRENT_VFU_COUNT: session.currentVFUCount.toString()
    });

    const hypothesis = await this.llmProvider.generateJSON<DiagnosticHypothesis>(filledPrompt);
    historyItem.hypothesisAfterVFU = hypothesis;
    session.latestHypothesis = hypothesis;

    // Apply stop rule
    if (hypothesis.needVFU && session.currentVFUCount < preBlock.vfuPolicy.maxVFUs) {
      session.status = 'awaiting_vfu';
    } else {
      session.status = 'completed';
      await this.generateFinalReport(session, preBlock);
    }

    await this.sessionService.saveSession(session);
    return session;
  }

  async generateSuggestedAnswer(sessionId: string): Promise<string> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const preBlock = await this.preBlockService.getPreBlock(session.preBlockId);
    if (!preBlock) {
      throw new Error(`PreBlock ${session.preBlockId} not found`);
    }

    if (!session.latestHypothesis || !session.latestHypothesis.suggestedVFU) {
      throw new Error(`Session ${sessionId} does not have an active VFU question`);
    }

    const currentVFUQuestion = session.latestHypothesis.suggestedVFU;

    const filledPrompt = this.replacePlaceholders(suggestedAnswerPrompt, {
      PRE_BLOCK: JSON.stringify(preBlock, null, 2),
      ARTIFACT: session.submission.artifact,
      NARRATIVE: session.submission.narrative,
      VFU_HISTORY: this.formatVFUHistory(session.vfuHistory),
      CURRENT_VFU_QUESTION: currentVFUQuestion
    });

    const result = await this.llmProvider.generateJSON<{ suggestedAnswer: string }>(filledPrompt);
    return result.suggestedAnswer;
  }

  private async generateFinalReport(session: Session, preBlock: PreBlockModel): Promise<void> {
    const latestHypothesis = session.latestHypothesis;
    if (!latestHypothesis) {
      throw new Error('Cannot generate final report without a diagnostic hypothesis');
    }

    // 1. Final Classification Step
    const filledClassificationPrompt = this.replacePlaceholders(classificationPrompt, {
      PRE_BLOCK: JSON.stringify(preBlock, null, 2),
      ARTIFACT: session.submission.artifact,
      NARRATIVE: session.submission.narrative,
      VFU_HISTORY: this.formatVFUHistory(session.vfuHistory),
      LATEST_HYPOTHESIS: JSON.stringify(latestHypothesis, null, 2)
    });

    const classResult = await this.llmProvider.generateJSON<{
      classification: 'Completely Correct' | 'Partially Correct' | 'Completely Incorrect';
      recommendation: 'Proceed' | 'Conditional Progression' | 'Rework';
      confidence: 'low' | 'medium' | 'high';
      mainGap: string;
      deficiencyProfile: string[];
    }>(filledClassificationPrompt);

    // 2. Teacher Report Rationale Step
    const filledReportPrompt = this.replacePlaceholders(teacherReportPrompt, {
      PRE_BLOCK: JSON.stringify(preBlock, null, 2),
      ARTIFACT: session.submission.artifact,
      NARRATIVE: session.submission.narrative,
      VFU_HISTORY: this.formatVFUHistory(session.vfuHistory),
      LATEST_HYPOTHESIS: JSON.stringify(latestHypothesis, null, 2),
      CLASSIFICATION: classResult.classification,
      RECOMMENDATION: classResult.recommendation,
      MAIN_GAP: classResult.mainGap,
      DEFICIENCY_PROFILE: JSON.stringify(classResult.deficiencyProfile),
      DEFICIENCY_PROFILE_ITEMS: classResult.deficiencyProfile.map(item => `"${item}"`).join(', ')
    });

    const finalReport = await this.llmProvider.generateJSON<TeacherReport>(filledReportPrompt);
    
    // Enforce matching fields
    session.teacherReport = {
      classification: classResult.classification,
      recommendation: classResult.recommendation,
      confidence: classResult.confidence,
      mainGap: classResult.mainGap,
      deficiencyProfile: classResult.deficiencyProfile,
      rationale: finalReport.rationale || 'Avaliação concluída com sucesso.'
    };
  }
}
