import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Save, ImagePlus, Video, Bold, Italic, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { supabase, uploadMedia } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { sendAccessCode } from '../lib/email';

interface Profile {
  id: string;
  full_name: string | null;
}


const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          width: attributes.width,
          style: `width: ${attributes.width}; text-align: ${attributes.textAlign}`,
        }),
      },
      textAlign: {
        default: 'left',
        renderHTML: attributes => ({
          style: `text-align: ${attributes.textAlign}`,
        }),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        class: 'image-wrapper',
        style: `display: flex; justify-content:center;`,
      },
      ['img', HTMLAttributes],
    ];
  },
});

// const CustomImage = Image.extend({
//   addAttributes() {
//     return {
//       ...this.parent?.(),
//       width: {
//         default: '100%',
//         renderHTML: attributes => ({
//           width: attributes.width,
//           style: `width: ${attributes.width}`,
//         }),
//       },
//       textAlign: {
//         default: 'left',
//         renderHTML: attributes => ({
//           style: `text-align: ${attributes.textAlign}`,
//         }),
//       },
//     };
//   },
// });

export function Create() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [accessType, setAccessType] = useState<'public' | 'private'>('public');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMediaNode, setSelectedMediaNode] = useState<any>(null);
  const [mediaSize, setMediaSize] = useState(100);
  const [mediaAlign, setMediaAlign] = useState('left');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg',
        },
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: '<p>Start typing your greeting...</p>',
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[200px]',
      },
      handleClick: (view, pos, event) => {
        const node = view.state.doc.nodeAt(pos);
        if (node?.type.name === 'image') {
          setSelectedMediaNode({ node, pos, type: 'image' });
          const width = parseInt(node.attrs.width, 10) || 100;
          setMediaSize(width);
          setMediaAlign(node.attrs.textAlign || 'left');
          return true;
        }
        
        if (event.target instanceof HTMLElement) {
          const videoElement = event.target.closest('video');
          if (videoElement) {
            setSelectedMediaNode({ 
              element: videoElement,
              type: 'video'
            });
            const width = parseInt(videoElement.style.width || '100', 10);
            setMediaSize(width);
            setMediaAlign(videoElement.parentElement?.style.textAlign || 'left');
            return true;
          }
        }
        
        setSelectedMediaNode(null);
        return false;
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
        setProfile(data || { id: user.id, full_name: null });
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    }

    loadProfile();
  }, [user]);

  const handleFileUpload = async (file: File, type: 'images' | 'videos') => {
    if (!file) return;
    
    try {
      setUploading(true);
      setError('');
      const url = await uploadMedia(file, type);

      if (type === 'images' && editor) {
        editor.chain().focus().setImage({ 
          src: url,
          width: '100%',
          textAlign: 'left',
        }).run();
      } else if (editor) {
        editor.chain().focus().insertContent(`
          <div style="text-align: left">
            <video controls class="rounded-lg" style="width: 100%" data-size="100">
              <source src="${url}" type="${file.type}">
              Your browser does not support the video tag.
            </video>
          </div>
        `).run();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleMediaSizeChange = (newSize: number) => {
    if (!selectedMediaNode || !editor) return;

    const { type } = selectedMediaNode;
    setMediaSize(newSize);

    if (type === 'image') {
      editor
        .chain()
        .focus()
        .setNodeSelection(selectedMediaNode.pos)
        .updateAttributes('image', { 
          width: `${newSize}%`
        })
        .run();
    } else if (type === 'video' && selectedMediaNode.element) {
      const video = selectedMediaNode.element;
      video.style.width = `${newSize}%`;
    }
  };

  const handleMediaAlign = (align: 'left' | 'center' | 'right') => {
    if (!selectedMediaNode || !editor) return;

    const { type } = selectedMediaNode;
    setMediaAlign(align);

    if (type === 'image') {
      editor
        .chain()
        .focus()
        .setNodeSelection(selectedMediaNode.pos)
        .updateAttributes('image', { 
          textAlign: align
        })
        .run();
    } else if (type === 'video' && selectedMediaNode.element) {
      const container = selectedMediaNode.element.parentElement;
      if (container) {
        container.style.textAlign = align;
      }
    }
  };

  const generateAccessCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSave = async () => {
    if (!editor || !user) return;
    
    try {
      setSaving(true);
      setError('');

      if (!title.trim()) {
        setError('Please enter a title for your greeting');
        setSaving(false);
        return;
      }

      if (accessType === 'private' && !recipientEmail) {
        setError('Please enter a recipient email for private greetings');
        setSaving(false);
        return;
      }

      const accessCode = accessType === 'private' ? generateAccessCode() : null;

      const { data, error: saveError } = await supabase
        .from('greetings')
        .insert({
          title: title.trim(),
          content: {
            html: editor.getHTML(),
            text: editor.getText(),
          },
          author_id: user.id,
          access_type: accessType,
          access_code: accessCode,
          notification_email: accessType === 'private' ? recipientEmail.trim() : null,
        })
        .select()
        .single();

      if (saveError) throw saveError;
      
      if (accessType === 'private' && data) {
        alert(`Your greeting has been saved! The access code will be sent to ${recipientEmail}`);
        const greeting_link = `${window.location.origin}/g/${data.id}`;
        const response = await sendAccessCode({email: recipientEmail, access_code: accessCode, greeting_id: greeting_link});
          console.log(response);
        
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save greeting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
          <div className="flex flex-wrap gap-2 mb-4 border-b pb-2">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              title="Bold"
            >
              <Bold className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded ${editor?.isActive('italic') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              title="Italic"
            >
              <Italic className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded ${editor?.isActive('bulletList') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              title="Bullet List"
            >
              <List className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded ${editor?.isActive('orderedList') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              title="Numbered List"
            >
              <ListOrdered className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded ${editor?.isActive('blockquote') ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              title="Quote"
            >
              <Quote className="h-5 w-5 text-gray-600" />
            </button>
            <div className="border-l mx-2" />
            <button
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              title="Align Left"
            >
              <AlignLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              title="Align Center"
            >
              <AlignCenter className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              className={`p-2 rounded ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              title="Align Right"
            >
              <AlignRight className="h-5 w-5 text-gray-600" />
            </button>
            <div className="border-l mx-2" />
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded"
              disabled={uploading}
              title="Add Image"
            >
              <ImagePlus className={`h-5 w-5 ${uploading ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded"
              disabled={uploading}
              title="Add Video"
            >
              <Video className={`h-5 w-5 ${uploading ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            {selectedMediaNode && (
              <>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm text-gray-500">Size:</span>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={mediaSize}
                    onChange={(e) => handleMediaSizeChange(Number(e.target.value))}
                    className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-sm text-gray-500 w-12">{mediaSize}%</span>
                </div>
                <div className="border-l mx-2" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMediaAlign('left')}
                    className={`p-2 rounded ${mediaAlign === 'left' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                    title="Align Media Left"
                  >
                    <AlignLeft className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleMediaAlign('center')}
                    className={`p-2 rounded ${mediaAlign === 'center' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                    title="Align Media Center"
                  >
                    <AlignCenter className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleMediaAlign('right')}
                    className={`p-2 rounded ${mediaAlign === 'right' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                    title="Align Media Right"
                  >
                    <AlignRight className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </>
            )}
          </div>
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'images');
              e.target.value = '';
            }}
          />
          <input
            type="file"
            ref={videoInputRef}
            className="hidden"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'videos');
              e.target.value = '';
            }}
          />
          <EditorContent editor={editor} className="prose max-w-none" />
        </div>

        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <select
              className="rounded border px-3 py-2"
              value={accessType}
              onChange={(e) => setAccessType(e.target.value as 'public' | 'private')}
            >
              <option value="public">Public Link</option>
              <option value="private">Private (Access Code)</option>
            </select>
            
            {accessType === 'private' && (
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Recipient's email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="rounded border px-3 py-2"
                />
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Greeting'}
          </button>
        </div>
      </div>
    </div>
  );
}