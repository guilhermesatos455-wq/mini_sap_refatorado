import React, { useState } from 'react';
import { 
  Bot, Sparkles, Send, Download, Copy, Check, RefreshCw, FileText, 
  ShieldCheck, TrendingUp, AlertTriangle, Building2, Briefcase, FileSearch,
  Scale, Award, ChevronRight, Layers, DollarSign
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  category?: 'parecer' | 'custos' | 'sox' | 'cambial' | 'sped';
  auditFirm?: string;
}

interface AuditCfoCopilotProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const AuditCfoCopilot: React.FC<AuditCfoCopilotProps> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [selectedFirm, setSelectedFirm] = useState<'PwC' | 'Deloitte' | 'EY' | 'KPMG' | 'Auditoria Interna'>('PwC');
  const [reportOpinion, setReportOpinion] = useState<'Sem Ressalvas' | 'Com Ressalvas' | 'Abstenção de Opinião'>('Sem Ressalvas');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: 'Hoje, 08:30',
      category: 'parecer',
      auditFirm: 'PwC',
      content: `**Olá! Sou o Assistente Copilot de Auditoria & CFO da NatuAssist.**
Estou conectado em tempo real aos registros contábeis, transações de estoque (MB51/CKM3), lançamentos não padronizados (JET SOX 404) e controles de manufatura (MES/MRP).

**Selecione um dos prompts rápidos abaixo ou digite sua pergunta analítica:**
• Elaboração formal do Relatório dos Auditores Independentes (Padrão NBC TA / ISA 700)
• Diagnóstico de variação de Custo dos Produtos Vendidos (CPV) e Custo de Ociosidade
• Análise da Segregação de Funções (SoD) e riscos de fraude em Contas a Pagar
• Parecer sobre efetividade dos Controles Internos SOX 404 do exercício financeiro`
    }
  ]);

  const quickPrompts = [
    {
      label: 'Parecer Big Four dos Auditores (ISA 700)',
      category: 'parecer',
      prompt: 'Elabore o Parecer Formal dos Auditores Independentes sobre as Demonstrações Financeiras da Companhia, avaliando aderência ao CPC/IFRS e conformidade SOX.'
    },
    {
      label: 'Diagnóstico de Margem Bruta & Ociosidade Fabril',
      category: 'custos',
      prompt: 'Analise o impacto do OEE de 89.6% da planta fabril na absorção de custos fixos e apure o custo de ociosidade não absorvido no período.'
    },
    {
      label: 'Relatório SOX 404 sobre Lançamentos JET',
      category: 'sox',
      prompt: 'Emita um parecer executivo sobre os testes de Journal Entry Testing (JET), apontando se as exceções detectadas no fim de semana comprometem os controles contábeis.'
    },
    {
      label: 'Stress Test de Capital de Giro & Risco Cambial',
      category: 'cambial',
      prompt: 'Simule o impacto de uma depreciação cambial de 15% nas obrigações com fornecedores internacionais e avalie a eficácia da política de hedge NDF.'
    }
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMsg: CopilotMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      content: text
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputPrompt('');
    setIsGenerating(true);

    setTimeout(() => {
      let responseContent = '';
      const lower = text.toLowerCase();

      if (lower.includes('parecer') || lower.includes('auditores') || lower.includes('isa 700') || lower.includes('big four')) {
        responseContent = `### 📋 RELATÓRIO DOS AUDITORES INDEPENDENTES SOBRE AS DEMONSTRAÇÕES CONTÁBEIS
**Entidade Emissora:** ${selectedFirm} Auditores Independentes S.S.  
**Destinatários:** Aos Acionistas, Membros do Conselho de Administração e Diretoria  
**Período Auditado:** Exercício findo em 31 de dezembro  
**Tipo de Parecer Emitido:** **OPINIÃO ${reportOpinion.toUpperCase()}**

---

#### 1. Opinião dos Auditores
Examinamos as demonstrações contábeis individuais e consolidadas da Companhia, que compreendem o Balanço Patrimonial, a Demonstração do Resultado (DRE), a Demonstração dos Fluxos de Caixa (DFC) e as respectivas notas explicativas.

Em nossa opinião, as referidas demonstrações contábeis apresentam adequadamente, em todos os aspectos relevantes, a posição patrimonial e financeira da Companhia, em conformidade com as práticas contábeis adotadas no Brasil (CPC) e com as normas internacionais de relatório financeiro (IFRS emitidas pelo IASB).

#### 2. Base para a Opinião
Nossa auditoria foi conduzida de acordo com as normas brasileiras e internacionais de auditoria (NBC TA / ISA). Nossas responsabilidades estão descritas na seção "Responsabilidades do Auditor". Declaramos que somos independentes em relação à Companhia, de acordo com o Código de Ética Profissional do CFC.

#### 3. Principais Assuntos de Auditoria (PAA / KAM - Key Audit Matters)
1. **Valoração de Estoques e Custo Real no Ledger de Materiais (SAP Material Ledger / CKM3)**:
   - *Procedimento Executado:* Testamos a consistência do recálculo do Preço Médio Ponderado (PMP) e a alocação de desvios de produção entre CPV e Estoque Final. Constatamos aderência total ao CPC 16 (Estoques).
2. **Ambiente de Controles Internos sobre Relatórios Financeiros (SOX 404 & Segregação de Funções - SoD)**:
   - *Procedimento Executado:* Revisamos a matriz de riscos e os testes de eficácia operacional nos lançamentos manuais de diário (Journal Entry Testing). Foram identificados 4 apontamentos de lançamentos fora de hora devidamente sanados com aprovação formal do Controller.

#### 4. Conclusão e Assinatura
Não foram identificadas distorções relevantes não corrigidas que pudessem comprometer a fidedignidade dos saldos contábeis auditados.

**${selectedFirm} Auditores Independentes S.S.**  
CRC 2SP014285/O-8  
*Sócio Responsável - Auditoria de Demonstrações Financeiras*`;
      } else if (lower.includes('margem') || lower.includes('oee') || lower.includes('ociosidade') || lower.includes('custo')) {
        responseContent = `### 📊 PARECER DE CONTROLADORIA: MARGEM BRUTA & OCIOSIDADE FABRIL
**Centro de Análise:** Fábrica Principal (Linhas 01, 02 e 04)  
**Índice OEE Apurado:** **89.6%** (Meta Corporativa: 85.0%)

---

#### 1. Diagnóstico de Produtividade & Absorção
- **Taxa de Absorção de Custo Fixo:** A eficiência operacional do período permitiu diluir os custos indiretos de fabricação (CIF) em **+4.2%** acima do orçado.
- **Custo de Ociosidade Mensurada:** Estimado em apenas **R$ 38.450,00** decorrente de setups na linha de blisterizadora (#02), valor considerado plenamente aceitável e inferior ao limite de tolerância orçamentária (R$ 75.000,00).

#### 2. Impacto na Margem Bruta
- **Margem Bruta Realizada:** **52.4%** (vs. Orçado de 49.8%), gerando um ganho incremental no EBITDA de aproximadamente **R$ 184.200,00**.
- **Recomendação:** Homologar a nova estrutura de BOM (Bill of Materials) para manter a padronização das perdas de excipientes abaixo de 1.2%.`;
      } else if (lower.includes('sox') || lower.includes('jet') || lower.includes('lançamento')) {
        responseContent = `### 🛡️ AVALIAÇÃO DE EFICÁCIA SOX 404: JOURNAL ENTRY TESTING (JET)
**Escopo do Teste:** População integral de lançamentos contábeis manuais (T-Code FB50 / FB01).  
**Amostragem Preditiva:** 100% dos lançamentos classificados com anomalia de alta materialidade.

---

#### 1. Resultados dos Testes de Controles
- **Lançamentos Fora de Expediente:** 4 lançamentos identificados nos finais de semana. Todos continham protocolo formal de contingência de fechamento autorizado pelo Gerente Contábil.
- **Transações Próximas à Alçada:** Não foi detectado fracionamento deliberado de pedidos para burlar limites de aprovação (*smurfing contábil*).
- **Contas Transitórias de Frete / Estoque (EM/EF):** Conciliação 99.1% concluída com saldo residual sob quarentena documental.

#### 2. Parecer de Conformidade
Conclui-se que os controles internos da Companhia operaram de forma **EFICAZ** durante o período, mitigando o risco de distorção relevante decorrente de fraude ou erro nos relatórios financeiros consolidados.`;
      } else {
        responseContent = `### 💡 DIAGNÓSTICO EXECUTIVO COMPLETO DE CONTROLADORIA
**Assunto Solicitado:** "${text}"

---

1. **Visão Geral e Alinhamento Estratégico:**
   Os dados operacionais da Companhia indicam solidez nas rotinas de fechamento mensal. O cruzamento das ordens de manufatura ativas (MES) com as requisições geradas pelo MRP demonstra aderência de 94.8% ao plano diretor de produção.

2. **Riscos e Pontos de Atenção:**
   - Monitorar a volatilidade das cotações de insumos químicos cotados em dólar (API Paracetamol e Amoxicilina).
   - Manter as trilhas de auditoria ativas com assinaturas digitais nos laudos de controle de qualidade farmacopeica.

3. **Plano de Ação Recomendado:**
   - Exportar o Dossiê de Fechamento SOX para apresentação no próximo Comitê de Auditoria e Riscos.
   - Sincronizar os lotes liberados na quarentena diretamente com as notas de remessa no WMS.`;
      }

      const assistantMsg: CopilotMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        category: 'parecer',
        auditFirm: selectedFirm,
        content: responseContent
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsGenerating(false);
      addAuditLog('Copilot CFO & Parecer Big Four', `Geração de parecer/diagnóstico sob modelo ${selectedFirm}.`);
      addToast('Diagnóstico executivo gerado com sucesso!', 'success');
    }, 1200);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    addToast('Parecer copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadReport = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Arquivo do parecer baixado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> IA Generativa & Parecer Big Four
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              ISA 700 / SOX 404 Ready
            </span>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5 mt-1`}>
            <Bot className="w-6 h-6 text-purple-400" /> Assistente Copilot de Auditoria & CFO Executivo
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Emissão de laudos de auditoria independente, análise de desvios industriais e diagnósticos para comitês executivos.
          </p>
        </div>

        {/* Configuration Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
            <span className="text-slate-400 text-[11px] pl-1 font-bold">Firma Auditada:</span>
            {(['PwC', 'Deloitte', 'EY', 'KPMG', 'Auditoria Interna'] as const).map((firm) => (
              <button
                key={firm}
                onClick={() => setSelectedFirm(firm)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  selectedFirm === firm ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {firm}
              </button>
            ))}
          </div>

          <select
            value={reportOpinion}
            onChange={(e) => setReportOpinion(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 cursor-pointer"
          >
            <option value="Sem Ressalvas">Opinião: Sem Ressalvas (Limpo)</option>
            <option value="Com Ressalvas">Opinião: Com Ressalvas</option>
            <option value="Abstenção de Opinião">Opinião: Abstenção / Adversa</option>
          </select>
        </div>
      </div>

      {/* Quick Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={isGenerating}
            className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between ${
              darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/50' : 'bg-white border-gray-200 hover:border-purple-500'
            } shadow-sm group`}
          >
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {qp.category.toUpperCase()}
              </span>
              <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                {qp.label}
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
              Executar análise <ChevronRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className={`p-4 rounded-3xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-gray-200'} space-y-4 min-h-[380px] max-h-[550px] overflow-y-auto custom-scrollbar`}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1 font-mono">
              {msg.sender === 'assistant' ? (
                <>
                  <span className="font-bold text-purple-400 flex items-center gap-1">
                    <Award className="w-3 h-3" /> {msg.auditFirm || 'Copilot CFO'}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-slate-300">Auditor Executivo</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-3xl p-5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-sm font-medium'
                  : darkMode
                  ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                  : 'bg-white border border-gray-200 text-slate-800 rounded-tl-sm'
              }`}
            >
              <div className="prose prose-invert max-w-none text-xs md:text-sm whitespace-pre-line">
                {msg.content}
              </div>

              {msg.sender === 'assistant' && msg.id !== 'msg-welcome' && (
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === msg.id ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                  <button
                    onClick={() => handleDownloadReport(msg.content, `Parecer_${msg.auditFirm || 'Auditoria'}`)}
                    className="px-2.5 py-1 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Parecer (.md)
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-2xl border border-purple-500/20 max-w-md animate-pulse">
            <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-xs text-purple-300 font-mono">
              Consolidando trilhas SOX e redigindo parecer formal padrão {selectedFirm}...
            </span>
          </div>
        )}
      </div>

      {/* Input Prompt Box */}
      <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-md`}>
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isGenerating) handleSendMessage();
          }}
          placeholder="Ex: Como justificar a variação de custo de estoque no balanço para o Comitê de Auditoria?"
          className="flex-1 bg-transparent px-3 py-2 text-xs md:text-sm text-white focus:outline-none placeholder:text-slate-500"
          disabled={isGenerating}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isGenerating || !inputPrompt.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> Enviar
        </button>
      </div>
    </div>
  );
};

export default AuditCfoCopilot;
