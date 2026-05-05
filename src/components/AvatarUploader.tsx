import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import Webcam from 'react-webcam';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Camera, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AvatarUploaderProps {
  onFileSelect: (file: File, faceDescriptor?: string) => void;
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
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [alignmentStatus, setAlignmentStatus] = useState<'none' | 'misaligned' | 'aligned'>('none');

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    let interval: any;
    if (mode === 'camera' && isModelLoaded) {
      interval = setInterval(async () => {
        if (!webcamRef.current) return;
        const video = webcamRef.current.video;
        if (!video || video.readyState !== 4) return;

        try {
          // detect face in realtime using SSD Mobilenet and Landmarks
          const detections = await faceapi
               .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
               .withFaceLandmarks();
          
          if (detections.length !== 1) {
            setAlignmentStatus('misaligned');
            return;
          }

          const box = detections[0].detection.box;
          const imgCenterX = video.videoWidth / 2;
          const imgCenterY = video.videoHeight / 2;
          const faceCenterX = box.x + box.width / 2;
          const faceCenterY = box.y + box.height / 2;

          const minDim = Math.min(video.videoWidth, video.videoHeight);
          const maxDist = minDim * 0.25; 
          
          const faceScale = box.height / minDim;
          const aspectRatio = box.height / box.width;
          
          // Real-time Troll check
          const positions = detections[0].landmarks.positions;
          const leftEyeY = (positions[36].y + positions[39].y) / 2;
          const rightEyeY = (positions[42].y + positions[45].y) / 2;
          const leftEyeX = (positions[36].x + positions[39].x) / 2;
          const rightEyeX = (positions[42].x + positions[45].x) / 2;
          const eyeSlope = Math.abs((rightEyeY - leftEyeY) / (rightEyeX - leftEyeX));

          const noseX = positions[30].x;
          const leftJawX = positions[0].x;
          const rightJawX = positions[16].x;
          const leftSideDist = Math.abs(noseX - leftJawX);
          const rightSideDist = Math.abs(rightJawX - noseX);
          const yawRatio = leftSideDist / (rightSideDist || 1);

          const mouthWidth = Math.abs(positions[54].x - positions[48].x);
          const mouthHeight = Math.abs(positions[66].y - positions[62].y);
          const mouthOpenRatio = mouthHeight / (mouthWidth || 1);

          if (
              Math.abs(imgCenterX - faceCenterX) > maxDist || 
              Math.abs(imgCenterY - faceCenterY) > maxDist || 
              faceScale < 0.45 || // Require close up to fill the circle
              faceScale > 0.85 ||
              detections[0].detection.score < 0.65 ||
              aspectRatio < 0.9 ||
              eyeSlope > 0.25 || 
              yawRatio < 0.5 || yawRatio > 2.0 || 
              mouthOpenRatio > 0.15 
          ) {
            setAlignmentStatus('misaligned');
          } else {
            setAlignmentStatus('aligned');
          }
        } catch (e) {
          console.error(e);
        }
      }, 500); 
    } else {
      setAlignmentStatus('none');
    }
    return () => clearInterval(interval);
  }, [mode, isModelLoaded]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Error loading face detection models:', error);
        toast({
          variant: 'destructive',
          title: 'System Error',
          description: 'Failed to load face detection AI.'
        });
      }
    };
    loadModels();
  }, [toast]);

  const processImage = async (img: HTMLImageElement, file: File) => {
    try {
      // detectAllFaces using SSD Mobilenet v1 for enterprise strictness
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid image',
          description: 'Please provide a clear image containing a human face.'
        });
        resetPreview();
      } else if (detections.length > 1) {
        toast({
          variant: 'destructive',
          title: 'Too many faces',
          description: 'Multiple faces detected. Please ensure only your face is visible (no background interference).'
        });
        resetPreview();
      } else {
        const box = detections[0].detection.box;
        const aspectRatio = box.height / box.width;

        // Ensure it's not overly obscured. Aspect ratio is relaxed to avoid confusion with FaceAPI rounded corners
        if (detections[0].detection.score < 0.80 || aspectRatio < 0.9) {
           toast({
             variant: 'destructive',
             title: 'Invalid face',
             description: 'Face is obscured (by phone, surface), or not clear enough. Please look straight and ensure good lighting.'
           });
           resetPreview();
           return;
        }

        // --- BEHAVIOR ANALYSIS (BIOMETRIC POSE CHECK) ---
        // Use 68 landmarks to evaluate head tilt and rotation
        const positions = detections[0].landmarks.positions;
        
        // 1. Tilt angle (Roll) - Check if 2 eyes are level
        const leftEyeY = (positions[36].y + positions[39].y) / 2;
        const rightEyeY = (positions[42].y + positions[45].y) / 2;
        const leftEyeX = (positions[36].x + positions[39].x) / 2;
        const rightEyeX = (positions[42].x + positions[45].x) / 2;
        const eyeSlope = Math.abs((rightEyeY - leftEyeY) / (rightEyeX - leftEyeX));

        // 2. Horizontal rotation angle (Yaw) - Compare distance from nose to both ears
        const noseX = positions[30].x;
        const leftJawX = positions[0].x;
        const rightJawX = positions[16].x;
        const leftSideDist = Math.abs(noseX - leftJawX);
        const rightSideDist = Math.abs(rightJawX - noseX);
        const yawRatio = leftSideDist / (rightSideDist || 1); // Tránh chia 0
        
        // 3. Biểu cảm (Troll check) - Kiểm tra độ mở của miệng (thè lưỡi, há to)
        // Lấy tọa độ mép trái (48), mép phải (54), môi trên trong (62), môi dưới trong (66)
        const mouthWidth = Math.abs(positions[54].x - positions[48].x);
        const mouthHeight = Math.abs(positions[66].y - positions[62].y);
        const mouthOpenRatio = mouthHeight / (mouthWidth || 1);

        // Nghiêng đầu > 15 độ, quay dọc 2 bên, HOẶC há miệng thè lưỡi (mouth ratio > 0.15)
        if (eyeSlope > 0.25 || yawRatio < 0.5 || yawRatio > 2.0 || mouthOpenRatio > 0.15) {
           toast({
             variant: 'destructive',
             title: 'Invalid pose or expression',
             description: 'Anti-fraud warning: You must not do strange actions (close eyes, open mouth, stick out tongue) or tilt head. Require a serious face.'
           });
           resetPreview();
           return;
        }

        
        // --- NẮN CHỈNH VỊ TRÍ KHUÔN MẶT --- 
        // Phải nằm ở tâm khung ảnh
        const imgCenterX = img.width / 2;
        const imgCenterY = img.height / 2;
        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;

        const minDim = Math.min(img.width, img.height);
        const maxDist = minDim * 0.25; 
        const faceScale = box.height / minDim;

        if (
             Math.abs(imgCenterX - faceCenterX) > maxDist || 
             Math.abs(imgCenterY - faceCenterY) > maxDist ||
             faceScale < 0.45 || // Zoom cực đại
             faceScale > 0.85
        ) {
            toast({
                variant: 'destructive',
                title: 'Out of format frame',
                description: 'Please bring the face to the center (in the middle of the green frame center) to capture.'
            });
            resetPreview();
            return;
        }

        const descriptorArray = Array.from(detections[0].descriptor);
        
        // --- ZERO-PADDING CROP ---
        const canvas = document.createElement('canvas');
        
        // Không sử dụng padding. Xén sát rạt vào khu vực có da mặt. Mọi vật thể bên dưới cằm sẽ bị biến mất hoàn toàn.
        const padding = box.width * 0.02; // Chỉ để lại 2% viền chống vỡ
        
        let cropX = Math.max(0, box.x - padding);
        let cropY = Math.max(0, box.y - padding * 1.0); 
        let cropWidth = Math.min(img.width - cropX, box.width + padding * 2);
        let cropHeight = Math.min(img.height - cropY, box.height + padding * 1.5);

        // Make it perfectly square exactly around the jaw
        const size = Math.max(cropWidth, cropHeight);
        cropX = Math.max(0, box.x + box.width / 2 - size / 2);
        cropY = Math.max(0, box.y + box.height / 2 - size / 2);
        const finalSize = Math.min(size, img.width - cropX, img.height - cropY);

        canvas.width = finalSize;
        canvas.height = finalSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, cropX, cropY, finalSize, finalSize, 0, 0, finalSize, finalSize);
        }

        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const croppedFile = new File([dataURItoBlob(croppedDataUrl)], file.name, { type: 'image/jpeg' });

        setPreviewUrl(croppedDataUrl);
        onFileSelect(croppedFile, JSON.stringify(descriptorArray));
        setMode('upload'); // Switch out of camera frame
        toast({
          title: 'Valid image',
          description: 'Face correctly identified.',
          className: 'bg-green-600 text-white border-none'
        });
      }
    } catch (detectionError) {
      console.error('Detection error:', detectionError);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not analyze the face.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPreview = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPreviewUrl(currentAvatarUrl || null);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isModelLoaded) {
      toast({ variant: 'destructive', title: 'Not Ready', description: 'AI model is loading...' });
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => processImage(img, file);
        img.onerror = () => {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not read the input image.' });
          setIsProcessing(false);
        };
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Processing error.' });
      setIsProcessing(false);
    }
  };

  // Convert Base64 to Blob
  const dataURItoBlob = useCallback((dataURI: string): Blob => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setIsProcessing(true);
        const file = new File([dataURItoBlob(imageSrc)], "captured-avatar.jpg", { type: "image/jpeg" });
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => processImage(img, file);
        img.onerror = () => {
          toast({ variant: "destructive", title: "Error", description: "Could not handle capture." });
          setIsProcessing(false);
        };
      }
    }
  }, [webcamRef, isModelLoaded]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <Dialog open={mode === 'camera'} onOpenChange={(open) => { if (!open && !isProcessing) setMode('upload'); }}>
        <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none p-0 flex justify-center [&>button]:hidden outline-none mt-[-10vh]">
          <div className="relative w-full max-w-[320px] aspect-square rounded-[32px] border-4 border-white overflow-hidden shadow-2xl bg-white mx-auto">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover transform scale-x-[-1]"
              videoConstraints={{ facingMode: "user" }}
            />

            {/* DYNAMIC DASHED OVAL & VIGNETTE MASK */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
               {/* Vignette ring */}
               <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(255,255,255,0.85) 68%)' }}></div>
               
               {/* SVG Dashed Frame */}
               <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full p-2 transform scale-[0.85]">
                  <ellipse
                    cx="100" cy="100"
                    rx="75" ry="98"
                    fill="none"
                    stroke={alignmentStatus === 'aligned' ? '#10b981' : alignmentStatus === 'misaligned' ? '#ef4444' : '#3b82f6'}
                    strokeWidth="3.5"
                    strokeDasharray="6 6"
                    className="transition-colors duration-300"
                  />
               </svg>
            </div>
            {isProcessing && (
              <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-neutral-800" />
                <span className="text-sm font-medium text-neutral-800">Analyzing...</span>
              </div>
            )}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-30 opacity-90 transition-opacity hover:opacity-100">
               <Button type="button" size="sm" variant="secondary" className="shadow-lg rounded-full" onClick={() => setMode('upload')} disabled={isProcessing}>
                 Cancel
               </Button>
               <Button 
                 type="button" 
                 size="sm" 
                 className="bg-blue-600 hover:bg-blue-700 shadow-lg rounded-full transition-all" 
                 onClick={capturePhoto} 
                 disabled={isProcessing || !isModelLoaded || alignmentStatus !== 'aligned'}
               >
                 <Camera className="w-4 h-4 mr-2" /> Capture
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {mode === 'upload' && (
        <>
          <Avatar className="w-24 h-24 shadow-sm border border-neutral-200">
            <AvatarImage src={previewUrl || undefined} alt="Avatar Preview" className="object-cover" />
            <AvatarFallback>{defaultFallback}</AvatarFallback>
          </Avatar>
          
          {!disableUpload && (
            <div className="flex flex-wrap items-center justify-center gap-2">
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
                className="h-9"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isProcessing ? "Analyzing AI..." : "Upload File"}
              </Button>

              <Button 
                type="button" 
                variant="outline"
                onClick={() => setMode('camera')}
                disabled={isProcessing || !isModelLoaded}
                className="h-9"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            </div>
          )}
        </>
      )}

      {(!isModelLoaded && !disableUpload) && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading AI engine...
        </p>
      )}
    </div>
  );
};
