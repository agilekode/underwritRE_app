import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

interface BackButtonProps {
  to: string;
}

const BackButton: React.FC<BackButtonProps> = ({ to }) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outlined"
      onClick={() => navigate(to)}
      sx={{ mb: 2, fontWeight: 700, borderRadius: 2 }}
    >
      Back
    </Button>
  );
};

export default BackButton; 