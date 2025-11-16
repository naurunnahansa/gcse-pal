'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const StudyCalendarPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Mock study sessions
  const studySessions = [
    { date: 5, subject: 'Mathematics', topic: 'Algebra', duration: 45 },
    { date: 8, subject: 'Biology', topic: 'Cell Structure', duration: 30 },
    { date: 12, subject: 'English', topic: 'Essay Writing', duration: 60 },
    { date: 15, subject: 'Chemistry', topic: 'Atomic Structure', duration: 45 },
    { date: 18, subject: 'History', topic: 'World War II', duration: 40 },
    { date: 22, subject: 'Mathematics', topic: 'Geometry', duration: 50 },
    { date: 25, subject: 'Physics', topic: 'Newton\'s Laws', duration: 35 },
  ];

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasSession = studySessions.find(session => session.date === day);
      const isToday = day === new Date().getDate() &&
                     currentDate.getMonth() === new Date().getMonth() &&
                     currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-2 ${
            isToday ? 'bg-blue-50 border-blue-500' : ''
          } ${hasSession ? 'bg-green-50' : ''}`}
        >
          <div className="text-sm font-medium mb-1">{day}</div>
          {hasSession && (
            <div className="text-xs">
              <div className="flex items-center gap-1 text-green-700">
                <BookOpen className="h-3 w-3" />
                {hasSession.subject}
              </div>
              <div className="flex items-center gap-1 text-gray-600 mt-1">
                <Clock className="h-3 w-3" />
                {hasSession.duration}min
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const changeMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Study Calendar</h1>
        <p className="text-muted-foreground">
          Plan and track your study sessions
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {monthYear}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="sm">
                Schedule Study Session
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Set Study Goal
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                View Study Stats
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studySessions.slice(0, 3).map((session, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-3">
                    <div className="text-sm font-medium">{session.subject}</div>
                    <div className="text-xs text-gray-600">{session.topic}</div>
                    <div className="text-xs text-gray-500">
                      {session.duration} minutes • Day {session.date}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                This Month's Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Study Sessions</span>
                  <span className="text-sm font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Hours</span>
                  <span className="text-sm font-medium">8.5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Streak</span>
                  <span className="text-sm font-medium">5 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Goal Progress</span>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudyCalendarPage;