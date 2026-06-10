// [Claude] Loading screen per spec: "Ajab Shahar Logo will animate during loading time"
// User requirement: full white background, logo centered, nothing else.
import Image from 'next/image';
import logo from '../public/logo.svg';

export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Image
        src={logo}
        alt="Ajab Shahar"
        width={120}
        height={120}
        priority
        style={{ opacity: 0.85 }}
      />
    </div>
  );
}
