import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, Search, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { productsService } from '@/services/products.service';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Call the visual search API using the service
      const response = await productsService.visualSearch(selectedImage);
      const { products, metadata } = response;

      if (products && products.length > 0) {
        onClose();
        navigate('/customer/retail?visual_search=true', {
          state: {
            visualSearchData: products,
            isVisualSearch: true,
            isExactMatch: metadata?.isExactMatch || false
          }
        });
      } else {
        setError('Không tìm thấy sản phẩm nào tương ứng.');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi phân tích hình ảnh.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20"
          >
            {/* Header */}
            <div className="p-6 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Tìm kiếm bằng hình ảnh</h3>
                  <p className="text-sm text-gray-500">Chụp hoặc tải ảnh lên để tìm sản phẩm</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-8">
              {!selectedImage ? (
                <div
                  onClick={handleUploadClick}
                  className="aspect-square sm:aspect-[4/3] rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-200 transition-all group"
                >
                  <div className="w-16 h-16 rounded-3xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">Chọn ảnh</p>
                    <p className="text-xs text-gray-500 mt-1">Hỗ trợ JPG, PNG, WEBP</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative aspect-square sm:aspect-[4/3] rounded-[2rem] overflow-hidden group">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-4 right-4 h-9 px-3 rounded-full bg-white/90 backdrop-blur-md text-red-500 hover:bg-white transition-all shadow-lg"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Loại bỏ
                    </Button>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang phân tích...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Search className="w-5 h-5" />
                        Bắt đầu tìm kiếm
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Hints */}
            {!selectedImage && (
              <div className="px-8 pb-8 flex items-center justify-center gap-6">
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                    <Camera className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Camera</span>
                </button>
                <div className="w-px h-8 bg-gray-100" />
                <div className="text-[10px] text-gray-400 font-medium max-w-[150px] text-center uppercase tracking-tight">
                  Mẹo: Sử dụng ảnh rõ nét để có kết quả chính xác nhất
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
