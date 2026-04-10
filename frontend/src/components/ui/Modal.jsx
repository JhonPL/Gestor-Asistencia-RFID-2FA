import { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import theme from '../../styles/theme';
import Icon from './Icon';

/**
 * Modal — componente base reutilizable.
 * Cierra con Escape, click en overlay, o botón X.
 * SRP: solo gestiona overlay, animación y accesibilidad.
 *
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {string}   title
 * @param {string}   [size] - 'sm' | 'md' | 'lg'
 * @param {React.ReactNode} children
 */

const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}`;

const Overlay = styled.div`
  position:fixed;inset:0;z-index:100;
  background-color:rgba(0,0,0,.35);
  backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;
  padding:1rem;
  animation:${fadeIn} .2s ease;
`;

const SIZES = { sm: '26rem', md: '34rem', lg: '44rem' };

const Container = styled.div`
  background-color:${theme.colors.surfaceContainerLowest};
  border-radius:${theme.radii['2xl']};
  box-shadow:0 24px 64px -12px rgba(26,35,126,.18);
  width:100%;max-width:${({ $size }) => SIZES[$size] ?? SIZES.md};
  max-height:90vh;overflow-y:auto;
  animation:${slideUp} .25s ease;
  border:1px solid ${theme.colors.outlineVariant}26;
`;

const Header = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:1.5rem 1.75rem 1.25rem;
  border-bottom:1px solid ${theme.colors.outlineVariant}26;
`;

const Title = styled.h2`
  font-family:${theme.fonts.headline};font-size:${theme.fontSizes.xl};
  font-weight:${theme.fontWeights.bold};color:${theme.colors.primary};
  letter-spacing:-.015em;
`;

const CloseBtn = styled.button`
  width:2rem;height:2rem;border-radius:${theme.radii.full};
  display:flex;align-items:center;justify-content:center;
  color:${theme.colors.onSurfaceVariant};
  transition:all ${theme.transitions.fast};
  &:hover{background-color:${theme.colors.surfaceContainerHigh};color:${theme.colors.onSurface}}
`;

const Body = styled.div`padding:1.75rem;`;

const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Overlay onClick={e => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label={title}>
      <Container $size={size}>
        <Header>
          <Title>{title}</Title>
          <CloseBtn onClick={onClose} aria-label="Cerrar modal">
            <Icon name="close" size="sm" />
          </CloseBtn>
        </Header>
        <Body>{children}</Body>
      </Container>
    </Overlay>
  );
};

export default Modal;