import { useState } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

/**
 * Navbar fija con blur y logo SmartClass.
 * SRP: solo gestiona la barra de navegación y su menú móvil.
 *
 * @param {Array<{label: string, href: string}>} navLinks
 * @param {Function} onLogin - callback del botón de inicio de sesión
 */

/* ── Styled Components ── */

const Nav = styled.nav`
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 50;
  height: 4rem;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 0 ${theme.colors.outlineVariant};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
`;

const Logo = styled.div`
  font-family: ${theme.fonts.headline};
  font-size: 1.25rem;
  font-weight: ${theme.fontWeights.bold};
  color: ${theme.colors.primaryContainer};
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  span.highlight {
    color: ${theme.colors.secondary};
  }
`;

const LogoBadge = styled.div`
  width: 2rem;
  height: 2rem;
  background-color: ${theme.colors.primary};
  border-radius: ${theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
  font-weight: 800;
  font-family: ${theme.fonts.body};
`;

const NavLinks = styled.div`
  display: none;
  gap: 2rem;
  align-items: center;

  @media (min-width: ${theme.breakpoints.md}) {
    display: flex;
  }
`;

const NavLink = styled.a`
  font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.sm};
  font-weight: ${theme.fontWeights.semibold};
  color: ${({ $active }) => ($active ? theme.colors.primaryContainer : theme.colors.onSurfaceVariant)};
  border-bottom: 2px solid ${({ $active }) => ($active ? theme.colors.primaryContainer : 'transparent')};
  padding-bottom: 2px;
  transition: all ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.primaryContainer};
    border-bottom-color: ${theme.colors.primaryContainer};
  }
`;

const Actions = styled.div`
  display: none;
  align-items: center;
  gap: 0.75rem;

  @media (min-width: ${theme.breakpoints.md}) {
    display: flex;
  }
`;

const MobileMenuBtn = styled.button`
  display: flex;
  align-items: center;
  color: ${theme.colors.primaryContainer};

  @media (min-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

/* ── Component ── */

const DEFAULT_LINKS = [
  { label: 'Inicio', href: '#', active: true },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Acerca de', href: '#acerca' },
];

const Navbar = ({ navLinks = DEFAULT_LINKS, onLogin }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Nav role="navigation" aria-label="Navegación principal">
      {/* Logo */}
      <Logo>
        <LogoBadge>SC</LogoBadge>
        Smart<span className="highlight">Class</span>
      </Logo>

      {/* Links desktop */}
      <NavLinks>
        {navLinks.map(({ label, href, active }) => (
          <NavLink key={label} href={href} $active={active}>
            {label}
          </NavLink>
        ))}
      </NavLinks>

      {/* Botón de login desktop */}
      <Actions>
        <Button variant="outlined" size="sm" onClick={onLogin}>
          <Icon name="login" size="sm" />
          Iniciar sesión
        </Button>
      </Actions>

      {/* Menú móvil */}
      <MobileMenuBtn
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
      >
        <Icon name={menuOpen ? 'close' : 'menu'} size="md" />
      </MobileMenuBtn>
    </Nav>
  );
};

export default Navbar;