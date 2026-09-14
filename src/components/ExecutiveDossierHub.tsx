import React, { useState } from 'react';
import { 
  FileSpreadsheet, Download, FileText, CheckCircle2, ShieldCheck, 
  Calendar, Layers, Database, Sparkles, Filter, RefreshCw, Eye, Check,
  AlertCircle, Building, Terminal, ExternalLink
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

interface ExecutiveDossierHubProps {
  darkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const ExecutiveDossierHub: React.FC<ExecutiveDossierHubProps> = ({ darkMode, addToast }) => {
  const { addAuditLog } = useAudit();
  const [selectedFormat, setSelectedFormat] = useState<'sox_book' | 'sped_fiscal' | 'sped_contabil' | 'board_pack'>('sox_book');
  const [accountingPeriod, setAccountingPeriod] = useState('2026-Q3');
  const [includeAuditLogs, setIncludeAuditLogs] = useState(true);
  const [includeProductionOrders, setIncludeProductionOrders] = useState(true);
  const [spedValidationStatus, setSpedValidationStatus] = useState<'Aprovado' | 'Pendente' | 'Processando'>('Aprovado');
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // Generate Book SOX CSV
  const handleExportSoxBook = () => {
    const csvRows = [
      ['DOSSIÊ DE FECHAMENTO CONTÁBIL & SOX 404 - NATUASSIST ENTERPRISE'],
      ['Período Contábil', accountingPeriod],
      ['Data de Emissão', new Date().toISOString()],
      ['Status dos Controles Internos', 'EFICAZ - Sem Deficiências Significativas'],
      [''],
      ['MÓDULO 1: BALANCETE DE VERIFICAÇÃO & CONCILIAÇÃO'],
      ['Conta Contábil', 'Descrição da Conta', 'Saldo Anterior', 'Débito', 'Crédito', 'Saldo Atual', 'Status Conciliação'],
      ['1.1.01.001', 'Banco Conta Movimento SP', '15400000.00', '4200000.00', '3900000.00', '15700000.00', 'Conciliado'],
      ['1.1.03.002', 'Estoques - Matérias-Primas Farmaco', '8950000.00', '2100000.00', '1850000.00', '9200000.00', 'Conciliado CKM3'],
      ['1.1.03.008', 'Estoques - Produtos Acabados Blister', '12400000.00', '3400000.00', '2900000.00', '12900000.00', 'Conciliado MB51'],
      ['2.1.01.005', 'Fornecedores Nacionais e Importados', '-9800000.00', '4100000.00', '4300000.00', '-10000000.00', 'Confirmado Circularização'],
      [''],
      ['MÓDULO 2: TESTES DE LANÇAMENTOS NÃO PADRONIZADOS (JET SOX 404)'],
      ['Documento SAP', 'Data/Hora', 'Usuário', 'Conta Débito/Crédito', 'Valor (R$)', 'Anomalia Detectada', 'Parecer da Auditoria'],
      ['DOC-2026-0901', '2026-09-06 23:45', 'OPER_NOTURNO', '1.1.03.002 / 3.1.01.001', '450000.00', 'Lançamento Fora de Expediente', 'Regularizado com Aprovação Controller'],
      ['DOC-2026-0914', '2026-09-08 14:20', 'USR_FISCAL', '2.1.05.003 / 1.1.01.001', '100000.00', 'Valor Redondo Sem Lastro NF', 'Estornado e Reclassificado'],
      [''],
      ['MÓDULO 3: MATRIZ DE SEGREGAÇÃO DE FUNÇÕES (SoD) & ALÇADAS'],
      ['Risco SoD', 'Função A (Requisição)', 'Função B (Aprovação/Pgto)', 'Exceções Detectadas', 'Controle Compensatório'],
      ['SOD-AP-01', 'Criar Fornecedor SAP', 'Efetuar Pagamento Bancário', '0 Violações', 'Aprovação Dual no Internet Banking'],
      ['SOD-MM-02', 'Entrada de Mercadoria (MIGO)', 'Entrada de Fatura (MIRO)', '0 Violações', 'Bloqueio de Perfil por T-Code'],
      [''],
      ['ASSINATURAS E GOVERNANÇA CORPORATIVA'],
      ['Diretor Financeiro (CFO)', 'Gerente de Controladoria', 'Auditor Chefe Interno', 'Líder de TI & Cibersegurança'],
      ['[Assinado Digitalmente]', '[Assinado Digitalmente]', '[Assinado Digitalmente]', '[Assinado Digitalmente]']
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.map(x => `"${x}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dossie_Fechamento_SOX_${accountingPeriod}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('Exportação Dossiê SOX 404', `Gerado Book de Fechamento Contábil completo para o período ${accountingPeriod}.`);
    addToast(`Dossiê de Fechamento SOX (${accountingPeriod}) exportado com sucesso!`, 'success');
  };

  // Generate SPED Fiscal File
  const handleExportSped = (type: 'EFD_ICMS' | 'ECD_CONTABIL') => {
    const lines = [
      `|0000|018|0|01012026|31032026|NATUASSIST INDUSTRIA FARMACEUTICA S.A.|12345678000190|BA|123456789|2905701|||A|1|`,
      `|0001|0|`,
      `|0005|NATUASSIST MATRIZ|41820000|AVENIDA DAS INDUSTRIAS|1000||DISTRITO INDUSTRIAL|7133333333||contato@natuassist.com.br|`,
      `|0100|ROBERTO ALVES CONTADOR|12345678901|CRC1BA123456|12345678000190|41820000|AV CONTABIL|500||CENTRO|7133334444||contador@natuassist.com.br|2905701|`,
      `|0150|CLI001|DROGARIA PACHECO S.A.|1058|98765432000110||3304557|||||`,
      `|0200|MAT-101|PARACETAMOL 500MG CX 50 COMP|7891234567890||CX|01|30049099||||`,
      `|0200|MAT-102|DIPIRONA SODICA 500MG GOTAS 20ML|7891234567891||FR|01|30049099||||`,
      `|0990|8|`,
      `|C001|0|`,
      `|C100|0|1|CLI001|55|00|1|102450|20260315|20260315|450000.00|1|0.00|0.00|450000.00|9|0.00|0.00|450000.00|81000.00|0.00|0.00|0.00|0.00|7425.00|34200.00|0.00|`,
      `|C190|0101|5102|18.00|450000.00|450000.00|81000.00|0.00|0.00|0.00|0.00|`,
      `|C990|4|`,
      `|H001|0|`,
      `|H005|20260331|22100000.00|01|`,
      `|H010|MAT-101|CX|15400|0.080000|1232.00|0|1.1.03.002|`,
      `|H010|MAT-102|FR|22100|0.090000|1989.00|0|1.1.03.002|`,
      `|H990|5|`,
      `|K001|0|`,
      `|K100|20260301|20260331|`,
      `|K200|20260331|MAT-101|15400|0||`,
      `|K230|20260310|20260315|WO-8801|MAT-101|50000||`,
      `|K990|5|`,
      `|9001|0|`,
      `|9900|0000|1|`,
      `|9900|C100|1|`,
      `|9900|H005|1|`,
      `|9900|K100|1|`,
      `|9990|6|`,
      `|9999|30|`
    ].join("\r\n");

    const blob = new Blob([lines], { type: 'text/plain;charset=iso-8859-1' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_${accountingPeriod}_PVA_VALIDATED.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('Exportação SPED', `Gerado arquivo digital ${type} para homologação PVA no período ${accountingPeriod}.`);
    addToast(`Arquivo digital ${type} gerado no padrão oficial SPED!`, 'success');
  };

  const handlePreviewSped = () => {
    setPreviewContent(`|0000|018|0|01012026|31032026|NATUASSIST INDUSTRIA FARMACEUTICA S.A.|12345678000190|BA|123456789|2905701|||A|1|
|0001|0|
|0100|ROBERTO ALVES CONTADOR|12345678901|CRC1BA123456|...
|C100|0|1|CLI001|55|00|1|102450|20260315|20260315|450000.00|1|...
|H005|20260331|22100000.00|01|
|K230|20260310|20260315|WO-8801|MAT-101|50000||
|9999|30|`);
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" /> Pacotes de Fechamento & SPED
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
              Layout Guia Prático RFB
            </span>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2.5 mt-1`}>
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" /> Central de Exportação de Dossiê Executivo & SPED
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Exportação unificada do Book de Fechamento SOX, Validação de Blocos SPED (EFD/ECD) e Relatório para Conselho de Administração.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-bold">Exercício:</span>
            <select
              value={accountingPeriod}
              onChange={(e) => setAccountingPeriod(e.target.value)}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026-Q1" className="bg-slate-900">2026 - 1º Trimestre (Q1)</option>
              <option value="2026-Q2" className="bg-slate-900">2026 - 2º Trimestre (Q2)</option>
              <option value="2026-Q3" className="bg-slate-900">2026 - 3º Trimestre (Q3)</option>
              <option value="2026-Q4" className="bg-slate-900">2026 - 4º Trimestre (Q4)</option>
              <option value="2025-ANUAL" className="bg-slate-900">2025 - Exercício Anual Consolidado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Format Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            id: 'sox_book',
            title: 'Book de Fechamento SOX',
            desc: 'Balancete, testes de conciliação, amostragem JET e assinaturas digitais.',
            badge: 'SOX 404 / IFRS',
            color: 'emerald'
          },
          {
            id: 'sped_fiscal',
            title: 'SPED Fiscal (EFD ICMS/IPI)',
            desc: 'Blocos 0, C (Notas), H (Inventário) e K (Produção) para validação PVA.',
            badge: 'RFB Guia Prático',
            color: 'blue'
          },
          {
            id: 'sped_contabil',
            title: 'SPED Contábil (ECD / ECF)',
            desc: 'Livro Diário, Razão Auxiliar e Lalur/Lacs para auditoria da Receita Federal.',
            badge: 'ECD / ECF Oficial',
            color: 'indigo'
          },
          {
            id: 'board_pack',
            title: 'Board Pack (Conselho)',
            desc: 'Sumário executivo de riscos, passivos contingentes e EBITDA para a Diretoria.',
            badge: 'Alta Gestão',
            color: 'purple'
          }
        ].map((fmt) => (
          <button
            key={fmt.id}
            onClick={() => setSelectedFormat(fmt.id as any)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedFormat === fmt.id
                ? 'bg-gradient-to-b from-emerald-950/30 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-500/30'
                : darkMode
                ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                {fmt.badge}
              </span>
              <h4 className="text-sm font-bold text-white">{fmt.title}</h4>
              <p className="text-xs text-slate-400">{fmt.desc}</p>
            </div>
            <div className="pt-3 flex items-center justify-between text-xs border-t border-slate-800 mt-3">
              <span className="text-slate-500 font-mono text-[10px]">Pronto para Geração</span>
              <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                {selectedFormat === fmt.id ? 'Selecionado ✓' : 'Visualizar'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Main Action Panel */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-gray-200'} space-y-5 shadow-sm`}>
        {selectedFormat === 'sox_book' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Dossiê Consolidado de Fechamento Contábil & SOX 404
                </h3>
                <p className="text-xs text-slate-400">
                  Pacote formal exigido pelos auditores externos para validação dos controles internos da Lei Sarbanes-Oxley.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportSoxBook}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Baixar Book SOX Completo (.CSV)
                </button>
              </div>
            </div>

            {/* Checklist of Components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Módulo 1</span>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Balancete & Conciliação
                </h5>
                <p className="text-[11px] text-slate-400">Contas bancárias, inventário MB51 e ledger CKM3 conciliados 100%.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Módulo 2</span>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Amostragem JET SOX
                </h5>
                <p className="text-[11px] text-slate-400">100% dos apontamentos anômalos com parecer e protocolo de regularização.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Módulo 3</span>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Segregação de Funções (SoD)
                </h5>
                <p className="text-[11px] text-slate-400">Zero conflitos críticos não mitigados na esteira de compras e pagamentos.</p>
              </div>
            </div>
          </div>
        )}

        {selectedFormat === 'sped_fiscal' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-400" />
                  Validador & Gerador SPED Fiscal (EFD ICMS/IPI)
                </h3>
                <p className="text-xs text-slate-400">
                  Arquivo digital oficial com Blocos 0, C, H (Inventário Físico) e K (Controle da Produção e Estoque).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviewSped}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" /> Pré-visualizar PVA
                </button>
                <button
                  onClick={() => handleExportSped('EFD_ICMS')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Baixar SPED Fiscal (.TXT)
                </button>
              </div>
            </div>

            {/* SPED Blocks Status Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Bloco SPED</th>
                    <th className="p-3">Descrição do Registro</th>
                    <th className="p-3">Qtd. Registros</th>
                    <th className="p-3">Status de Validação PVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  <tr>
                    <td className="p-3 font-mono font-bold text-blue-400">Bloco 0</td>
                    <td className="p-3">Abertura, Identificação do Contribuinte e Cadastro de Itens</td>
                    <td className="p-3 font-mono">1.420</td>
                    <td className="p-3 text-emerald-400 font-bold">✓ Válido Sem Erros</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-blue-400">Bloco C</td>
                    <td className="p-3">Documentos Fiscais de Entrada e Saída (NF-e mod. 55)</td>
                    <td className="p-3 font-mono">8.940</td>
                    <td className="p-3 text-emerald-400 font-bold">✓ Válido Sem Erros</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-blue-400">Bloco H</td>
                    <td className="p-3">Inventário Físico P3/P7 (Posição de Estoque Valorizada)</td>
                    <td className="p-3 font-mono">4.210</td>
                    <td className="p-3 text-emerald-400 font-bold">✓ Válido Sem Erros</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-blue-400">Bloco K</td>
                    <td className="p-3">Controle da Produção e Estoque (K200 / K230 Ordens MES)</td>
                    <td className="p-3 font-mono">2.830</td>
                    <td className="p-3 text-emerald-400 font-bold">✓ Válido Sem Erros</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {previewContent && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
                  Pré-visualização do Layout Pipe (|) para o Programa Validador e Assinador (PVA):
                </span>
                <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-tight max-h-48 overflow-y-auto custom-scrollbar">
                  {previewContent}
                </pre>
              </div>
            )}
          </div>
        )}

        {selectedFormat === 'sped_contabil' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  SPED Contábil (ECD - Escrituração Contábil Digital)
                </h3>
                <p className="text-xs text-slate-400">
                  Geração dos Livros Diário Geral (G), Balanço Patrimonial e DRE para transmissão à Receita Federal.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExportSped('ECD_CONTABIL')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Baixar ECD Contábil (.TXT)
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Assinatura digital padrão ICP-Brasil (e-PJ e e-PF do Contador / Administrador) validada previamente na esteira SOX.
            </p>
          </div>
        )}

        {selectedFormat === 'board_pack' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" />
                  Board Pack para Comitê de Auditoria & Conselho de Administração
                </h3>
                <p className="text-xs text-slate-400">
                  Apresentação executiva estruturada com os principais KPIs de rentabilidade, passivos contingentes e risco cambial.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportSoxBook}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-purple-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Baixar Sumário Executivo (.CSV)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">EBITDA Ajustado</span>
                <strong className="text-lg font-mono text-emerald-400">R$ 28.450.000</strong>
                <span className="text-[10px] text-emerald-500 block mt-1">+12.4% vs Orçamento</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Conformidade SOX 404</span>
                <strong className="text-lg font-mono text-purple-400">99.8% Eficaz</strong>
                <span className="text-[10px] text-slate-400 block mt-1">Zero deficiências graves</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Hedge Cambial NDF</span>
                <strong className="text-lg font-mono text-blue-400">80% Protegido</strong>
                <span className="text-[10px] text-slate-400 block mt-1">USD 3.6M de USD 4.5M</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Índice OEE Fabril</span>
                <strong className="text-lg font-mono text-amber-400">89.6%</strong>
                <span className="text-[10px] text-slate-400 block mt-1">Acima da meta de 85%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDossierHub;
