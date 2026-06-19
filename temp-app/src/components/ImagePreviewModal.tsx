"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface Props {
  src: string | null;
  onClose: () => void;
}

export function ImagePreviewModal({ src, onClose }: Props) {
  return (
    <Dialog open={!!src} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-full p-2 bg-black/90 border-0 flex items-center justify-center">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Preview"
            className="max-h-[85vh] max-w-full object-contain rounded"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
