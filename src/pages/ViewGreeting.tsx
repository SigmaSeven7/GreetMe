import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home } from 'lucide-react';

interface Greeting {
  id: string;
  title: string;
  content: {
    html: string;
  };
  created_at: string;
  access_type: 'public' | 'private';
  author: {
    full_name: string | null;
  } | null;
}

export function ViewGreeting() {
  const { id } = useParams();
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [needsAccessCode, setNeedsAccessCode] = useState(false);

  useEffect(() => {
    async function loadGreeting() {
      if (!id) {
        setError('Invalid greeting ID');
        setLoading(false);
        return;
      }

      try {
        // First, check if the greeting exists and its access type
        const { data: greetingInfo, error: infoError } = await supabase
          .from('greetings')
          .select('access_type')
          .eq('id', id)
          .maybeSingle();

        if (infoError) throw infoError;

        if (!greetingInfo) {
          setError('Greeting not found');
          setLoading(false);
          return;
        }

        // If it's private, show the access code form
        if (greetingInfo.access_type === 'private') {
          setNeedsAccessCode(true);
          setLoading(false);
          return;
        }

        // If public, load the full greeting
        const { data, error: loadError } = await supabase
          .from('greetings')
          .select(`
            id,
            title,
            content,
            created_at,
            access_type,
            author:profiles!greetings_author_id_fkey (
              full_name
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (loadError) throw loadError;
        if (!data) {
          setError('Unable to load greeting');
          return;
        }

        setGreeting(data);
      } catch (err) {
        console.error('Error loading greeting:', err);
        setError('Unable to load greeting');
      } finally {
        setLoading(false);
      }
    }

    loadGreeting();
  }, [id]);

  const verifyAccessCode = async () => {
    if (!id || !accessCode) return;

    try {
      setIsVerifying(true);
      setError('');
      
      const { data, error: verifyError } = await supabase
        .from('greetings')
        .select(`
          id,
          title,
          content,
          created_at,
          access_type,
          author:profiles!greetings_author_id_fkey (
            full_name
          )
        `)
        .eq('id', id)
        .eq('access_code', accessCode)
        .maybeSingle();

      if (verifyError) throw verifyError;
      
      if (!data) {
        setError('Invalid access code. Please try again.');
        return;
      }

      setGreeting(data);
      setNeedsAccessCode(false);
    } catch (err) {
      console.error('Error verifying access code:', err);
      setError('Invalid access code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (needsAccessCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Private Greeting</h2>
          <p className="text-gray-600 mb-6">
            This greeting requires an access code. Please enter the code that was sent to your email.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={verifyAccessCode}
              disabled={isVerifying || !accessCode}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'View Greeting'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !greeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-8">{error || 'Something went wrong'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-medium"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir='' className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl text-center font-bold text-gray-900 mb-4">{greeting.title}</h1>
          
          <div className="flex items-center justify-center text-sm text-gray-500 mb-8">
            <span>From {greeting.author?.full_name || 'Anonymous'}</span>
            <span className="mx-2">•</span>
            <span>{new Date(greeting.created_at).toLocaleDateString()}</span>
          </div>

          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: greeting.content.html }}
          />
        </div>
      </div>
    </div>
  );
}