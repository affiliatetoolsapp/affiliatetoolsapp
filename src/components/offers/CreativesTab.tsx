
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { FileArchive, Image, File, Trash2, Download, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreativesTabProps {
  advertiserID: string;
  formData: any;
  setFormData: (data: any) => void;
  onPrevious: () => void;
  onNext: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

const CreativesTab: React.FC<CreativesTabProps> = ({
  advertiserID,
  formData,
  setFormData,
  onPrevious,
  onNext
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    formData.creatives ? [...formData.creatives] : []
  );
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    
    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isZip = file.type === 'application/zip' || 
                    file.type === 'application/x-zip-compressed' ||
                    file.name.endsWith('.zip');
        
        if (!isImage && !isZip) {
          toast({
            variant: "destructive",
            title: "Invalid file type",
            description: "Only images and ZIP files are allowed."
          });
          return null;
        }
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "File too large",
            description: "Maximum file size is 10MB."
          });
          return null;
        }
        
        // Create a unique file name to prevent collisions
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const filePath = `creatives/${advertiserID}/${fileName}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('offer-assets')
          .upload(filePath, file, {
            upsert: false,
            contentType: file.type
          });
          
        if (error) {
          console.error("Upload error:", error);
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: error.message || "Failed to upload file."
          });
          return null;
        }
        
        const { data: urlData } = supabase.storage
          .from('offer-assets')
          .getPublicUrl(filePath);
          
        return {
          id: data.path,
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl
        };
      });
      
      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(Boolean) as UploadedFile[];
      
      if (validResults.length) {
        const newFiles = [...uploadedFiles, ...validResults];
        setUploadedFiles(newFiles);
        setFormData({
          ...formData,
          creatives: newFiles
        });
        
        toast({
          title: "Files uploaded",
          description: `Successfully uploaded ${validResults.length} file(s).`
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "An unexpected error occurred."
      });
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be selected again if needed
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };
  
  const handleDeleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase.storage
        .from('offer-assets')
        .remove([fileId]);
        
      if (error) {
        console.error("Delete error:", error);
        toast({
          variant: "destructive",
          title: "Deletion failed",
          description: error.message || "Failed to delete file."
        });
        return;
      }
      
      const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
      setUploadedFiles(updatedFiles);
      setFormData({
        ...formData,
        creatives: updatedFiles
      });
      
      toast({
        title: "File deleted",
        description: "File was successfully deleted."
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message || "An unexpected error occurred."
      });
    }
  };
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (
      type === 'application/zip' || 
      type === 'application/x-zip-compressed'
    ) {
      return <FileArchive className="h-5 w-5 text-amber-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketing Creatives</CardTitle>
        <CardDescription>
          Upload images and asset packages for your affiliates to use in their promotions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid gap-3">
          <Label htmlFor="file-upload">Upload Materials</Label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <Input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.zip"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <Button
                  variant="ghost"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Click to upload files'}
                </Button>{' '}
                or drag and drop
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Supports images (PNG, JPG, GIF) and ZIP files (up to 10MB)
              </p>
            </div>
          </div>
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium mb-3">Uploaded Creatives</h3>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground mb-3">
                These files will be available for download to approved affiliates.
              </p>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-2 bg-background rounded border"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a 
                        href={file.url} 
                        download 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 hover:text-primary"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button 
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 hover:text-destructive"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3">
                <Badge variant="outline">
                  {uploadedFiles.length} file(s) uploaded
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Add More
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Next: Tracking
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreativesTab;
