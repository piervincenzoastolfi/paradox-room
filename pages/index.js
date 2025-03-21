
import Head from 'next/head';
import dynamic from 'next/dynamic';

const ParadoxRoom = dynamic(() => import('../components/ParadoxRoom'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Paradox Room</title>
      </Head>
      <ParadoxRoom />
    </>
  );
}
