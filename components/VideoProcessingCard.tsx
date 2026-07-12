// components/VideoProcessingCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Clock } from "lucide-react";

type VideoProcessingCardProps = {
  startedAt?: string | null;
  onRetry?: () => void;
  className?: string;
};

export function VideoProcessingCard({ startedAt, onRetry, className }: VideoProcessingCardProps) {
  const startedLabel = startedAt
    ? new Date(startedAt).toLocaleString()
    : null;

  return (
    <Card className={`border-dashed ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <CardTitle className="text-base">Processing your video…</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Your elevator pitch is being encoded and will be available shortly.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4" />
          {startedLabel ? <>Started at {startedLabel}</> : <>Encoding in progress</>}
        </div>

        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Check again
        </Button>
      </CardContent>
    </Card>
  );
}
