import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './PageHeader.css';

const PageHeader = ({ title }) => {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <button className="back-btn" onClick={() => navigate('/dashboard')} aria-label="Back">
        <FiArrowLeft />
      </button>
      <h2>{title}</h2>
    </header>
  );
};

export default PageHeader;