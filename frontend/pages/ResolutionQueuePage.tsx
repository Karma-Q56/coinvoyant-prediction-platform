import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import backend from "~backend/client";
import type { PendingResolution } from "~backend/admin/get_pending_resolutions";
import type { ResolutionMetrics } from "~backend/admin/get_resolution_metrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

export default function ResolutionQueuePage() {
  const [pendingPredictions, setPendingPredictions] = useState<PendingResolution[]>([]);
  const [metrics, setMetrics] = useState<ResolutionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [queueData, metricsData] = await Promise.all([
        backend.admin.getPendingResolutions(),
        backend.admin.getResolutionMetrics(),
      ]);
      setPendingPredictions(queueData.predictions);
      setMetrics(metricsData);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load resolution queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (predictionId: number, correctOption: string) => {
    setResolvingId(predictionId);
    try {
      const userId = parseInt(localStorage.getItem("userId") || "0");
      await backend.admin.resolvePrediction({
        userId,
        predictionId,
        correctOption,
      });

      toast({
        title: "Success",
        description: "Prediction resolved successfully",
      });

      await loadData();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to resolve prediction",
        variant: "destructive",
      });
    } finally {
      setResolvingId(null);
    }
  };

  const getUrgencyColor = (hours: number) => {
    if (hours < 6) return "bg-green-500";
    if (hours < 24) return "bg-yellow-500";
    if (hours < 72) return "bg-orange-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resolution Queue</h1>
          <p className="text-muted-foreground mt-1">
            Manage predictions awaiting resolution
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin")}>
          Back to Admin
        </Button>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.currentlyPending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting resolution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgResolutionTimeHours}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Average resolution time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.resolvedLast24h}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Resolved yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalResolved}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Metrics</CardTitle>
            <CardDescription>Track admin resolution performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fastest Resolution:</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                {metrics.fastestResolutionHours}h
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Slowest Resolution:</span>
              <Badge variant="outline" className="bg-red-500/10 text-red-500">
                {metrics.slowestResolutionHours}h
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Resolved Last 7 Days:</span>
              <Badge variant="outline">{metrics.resolvedLast7d}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {pendingPredictions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All caught up!</h3>
              <p className="text-muted-foreground">No predictions awaiting resolution</p>
            </CardContent>
          </Card>
        ) : (
          pendingPredictions.map((prediction) => (
            <Card key={prediction.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{prediction.category}</Badge>
                      <Badge
                        variant="outline"
                        className={`${getUrgencyColor(prediction.hoursWaiting)} text-white`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {prediction.hoursWaiting}h waiting
                      </Badge>
                      <Badge variant="outline">
                        {prediction.totalVotes} votes
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{prediction.question}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Closed: {new Date(prediction.closedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Select winning option:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {prediction.options.map((option) => (
                      <Button
                        key={option}
                        onClick={() => handleResolve(prediction.id, option)}
                        disabled={resolvingId === prediction.id}
                        variant="outline"
                        className="justify-start h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {resolvingId === prediction.id ? "Resolving..." : option}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
