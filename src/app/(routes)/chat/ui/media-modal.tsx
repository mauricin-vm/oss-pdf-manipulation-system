'use client'

interface MediaModalProps {
  isOpen: boolean;
  type: string;
  url: string;
  onClose: () => void;
}

export function MediaModal({ isOpen, type, url, onClose }: MediaModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          className="absolute -top-10 right-0 text-white text-xl font-bold z-10"
          onClick={onClose}
        >
          ✕
        </button>

        {type === 'image' && (
          <img
            src={url}
            alt="Imagem ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {type === 'video' && (
          <video
            src={url}
            controls
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
            autoPlay
          />
        )}
      </div>
    </div>
  );
}