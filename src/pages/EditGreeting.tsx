import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Save, Image, Video, Bold, Italic, List, ListOrdered, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Profile {
  id: string;
  full_name: string | null;
}

export function EditGreeting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [accessType, setAccessType] = useState<'public' | 'private'>('public');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[200px]',
      },
    },
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    }

    loadProfile();
  }, [user]);

  useEffect(() => {
    async function loadGreeting() {
      try {
        const { data, error: loadError } = await supabase
          .from('greetings')
          .select('*')
          .eq('id', id)
          .single();

        if (loadError) throw loadError;
        if (!data) throw new Error('Greeting not found');

        if (data.author_id !== user?.id) {
          navigate('/dashboard');
          return;
        }

        setTitle(data.title);
        setAccessType(data.access_type);
        editor?.commands.setContent(data.content.html);
        setLoading(false);
      } catch (err) {
        console.error('Error loading greeting:', err);
        navigate('/dashboard');
      }
    }

    if (id && user && editor) {
      loadGreeting();
    }
  }, [id, user, editor, navigate]);

  const handleSave = async () => {
    if (!editor || !user || !id || !profile) return;
    
    try {
      setSaving(true);
      setError('');

      const { error: saveError } = await supabase
        .from('greetings')
        .update({
          title: title || 'Untitled Greeting',
          content: {
            html: editor.getHTML(),
            text: editor.getText(),
          },
          access_type: accessType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('author_id', user.id);

      if (saveError) throw saveError;
      
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save greeting. Please try again.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Greeting Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl font-bold border-none outline-none"
          />
          <div className="mt-2 text-sm text-gray-500">
            By {profile?.full_name || 'Anonymous'}
          </div>
        </div>

        <div className="border rounded-lg p-4 mb-6">
          <div className="flex gap-2 mb-4 border-b pb-2">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <Bold className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded ${editor?.isActive('italic') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <Italic className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded ${editor?.isActive('bulletList') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <List className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded ${editor?.isActive('orderedList') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <ListOrdered className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded ${editor?.isActive('blockquote') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <Quote className="h-5 w-5 text-gray-600" />
            </button>
            <div className="border-l mx-2" />
            <button className="p-2 hover:bg-gray-100 rounded">
              <Image className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Video className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <EditorContent editor={editor} className="prose max-w-none" />
        </div>

        <div className="flex justify-between">
          <div className="flex gap-4">
            <select
              className="rounded border px-3 py-2"
              value={accessType}
              onChange={(e) => setAccessType(e.target.value as 'public' | 'private')}
            >
              <option value="public">Public Link</option>
              <option value="private">Access Code</option>
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}