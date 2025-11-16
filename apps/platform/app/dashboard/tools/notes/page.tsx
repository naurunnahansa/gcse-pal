'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  Calendar,
  Tag,
  Star,
  Edit3,
  Trash2,
  Filter,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const NotesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your notes.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  // Mock notes data
  const notes = [
    {
      id: 1,
      title: 'Algebra: Quadratic Equations',
      subject: 'Mathematics',
      content: 'Key formulas for solving quadratic equations:\n\n1. Standard form: ax² + bx + c = 0\n2. Quadratic formula: x = (-b ± √(b²-4ac)) / 2a\n3. Factoring method: Find two numbers that multiply to ac and add to b\n\nImportant: Always check your answers by plugging them back into the original equation.',
      date: '2024-01-18',
      tags: ['algebra', 'formulas', 'homework'],
      starred: true,
    },
    {
      id: 2,
      title: 'Biology: Cell Structure Overview',
      subject: 'Biology',
      content: 'Animal Cell Components:\n\n• Nucleus - Contains DNA, controls cell activities\n• Mitochondria - Powerhouse of the cell, produces ATP\n• Ribosomes - Protein synthesis\n• Endoplasmic Reticulum - Transport and protein folding\n• Golgi Apparatus - Modifies and packages proteins\n• Cell Membrane - Controls what enters and leaves the cell\n• Cytoplasm - Jelly-like substance filling the cell',
      date: '2024-01-17',
      tags: ['cells', 'organelles', 'exam-prep'],
      starred: false,
    },
    {
      id: 3,
      title: 'English Essay Writing Tips',
      subject: 'English',
      content: 'Structure for GCSE Essays:\n\nIntroduction:\n- Hook the reader\n- State your thesis/argument\n- Outline main points (3 points maximum)\n\nBody Paragraphs:\n- One main idea per paragraph\n- P.E.E.L structure: Point, Evidence, Explanation, Link\n- Use quotes from the text\n\nConclusion:\n- Summarize main points\n- Restate thesis in different words\n- Final thought on significance',
      date: '2024-01-16',
      tags: ['essay', 'writing', 'structure'],
      starred: true,
    },
    {
      id: 4,
      title: 'Chemistry Lab Safety Rules',
      subject: 'Chemistry',
      content: 'Essential Safety Guidelines:\n\n1. Always wear safety goggles\n2. Never eat or drink in the lab\n3. Tie back long hair\n4. Know the location of safety equipment\n5. Report any spills or accidents immediately\n6. Use fume hood for volatile substances\n7. Dispose of chemicals properly\n8. Wash hands thoroughly after experiments',
      date: '2024-01-15',
      tags: ['safety', 'lab', 'rules'],
      starred: false,
    },
  ];

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'subject':
        return a.subject.localeCompare(b.subject);
      default:
        return 0;
    }
  });

  const subjects = ['all', ...new Set(notes.map(note => note.subject))];
  const stats = {
    total: notes.length,
    starred: notes.filter(n => n.starred).length,
    thisWeek: notes.filter(n => {
      const noteDate = new Date(n.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return noteDate >= weekAgo;
    }).length,
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Notes</h1>
        <p className="text-muted-foreground">
          Keep track of important concepts and study materials
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Starred</p>
                <p className="text-2xl font-bold">{stats.starred}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="text-2xl font-bold">{new Set(notes.map(n => n.subject)).size}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Notes List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notes</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="subject">Sort by Subject</option>
                </select>
              </div>

              {/* Notes Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {sortedNotes.map((note) => (
                  <Card key={note.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{note.title}</h3>
                            {note.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {note.subject}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {note.date}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-4">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-2">
                        {note.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedNotes.slice(0, 5).map((note) => (
                  <div key={note.id} className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{note.title}</p>
                      <p className="text-xs text-muted-foreground">{note.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags Cloud */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(notes.flatMap(n => n.tags))).map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create New Note
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;