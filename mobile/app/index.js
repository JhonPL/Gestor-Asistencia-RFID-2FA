import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getToken } from '../src/storage/auth';

export default function Index() {
  const [destino, setDestino] = useState(null);

  useEffect(() => {
    async function checkSession() {
      const token = await getToken();
      setDestino(token ? '/screens/home' : '/screens/login');
    }
    checkSession();
  }, []);

  // Mientras verifica, no renderiza nada
  if (!destino) return null;

  return <Redirect href={destino} />;
}