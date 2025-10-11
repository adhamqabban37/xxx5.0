'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, Loader2 } from 'lucide-react';

interface AddCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (company: any) => void;
}

export function AddCompanyDialog({ isOpen, onClose, onCompanyCreated }: AddCompanyDialogProps) {
  const [formData, setFormData] = useState({
    url: '',
    companyName: '',
    competitors: [] as string[],
    fullScan: true,
  });
  const [newCompetitor, setNewCompetitor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(`Company with domain already exists. Company ID: ${data.companyId}`);
        } else if (response.status === 403 && data.upgradeRequired) {
          setError('Premium subscription required to add companies.');
        } else {
          setError(data.error || 'Failed to create company');
        }
        return;
      }

      onCompanyCreated(data.company);

      // Reset form
      setFormData({
        url: '',
        companyName: '',
        competitors: [],
        fullScan: true,
      });
      setNewCompetitor('');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !formData.competitors.includes(newCompetitor.trim())) {
      setFormData({
        ...formData,
        competitors: [...formData.competitors, newCompetitor.trim()],
      });
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setFormData({
      ...formData,
      competitors: formData.competitors.filter((c) => c !== competitor),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      addCompetitor();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Company for AEO Analysis</DialogTitle>
          <DialogDescription>
            Start tracking your company's AI visibility and get actionable insights.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="url">Company Website URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">The main website URL for your company</p>
          </div>

          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              placeholder="Acme Marketing Agency"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Competitors (Optional)</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Add competitor name"
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompetitor}
                disabled={!newCompetitor.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.competitors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.competitors.map((competitor) => (
                  <Badge
                    key={competitor}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{competitor}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeCompetitor(competitor)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Add up to 5 competitors for benchmarking analysis
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="fullScan"
              type="checkbox"
              checked={formData.fullScan}
              onChange={(e) => setFormData({ ...formData, fullScan: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="fullScan" className="text-sm">
              Run full AI visibility scan (recommended)
            </Label>
          </div>

          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.url || !formData.companyName}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating...' : 'Start Analysis'}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Content analysis and schema detection</li>
            <li>• Citation extraction from AI engines</li>
            <li>• Domain authority scoring (OPR API)</li>
            <li>• Lighthouse technical audit</li>
            <li>• Competitor benchmarking</li>
            <li>• AI-generated recommendations</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            Initial analysis takes 2-5 minutes. Dashboard updates in real-time.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
