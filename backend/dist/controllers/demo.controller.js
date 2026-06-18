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
exports.DemoController = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DemoController {
    dataDir;
    constructor() {
        this.dataDir = path.resolve(__dirname, '../../../data');
        if (!fs.existsSync(this.dataDir)) {
            this.dataDir = path.resolve(process.cwd(), '../data');
        }
        if (!fs.existsSync(this.dataDir)) {
            this.dataDir = path.resolve(process.cwd(), 'data');
        }
    }
    getDemoCasesPath() {
        return path.join(this.dataDir, 'demo-cases');
    }
    listDemoCases = async (req, res) => {
        try {
            const demoPath = this.getDemoCasesPath();
            if (!fs.existsSync(demoPath)) {
                res.json([]);
                return;
            }
            const files = fs.readdirSync(demoPath);
            const cases = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = fs.readFileSync(path.join(demoPath, file), 'utf-8');
                        cases.push(JSON.parse(content));
                    }
                    catch (e) {
                        console.error(`Error reading demo case ${file}:`, e);
                    }
                }
            }
            cases.sort((a, b) => a.caseId.localeCompare(b.caseId));
            res.json(cases);
        }
        catch (error) {
            console.error('Error in listDemoCases:', error);
            res.status(500).json({ error: 'Failed to list demo cases' });
        }
    };
    initializeDemoCases = async (req, res) => {
        try {
            const demoPath = this.getDemoCasesPath();
            const filesExist = fs.existsSync(demoPath) && fs.readdirSync(demoPath).length > 0;
            res.json({
                success: true,
                message: filesExist
                    ? 'Casos de demonstração carregados com sucesso a partir do diretório de dados.'
                    : 'Diretório de casos demonstrativos vazio ou ausente. Por favor, verifique se os arquivos JSON existem no workspace.'
            });
        }
        catch (error) {
            console.error('Error in initializeDemoCases:', error);
            res.status(500).json({ error: 'Failed to initialize demo cases' });
        }
    };
}
exports.DemoController = DemoController;
