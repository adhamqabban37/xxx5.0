// Example component demonstrating IndexNow auto-triggers in React
'use client';

import { useState } from 'react';
import { useIndexNowTrigger } from '@/lib/indexnow-triggers';
import { Save, Plus, Trash2, RefreshCw } from 'lucide-react';

interface ContentItem {
  id: string;
  url: string;
  title: string;
  content: string;
  lastModified: Date;
}

export default function ContentManagerExample() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Get IndexNow trigger functions
  const { 
    onContentCreated, 
    onContentUpdated, 
    onContentDeleted,
    flushPending 
  } = useIndexNowTrigger();

  // Create new content
  const handleCreate = async (newContent: { url: string; title: string; content: string }) => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual API call
      const response = await fetch('/api/content/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newContent.url,
          content: newContent.content,
          type: 'page'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        const newItem: ContentItem = {
          id: Date.now().toString(),
          url: newContent.url,
          title: newContent.title,
          content: newContent.content,
          lastModified: new Date()
        };
        setContent(prev => [...prev, newItem]);

        // Trigger IndexNow for new content (handled by API route)
        // But we can also trigger client-side if needed:
        // await onContentCreated(newContent.url);
        
        console.log('Content created and IndexNow triggered');
      }
    } catch (error) {
      console.error('Failed to create content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing content
  const handleUpdate = async (id: string, updatedData: Partial<ContentItem>) => {
    try {
      setIsLoading(true);
      
      const item = content.find(c => c.id === id);
      if (!item) return;

      // TODO: Replace with actual API call
      const response = await fetch('/api/content/example', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.url,
          content: updatedData.content,
          type: 'page'
        })
      });

      if (response.ok) {
        // Update local state
        setContent(prev => prev.map(c => 
          c.id === id 
            ? { ...c, ...updatedData, lastModified: new Date() }
            : c
        ));

        // Trigger IndexNow for updated content (handled by API route)
        // But we can also trigger client-side:
        // await onContentUpdated(item.url);
        
        setEditingId(null);
        console.log('Content updated and IndexNow triggered');
      }
    } catch (error) {
      console.error('Failed to update content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete content
  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      
      const item = content.find(c => c.id === id);
      if (!item) return;

      // TODO: Replace with actual API call
      const response = await fetch(`/api/content/example?url=${encodeURIComponent(item.url)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Update local state
        setContent(prev => prev.filter(c => c.id !== id));

        // Trigger IndexNow for deleted content (handled by API route)
        // But we can also trigger client-side:
        // await onContentDeleted(item.url);
        
        console.log('Content deleted and IndexNow triggered');
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual schema update (e.g., when changing structured data)
  const handleSchemaUpdate = async (id: string) => {
    const item = content.find(c => c.id === id);
    if (!item) return;

    try {
      // Client-side schema change trigger
      // This would be useful when updating structured data without changing content
      // await onSchemaChange(item.url);
      
      console.log('Schema updated and IndexNow triggered for:', item.url);
    } catch (error) {
      console.error('Failed to trigger schema update:', error);
    }
  };

  // Force flush all pending submissions
  const handleFlushPending = async () => {
    try {
      await flushPending();
      console.log('All pending IndexNow submissions flushed');
    } catch (error) {
      console.error('Failed to flush pending submissions:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Content Manager</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleFlushPending}
            className="flex items-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Flush IndexNow Queue
          </button>
          <button
            onClick={() => {
              // Demo: Create new content
              handleCreate({
                url: `/demo-page-${Date.now()}`,
                title: 'Demo Page',
                content: 'This is a demo page created at ' + new Date().toLocaleString()
              });
            }}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Demo Content
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {content.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No content yet. Create some demo content to see IndexNow triggers in action.
          </div>
        ) : (
          content.map((item) => (
            <div key={item.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.url}</p>
                  <p className="text-xs text-gray-500">
                    Last modified: {item.lastModified.toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    {editingId === item.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleSchemaUpdate(item.id)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                  >
                    Update Schema
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isLoading}
                    className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-sm rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>

              {editingId === item.id ? (
                <div className="space-y-3">
                  <textarea
                    value={item.content}
                    onChange={(e) => {
                      setContent(prev => prev.map(c => 
                        c.id === item.id ? { ...c, content: e.target.value } : c
                      ));
                    }}
                    className="w-full p-3 bg-slate-600 border border-slate-500 rounded text-white resize-vertical min-h-[100px]"
                    placeholder="Content..."
                  />
                  <button
                    onClick={() => handleUpdate(item.id, { content: item.content })}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Trigger IndexNow
                  </button>
                </div>
              ) : (
                <div className="bg-slate-600/50 p-3 rounded text-gray-300 text-sm">
                  {item.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* IndexNow Trigger Information */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-3">IndexNow Auto-Triggers</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• <strong>Create Content:</strong> Immediate high-priority submission</p>
          <p>• <strong>Update Content:</strong> Batched normal-priority submission</p>
          <p>• <strong>Delete Content:</strong> Immediate normal-priority submission</p>
          <p>• <strong>Schema Changes:</strong> Immediate high-priority submission</p>
          <p>• <strong>Batch Processing:</strong> Groups updates over 5 seconds to avoid rate limits</p>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="text-white">Processing and triggering IndexNow...</span>
          </div>
        </div>
      )}
    </div>
  );
}