import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import theme from '../../styles/theme';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

/**
 * Navbar — igual que el original, solo se cambió:
 * - El link 'Dashboard' → 'Mis cursos' con path '/mis-cursos'
 * - Se eliminó el link 'Mis cursos' duplicado que apuntaba a '/cursos'
 * - goHome del docente apunta a '/mis-cursos'
 */

const Nav = styled.nav`
  position:fixed;top:0;width:100%;z-index:50;height:4rem;
  background-color:rgba(255,255,255,.85);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  box-shadow:0 1px 0 ${theme.colors.outlineVariant};
  display:flex;justify-content:space-between;align-items:center;padding:0 2rem;
`;
const LogoBtn = styled.button`
  font-family:${theme.fonts.headline};font-size:1.25rem;
  font-weight:${theme.fontWeights.bold};color:${theme.colors.primaryContainer};
  letter-spacing:-.03em;display:flex;align-items:center;gap:.5rem;
  .highlight{color:${theme.colors.secondary}}
  &:hover{opacity:.85}
  transition:opacity ${theme.transitions.fast};
`;
const LogoBadge = styled.div`
  width:2rem;height:2rem;background-color:${theme.colors.primary};
  border-radius:${theme.radii.md};display:flex;align-items:center;justify-content:center;
  color:white;font-size:.875rem;font-weight:800;font-family:${theme.fonts.body};
`;
const NavLinks = styled.div`
  display:none;gap:2rem;align-items:center;
  @media(min-width:${theme.breakpoints.md}){display:flex}
`;
const NavLink = styled.button`
  font-family:${theme.fonts.body};font-size:${theme.fontSizes.sm};
  font-weight:${theme.fontWeights.semibold};
  color:${({ $active }) => $active ? theme.colors.primaryContainer : theme.colors.onSurfaceVariant};
  border-bottom:2px solid ${({ $active }) => $active ? theme.colors.primaryContainer : 'transparent'};
  padding-bottom:2px;transition:all ${theme.transitions.fast};
  &:hover{color:${theme.colors.primaryContainer};border-bottom-color:${theme.colors.primaryContainer}}
`;
const Actions = styled.div`
  display:none;align-items:center;gap:.75rem;
  @media(min-width:${theme.breakpoints.md}){display:flex}
`;
const UserChip = styled.button`
  display:flex;align-items:center;gap:.625rem;
  padding:.375rem .875rem .375rem .5rem;
  background-color:${theme.colors.surfaceContainerLow};
  border-radius:${theme.radii.full};cursor:pointer;
  transition:background-color ${theme.transitions.fast};
  &:hover{background-color:${theme.colors.surfaceContainer}}
`;
const AvatarCircle = styled.div`
  width:2rem;height:2rem;border-radius:${theme.radii.full};
  background-color:${theme.colors.primaryFixedDim};color:${theme.colors.primary};
  display:flex;align-items:center;justify-content:center;
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.bold};
  font-family:${theme.fonts.body};flex-shrink:0;
`;
const UserName = styled.span`
  font-size:${theme.fontSizes.sm};font-weight:${theme.fontWeights.semibold};
  color:${theme.colors.onSurface};
`;
const LogoutBtn = styled.button`
  font-size:${theme.fontSizes.xs};font-weight:${theme.fontWeights.semibold};
  color:${theme.colors.onSurfaceVariant};padding:.375rem .625rem;
  border-radius:${theme.radii.md};transition:all ${theme.transitions.fast};
  &:hover{color:${theme.colors.error};background-color:${theme.colors.errorContainer}33}
`;
const MobileMenuBtn = styled.button`
  display:flex;align-items:center;color:${theme.colors.primaryContainer};
  @media(min-width:${theme.breakpoints.md}){display:none}
`;

const Navbar = ({ authenticated = false, user, onLogout, navLinks }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const goHome = () => navigate(authenticated
    ? (user?.rol === 'administrador' ? '/admin' : '/mis-cursos')
    : '/'
  );

  const defaultLinks = authenticated
    ? user?.rol === 'administrador'
      ? [{ label: 'Panel Admin', path: '/admin' }]
      : [{ label: 'Mis cursos', path: '/mis-cursos' }]
    : [
        { label: 'Inicio', path: '#inicio' },
        { label: 'Cómo funciona', path: '#como-funciona' },
      ];

  const links = navLinks ?? defaultLinks;

  return (
    <Nav role="navigation" aria-label="Navegación principal">
      <LogoBtn onClick={goHome} aria-label="Ir al inicio">
        <LogoBadge>SC</LogoBadge>
        Smart<span className="highlight">Class</span>
      </LogoBtn>

      <NavLinks>
        {links.map(({ label, path }) => (
          <NavLink
            key={label}
            $active={location.pathname === path}
            onClick={() => {
              if (path.startsWith('#')) {
                const elementId = path.slice(1);
                const element = document.getElementById(elementId);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              } else {
                navigate(path);
              }
            }}
          >
            {label}
          </NavLink>
        ))}
      </NavLinks>

      <Actions>
        {authenticated && user ? (
          <>
            <UserChip aria-label={`Usuario: ${user.nombre} ${user.apellido}`}>
              <AvatarCircle>{user.iniciales}</AvatarCircle>
              <UserName>{user.nombre} {user.apellido}</UserName>
            </UserChip>
            <LogoutBtn onClick={onLogout} title="Cerrar sesión">
              <Icon name="logout" size="sm" />
            </LogoutBtn>
          </>
        ) : (
          <Button variant="outlined" size="sm" onClick={() => navigate('/login')}>
            <Icon name="login" size="sm" />
            Iniciar sesión
          </Button>
        )}
      </Actions>

      <MobileMenuBtn onClick={() => setMenuOpen(v => !v)} aria-label="Abrir menú" aria-expanded={menuOpen}>
        <Icon name={menuOpen ? 'close' : 'menu'} size="md" />
      </MobileMenuBtn>
    </Nav>
  );
};

export default Navbar;