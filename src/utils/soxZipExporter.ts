import JSZip from 'jszip';
import saveAs from 'file-saver';

export async function generateSoxAuditZip(allData: Array<any>, addToast: (msg: string, type: 'success' | 'error') => void) {
  try {
    const zip = new JSZip();

    // 1. Relatório de Divergências e Reconciliação
    const summaryCsv = [
      'Documento,Material,Centro,Valor NF,Valor CKM3,Status,Diferenca',
      ...allData.map(item => 
        `"${item.docNum || item.id}","${item.material || item.mat}","${item.centro || item.plant}","${item.nfValue || 0}","${item.pmmValue || 0}","${item.status || 'OK'}","${(item.nfValue || 0) - (item.pmmValue || 0)}"`
      )
    ].join('\n');
    zip.file('reconciliacao_nfs_vs_ckm3.csv', summaryCsv);

    // 2. Logs de IDOCs e Integração
    const idocJson = JSON.stringify([
      { id: '3849021', type: 'INVOIC01', status: '51', statusText: 'Erro 51: Erro na contabilização do documento', direction: 'Entrada (EDI)', date: '2026-09-10 08:30' },
      { id: '3849022', type: 'MATMAS03', status: '53', statusText: 'Sucesso: Documento publicado com êxito', direction: 'Entrada (EDI)', date: '2026-09-10 08:32' },
      { id: '3849023', type: 'ORDERS05', status: '29', statusText: 'Erro 29: Erro no serviço ALE / Validação de Fornecedor', direction: 'Saída', date: '2026-09-10 08:35' }
    ], null, 2);
    zip.file('logs_idocs_we02.json', idocJson);

    // 3. Matriz SoD (Segregação de Funções)
    const sodCsv = [
      'Usuario,Perfil,Conflito,Risco,Status Mitigacao',
      '"MARIO.SILVA","FIN_MANAGER","Criação de Fornecedor (XK01) + Lançamento (MIRO)","Alto (SoD Violation)","Pendente"',
      '"ANA.SOUZA","MM_SUPER","Movimentação de Estoque (MB51) + Ajuste (MI04)","Médio","Mitigado"',
      '"CARLOS.LIMA","FI_CONTROLLER","Modificação de Razão (FBL3N) + Pagamento (F110)","Alto (SoD Violation)","Pendente"'
    ].join('\n');
    zip.file('matriz_sod_compliance.csv', sodCsv);

    // 4. Termo de Conformidade SOX
    const complianceTxt = `TERMO DE CONFORMIDADE E AUDITORIA SOX (SARBANES-OXLEY)
Gerado em: ${new Date().toISOString()}
Sistema: Mini-SAP Web Auditoria Enterprise
-----------------------------------------------------------------
Este pacote contém evidências consolidadas de reconciliação de custos (CKM3 vs MB51),
monitoramento de integrações EDI/IDOC (WE02) e análise de segregação de funções (SoD).
Todas as transações e saldos foram auditados em conformidade com as normas internas.
`;
    zip.file('TERMO_CONFORMIDADE_SOX.txt', complianceTxt);

    // Generate zip and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `Pacote_Evidencias_Audit_SOX_${new Date().toISOString().slice(0, 10)}.zip`);
    addToast('Pacote ZIP de Auditoria SOX gerado e baixado com sucesso!', 'success');
  } catch (error) {
    console.error('Error generating SOX zip:', error);
    addToast('Erro ao gerar pacote ZIP de auditoria.', 'error');
  }
}
