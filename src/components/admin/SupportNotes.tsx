/**
 * Support Notes Component
 * 
 * Phase Admin D: Internal support notes for users
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, StickyNote, Plus, Trash2, Star } from 'lucide-react';
import {
  getSupportNotes,
  addSupportNote,
  deleteSupportNote,
  type SupportNote,
} from '@/services/admin/SupportNotesService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SupportNotesProps {
  userId: string;
}

export default function SupportNotes({ userId }: SupportNotesProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes] = useState<SupportNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const { notes: notesData, error } = await getSupportNotes(userId);
      if (error) {
        toast({
          title: '❌ خطأ',
          description: error,
          variant: 'destructive',
        });
      } else {
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحميل الملاحظات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [userId]);

  const handleAddNote = async () => {
    if (!user?.id || !newNote.trim()) {
      toast({
        title: '❌ خطأ',
        description: 'يرجى إدخال نص الملاحظة',
        variant: 'destructive',
      });
      return;
    }

    setAddingNote(true);
    try {
      const { success, error } = await addSupportNote(userId, user.id, newNote, isImportant);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم إضافة الملاحظة',
        });
        setNewNote('');
        setIsImportant(false);
        loadNotes();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في إضافة الملاحظة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
      return;
    }

    try {
      const { success, error } = await deleteSupportNote(noteId);
      if (success) {
        toast({
          title: '✅ نجح',
          description: 'تم حذف الملاحظة',
        });
        loadNotes();
      } else {
        toast({
          title: '❌ خطأ',
          description: error || 'فشل في حذف الملاحظة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة ملاحظة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-text">نص الملاحظة</Label>
            <Textarea
              id="note-text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="أدخل ملاحظة الدعم هنا..."
              rows={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="important"
              checked={isImportant}
              onCheckedChange={setIsImportant}
            />
            <Label htmlFor="important" className="cursor-pointer">
              ملاحظة مهمة
            </Label>
          </div>
          <Button
            onClick={handleAddNote}
            disabled={addingNote || !newNote.trim()}
            className="w-full"
          >
            {addingNote ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري الإضافة...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                إضافة ملاحظة
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            الملاحظات ({notes.length})
          </CardTitle>
          <CardDescription>ملاحظات الدعم الداخلية للمستخدم</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && notes.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : notes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد ملاحظات
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  className={cn(
                    'border-l-4',
                    note.is_important
                      ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                      : 'border-l-gray-300'
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {note.is_important && (
                            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20">
                              <Star className="w-3 h-3 mr-1" />
                              مهم
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(note.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{note.note_text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

