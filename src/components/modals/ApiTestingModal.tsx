import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiTestingModal: React.FC<ApiTestingModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState('');
  const [formData, setFormData] = useState({
    url: '',
    method: 'GET',
    headers: '',
    body: ''
  });

  const handleTest = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults('{"status": "success", "data": {"message": "API test completed successfully"}}');
      toast({ title: 'API test completed' });
    } catch (error) {
      setTestResults('{"status": "error", "message": "API test failed"}');
      toast({ title: 'API test failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Testing
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">API URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com/test"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="headers">Headers (JSON)</Label>
            <Textarea
              id="headers"
              value={formData.headers}
              onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
              placeholder='{"Content-Type": "application/json"}'
              rows={3}
            />
          </div>
          {formData.method !== 'GET' && (
            <div className="space-y-2">
              <Label htmlFor="body">Request Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder='{"key": "value"}'
                rows={4}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Test Results</Label>
            <Textarea
              value={testResults}
              readOnly
              placeholder="Test results will appear here..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleTest} disabled={isLoading}>
            <Play className="h-4 w-4 mr-1" />
            {isLoading ? 'Testing...' : 'Test API'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};