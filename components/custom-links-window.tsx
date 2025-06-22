'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Link as LinkIcon, LayoutGrid, Link2 } from "lucide-react"
import { useFirestore } from "../hooks/use-firestore"
import { useAuth } from "@/contexts/auth-context"
import { WidgetsPanel } from "./widgets-panel"

interface CustomLink {
  id: string;
  title: string;
  url: string;
}

export function CustomLinksWindow() {
  const { user } = useAuth();
  const { getDocument, updateDocument } = useFirestore(`users/${user?.uid}/preferences`);
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [newLink, setNewLink] = useState({ title: '', url: 'https://' });
  const [isLoading, setIsLoading] = useState(true);

  // Load custom links from Firestore
  useEffect(() => {
    const loadLinks = async () => {
      if (!user) return;
      
      try {
        const data = await getDocument('customLinks');
        if (data && Array.isArray(data.links)) {
          setLinks(data.links as CustomLink[]);
        }
      } catch (error) {
        console.error('Error loading custom links:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLinks();
  }, [user, getDocument]);

  // Save links to Firestore whenever they change
  useEffect(() => {
    const saveLinks = async () => {
      if (!user || isLoading) return;
      
      try {
        await updateDocument({ customLinks: links });
      } catch (error) {
        console.error('Error saving custom links:', error);
      }
    };

    const timer = setTimeout(() => {
      saveLinks();
    }, 500);

    return () => clearTimeout(timer);
  }, [links, user, updateDocument, isLoading]);

  const addLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    
    // Basic URL validation
    let url = newLink.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const link = {
      id: Date.now().toString(),
      title: newLink.title.trim(),
      url
    };

    setLinks(prev => [...prev, link]);
    setNewLink({ title: '', url: 'https://' });
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="animate-pulse">Loading links...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Tabs defaultValue="links" className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            My Content
          </h2>
          <TabsList>
            <TabsTrigger value="links" className="flex items-center gap-1">
              <Link2 className="h-4 w-4" /> Links
            </TabsTrigger>
            <TabsTrigger value="widgets" className="flex items-center gap-1">
              <LayoutGrid className="h-4 w-4" /> Widgets
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-6">
          {/* Add New Link Form */}
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-medium mb-3">Add New Link</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="link-title">Title</Label>
                <Input
                  id="link-title"
                  placeholder="Link title"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="link-url"
                    type="url"
                    placeholder="https://example.com"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={addLink}
                    disabled={!newLink.title.trim() || !newLink.url.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Links List */}
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-medium mb-3">Your Links</h3>
            {links.length > 0 ? (
              <ul className="space-y-2">
                {links.map((link) => (
                  <li 
                    key={link.id} 
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
                  >
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center gap-2 group"
                    >
                      <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                      <span className="truncate">
                        {link.title || 'Untitled Link'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                        {link.url}
                      </span>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No custom links added yet. Add your first link above.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Widgets Tab - Removed as it's now managed by the window manager */}
        <TabsContent value="widgets" className="flex items-center justify-center h-32 text-muted-foreground">
          <p>Widgets are now available in the widgets panel (click the grid icon in the media controls)</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
