import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { photoUploadRules, validatePhotos } from "@/features/owner/services/ownerDashboard";
import { UploadPhoto } from "@/features/owner/types";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import { useRef, type ChangeEvent } from "react";

interface Props {
  photos: UploadPhoto[];
  onChange: (photos: UploadPhoto[]) => void;
  error: string | null;
  onError: (message: string | null) => void;
}

export const PhotoUploader = ({ photos, onChange, error, onError }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const createPhotoId = () => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }

    if (typeof globalThis.crypto?.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
      return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const onFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validationError = validatePhotos(selectedFiles, photos);
    if (validationError) {
      onError(validationError);
      return;
    }

    const appended = selectedFiles.map((file) => ({
      id: createPhotoId(),
      file,
      previewUrl: URL.createObjectURL(file),
      isCover: false,
    }));

    const next = [...photos, ...appended].map((photo, index) => ({ ...photo, isCover: index === 0 }));
    onError(null);
    onChange(next);
    event.target.value = "";
  };

  const removePhoto = (photoId: string) => {
    const next = photos.filter((photo) => photo.id !== photoId).map((photo, index) => ({ ...photo, isCover: index === 0 }));
    onChange(next);
  };

  const setAsCover = (photoId: string) => {
    onChange(photos.map((photo) => ({ ...photo, isCover: photo.id === photoId })));
  };

  const reorderPhoto = (photoId: string, direction: "up" | "down") => {
    const index = photos.findIndex((photo) => photo.id === photoId);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const next = [...photos];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next.map((photo, order) => ({ ...photo, isCover: order === 0 })));
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Photos de la maison</p>
          <p className="text-sm text-muted-foreground">
            {photos.length}/{photoUploadRules.maxPhotos} • Formats: JPG, JPEG, PNG, WEBP • Max {photoUploadRules.maxImageSizeMb}MB/image •
            {" "}
            {photoUploadRules.maxTotalUploadSizeMb}MB total
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={photos.length >= photoUploadRules.maxPhotos}>
          <ImagePlus className="w-4 h-4 mr-2" />
          Ajouter photos
        </Button>
      </div>

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={onFilesSelected} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <div key={photo.id} className="border rounded-lg p-2 space-y-2">
            <img src={photo.previewUrl} alt={`Prévisualisation ${index + 1}`} className="w-full h-40 object-cover rounded-md" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={photo.isCover ? "default" : "outline"} onClick={() => setAsCover(photo.id)}>
                <Star className="w-4 h-4 mr-1" />
                {photo.isCover ? "Couverture" : "Définir couverture"}
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={() => reorderPhoto(photo.id, "up")} disabled={index === 0}>
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => reorderPhoto(photo.id, "down")}
                disabled={index === photos.length - 1}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button type="button" size="icon" variant="destructive" onClick={() => removePhoto(photo.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
