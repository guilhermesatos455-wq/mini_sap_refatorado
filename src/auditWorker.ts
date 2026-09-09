// Web Worker for 5 Million Rows Massive Audit & Reconciliation
// Processes chunks in background thread to prevent UI freezing.

self.onmessage = async function (e) {
  const { type, payload } = e.data;

  if (type === 'GENERATE_OR_PROCESS_MASSIVE_DATA') {
    const { totalRows = 1000000, batchSize = 50000 } = payload || {};
    
    let processed = 0;
    const materials = ['MAT-10029', 'MAT-10030', 'MAT-10031', 'MAT-10032', 'MAT-10033'];
    
    while (processed < totalRows) {
      const currentBatch = [];
      const count = Math.min(batchSize, totalRows - processed);
      
      for (let i = 0; i < count; i++) {
        const matIdx = Math.floor(Math.random() * materials.length);
        const qty = Math.floor(Math.random() * 50000) + 100;
        const unitPrice = Number((Math.random() * 500 + 10).toFixed(2));
        const isDivergent = Math.random() < 0.05;
        const total = isDivergent ? qty * unitPrice * 1.05 : qty * unitPrice;
        
        currentBatch.push({
          datasetName: 'StressTest-5M-Worker',
          material: materials[matIdx],
          centro: '1001',
          quantidade: qty,
          valorTotal: Number(total.toFixed(2)),
          status: isDivergent ? 'DIVERGENTE' : 'CONFORME',
          dataMovimento: '2026-09-08'
        });
      }
      
      processed += count;
      
      // Send chunk back to main thread
      self.postMessage({
        type: 'BATCH_PROCESSED',
        payload: {
          batch: currentBatch,
          progress: Math.round((processed / totalRows) * 100),
          processedCount: processed
        }
      });
    }
    
    self.postMessage({
      type: 'PROCESSING_COMPLETE',
      payload: { totalProcessed: totalRows }
    });
  }
};
