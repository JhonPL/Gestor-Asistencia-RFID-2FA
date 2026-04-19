import { Redirect } from 'expo-router';

// Punto de entrada: siempre va al login
export default function Index() {
  return <Redirect href="/screens/login" />;
}