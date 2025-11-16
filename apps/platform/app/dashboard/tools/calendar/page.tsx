'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Target,
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const StudyCalendarPage = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your study calendar.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-lg bg-blue-100">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Study Calendar</h1>
          <p className="text-muted-foreground">
            Plan and track your study sessions
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Coming Soon!</h2>
                <p className="text-muted-foreground mb-4">
                  We're working on a comprehensive study calendar to help you organize your learning schedule and track your study sessions.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-100">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-1">Smart Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered study session recommendations based on your learning patterns
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-green-100">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-1">Goal Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Set and achieve daily, weekly, and monthly study goals
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-orange-100">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-medium mb-1">Study Reminders</h3>
                  <p className="text-sm text-muted-foreground">
                    Never miss a study session with smart notifications
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>What's coming:</strong> Interactive calendar, study session scheduling, progress tracking, and integration with your courses.
                </p>
              </div>

              <Button asChild size="lg">
                <a href="/dashboard">Back to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudyCalendarPage;