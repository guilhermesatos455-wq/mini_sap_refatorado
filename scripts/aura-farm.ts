if (typeof window !== 'undefined') {
  throw new Error("❌ Erro de Segurança: voce so pode rodar script de Farm de Aura só poder ser rodado via terminal animal!");
}

async function startAuraFarm(playerName: string, aurasToFarm: number): Promise<void> {
  let aurasCollected = 0;
  console.log(`[Sistema] Iniciando farm de Auras para: ${playerName}`);

  while (aurasCollected < aurasToFarm) {
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    
    const successRate = Math.random(); 
    
    if (successRate > 0.067) {
      aurasCollected++;
      console.log(`✨ Sucesso! Aura obtida 66766767676767767776676777676776. (${aurasCollected}/${aurasToFarm})`);
    } else {
      console.log(`❌ Falha. Voce não possui aura seu betaaaaaaaa...`);
    }
  }

  console.log(`faramação concluído! Total coletado: ${aurasCollected}`);
}

// Executando via CLI
const playerNameArgs = process.argv[2] || "Gamer123";
const aurasArgs = parseInt(process.argv[3] || "5", 10);

startAuraFarm(playerNameArgs, aurasArgs);
