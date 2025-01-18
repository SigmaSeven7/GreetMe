import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare, Share2, Eye, Edit2, User, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Greeting {
  id: string;
  title: string;
  content: {
    text: string;
    html: string;
  };
  access_type: 'public' | 'private';
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
}

export function Dashboard() {
  const [greetings, setGreetings] = useState<Greeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        const [greetingsResponse, profileResponse] = await Promise.all([
          supabase
            .from('greetings')
            .select('*')
            .eq('author_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', user.id)
        ]);

        if (greetingsResponse.error) throw greetingsResponse.error;
        if (profileResponse.error) throw profileResponse.error;

        setGreetings(greetingsResponse.data || []);
        // Handle the case where profile might not exist yet
        setProfile(profileResponse.data?.[0] || { id: user.id, full_name: null });
        setNewName(profileResponse.data?.[0]?.full_name || '');
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  const handleShare = (greetingId: string) => {
    const url = `${window.location.origin}/g/${greetingId}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          full_name: newName,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, full_name: newName } : null);
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleDelete = async (greetingId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this greeting?')) return;

    try {
      setDeletingId(greetingId);
      
      // Delete associated media files first
      const greeting = greetings.find(g => g.id === greetingId);
      if (greeting) {
        const content = greeting.content.html;
        const mediaUrls = [
          ...content.matchAll(/src="([^"]+)"/g)
        ].map(match => match[1]);

        for (const url of mediaUrls) {
          const path = url.split('/').pop();
          if (path) {
            if (url.includes('/images/')) {
              await supabase.storage.from('images').remove([path]);
            } else if (url.includes('/videos/')) {
              await supabase.storage.from('videos').remove([path]);
            }
          }
        }
      }

      // Delete the greeting
      const { error: deleteError } = await supabase
        .from('greetings')
        .delete()
        .eq('id', greetingId)
        .eq('author_id', user.id);

      if (deleteError) throw deleteError;

      setGreetings(prev => prev.filter(g => g.id !== greetingId));
    } catch (err) {
      console.error('Error deleting greeting:', err);
      setError('Failed to delete greeting');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading your greetings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My Greetings</h1>
          {isEditingProfile ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                placeholder="Enter your name"
              />
              <button
                onClick={handleUpdateProfile}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  setNewName(profile?.full_name || '');
                }}
                className="text-sm text-gray-500 hover:text-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <User className="h-4 w-4" />
              {profile?.full_name || 'Set your name'}
            </button>
          )}
        </div>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PenSquare className="h-4 w-4 mr-2" />
          New Greeting
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {shareUrl && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md flex justify-between items-center">
          <span>Share URL copied to clipboard!</span>
          <button 
            onClick={() => setShareUrl('')}
            className="text-green-700 hover:text-green-800"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg divide-y">
        {greetings.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-500 text-center">No greetings created yet.</p>
            <div className="mt-4 text-center">
              <Link
                to="/create"
                className="text-indigo-600 hover:text-indigo-500 font-medium inline-flex items-center"
              >
                <PenSquare className="h-4 w-4 mr-2" />
                Create your first greeting
              </Link>
            </div>
          </div>
        ) : (
          greetings.map((greeting) => (
            <div key={greeting.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {greeting.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(greeting.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-gray-600 line-clamp-2">
                    {greeting.content.text}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/edit/${greeting.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <Edit2 className="h-5 w-5" />
                  </Link>
                  <button 
                    onClick={() => handleShare(greeting.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <Link
                    to={`/g/${greeting.id}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(greeting.id)}
                    disabled={deletingId === greeting.id}
                    className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  greeting.access_type === 'public' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {greeting.access_type === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}