import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarUploaderProps {
  onFileSelect: (file: File) => void;
  currentAvatarUrl?: string;
  defaultFallback?: string;
  disableUpload?: boolean;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ 
  onFileSelect, 
  currentAvatarUrl,
  defaultFallback = "US",
  disableUpload = false
}) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load the tiny_face_detector model weights from /models directory
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Error loading face detection model:', error);
        toast({
          variant: 'destructive',
          title: 'System Error',
          description: 'Failed to load face detection AI.'
        });
      }
    };
    loadModels();
  }, [toast]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isModelLoaded) {
      toast({
        variant: 'destructive',
        title: 'Not Ready',
        description: 'AI model is loading, please try again in a moment.'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        
        const img = new Image();
        img.src = dataUrl;
        img.onload = async () => {
          try {
            // Validate the presence of a face
            const detections = await faceapi.detectAllFaces(
              img, 
              new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.85 })
            );

            if (detections.length === 0) {
              toast({
                variant: 'destructive',
                title: 'Invalid image',
                description: 'Please select an image containing a human face.'
              });
              // Reset input
              if (fileInputRef.current) fileInputRef.current.value = '';
              setPreviewUrl(currentAvatarUrl || null);
            } else {
              setPreviewUrl(dataUrl);
              onFileSelect(file);
              toast({
                title: 'Valid image',
                description: 'Face detected successfully.',
                className: 'bg-green-600 text-white'
              });
            }
          } catch (detectionError) {
             console.error('Detection error:', detectionError);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not analyze the image.' });
          } finally {
             setIsProcessing(false);
          }
        };
        img.onerror = () => {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not read the image.' });
          setIsProcessing(false);
        };
      };
      reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'An error occurred while reading the file.' });
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred during image processing.'
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="w-24 h-24">
        <AvatarImage src={previewUrl || undefined} alt="Avatar Preview" className="object-cover" />
        <AvatarFallback>{defaultFallback}</AvatarFallback>
      </Avatar>
      
      {!disableUpload ? (
        <div className="flex flex-col items-center gap-2">
          <Input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isProcessing || !isModelLoaded}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || !isModelLoaded}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
               <>
                <Upload className="mr-2 h-4 w-4" />
                Choose New Image
              </>
            )}
          </Button>
          {!isModelLoaded && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Loading AI analyzer...
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center mt-2 max-w-[200px]">
          Fixed avatar. (Contact Admin to reset)
        </p>
      )}
    </div>
  );
};
