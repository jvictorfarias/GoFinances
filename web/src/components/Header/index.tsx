import React from 'react';

import { Link } from 'react-router-dom';

import { Container, LinkText } from './styles';

import Logo from '../../assets/logo.svg';

interface HeaderProps {
  size?: 'small' | 'large';
  focus: 'Dashboard' | 'Import' | 'Create';
}

const Header: React.FC<HeaderProps> = ({
  size = 'large',
  focus = 'Dashboard',
}: HeaderProps) => {
  return (
    <Container size={size}>
      <header>
        <img src={Logo} alt="GoFinances" />
        <nav>
          <Link to="/">
            <LinkText isFocused={focus === 'Dashboard'}>Listagem</LinkText>
          </Link>
          <Link to="/import">
            <LinkText isFocused={focus === 'Import'}>Importar</LinkText>
          </Link>
        </nav>
      </header>
    </Container>
  );
};

export default Header;
