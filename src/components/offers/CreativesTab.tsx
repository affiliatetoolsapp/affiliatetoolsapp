
import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileType, 
  File, 
  Image as ImageIcon, 
  X, 
  Loader2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface CreativesTabProps {
  offerId?: string;
  advertiserId: string;
  savedCreatives: any[];
  onCreativesChange: (creatives: any[]) => void;
}

const CreativesTab: React.FC<CreativesTabProps> = ({ 
  offerId, 
  advertiserId, 
  savedCreatives = [],
  onCreativesChange 
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [creatives, setCreatives] = useState<any[]>(savedCreatives);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const newCreatives = [...creatives];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        // Create proper folder structure: advertiserId/offerId/fileName
        const filePath = `${advertiserId}/${offerId || 'new'}/${fileName}`;
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('offer-assets')
          .upload(filePath, file);
        
        if (error) {
          console.error('Error uploading file:', error);
          toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message,
          });
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('offer-assets')
          .getPublicUrl(filePath);
        
        newCreatives.push({
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          url: publicUrl,
        });
      }
      
      setCreatives(newCreatives);
      onCreativesChange(newCreatives);
      
      toast({
        title: 'Files Uploaded',
        description: `Successfully uploaded ${files.length} file(s)`,
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error in upload process:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'An unexpected error occurred during upload',
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveCreative = async (index: number) => {
    try {
      const creative = creatives[index];
      
      // Delete from storage if it exists there
      if (creative.path) {
        const { error } = await supabase.storage
          .from('offer-assets')
          .remove([creative.path]);
        
        if (error) {
          console.error('Error removing file from storage:', error);
          toast({
            variant: 'destructive',
            title: 'Remove Failed',
            description: error.message,
          });
          return;
        }
      }
      
      const newCreatives = [...creatives];
      newCreatives.splice(index, 1);
      setCreatives(newCreatives);
      onCreativesChange(newCreatives);
      
      toast({
        title: 'File Removed',
        description: 'Creative asset removed successfully',
      });
    } catch (error) {
      console.error('Error removing creative:', error);
      toast({
        variant: 'destructive',
        title: 'Remove Error',
        description: 'An unexpected error occurred',
      });
    }
  };
  
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    } else if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') {
      return <FileType className="h-6 w-6 text-orange-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="creatives">Marketing Materials & Creatives</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Upload images, banners, and other marketing materials for affiliates
            </p>
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                id="creatives"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,application/zip,application/x-zip-compressed"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload Files
              </Button>
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, PNG, GIF, ZIP (max 10MB)
              </p>
            </div>
          </div>
          
          {creatives.length > 0 && (
            <div className="border rounded-md divide-y">
              {creatives.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {getFileTypeIcon(file.type)}
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {file.type.split('/')[1]?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCreative(index)}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {creatives.length === 0 && (
            <div className="border rounded-md p-6 text-center">
              <p className="text-muted-foreground">No creatives uploaded yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CreativesTab;
