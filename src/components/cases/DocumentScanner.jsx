import React, { useState, useRef, useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, RotateCcw, Check, X, ScanLine, Loader2, ZoomIn, FlipHorizontal } from "lucide-react";

export default function DocumentScanner({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | preview | captured
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // environment = back camera
  const [error, setError] = useState(null);

  const startCamera = useCallback(async (mode = facingMode) => {
    setError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPhase("preview");
    } catch (err) {
      setError("Camera access denied or unavailable. Please allow camera permissions and try again.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleOpen = () => {
    if (open && phase === "idle") {
      startCamera();
    }
  };

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    } else {
      stopCamera();
      setPhase("idle");
      setCapturedImage(null);
      setError(null);
    }
    return () => stopCamera();
  }, [open]);

  const flipCamera = () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    setPhase("captured");
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const confirmCapture = () => {
    if (!capturedImage) return;
    // Convert base64 to File object
    const byteString = atob(capturedImage.split(",")[1]);
    const mimeString = "image/jpeg";
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mimeString });
    const fileName = `scan_${Date.now()}.jpg`;
    const file = new File([blob], fileName, { type: mimeString });
    onCapture(file);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            Document Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black" style={{ minHeight: 320 }}>
          {/* Camera viewfinder */}
          {phase === "preview" && (
            <>
              <video
                ref={videoRef}
                className="w-full object-cover"
                style={{ maxHeight: 480 }}
                playsInline
                muted
              />
              {/* Document guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/60 rounded-lg"
                  style={{ width: "85%", height: "75%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }}
                >
                  {/* Corner marks */}
                  {["top-0 left-0 border-t-2 border-l-2 rounded-tl", "top-0 right-0 border-t-2 border-r-2 rounded-tr",
                    "bottom-0 left-0 border-b-2 border-l-2 rounded-bl", "bottom-0 right-0 border-b-2 border-r-2 rounded-br"].map((cls, i) => (
                    <div key={i} className={`absolute w-5 h-5 border-primary ${cls}`} />
                  ))}
                </div>
              </div>
              <p className="absolute bottom-16 w-full text-center text-white/80 text-xs">
                Align document within the frame
              </p>
            </>
          )}

          {/* Captured preview */}
          {phase === "captured" && capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full object-contain" style={{ maxHeight: 480 }} />
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <Camera className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="px-4 py-4 flex items-center justify-center gap-4 bg-background">
          {phase === "preview" && (
            <>
              <Button variant="outline" size="icon" onClick={flipCamera} className="rounded-full h-11 w-11">
                <FlipHorizontal className="w-5 h-5" />
              </Button>
              <Button
                onClick={capture}
                className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90 shadow-lg"
              >
                <Camera className="w-6 h-6" />
              </Button>
              <Button variant="outline" size="icon" onClick={onClose} className="rounded-full h-11 w-11">
                <X className="w-5 h-5" />
              </Button>
            </>
          )}

          {phase === "captured" && (
            <>
              <Button variant="outline" onClick={retake} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Retake
              </Button>
              <Button onClick={confirmCapture} className="gap-2">
                <Check className="w-4 h-4" /> Use This Scan
              </Button>
            </>
          )}

          {phase === "idle" && !error && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Starting camera...
            </div>
          )}

          {error && (
            <Button variant="outline" onClick={onClose}>Close</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}