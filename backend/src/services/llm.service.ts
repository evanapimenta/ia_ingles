import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

export interface LLMProvider {
  generateJSON<T>(prompt: string): Promise<T>;
}

// OpenAI implementation using GPT-4o
export class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not defined in the environment variables.');
    }
    this.openai = new OpenAI({ apiKey });
    this.model = process.env.LLM_MODEL || 'gpt-4o';
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a precise academic evaluator. Always reply in JSON format. Verify your JSON is valid before returning. Translate your educational evaluation to Portuguese.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      let text = response.choices[0].message.content || '{}';
      
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }

      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON. Raw text was:', text);
        throw new Error(`Erro ao decodificar JSON do OpenAI: ${(parseError as Error).message}. Conteúdo: ${text}`);
      }
    } catch (error) {
      console.error('Error in OpenAIProvider:', error);
      throw error;
    }
  }
}

// Gemini Provider using Google Generative Language API
export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
    }
    let configModel = process.env.LLM_MODEL || 'gemini-1.5-flash';
    // If OpenAI model was left in configModel, map it to a sensible Gemini default
    if (configModel.includes('gpt-')) {
      configModel = 'gemini-1.5-flash';
    }
    this.model = configModel;
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: prompt + '\n\nIMPORTANT: Return ONLY a valid JSON object. Translate your educational evaluation to Portuguese.',
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const data = await response.json() as any;
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }

      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON. Raw text was:', text);
        throw new Error(`Erro ao decodificar JSON do Gemini: ${(parseError as Error).message}. Conteúdo: ${text}`);
      }
    } catch (error) {
      console.error('Error in GeminiProvider:', error);
      throw error;
    }
  }
}

// Mock LLM Provider for demo cases without requiring OpenAI API Key
export class MockProvider implements LLMProvider {
  async generateJSON<T>(prompt: string): Promise<T> {
    console.log('--- MOCK LLM PROVIDER CALLED ---');
    const promptLower = prompt.toLowerCase();

    // Check prompt step
    if (promptLower.includes('teacher-report.prompt.ts') || promptLower.includes('compile the final teacher report')) {
      return this.mockTeacherReport(promptLower) as unknown as T;
    }

    if (promptLower.includes('classification.prompt.ts') || promptLower.includes('final pedagogical classification')) {
      return this.mockClassification(promptLower) as unknown as T;
    }

    if (promptLower.includes('vfu.prompt.ts') || promptLower.includes('reanalyze a student\'s performance')) {
      return this.mockReanalysis(promptLower) as unknown as T;
    }

    // Default to diagnostic
    return this.mockDiagnostic(promptLower) as unknown as T;
  }

  private mockDiagnostic(prompt: string): any {
    if (prompt.includes('drinked') || prompt.includes('case1')) {
      return {
        demonstratedCompetencies: ['Recognize regular verbs'],
        missingCompetencies: ['Recognize irregular verbs', 'Use Simple Past correctly', 'Use Past Participle correctly', 'Differentiate Simple Past and Present Perfect'],
        misconceptionsDetected: ['All past verbs end with ed', 'Irregular verbs follow regular patterns', 'Present Perfect can be used with explicit past time markers'],
        confidence: 'medium',
        needVFU: true,
        diagnosticHypothesis: 'O estudante aplicou o sufixo regular "-ed" em verbos irregulares ("drinked" e "goed") e combinou o Present Perfect com um marcador de tempo específico ("yesterday I have gone"). Isso indica uma falha na diferenciação de regras de verbos regulares/irregulares e no uso de marcadores temporais.',
        suggestedVFU: 'Você utilizou as palavras "drinked" e "goed". Como você formaria o passado simples desses verbos que são irregulares em inglês?'
      };
    }

    if (prompt.includes('have went') || prompt.includes('case2')) {
      return {
        demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs'],
        missingCompetencies: ['Use Simple Past correctly', 'Use Past Participle correctly', 'Differentiate Simple Past and Present Perfect'],
        misconceptionsDetected: ['Went and gone are interchangeable', 'Past Participle equals Simple Past'],
        confidence: 'medium',
        needVFU: true,
        diagnosticHypothesis: 'O estudante usou "have went" (auxiliar com Simple Past) e "I gone" (particípio sem auxiliar), indicando a misconception de que "went" e "gone" são intercambiáveis ou que o particípio pode funcionar sozinho no passado.',
        suggestedVFU: 'Na sua primeira frase você escreveu "have went" e na terceira escreveu "I gone". Qual é a regra gramatical para o uso de "went" (Simple Past) e "gone" (Past Participle) com ou sem verbos auxiliares?'
      };
    }

    if (prompt.includes('seen a star') || prompt.includes('case3')) {
      return {
        demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs', 'Use Simple Past correctly', 'Use Past Participle correctly'],
        missingCompetencies: ['Differentiate Simple Past and Present Perfect'],
        misconceptionsDetected: ['Present Perfect can be used with explicit past time markers'],
        confidence: 'medium',
        needVFU: true,
        diagnosticHypothesis: 'O estudante conjuga e aplica os verbos no Simple Past ("saw", "played") e no Present Perfect ("have lived") de forma correta. No entanto, há um deslize ao escrever "last night I have seen a star", onde utiliza o Present Perfect com um marcador temporal de passado definido.',
        suggestedVFU: 'Na sua frase "last night I have seen a star", você combinou o Present Perfect com "last night". Qual tempo verbal deveria ser utilizado com marcadores específicos de tempo concluído como "last night"?'
      };
    }

    if (prompt.includes('buyed') || prompt.includes('case4')) {
      return {
        demonstratedCompetencies: ['Recognize regular verbs', 'Use Simple Past correctly'],
        missingCompetencies: ['Recognize irregular verbs', 'Use Past Participle correctly'],
        misconceptionsDetected: ['All past verbs end with ed', 'Irregular verbs follow regular patterns'],
        confidence: 'medium',
        needVFU: true,
        diagnosticHypothesis: 'O estudante demonstra domínio de verbos regulares ("yesterday" com passado) e de verbos irregulares comuns ("has eaten"). Contudo, apresenta erros em outros verbos irregulares: cria "buyed" (regularização) e usa "have drove" (Simple Past após auxiliar).',
        suggestedVFU: 'Você escreveu "buyed" e "have drove". Como são formados os passados do verbo "buy" no Simple Past e do verbo "drive" no Past Participle?'
      };
    }

    if (prompt.includes('walked to the library') || prompt.includes('case5')) {
      return {
        demonstratedCompetencies: [
          'Recognize regular verbs',
          'Recognize irregular verbs',
          'Use Simple Past correctly',
          'Use Past Participle correctly',
          'Differentiate Simple Past and Present Perfect',
          'Explain grammatical choices'
        ],
        missingCompetencies: [],
        misconceptionsDetected: [],
        confidence: 'high',
        needVFU: false,
        diagnosticHypothesis: 'O estudante demonstra domínio absoluto sobre verbos regulares e irregulares no passado. Ele diferencia perfeitamente o Simple Past (para ações com tempo específico "yesterday") do Present Perfect (para períodos inacabados "this week"). Nenhuma dúvida conceitual foi observada.',
        suggestedVFU: null
      };
    }

    if (prompt.includes('ate dinner') || prompt.includes('case6') || prompt.includes('already finished')) {
      return {
        demonstratedCompetencies: [
          'Recognize regular verbs',
          'Recognize irregular verbs',
          'Use Simple Past correctly',
          'Use Past Participle correctly',
          'Differentiate Simple Past and Present Perfect',
          'Explain grammatical choices'
        ],
        missingCompetencies: [],
        misconceptionsDetected: [],
        confidence: 'high',
        needVFU: false,
        diagnosticHypothesis: 'O estudante aplica e justifica corretamente o Simple Past "ate" e "traveled" para tempos definidos ("at 7 PM", "last year") e o Present Perfect para ações com relevância presente sem indicação de tempo. Domínio consolidado.',
        suggestedVFU: null
      };
    }

    // Default fallback for custom input when OpenAI API Key is missing:
    return {
      demonstratedCompetencies: [],
      missingCompetencies: [],
      misconceptionsDetected: [],
      confidence: 'low',
      needVFU: false,
      diagnosticHypothesis: 'AVISO: O sistema está operando em Modo de Demonstração (Mock Provider) porque nenhuma chave OPENAI_API_KEY foi configurada no arquivo backend/.env. Para analisar entradas personalizadas de forma real com o GPT-4o, configure a sua chave de API e reinicie o servidor.',
      suggestedVFU: null
    };
  }

  private mockReanalysis(prompt: string): any {
    if (prompt.includes('case1') || prompt.includes('drinked')) {
      // VFU 1 or VFU 2
      if (prompt.includes('concluído') || prompt.includes('específico') || prompt.includes('ontem') || prompt.includes('yesterday') || prompt.includes('advérbio')) {
        // This is answer to VFU 2
        return {
          demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs', 'Use Simple Past correctly', 'Differentiate Simple Past and Present Perfect'],
          missingCompetencies: [],
          misconceptionsDetected: [],
          confidence: 'high',
          needVFU: false,
          diagnosticHypothesis: 'O estudante demonstrou compreender que o Present Perfect não deve ser usado com marcadores de tempo específicos como "yesterday", corrigindo a frase para "Yesterday I went". Os misconceptions sobre verbos irregulares e tempos verbais foram esclarecidos.',
          suggestedVFU: null
        };
      } else {
        // This is answer to VFU 1
        return {
          demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs'],
          missingCompetencies: ['Use Simple Past correctly', 'Use Past Participle correctly', 'Differentiate Simple Past and Present Perfect'],
          misconceptionsDetected: ['Present Perfect can be used with explicit past time markers'],
          confidence: 'medium',
          needVFU: true,
          diagnosticHypothesis: 'O estudante corrigiu corretamente as formas de "drink" e "go" para "drank" e "went", mostrando que reconhece verbos irregulares. No entanto, o erro com "Yesterday I have gone" ainda está presente. Precisamos verificar se ele compreende a regra do Present Perfect com advérbios passados definidos.',
          suggestedVFU: 'Na sua frase original: "Yesterday I have gone to study there", você usou o Present Perfect "have gone" com a palavra "yesterday". O que há de errado com essa combinação de tempo verbal e marcador temporal?'
        };
      }
    }

    if (prompt.includes('case2') || prompt.includes('have went')) {
      if (prompt.includes('corrigiria') || prompt.includes('went to the store') || prompt.includes('simple past') || prompt.includes('auxiliar')) {
        // VFU 2 response
        return {
          demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs', 'Use Simple Past correctly', 'Use Past Participle correctly'],
          missingCompetencies: [],
          misconceptionsDetected: [],
          confidence: 'high',
          needVFU: false,
          diagnosticHypothesis: 'O estudante corrigiu com sucesso a frase para "I went to the store", mostrando que sabe usar o Simple Past de forma correta sem auxiliar e desfazendo a confusão de intercambiabilidade.',
          suggestedVFU: null
        };
      } else {
        // VFU 1 response
        return {
          demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs', 'Use Simple Past correctly'],
          missingCompetencies: ['Use Past Participle correctly'],
          misconceptionsDetected: ['Past Participle equals Simple Past'],
          confidence: 'medium',
          needVFU: true,
          diagnosticHypothesis: 'O estudante identificou corretamente que "went" é o Simple Past e é usado sozinho, enquanto "gone" exige o auxiliar "have/has". No entanto, precisamos verificar se ele sabe como corrigir a terceira frase "I gone to the store" com base nessa regra.',
          suggestedVFU: 'Muito bem! Com base nessa regra que você acabou de explicar, como você corrigiria a frase "I gone to the store"?'
        };
      }
    }

    if (prompt.includes('case3') || prompt.includes('seen a star')) {
      return {
        demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs', 'Use Simple Past correctly', 'Use Past Participle correctly', 'Differentiate Simple Past and Present Perfect'],
        missingCompetencies: [],
        misconceptionsDetected: [],
        confidence: 'high',
        needVFU: false,
        diagnosticHypothesis: 'O estudante explicou corretamente que marcas de tempo específicas e fechadas exigem o Simple Past ("saw") e não o Present Perfect, corrigindo para "last night I saw a star".',
        suggestedVFU: null
      };
    }

    if (prompt.includes('case4') || prompt.includes('buyed')) {
      return {
        demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs', 'Use Simple Past correctly', 'Use Past Participle correctly'],
        missingCompetencies: [],
        misconceptionsDetected: [],
        confidence: 'high',
        needVFU: false,
        diagnosticHypothesis: 'O estudante respondeu corretamente apontando "bought" como passado de "buy" e "driven" como particípio de "drive", eliminando a dúvida sobre o seu conhecimento desses verbos.',
        suggestedVFU: null
      };
    }

    return {
      demonstratedCompetencies: ['Recognize regular verbs', 'Recognize irregular verbs', 'Use Simple Past correctly'],
      missingCompetencies: [],
      misconceptionsDetected: [],
      confidence: 'high',
      needVFU: false,
      diagnosticHypothesis: 'A reanálise do estudante foi concluída e todas as dúvidas conceituais pendentes foram resolvidas.',
      suggestedVFU: null
    };
  }

  private mockClassification(prompt: string): any {
    if (prompt.includes('case5') || prompt.includes('walked to the library')) {
      return {
        classification: 'Completely Correct',
        recommendation: 'Proceed',
        confidence: 'high',
        mainGap: 'Nenhuma',
        deficiencyProfile: []
      };
    }

    if (prompt.includes('case6') || prompt.includes('ate dinner at 7 pm')) {
      return {
        classification: 'Completely Correct',
        recommendation: 'Proceed',
        confidence: 'high',
        mainGap: 'Nenhuma',
        deficiencyProfile: []
      };
    }

    if (prompt.includes('case1') || prompt.includes('drinked')) {
      return {
        classification: 'Partially Correct',
        recommendation: 'Rework',
        confidence: 'high',
        mainGap: 'Uso incorreto do sufixo -ed para verbos irregulares e Present Perfect com marcador temporal específico.',
        deficiencyProfile: ['All past verbs end with ed', 'Present Perfect can be used with explicit past time markers']
      };
    }

    if (prompt.includes('case2') || prompt.includes('have went')) {
      return {
        classification: 'Partially Correct',
        recommendation: 'Conditional Progression',
        confidence: 'high',
        mainGap: 'Confusão no uso de went (Simple Past) e gone (Past Participle).',
        deficiencyProfile: ['Went and gone are interchangeable', 'Past Participle equals Simple Past']
      };
    }

    if (prompt.includes('case3') || prompt.includes('seen a star')) {
      return {
        classification: 'Partially Correct',
        recommendation: 'Conditional Progression',
        confidence: 'high',
        mainGap: 'Uso de Present Perfect com marcador temporal de passado definido.',
        deficiencyProfile: ['Present Perfect can be used with explicit past time markers']
      };
    }

    if (prompt.includes('case4') || prompt.includes('buyed')) {
      return {
        classification: 'Partially Correct',
        recommendation: 'Conditional Progression',
        confidence: 'high',
        mainGap: 'Regularização incorreta de verbos irregulares e particípio incorreto.',
        deficiencyProfile: ['All past verbs end with ed', 'Irregular verbs follow regular patterns']
      };
    }

    if (prompt.includes('modo de demonstração') || prompt.includes('aviso: o sistema está operando')) {
      return {
        classification: 'Partially Correct',
        recommendation: 'Conditional Progression',
        confidence: 'low',
        mainGap: 'Chave de API não configurada (Modo de Demonstração ativo).',
        deficiencyProfile: []
      };
    }

    return {
      classification: 'Partially Correct',
      recommendation: 'Conditional Progression',
      confidence: 'medium',
      mainGap: 'Algumas lacunas menores identificadas.',
      deficiencyProfile: []
    };
  }

  private mockTeacherReport(prompt: string): any {
    const classification = prompt.includes('completely correct') ? 'Completely Correct' :
                           prompt.includes('completely incorrect') ? 'Completely Incorrect' : 'Partially Correct';
    const recommendation = prompt.includes('proceed') ? 'Proceed' :
                              prompt.includes('rework') ? 'Rework' : 'Conditional Progression';

    let rationale = '';
    if (classification === 'Completely Correct') {
      rationale = 'O estudante demonstrou domínio absoluto na aplicação dos verbos no passado em inglês. Ele aplicou corretamente os verbos regulares no Simple Past e diferenciou de forma precisa o uso do Present Perfect para ações com períodos de tempo não específicos ou em andamento, justificando perfeitamente a sua escolha gramatical. Não foram detectadas lacunas de aprendizagem ou concepções errôneas.';
    } else if (classification === 'Completely Incorrect') {
      rationale = 'O estudante apresenta dificuldades generalizadas na formação do passado em inglês. Demonstra a concepção errônea de que todos os verbos no passado terminam em -ed e não consegue reconhecer verbos irregulares comuns. Além disso, falha na distinção básica entre Simple Past e Present Perfect. Recomenda-se retrabalho completo (Rework) do bloco pedagógico.';
    } else {
      // Partially correct
      if (prompt.includes('case1') || prompt.includes('drinked')) {
        rationale = 'O aluno inicialmente demonstrou misconceptions graves ao tentar aplicar a regra regular "-ed" em verbos irregulares ("drinked", "goed") e ao usar o Present Perfect com marcadores de tempo definidos ("Yesterday I have gone"). Durante os diálogos de verificação, o aluno demonstrou conhecimento corretivo ao identificar as formas irregulares "drank" e "went" e ao corrigir o uso do Present Perfect para Simple Past devido ao advérbio "yesterday". Embora as lacunas tenham sido sanadas no diálogo, recomenda-se uma revisão cuidadosa (Rework) de verbos irregulares e tempos passados para consolidar o aprendizado.';
      } else if (prompt.includes('case2') || prompt.includes('have went')) {
        rationale = 'O estudante apresentou confusão na diferenciação gramatical de "went" (Simple Past) e "gone" (Past Participle), combinando "have went" e usando o particípio isolado "I gone". Durante os follow-ups, ele explicitou a regra de que "went" é usado sem auxiliar e "gone" com auxiliar, e corrigiu corretamente "I gone" para "I went". Recomenda-se progressão condicional com exercícios de fixação para garantir que a distinção entre particípio e passado simples seja automatizada na escrita.';
      } else if (prompt.includes('case3') || prompt.includes('seen a star')) {
        rationale = 'O estudante demonstra sólida compreensão na formação de verbos no passado simples e Present Perfect ("saw", "played", "have lived"). O único desvio foi a aplicação do Present Perfect com "last night". No diálogo, o estudante identificou o erro imediatamente e justificou a correção usando o Simple Past "saw" por se tratar de um tempo determinado, evidenciando o domínio da diferença de uso entre os dois tempos verbais.';
      } else if (prompt.includes('case4') || prompt.includes('buyed')) {
        rationale = 'O estudante demonstra bom domínio da estrutura geral do passado simples e de tempos compostos ("has eaten"), mas cometeu erros de regularização de verbos irregulares ("buyed") e de uso de particípio ("have drove"). No diálogo de verificação, ele demonstrou saber que o passado de "buy" é "bought" e o particípio de "drive" é "driven", sugerindo que os desvios foram lapsos ou que ele possui o conhecimento passivo que necessita ser consolidado.';
      } else if (prompt.includes('modo de demonstração') || prompt.includes('aviso: o sistema está operando')) {
        rationale = 'O sistema está operando em Modo de Demonstração (Mock Provider) porque nenhuma chave OPENAI_API_KEY foi configurada no arquivo backend/.env. O texto enviado pelo aluno não corresponde a nenhum dos casos pré-configurados (Casos 1 a 6). Para testar frases personalizadas de forma real, configure a sua chave da OpenAI no arquivo backend/.env e reinicie o servidor.';
      } else {
        rationale = 'Avaliação de caso de demonstração concluída com sucesso.';
      }
    }

    return {
      classification,
      recommendation,
      confidence: prompt.includes('modo de demonstração') || prompt.includes('aviso: o sistema está operando') ? 'low' : 'high',
      mainGap: prompt.includes('case1') ? 'Uso incorreto do sufixo -ed para verbos irregulares e Present Perfect com tempo definido' :
                prompt.includes('case2') ? 'Confusão no uso de went e gone' :
                prompt.includes('case3') ? 'Uso de Present Perfect com marcador temporal de passado definido' :
                prompt.includes('case4') || prompt.includes('buyed') ? 'Regularização incorreta de verbos irregulares e particípio incorreto' : 
                (prompt.includes('modo de demonstração') || prompt.includes('aviso: o sistema está operando') ? 'Chave de API não configurada (Modo de Demonstração ativo).' : 'Nenhum'),
      deficiencyProfile: prompt.includes('case1') ? ['All past verbs end with ed', 'Present Perfect can be used with explicit past time markers'] :
                         prompt.includes('case2') ? ['Went and gone are interchangeable', 'Past Participle equals Simple Past'] :
                         prompt.includes('case3') ? ['Present Perfect can be used with explicit past time markers'] :
                         prompt.includes('case4') || prompt.includes('buyed') ? ['All past verbs end with ed', 'Irregular verbs follow regular patterns'] : [],
      rationale
    };
  }
}
