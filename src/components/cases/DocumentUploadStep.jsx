import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DocumentUploadStep({ onContinue, onBack }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    setUploading(true);
    const newFiles = [];

    for (const file of Array.from(files)) {
      try {
        const uploadRes = await base44.integrations.Core.UploadFile({ file });
        newFiles.push({
          file_url: uploadRes.file_url,
          file_name: file.name,
          file_type: "other",
        });
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setUploading(false);
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (uploadedFiles.length > 0) {
      // Pass files to parent - it will handle auto-generation
      onContinue(uploadedFiles);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-semibold text-lg text-foreground mb-2">
          Upload Your Evidence
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload all documents related to your dispute. AI will extract key information automatically.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-secondary/30"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium text-foreground mb-2">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, JPG, PNG, DOC, DOCX (max 25MB per file)
        </p>
        {uploading && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Uploaded Files ({uploadedFiles.length})</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">Ready for AI extraction</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(idx)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="gap-2">
            Back
          </Button>
        )}
        <Button 
          onClick={handleContinue} 
          disabled={uploadedFiles.length === 0 || uploading}
          className="flex-1 gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              Continue
              <CheckCircle className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
        <p className="text-xs text-primary font-semibold">⚡ Fast Track Enabled</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">AI will auto-generate your complaint letter after you provide case details</p>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tip: Upload everything first. AI will extract the details and prompt for any missing information.
      </p>
    </div>
  );
}