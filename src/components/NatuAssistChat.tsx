import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Bot, X, Loader2, Download, Volume2, Copy, Trash2, Sparkles, Check, Mic, MicOff, Activity, ShieldCheck } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { useAudit } from '../context/AuditContext';
import { Message, aiService } from '../services/aiService';

interface NatuAssistChatProps {
  onClose: () => void;
}

export const NatuAssistChat: React.FC<NatuAssistChatProps> = ({ onClose }) => {
  const { darkMode, resultado, movements, initialStockPositions, finalStockPositions, recipes, historico, cfops, dataInicio, dataFim } = useAudit();
  const STORAGE_KEY = 'natuassist_chat_history_v1';

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { role: 'assistant', content: 'Olá! Sou o **NatuAssist**, seu assistente avançado de auditoria fiscal e SAP. Como posso ajudar você hoje com as análises, divergências de preços, movimentações MB51 ou estoque?' }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  const auditContext = useMemo(() => {
      if (!resultado) return "Nenhum dado auditado principal disponível no momento.";
      
      const summary = [
          `Dados Auditados: ${resultado.divergencias?.length || 0} divergências encontradas.`,
          `Valor total de impacto financeiro: ${resultado.totalImpacto || 0}.`,
          `Configurações atuais: CFOPs: ${cfops}, Período: ${dataInicio} a ${dataFim}.`,
          `Receitas de auditoria ativas: ${recipes.length}.`,
          `Movimentações de material cadastradas (MB51): ${movements.length}.`,
          `Posições de estoque inicial: ${initialStockPositions.length}, final: ${finalStockPositions.length}.`,
          `Tamanho do histórico de auditoria: ${historico.length}.`
      ];
      
      return `Você é o NatuAssist, um especialista sênior em auditoria fiscal SAP. Aqui está o resumo atual do sistema: ${summary.join(' ')}. Use esses dados para responder perguntas com precisão técnica. SEMPRE estruture suas respostas utilizando marcações Markdown e os prefixos [RISCO], [SUGESTÃO] e [DADOS] quando aplicável.`;
  }, [resultado, movements, initialStockPositions, finalStockPositions, recipes, historico, cfops, dataInicio, dataFim]);

  const exportChat = () => {
    const text = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-natuassist-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    const initialMsg: Message = { role: 'assistant', content: 'Histórico limpo. Como posso ajudar você em uma nova análise de auditoria SAP?' };
    setMessages([initialMsg]);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\[RISCO\]|\[SUGESTÃO\]|\[DADOS\]/g, '').replace(/[*#_`-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech Recognition (Voice Input)
  const toggleSpeechRecognition = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('Seu navegador não suporta reconhecimento de voz nativo.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    const systemMessage: Message = { role: 'system', content: `Você é o NatuAssist, um especialista em auditoria SAP. ${auditContext}` };
    
    const cleanMessages = messages.filter(m => m.role !== 'system');
    const newMessagesForAI = [systemMessage, ...cleanMessages, userMessage];
    
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
        let accumulatedText = '';
        await aiService.chat(newMessagesForAI, (streamText) => {
            accumulatedText = streamText;
            setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: accumulatedText };
                return copy;
            });
        });
    } catch (error) {
        setMessages(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua solicitação com o motor de IA offline/servidor. Verifique a conexão com o backend.' };
            return copy;
        });
    } finally {
        setLoading(false);
    }
  };

  const suggestions = [
    "📊 Resumir Divergências",
    "💰 Calcular Impacto Financeiro",
    "🔍 Investigar Movimentações MB51",
    "⚡ Executar Diagnóstico Completo SAP",
    "🛡️ Validar Compliance & SOX"
  ];

  return (
    <ChatErrorBoundary>
        <div className={`fixed bottom-6 right-6 z-[60] w-[440px] max-w-[95vw] h-[660px] flex flex-col rounded-3xl shadow-2xl border backdrop-blur-xl ${darkMode ? 'bg-slate-900/98 border-slate-700 text-slate-100' : 'bg-white/98 border-slate-200 text-slate-800'}`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'} rounded-t-3xl`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#8DC63F]/20 flex items-center justify-center text-[#8DC63F] shadow-inner">
                        <Bot className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm flex items-center gap-2">
                            NatuAssist AI <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </h3>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Especialista SAP • 100% Offline / Seguro
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => handleSend("⚡ Realize um diagnóstico executivo completo das divergências de preços, estoques e movimentações MB51 atuais.")}
                        title="Executar Diagnóstico Automático" 
                        className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-slate-800 text-[#8DC63F]' : 'hover:bg-slate-100 text-[#78AF32]'}`}
                    >
                        <Activity className="w-4 h-4" />
                    </button>
                    <button onClick={clearChat} title="Limpar Conversa" className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}>
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={exportChat} title="Exportar Conversa (.txt)" className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}>
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} title="Fechar" className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-600'}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-[88%] text-xs sm:text-sm shadow-sm leading-relaxed ${
                            m.role === 'user' 
                                ? 'bg-[#8DC63F] text-white font-medium rounded-br-none shadow-md shadow-[#8DC63F]/20' 
                                : (darkMode ? 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none' : 'bg-slate-100 text-slate-800 border border-slate-200/60 rounded-bl-none')
                        }`}>
                            {m.role === 'assistant' ? (
                                <div className="markdown-body space-y-2">
                                    <Markdown>{m.content || (loading && i === messages.length - 1 ? 'Pensando e analisando dados SAP em tempo real...' : '')}</Markdown>
                                </div>
                            ) : (
                                m.content
                            )}
                        </div>

                        {/* Message Action Toolbar for Assistant */}
                        {m.role === 'assistant' && m.content && (
                            <div className="flex items-center gap-2 mt-1 px-2 text-[10px] text-slate-400">
                                <button 
                                    onClick={() => copyToClipboard(m.content, i)} 
                                    className="flex items-center gap-1 hover:text-[#8DC63F] transition-colors py-0.5 px-1.5 rounded"
                                >
                                    {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedIndex === i ? 'Copiado!' : 'Copiar'}</span>
                                </button>
                                <span>•</span>
                                <button 
                                    onClick={() => speakText(m.content)} 
                                    className="flex items-center gap-1 hover:text-[#8DC63F] transition-colors py-0.5 px-1.5 rounded"
                                >
                                    <Volume2 className="w-3 h-3" />
                                    <span>Ouvir</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {loading && messages[messages.length - 1]?.content === '' && (
                    <div className="flex items-center gap-2 text-xs text-[#8DC63F] font-bold p-3 bg-[#8DC63F]/10 rounded-2xl animate-pulse">
                        <Loader2 className="animate-spin w-4 h-4"/> Analisando registros e matriz de risco SAP...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions & Input Area */}
            <div className={`p-4 border-t ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'} rounded-b-3xl`}>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
                    <Sparkles className="w-3.5 h-3.5 text-[#8DC63F] shrink-0" />
                    {suggestions.map(s => (
                        <button
                            key={s}
                            onClick={() => handleSend(s)}
                            disabled={loading}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                                darkMode 
                                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-[#8DC63F] hover:text-[#8DC63F]' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-[#8DC63F] hover:text-[#8DC63F] shadow-xs'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleSpeechRecognition}
                        title={isListening ? "Ouvindo microfone..." : "Falar pergunta por voz"}
                        className={`p-3 rounded-2xl border transition-all ${
                            isListening 
                                ? 'bg-rose-500 border-rose-600 text-white animate-bounce' 
                                : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[#8DC63F]' : 'bg-white border-slate-200 text-slate-600 hover:border-[#8DC63F]')
                        }`}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                        className={`flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium outline-none border transition-all ${
                            darkMode 
                                ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-[#8DC63F]' 
                                : 'bg-white border-slate-200 text-slate-800 focus:border-[#8DC63F] shadow-inner'
                        }`}
                        placeholder={isListening ? "Ouvindo sua voz..." : "Faça uma pergunta sobre a auditoria..."}
                    />
                    <button 
                        onClick={() => handleSend()} 
                        disabled={loading || !input.trim()}
                        className={`p-3.5 bg-[#8DC63F] text-white rounded-2xl transition-all hover:bg-[#78AF32] shadow-md shadow-[#8DC63F]/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Send className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    </ChatErrorBoundary>
  );
};
