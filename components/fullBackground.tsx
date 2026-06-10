import { ReactNode } from 'react';
import '../styles/CustomStyle.css';

type FullBackgroundProps = {
  children?: ReactNode;
  background?: string; // Add background prop
};

export default function FullBackground({ children, background }: FullBackgroundProps) {
  return (
    <div
      className="full-background"
      style={background ? { backgroundImage: `url(${background})` } : {}}
    >
      {children}
    </div>
  );
}
