"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalysisProgressModalProps {
  open: boolean;
  analysisId: string | null;
  progressEndpoint: string; // Base URL for progress endpoint
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

interface ProgressData {
  current_step: string;
  step_number: number;
  total_steps: number;
  progress_percentage: number;
  status: string;
  message: string;
  timestamp: string;
}

export function AnalysisProgressModal({
  open,
  analysisId,
  progressEndpoint,
  onComplete,
  onError,
}: AnalysisProgressModalProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!open || !analysisId || isPolling) return;

    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    const pollProgress = async () => {
      try {
        const response = await fetch(`${progressEndpoint}/progress?analysis_id=${analysisId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch progress: ${response.status}`);
        }

        const data = await response.json();

        if (!isMounted) return;

        // Check if it's progress data or final result
        if (data.status === "in_progress" || data.current_step) {
          // It's progress data
          setProgress(data);
        } else if (data.status === "success" || data.results) {
          // It's the final result
          console.log("✓ Analysis completed");
          clearInterval(intervalId);
          setIsPolling(false);
          onComplete(data);
        } else if (data.status === "error" || data.errors?.length > 0) {
          // Error occurred
          clearInterval(intervalId);
          setIsPolling(false);
          onError(data.errors?.[0] || "Analysis failed");
        }
      } catch (error) {
        console.error("Error polling progress:", error);
        if (isMounted) {
          clearInterval(intervalId);
          setIsPolling(false);
          onError(error instanceof Error ? error.message : "Failed to fetch progress");
        }
      }
    };

    // Start polling
    setIsPolling(true);
    pollProgress(); // Initial call
    intervalId = setInterval(pollProgress, 25000); // Poll every 25 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [open, analysisId, progressEndpoint, onComplete, onError, isPolling]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] bg-black/95 backdrop-blur-sm border border-primary/30 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing Content
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {progress?.message || "Starting analysis..."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {progress && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Step {progress.step_number} of {progress.total_steps}
                  </span>
                  <span className="text-primary font-mono">
                    {progress.progress_percentage}%
                  </span>
                </div>
                <Progress value={progress.progress_percentage} className="h-2" />
              </div>

              <div className="bg-black/50 border border-input rounded-lg p-4">
                <p className="text-sm font-mono text-muted-foreground">
                  Current Step:
                </p>
                <p className="text-base font-mono text-foreground mt-1 capitalize">
                  {progress.current_step.replace(/_/g, " ")}
                </p>
              </div>
            </>
          )}

          {!progress && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            This may take several minutes. Please do not close this window.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

