import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Eye, Share2, Bookmark } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: {
    id: string;
    title: string;
    content: string;
    type: string;
    size: string;
    lastModified: string;
    author: string;
  };
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Downloading document:', document?.title);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    console.log('Sharing document:', document?.title);
  };

  const handleBookmark = () => {
    console.log('Bookmarking document:', document?.title);
  };

  if (!document) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Document metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary">{document.type}</Badge>
            <span>{document.size}</span>
            <span>Modified: {document.lastModified}</span>
            <span>By: {document.author}</span>
          </div>

          <Separator />

          {/* Document content */}
          <ScrollArea className="h-[60vh] w-full border rounded-md p-4">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {document.content}
              </pre>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBookmark}>
              <Bookmark className="h-4 w-4 mr-1" />
              Bookmark
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleDownload} disabled={isLoading}>
              <Download className="h-4 w-4 mr-1" />
              {isLoading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};