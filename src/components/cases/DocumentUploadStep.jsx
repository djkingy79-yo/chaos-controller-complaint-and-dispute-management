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
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 border-2 border-primary/30 rounded-2xl p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full" />
        <div>
          <h2 className="font-heading font-black text-3xl text-foreground mb-2">
            Upload Your Evidence
          </h2>
          <p className="text-lg text-muted-foreground font-bold">
            Upload all documents related to your dispute. AI will extract key information automatically.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative overflow-hidden border-3 border-dashed border-primary/40 rounded-2xl p-10 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <p className="text-xl font-black text-foreground mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-base text-muted-foreground font-bold">
            PDF, JPG, PNG, DOC, DOCX (max 25MB per file)
          </p>
          {uploading && (
            <div className="flex items-center justify-center gap-3 mt-6 text-base text-muted-foreground font-bold">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Uploading...
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-foreground">
            Uploaded Files <span className="text-primary">({uploadedFiles.length})</span>
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-4 p-5 bg-card border-2 border-border rounded-xl hover:border-primary/30 transition-all">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-foreground truncate">{file.file_name}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">Ready for AI extraction</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(idx)}
                  className="shrink-0 h-10 w-10 rounded-xl hover:bg-destructive/10"
                >
                  <X className="w-5 h-5 text-destructive" />
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
      <div className="flex gap-4 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="gap-2 h-14 px-8 text-lg font-black border-2">
            Back
          </Button>
        )}
        <Button 
          onClick={handleContinue} 
          disabled={uploadedFiles.length === 0 || uploading || detectingCategory}
          className="flex-1 gap-3 h-14 px-8 text-lg font-black bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/30 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : detectingCategory ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI Detecting...
            </>
          ) : (
            <>
              Continue
              <CheckCircle className="w-5 h-5" />
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