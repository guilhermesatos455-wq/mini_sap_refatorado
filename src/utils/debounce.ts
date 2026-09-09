// Utility function for Debounce implementation
export function debounce<T extends (...args: any[]) => any>(
  funcaoOriginal: T,
  tempoDeEspera: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;

  return function (this: any, ...argumentos: Parameters<T>) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      funcaoOriginal.apply(this, argumentos);
    }, tempoDeEspera);
  };
}
