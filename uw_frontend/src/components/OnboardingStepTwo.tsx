import React, { useState } from 'react';
import { Card, CardContent, Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, FormControlLabel, Checkbox } from '@mui/material';

type OnboardingData = {
  assetTypeFocus: string[];
  typicalDealSize: string;
  geographicFocus: string;
  referralSource: string;
  emailUpdates: boolean;
};

type OnboardingStepTwoProps = {
  onComplete: (data: Partial<OnboardingData>) => void;
  onSkip: () => void;
  initialData: OnboardingData;
  onBack?: () => void;
};

const assetTypes = ['Multifamily', 'Mixed-Use', 'Industrial', 'Retail', 'Office', 'Land', 'Other'];

export default function OnboardingStepTwo({ onComplete, onSkip, initialData, onBack }: OnboardingStepTwoProps) {
  const [assetTypeFocus, setAssetTypeFocus] = useState<string[]>(initialData.assetTypeFocus || []);
  const [typicalDealSize, setTypicalDealSize] = useState(initialData.typicalDealSize || '');
  const [geographicFocus, setGeographicFocus] = useState(initialData.geographicFocus || '');
  const [referralSource, setReferralSource] = useState(initialData.referralSource || '');
  const [emailUpdates, setEmailUpdates] = useState(initialData.emailUpdates || false);

  const toggleAssetType = (assetType: string) => {
    setAssetTypeFocus((prev) => (prev.includes(assetType) ? prev.filter((t) => t !== assetType) : [...prev, assetType]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ assetTypeFocus, typicalDealSize, geographicFocus, referralSource, emailUpdates });
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 700, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Step 2 of 2</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ height: 8, width: 64, backgroundColor: '#3b82f6', borderRadius: 1 }} />
              <Box sx={{ height: 8, width: 64, backgroundColor: '#3b82f6', borderRadius: 1 }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Help us help you</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            These details are optional, but they help us better understand our users and improve the product.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 500 }}>Asset Type Focus</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {assetTypes.map((assetType) => (
                  <Chip
                    key={assetType}
                    label={assetType}
                    onClick={() => toggleAssetType(assetType)}
                    sx={{
                      backgroundColor: assetTypeFocus.includes(assetType) ? '#3b82f6' : '#f3f4f6',
                      color: assetTypeFocus.includes(assetType) ? 'white' : '#6b7280',
                      '&:hover': { backgroundColor: assetTypeFocus.includes(assetType) ? '#2563eb' : '#e5e7eb' },
                      fontWeight: 500,
                      px: 2,
                      py: 1,
                    }}
                  />
                ))}
              </Box>
            </Box>

            <FormControl fullWidth>
              <InputLabel id="typical-deal-size-label">Typical Deal Size</InputLabel>
              <Select
                labelId="typical-deal-size-label"
                id="typicalDealSize"
                value={typicalDealSize}
                label="Typical Deal Size"
                onChange={(e) => setTypicalDealSize(e.target.value)}
              >
                <MenuItem value="<1M">&lt;$1M</MenuItem>
                <MenuItem value="1-10M">$1–10M</MenuItem>
                <MenuItem value="10-50M">$10–50M</MenuItem>
                <MenuItem value=">50M">&gt;$50M</MenuItem>
              </Select>
            </FormControl>

            <TextField
              id="geographicFocus"
              label="Geographic Focus"
              placeholder="e.g., California, Northeast, National"
              value={geographicFocus}
              onChange={(e) => setGeographicFocus(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="referral-source-label">How did you hear about us?</InputLabel>
              <Select
                labelId="referral-source-label"
                id="referralSource"
                value={referralSource}
                label="How did you hear about us?"
                onChange={(e) => setReferralSource(e.target.value)}
              >
                <MenuItem value="friend">Friend/Colleague</MenuItem>
                <MenuItem value="linkedin">LinkedIn</MenuItem>
                <MenuItem value="google">Google</MenuItem>
                <MenuItem value="reddit">Reddit</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Checkbox checked={emailUpdates} onChange={(e) => setEmailUpdates(e.target.checked)} color="primary" />}
              label="Keep me updated about new features and model types."
              sx={{ mt: 1 }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' }, textTransform: 'none', fontSize: '1rem', py: 1.5 }}
              >
                Finish Setup
              </Button>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button type="button" onClick={onSkip} sx={{ textTransform: 'none' }}>Skip</Button>
                <Button type="button" onClick={onBack || onSkip} sx={{ textTransform: 'none' }}>Back</Button>
              </Box>
            </Box>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}


