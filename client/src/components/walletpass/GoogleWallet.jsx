import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ButtonRound } from '../button/ButtonRound/ButtonRound';
import { useEffect } from 'react';

const GoogleWallet = ({ userId }) => {
  const handleAddToWallet = async () => {
    const res = await fetch('http://localhost:8081/wallet/create-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id: userId }),
    });

    const data = await res.json();
    if (data.url) {
      window.open(data.url, '_blank');
    } else {
      alert('Failed to generate pass');
    }
  };

  return (
    <div className="tabs">
      <ButtonRound label="Add to Google Wallet" onClick={handleAddToWallet} />
    </div>
  );
};

GoogleWallet.propTypes = {
  userId: PropTypes.string.isRequired,
};

GoogleWallet.defaultProps = {
  userId: '',
};

export { GoogleWallet };
