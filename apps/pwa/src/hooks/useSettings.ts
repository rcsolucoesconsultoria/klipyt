import { useEffect, useState } from 'react';
import { getSettings } from '../services/api';

interface Settings {
  fase_monetizacao_ativa: boolean;
  global_margin: number;
  tema_ativo: string;
}

const DEFAULT: Settings = {
  fase_monetizacao_ativa: false,
  global_margin: 0.4,
  tema_ativo: 'COPA',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    getSettings()
      .then((data) => setSettings({ ...DEFAULT, ...data }))
      .catch(() => {});
  }, []);

  return settings;
}
