import dynamic from 'next/dynamic';

export default dynamic(() => import('../../components/runtime/FlappyBotsRuntime'), {
  ssr: false,
});
