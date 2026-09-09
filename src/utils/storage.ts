export const getStorageData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`@toximanager_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Erro ao ler o localStorage para a chave ${key}:`, error);
    return [];
  }
};

export const setStorageData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(`@toximanager_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar no localStorage para a chave ${key}:`, error);
  }
};