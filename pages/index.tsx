import { useEffect } from 'react';

export default function IndexRedirect() {
  useEffect(() => {
    window.location.replace('/flappybots');
  }, []);
  return null;
}
