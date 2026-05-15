import dynamic from 'next/dynamic';

export default dynamic(() => import('../../components/runtime/FlappyBotsTestMode'), {
  ssr: false,
});
