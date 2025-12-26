import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

type UploadResult = {
  objectPath: string;
  metadata: {
    name: string;
    size: number;
    contentType: string;
  };
};

type UseUploadOptions = {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
};

type UseUploadReturn = {
  uploadFile: (file: File) => Promise<UploadResult | null>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
};

export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Request presigned URL
      const urlRes = await apiRequest("POST", "/api/uploads/request-url", {
        name: file.name,
        size: file.size,
        contentType: file.type,
      });
      const { uploadURL, objectPath } = await urlRes.json();

      setProgress(25);

      // Upload file to storage
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to storage");
      }

      setProgress(100);

      const result: UploadResult = {
        objectPath,
        metadata: {
          name: file.name,
          size: file.size,
          contentType: file.type,
        },
      };

      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error("Upload failed");
      setError(uploadError);
      options.onError?.(uploadError);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  return {
    uploadFile,
    isUploading,
    progress,
    error,
  };
}
