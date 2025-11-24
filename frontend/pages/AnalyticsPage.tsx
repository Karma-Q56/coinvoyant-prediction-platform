import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import backend from "~backend/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, TrendingUp, Target, Trophy, Calendar, BarChart3, Lightbulb } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    totalTokensWon: number;
    totalTokensLost: number;
  };
  categoryPerformance: CategoryPerformance[];
  weekdayPerformance: WeekdayPerformance[];
  monthlyTrend: MonthlyTrend[];
  insights: string[];
  recentPredictions: RecentPrediction[];
}

interface CategoryPerformance {
  category: string;
  total: number;
  correct: number;
  accuracy: number;
  tokensWon: number;
  tokensLost: number;
}

interface WeekdayPerformance {
  weekday: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface RecentPrediction {
  id: number;
  question: string;
  category: string;
  vote: string;
  isCorrect: boolean | null;
  tokensWon: number;
  createdAt: Date;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f43f5e"];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      const data = await backend.user.getAnalytics({ userId: user.id });
      setAnalytics(data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!analytics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      overview: analytics.overview,
      categoryPerformance: analytics.categoryPerformance,
      weekdayPerformance: analytics.weekdayPerformance,
      monthlyTrend: analytics.monthlyTrend,
      insights: analytics.insights,
      recentPredictions: analytics.recentPredictions,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prediction-analytics-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Analytics report downloaded successfully",
    });
  };

  const downloadCSV = () => {
    if (!analytics) return;

    const csvRows = [
      ["Prediction History Report"],
      [""],
      ["Question", "Category", "Your Vote", "Result", "Tokens Won/Lost", "Date"],
    ];

    analytics.recentPredictions.forEach((pred) => {
      csvRows.push([
        `"${pred.question.replace(/"/g, '""')}"`,
        pred.category,
        pred.vote,
        pred.isCorrect === null ? "Pending" : pred.isCorrect ? "Correct" : "Incorrect",
        pred.isCorrect === true ? `+${pred.tokensWon}` : pred.isCorrect === false ? `-${pred.tokensWon}` : "0",
        new Date(pred.createdAt).toLocaleDateString(),
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prediction-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Prediction history CSV downloaded successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Failed to load analytics</div>
      </div>
    );
  }

  const netProfit = analytics.overview.totalTokensWon - analytics.overview.totalTokensLost;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">Track your prediction patterns and performance</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button onClick={downloadReport} className="gap-2">
              <Download className="h-4 w-4" />
              JSON Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.overview.totalPredictions}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" />
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.overview.accuracy.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">
                {analytics.overview.correctPredictions} / {analytics.overview.totalPredictions} correct
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-sm font-medium">Tokens Won</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">+{analytics.overview.totalTokensWon}</div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${netProfit >= 0 ? "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20" : "from-red-500/10 to-red-600/10 border-red-500/20"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className={`h-5 w-5 ${netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`} />
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {netProfit >= 0 ? "+" : ""}{netProfit}
              </div>
              <p className="text-sm text-muted-foreground">Lost: {analytics.overview.totalTokensLost}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle>Personalized Insights</CardTitle>
            </div>
            <CardDescription>AI-powered insights based on your prediction patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Your accuracy across different prediction categories</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.categoryPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="category" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Legend />
                    <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No category data available yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekday Performance</CardTitle>
              <CardDescription>How your accuracy varies by day of the week</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.weekdayPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.weekdayPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="weekday" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No weekday data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Accuracy Trend</CardTitle>
            <CardDescription>Track your prediction accuracy over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} name="Accuracy %" />
                  <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} name="Total Predictions" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No monthly trend data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Distribution of your predictions by category</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.categoryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category} (${entry.total})`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {analytics.categoryPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No category distribution data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Predictions</CardTitle>
            <CardDescription>Your 20 most recent prediction outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentPredictions.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentPredictions.map((pred) => (
                  <div key={pred.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{pred.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{pred.category}</span>
                        <span className="text-xs text-muted-foreground">
                          Voted: {pred.vote}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(pred.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pred.isCorrect === null ? (
                        <span className="text-sm px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          Pending
                        </span>
                      ) : pred.isCorrect ? (
                        <>
                          <span className="text-sm font-semibold text-green-500">+{pred.tokensWon}</span>
                          <span className="text-sm px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                            Correct
                          </span>
                        </>
                      ) : (
                        <span className="text-sm px-3 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                          Incorrect
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No predictions yet. Start making predictions to see your history!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
