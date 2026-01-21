import React, { useState } from 'react';
import { Card, CardContent, Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export type OnboardingStepOneData = {
  jobRole: string;
  company: string;
  experienceLevel: string;
};

type Props = {
  initialData?: Partial<OnboardingStepOneData>;
  onNext: (data: OnboardingStepOneData) => void;
  onSkip: () => void;
};

const jobRoles = ['Analyst', 'Associate', 'Vice President', 'Principal', 'Owner/Operator', 'Lender', 'Broker', 'Student', 'Other'];
const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];

export default function OnboardingStepOne({ initialData, onNext, onSkip }: Props) {
  const [jobRole, setJobRole] = useState(initialData?.jobRole || '');
  const [company, setCompany] = useState(initialData?.company || '');
  const [experienceLevel, setExperienceLevel] = useState(initialData?.experienceLevel || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ jobRole, company, experienceLevel });
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 700, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Step 1 of 2</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ height: 8, width: 64, backgroundColor: '#3b82f6', borderRadius: 1 }} />
              <Box sx={{ height: 8, width: 64, backgroundColor: 'rgba(59,130,246,0.35)', borderRadius: 1 }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Tell us a bit about yourself</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            This helps us tailor your experience and get you modeling faster.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="job-role-label">Job Role</InputLabel>
              <Select
                labelId="job-role-label"
                id="jobRole"
                value={jobRole}
                label="Job Role"
                onChange={(e) => setJobRole(e.target.value)}
              >
                {jobRoles.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <TextField
                id="company"
                label="Company or Organization"
                placeholder="Optional"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                fullWidth
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Optional</Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel id="experience-level-label">Experience Level</InputLabel>
              <Select
                labelId="experience-level-label"
                id="experienceLevel"
                value={experienceLevel}
                label="Experience Level"
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                {experienceLevels.map((l) => (
                  <MenuItem key={l} value={l}>{l}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
              <Button type="submit" variant="contained" fullWidth sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' }, textTransform: 'none', fontSize: '1rem', py: 1.5 }}>
                Continue
              </Button>
              <Button type="button" onClick={onSkip} sx={{ textTransform: 'none', color: 'text.secondary', '&:hover': { color: 'text.primary', backgroundColor: 'transparent' } }}>
                Skip for now
              </Button>
            </Box>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}


