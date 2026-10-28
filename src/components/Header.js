import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => (
  <header className="site-header">
    <Link to="/" className="brand">
      <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Fortis Wallet" className="brand-logo" />
      <span className="brand-name">Fortis Wallet</span>
    </Link>
  </header>
);

export default Header;