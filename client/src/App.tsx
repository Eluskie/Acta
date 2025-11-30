import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import ReviewEditScreen from "@/pages/ReviewEditScreen";
import SendScreen from "@/pages/SendScreen";
import RecordingScreen from "@/components/RecordingScreen";
import NotFound from "@/pages/not-found";

type AppScreen = "dashboard" | "recording" | "review" | "send";

interface MeetingData {
  buildingName: string;
  attendeesCount: number;
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("dashboard");
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [, setLocation] = useLocation();

  const handleStartRecording = (data: MeetingData) => {
    setMeetingData(data);
    setCurrentScreen("recording");
  };

  const handleStopRecording = (duration: number) => {
    console.log("Recording stopped, duration:", duration);
    setCurrentScreen("review");
  };

  const handleMeetingClick = (meetingId: string) => {
    // todo: fetch meeting data by ID
    console.log("Meeting clicked:", meetingId);
    setMeetingData({
      buildingName: "Comunidad Edificio Alameda 42",
      attendeesCount: 12,
    });
    setCurrentScreen("review");
  };

  const handleGenerateActa = () => {
    setCurrentScreen("send");
  };

  const handleSendActa = () => {
    console.log("Acta sent");
  };

  const handleDone = () => {
    setMeetingData(null);
    setCurrentScreen("dashboard");
    setLocation("/");
  };

  const handleBack = () => {
    switch (currentScreen) {
      case "recording":
        setCurrentScreen("dashboard");
        break;
      case "review":
        setCurrentScreen("dashboard");
        break;
      case "send":
        setCurrentScreen("review");
        break;
      default:
        setCurrentScreen("dashboard");
    }
  };

  if (currentScreen === "recording" && meetingData) {
    return (
      <RecordingScreen
        buildingName={meetingData.buildingName}
        attendeesCount={meetingData.attendeesCount}
        onStop={handleStopRecording}
        onClose={() => setCurrentScreen("dashboard")}
      />
    );
  }

  if (currentScreen === "review" && meetingData) {
    return (
      <ReviewEditScreen
        buildingName={meetingData.buildingName}
        onBack={handleBack}
        onGenerate={handleGenerateActa}
      />
    );
  }

  if (currentScreen === "send" && meetingData) {
    return (
      <SendScreen
        buildingName={meetingData.buildingName}
        date="28 de noviembre de 2025"
        onBack={handleBack}
        onSend={handleSendActa}
        onDone={handleDone}
      />
    );
  }

  return (
    <Switch>
      <Route path="/">
        <Dashboard
          onStartRecording={handleStartRecording}
          onMeetingClick={handleMeetingClick}
        />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
