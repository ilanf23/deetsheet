import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ImagePlus, Loader2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedImageBlob } from "@/lib/cropImage";

interface PostImageEditorDialogProps {
  open: boolean;
  imageSrc: string | null;
  onOpenChange: (open: boolean) => void;
  onApply: (file: File, previewUrl: string) => void;
  onReselect: () => void;
}

const POST_IMAGE_ASPECT = 4 / 3;
const POST_IMAGE_OUTPUT_SIZE = { width: 1200, height: 900 };

export default function PostImageEditorDialog({
  open,
  imageSrc,
  onOpenChange,
  onApply,
  onReselect,
}: PostImageEditorDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const livePreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  }, [imageSrc]);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  useEffect(() => {
    livePreviewUrlRef.current = livePreviewUrl;
  }, [livePreviewUrl]);

  useEffect(() => {
    return () => {
      if (livePreviewUrlRef.current) URL.revokeObjectURL(livePreviewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!imageSrc || !croppedAreaPixels) {
      setLivePreviewUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return null;
      });
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const blob = await getCroppedImageBlob(
          imageSrc,
          croppedAreaPixels,
          rotation,
          POST_IMAGE_OUTPUT_SIZE,
          "image/jpeg",
          0.9,
        );
        if (!active) return;
        const nextUrl = URL.createObjectURL(blob);
        setLivePreviewUrl((previousUrl) => {
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          return nextUrl;
        });
      } catch {
        // Keep the cropper usable if the preview render fails.
      }
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [croppedAreaPixels, imageSrc, rotation]);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);

    try {
      const blob = await getCroppedImageBlob(
        imageSrc,
        croppedAreaPixels,
        rotation,
        POST_IMAGE_OUTPUT_SIZE,
        "image/jpeg",
        0.9,
      );
      const file = new File([blob], `post-image-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const previewUrl = URL.createObjectURL(blob);
      onApply(file, previewUrl);
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Post Photo</DialogTitle>
          <DialogDescription>
            Crop, zoom, and rotate the photo before attaching it to the post.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={POST_IMAGE_ASPECT}
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={handleCropComplete}
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Slider
                  min={1}
                  max={3}
                  step={0.05}
                  value={[zoom]}
                  onValueChange={([value]) => setZoom(value)}
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[rotation]}
                  onValueChange={([value]) => setRotation(value)}
                />
                <RotateCw className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Post Preview</p>
            <div className="rounded-lg border bg-card p-3 shadow-sm">
              <div className="mb-3 h-4 w-24 rounded bg-muted" />
              <div className="mb-3 h-5 w-11/12 rounded bg-muted" />
              <div className="aspect-[4/3] overflow-hidden rounded-md border bg-muted">
                {livePreviewUrl && (
                  <img
                    src={livePreviewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onReselect} disabled={processing}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Choose Different Photo
          </Button>
          <Button type="button" onClick={handleApply} disabled={processing || !croppedAreaPixels}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Use Photo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
