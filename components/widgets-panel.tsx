"use client";

import { useState, useEffect, useCallback } from 'react';
import { registerWidgetWindow } from './window-manager';
import { useWindows } from '@/hooks/use-windows';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useFirestore } from '@/hooks/use-firestore';
import { useAuth } from '@/contexts/auth-context';
import { X, ExternalLink, Plus, LayoutDashboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Panel } from '@/components/ui/panel';

interface Widget {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export function WidgetsPanel() {
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const [newWidget, setNewWidget] = useState({ name: '', url: '' });
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCollection, setDocument, deleteDocument, loading } = useFirestore(user ? `users/${user.uid}` : 'temp');

  const { openWindow } = useWindows();

  const openWidget = (widget: Widget) => {
    // Register the widget window (ensures window-manager knows about it)
    registerWidgetWindow(`widget-${widget.id}`, widget.name, widget.url);
    // Open the widget window using the window manager system
    openWindow(`widget-${widget.id}`);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const loadWidgets = useCallback(async () => {
    if (!user) return;
    
    try {
      const userWidgets = await getCollection<Widget>('widgets');
      setWidgets(userWidgets);
      
      // Select the first widget by default if none is selected
      if (userWidgets.length > 0 && !selectedWidget) {
        setSelectedWidget(userWidgets[0]);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load widgets';
      setError(new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [user, getCollection, toast, selectedWidget]);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);



  const handleAddWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      const errorMsg = 'You must be signed in to add widgets.';
      setError(new Error(errorMsg));
      toast({
        title: 'Authentication Required',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    // Validate input
    if (!newWidget.name.trim() || !newWidget.url.trim()) {
      const errorMsg = 'Please provide both a name and URL for the widget.';
      setError(new Error(errorMsg));
      toast({
        title: 'Validation Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    const newWidgetWithMetadata: Widget = {
      id: `${Date.now()}`,
      ...newWidget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDocument(`widgets/${newWidgetWithMetadata.id}`, newWidgetWithMetadata);
      setWidgets(prev => [...prev, newWidgetWithMetadata]);
      setSelectedWidget(newWidgetWithMetadata);
      setIsAddingWidget(false);
      setNewWidget({ name: '', url: '' });
      toast({
        title: 'Widget Added',
        description: `Successfully added "${newWidget.name}".`,
      });
    } catch (error) {
      console.error('Error adding widget:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to add widget.';
      setError(new Error(errorMsg));
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveWidget = async (e: React.MouseEvent, widgetId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!widgetId || !user) return;

    try {
      await deleteDocument('widgets', widgetId);
      const updatedWidgets = widgets.filter(w => w.id !== widgetId);
      setWidgets(updatedWidgets);

      if (selectedWidget?.id === widgetId) {
        setSelectedWidget(updatedWidgets.length > 0 ? updatedWidgets[0] : null);
      }
      
      toast({
        title: 'Widget Deleted',
        description: 'The widget has been removed.',
      });
    } catch (error) {
      console.error('Error removing widget:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to remove widget.';
      setError(new Error(errorMsg));
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };



  // Helper to get favicon url
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
    }
  };



  if (!user) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-center">
        <LayoutDashboard className="h-12 w-12 text-gray-500 mb-4" />
        <div className="text-gray-400 mb-2">Sign in to manage your widgets</div>
        <div className="text-xs text-gray-500">Your widgets will be saved to the cloud</div>
      </div>
    );
  }



  return (
    <div className="h-full">
      <Panel 
        title="Widgets" 
        icon={<LayoutDashboard className="h-4 w-4" />}
        count={widgets.length}
        loading={loading}
        error={error?.message}
        headerAction={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAddingWidget(true)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
          </Button>
        }
      >
        <div className="p-3">
          {widgets.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <LayoutDashboard className="h-6 w-6 text-accent/70" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">No widgets yet</h3>
              <p className="text-xs text-muted-foreground mb-4">Add your first widget to get started</p>
              <Button 
                size="sm" 
                onClick={() => setIsAddingWidget(true)}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Widget
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {widgets.map((widget) => (
                <div 
                  key={widget.id} 
                  className="group relative"
                >
                  <button
                    onClick={() => openWidget(widget)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      "bg-background border hover:bg-accent/50 transition-colors",
                      "relative overflow-hidden"
                    )}
                    title={widget.name}
                  >
                    <img
                      src={getFaviconUrl(widget.url)}
                      alt={widget.name}
                      className="w-5 h-5"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXdpbmRvdyI+PHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE2IiByeD0iMiIvPjxwYXRoIGQ9Ik0yIDhoMjAiLz48L3N2Zz4=';
                      }}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWidget(e, widget.id);
                    }}
                    className={cn(
                      "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-white",
                      "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                      "text-[10px] leading-none"
                    )}
                    title="Remove widget"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>


      
      {/* Add Widget Dialog */}
      {isAddingWidget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-background/95 backdrop-blur-lg rounded-lg border border-border shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <h3 className="text-lg font-medium">Add New Widget</h3>
            </div>
            <form onSubmit={handleAddWidget} className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="widget-name">Widget Name</Label>
                  <Input
                    id="widget-name"
                    value={newWidget.name}
                    onChange={(e) => setNewWidget({...newWidget, name: e.target.value})}
                    placeholder="e.g., Calendar, Weather"
                    autoFocus
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widget-url">Widget URL</Label>
                  <Input
                    id="widget-url"
                    type="text"
                    value={newWidget.url}
                    onChange={(e) => setNewWidget({...newWidget, url: e.target.value})}
                    placeholder="e.g. notion.com or https://notion.com"
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddingWidget(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newWidget.name.trim() || !newWidget.url.trim()}>
                  Add Widget
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
