import styled from 'styled-components';
import theme from '../../styles/theme';

/**
 * Footer de la landing page.
 * SRP: muestra créditos y enlaces institucionales.
 *
 * @param {Array<{label: string, href: string}>} links
 */

const FooterWrapper = styled.footer`
  width: 100%;
  padding: 2rem 3rem;
  background-color: white;
  border-top: 1px solid ${theme.colors.outlineVariant};
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  @media (min-width: ${theme.breakpoints.md}) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const Copyright = styled.p`
  font-size: ${theme.fontSizes.xs};
  font-family: ${theme.fonts.label};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${theme.colors.outline};
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const FooterLink = styled.a`
  font-size: ${theme.fontSizes.xs};
  font-family: ${theme.fonts.label};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${theme.colors.outline};
  opacity: 0.8;
  transition: all ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.primaryContainer};
    opacity: 1;
  }
`;

const DEFAULT_LINKS = [
  { label: 'Privacidad Institucional', href: '#' },
  { label: 'Manual Docente', href: '#' },
  { label: 'Soporte Técnico', href: '#' },
];

const Footer = ({ links = DEFAULT_LINKS }) => (
  <FooterWrapper>
    <Copyright>
      © {new Date().getFullYear()} SmartClass RFID — Universidad Cooperativa de Colombia, Villavicencio
    </Copyright>
    <FooterLinks>
      {links.map(({ label, href }) => (
        <FooterLink key={label} href={href}>
          {label}
        </FooterLink>
      ))}
    </FooterLinks>
  </FooterWrapper>
);

export default Footer;