import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, X, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DocumentUploadStep({ onContinue, onBack }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [detectingCategory, setDetectingCategory] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState(null);
  const fileInputRef = useRef(null);

  const detectCategoryFromDocuments = async (files) => {
    setDetectingCategory(true);
    try {
      const prompt = `Analyse these uploaded documents and determine the dispute category. Return ONLY one word from: banking, insurance, tenancy, telco, utilities, government, other.
      
      Look for keywords:
      - Banking: bank names (CBA, Westpac, NAB, ANZ), account numbers, transactions
      - Insurance: policy numbers, claims, insurers (NRMA, Allianz)
      - Tenancy: lease, rental, property manager, NCAT, bond
      - Telco: phone, mobile, Optus, Telstra, Vodafone, billing
      - Utilities: electricity, gas, energy, water, AGL, Origin
      - Government: Centrelink, Services Australia, ATO, tax, government department
      - Other: none of the above
      
      Return the category name only.`;
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: files.map(f => f.file_url),
      });
      
      const category = result.trim().toLowerCase();
      setDetectedCategory(category);
      return category;
    } catch (error) {
      console.error("Category detection failed:", error);
      setDetectingCategory(false);
      return null;
    }
  };

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
      // Auto-detect category from documents
      const category = await detectCategoryFromDocuments(uploadedFiles);
      setDetectingCategory(false);
      // Pass files and detected category to parent
      onContinue(uploadedFiles, category);
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

      {/* AI Category Detection Status */}
      {detectingCategory && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <p className="text-sm font-semibold text-primary">AI Detecting Your Dispute Category...</p>
          </div>
          <p className="text-xs text-muted-foreground">Analysing documents to auto-select the right category for you</p>
        </div>
      )}

      {detectedCategory && !detectingCategory && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm font-semibold text-green-500">Category Auto-Detected</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on your documents, this appears to be a <strong className="text-foreground capitalize">{detectedCategory}</strong> dispute
          </p>
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
          disabled={uploadedFiles.length === 0 || uploading || detectingCategory}
          className="flex-1 gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : detectingCategory ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting...
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
        <p className="text-[11px] text-muted-foreground mt-0.5">AI detects your dispute category automatically from uploaded documents</p>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Tip: Upload everything first. AI will detect the category and extract all details automatically.
      </p>
    </div>
  );
}