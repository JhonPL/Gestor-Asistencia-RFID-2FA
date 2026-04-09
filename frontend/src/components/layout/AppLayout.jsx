import styled from 'styled-components';
import theme from '../../styles/theme';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * AppLayout — estructura de páginas autenticadas.
 * Sin sidebar: el contenido ocupa todo el ancho con max-width controlado.
 * SRP: gestiona únicamente la disposición del layout autenticado.
 *
 * @param {React.ReactNode} children
 * @param {object}  user    - { nombre, apellido, iniciales }
 * @param {Function} onLogout
 */

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${theme.colors.surface};
`;

const PageContent = styled.main`
  /* Compensa la navbar fija de 4rem */
  padding-top: 5rem;
  padding-bottom: 3rem;
  padding-left: 2rem;
  padding-right: 2rem;
  flex: 1;

  @media (min-width: ${theme.breakpoints.md}) {
    padding-left: 3rem;
    padding-right: 3rem;
  }

  @media (min-width: ${theme.breakpoints.xl}) {
    padding-left: 4rem;
    padding-right: 4rem;
  }
`;

const Inner = styled.div`
  max-width: 80rem;
  margin: 0 auto;
`;

const AppLayout = ({ children, user, onLogout }) => (
  <Wrapper>
    <Navbar user={user} onLogout={onLogout} authenticated />
    <PageContent>
      <Inner>{children}</Inner>
    </PageContent>
    <Footer />
  </Wrapper>
);

export default AppLayout;