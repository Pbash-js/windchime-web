"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Palette, ImageIcon, Timer, Bell, Shield, Monitor, Sun, Moon, Cloud, CloudOff, LayoutGrid } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { useTheme } from "next-themes"
import { usePreferences } from "@/contexts/preferences-context"
import type { UserPreferences } from "@/hooks/use-firestore-preferences"

const backgroundImages = [
  { id: "bedroom", name: "Cozy Bedroom", path: "/images/bedroom-scene.png" },
  { id: "library", name: "Library", path: "/images/library-scene.png" },
  { id: "nature", name: "Nature View", path: "/images/nature-scene.png" },
  { id: "office", name: "Modern Office", path: "/images/office-scene.png" },
]

export function SettingsWindow() {
  type LocalPreferences = UserPreferences & {
    windowStyles: {
      headerAutoHide: boolean
      headerHideDelay: number
      windowBgOpacity: number
      windowBgColor: string
      windowBorderRadius: number
      windowShadow: string
    }
    musicGenre: string
  }

  const defaultWindowStyles = {
    headerAutoHide: false,
    headerHideDelay: 2000,
    windowBgOpacity: 0.85,
    windowBgColor: '24,24,28',
    windowBorderRadius: 8,
    windowShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
  }

  const { 
    theme: currentTheme, 
    backgroundScene, 
    windowStyles, 
    pomodoroSettings, 
    notifications, 
    privacy,
    updateLocalPreferences 
  } = usePreferences()
  
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()
  const { setTheme } = useTheme()
  
  // Initialize local state with current preferences
  const [localPrefs, setLocalPrefs] = useState<LocalPreferences>(() => {
    // Create a base object with all required properties and default values
    const basePrefs: LocalPreferences = {
      theme: 'system',
      backgroundScene: 'bedroom',
      musicGenre: 'lofi',
      windowStyles: {
        ...defaultWindowStyles,
        ...windowStyles
      },
      pomodoroSettings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        autoStartBreaks: true,
        autoStartPomodoros: false,
        soundEnabled: true,
        volume: 70
      },
      notifications: {
        desktop: true,
        sound: true,
        email: false
      },
      privacy: {
        analytics: true,
        crashReports: true
      }
    };

    // Merge with current preferences from context
    return {
      ...basePrefs,
      theme: currentTheme || basePrefs.theme,
      backgroundScene: backgroundScene || basePrefs.backgroundScene,
      windowStyles: {
        ...basePrefs.windowStyles,
        ...windowStyles
      },
      pomodoroSettings: {
        ...basePrefs.pomodoroSettings,
        ...pomodoroSettings
      },
      notifications: {
        ...basePrefs.notifications,
        ...notifications
      },
      privacy: {
        ...basePrefs.privacy,
        ...privacy
      }
    };
  })

  // Update local preferences when global preferences change
  useEffect(() => {
    setLocalPrefs(prev => {
      // Only update if there are actual changes to prevent unnecessary re-renders
      const newWindowStyles = {
        ...defaultWindowStyles,
        ...windowStyles,
        // Preserve any local window style overrides that aren't in the context
        ...(prev.windowStyles || {})
      };
      
      const newPomodoroSettings = {
        ...prev.pomodoroSettings,
        ...pomodoroSettings
      };
      
      const newNotifications = {
        ...prev.notifications,
        ...notifications
      };
      
      const newPrivacy = {
        ...prev.privacy,
        ...privacy
      };
      
      // Check if any values have actually changed
      const hasChanges = 
        (currentTheme && currentTheme !== prev.theme) ||
        (backgroundScene && backgroundScene !== prev.backgroundScene) ||
        JSON.stringify(newWindowStyles) !== JSON.stringify(prev.windowStyles) ||
        JSON.stringify(newPomodoroSettings) !== JSON.stringify(prev.pomodoroSettings) ||
        JSON.stringify(newNotifications) !== JSON.stringify(prev.notifications) ||
        JSON.stringify(newPrivacy) !== JSON.stringify(prev.privacy);
      
      if (!hasChanges) return prev;
      
      return {
        ...prev,
        theme: currentTheme || prev.theme,
        backgroundScene: backgroundScene || prev.backgroundScene,
        musicGenre: prev.musicGenre,
        windowStyles: newWindowStyles,
        pomodoroSettings: newPomodoroSettings,
        notifications: newNotifications,
        privacy: newPrivacy
      };
    });
  }, [currentTheme, backgroundScene, windowStyles, pomodoroSettings, notifications, privacy, defaultWindowStyles])

  // Apply theme changes immediately
  useEffect(() => {
    if (localPrefs.theme) {
      setTheme(localPrefs.theme)
    }
  }, [localPrefs.theme, setTheme])

  // Apply window styles and background changes immediately
  useEffect(() => {
    const { windowStyles, backgroundScene } = localPrefs;

    // Apply background image
    const backgroundMap: Record<string, string> = {
      bedroom: "/images/bedroom-scene.png",
      library: "/images/library-scene.png",
      nature: "/images/nature-scene.png",
      office: "/images/office-scene.png",
    };
    const newBackground = backgroundMap[backgroundScene] || "/images/bedroom-scene.png";
    document.body.style.backgroundImage = `url(${newBackground})`;

    // Apply window styles as CSS variables
    document.documentElement.style.setProperty('--window-bg-opacity', windowStyles.windowBgOpacity.toString());
    document.documentElement.style.setProperty('--window-bg-color', windowStyles.windowBgColor);
    document.documentElement.style.setProperty('--window-border-radius', `${windowStyles.windowBorderRadius}px`);
    document.documentElement.style.setProperty('--window-shadow', windowStyles.windowShadow);

  }, [localPrefs.windowStyles, localPrefs.backgroundScene]);

  const handlePomodoroChange = (key: string, value: any) => {
    const newPomodoroSettings = {
      ...localPrefs.pomodoroSettings,
      [key]: value,
    };
    
    const newPrefs = {
      ...localPrefs,
      pomodoroSettings: newPomodoroSettings,
    };
    
    setLocalPrefs(newPrefs);
    updateLocalPreferences({ pomodoroSettings: newPomodoroSettings });
  };

  // Handle window style changes
  const handleWindowStyleChange = (key: string, value: any) => {
    const newWindowStyles = {
      ...localPrefs.windowStyles,
      [key]: value,
    };
    
    const newPrefs = {
      ...localPrefs,
      windowStyles: newWindowStyles,
    };
    
    setLocalPrefs(newPrefs);
    updateLocalPreferences({ windowStyles: newWindowStyles });
  };
  
  // Define valid window style keys for type safety
  type WindowStyleKey = 'headerAutoHide' | 'headerHideDelay' | 'windowBgOpacity' | 'windowBgColor' | 'windowBorderRadius' | 'windowShadow';
  
  // Memoize the slider change handler to prevent unnecessary re-renders
  const handleSliderChange = useCallback((key: WindowStyleKey, value: any, isSliderCommit = false) => {
    setLocalPrefs(prev => {
      // Skip update if the value hasn't changed
      if (prev.windowStyles[key] === value) return prev;
      
      const newWindowStyles = {
        ...prev.windowStyles,
        [key]: value,
      };
      
      // Only update preferences when the slider interaction is complete
      if (isSliderCommit) {
        updateLocalPreferences({ windowStyles: newWindowStyles });
      }
      
      return {
        ...prev,
        windowStyles: newWindowStyles,
      };
    });
  }, [updateLocalPreferences]);
  
  // Memoize the slider components to prevent unnecessary re-renders
  const renderSlider = useCallback(({
    id,
    value,
    min,
    max,
    step,
    format = (v: number) => v.toString(),
    onChange,
    onCommit
  }: {
    id: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format?: (value: number) => string;
    onChange: (value: number) => void;
    onCommit: (value: number) => void;
  }) => (
    <Slider
      id={id}
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([val]) => onChange(val)}
      onValueCommit={([val]) => onCommit(val)}
      className="w-full"
    />
  ), []);

  const handlePreferenceChange = (
    key: keyof Omit<LocalPreferences, 'windowStyles'>,
    value: LocalPreferences[keyof Omit<LocalPreferences, 'windowStyles'>]
  ) => {
    const newPrefs = {
      ...localPrefs,
      [key]: value,
    };
    
    // Update local state immediately for instant UI feedback
    setLocalPrefs(newPrefs);
    
    // Update preferences in the background
    updateLocalPreferences({ [key]: value });
  };

  const handleNestedPreferenceChange = <K extends keyof LocalPreferences>(
    category: K,
    key: keyof LocalPreferences[K],
    value: LocalPreferences[K][keyof LocalPreferences[K]]
  ) => {
    const newCategory = {
      ...(localPrefs[category] as object),
      [key]: value,
    };
    
    const newPrefs = {
      ...localPrefs,
      [category]: newCategory,
    };
    
    setLocalPrefs(newPrefs);
    updateLocalPreferences({ [category]: newCategory });
  };

  return (
    <div className="p-4 h-full text-white flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold">Settings</h2>
          <div className="flex items-center gap-1">
            {isOnline ? <Cloud className="h-3 w-3 text-green-400" /> : <CloudOff className="h-3 w-3 text-orange-400" />}
            <span className="text-xs text-gray-400">{isOnline ? "Synced" : "Offline"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-4 mb-4 bg-gray-800/50 flex-shrink-0">
          <TabsTrigger value="appearance" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="text-xs">
            <Timer className="h-3 w-3 mr-1" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="h-3 w-3 mr-1" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="appearance" className="space-y-4 mt-0">
            {/* Theme Selection */}
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Monitor className="h-4 w-4" />
                  Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <RadioGroup value={localPrefs.theme} onValueChange={(value) => handlePreferenceChange("theme", value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-2 text-white text-sm">
                      <Sun className="h-3 w-3" />
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-2 text-white text-sm">
                      <Moon className="h-3 w-3" />
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="flex items-center gap-2 text-white text-sm">
                      <Monitor className="h-3 w-3" />
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Window Styling */}
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <LayoutGrid className="h-4 w-4" />
                  Window Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="headerAutoHide" className="text-xs text-white">Auto-hide Header</Label>
                    <Switch
                      id="headerAutoHide"
                      checked={localPrefs.windowStyles?.headerAutoHide || false}
                      onCheckedChange={(checked) => handleNestedPreferenceChange('windowStyles', 'headerAutoHide', checked)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="headerHideDelay" className="text-xs text-white">Header Hide Delay: {localPrefs.windowStyles?.headerHideDelay || 2000}ms</Label>
                    </div>
                    {renderSlider({
                      id: 'headerHideDelay',
                      value: localPrefs.windowStyles?.headerHideDelay || 2000,
                      min: 500,
                      max: 5000,
                      step: 100,
                      format: (v) => `${v}ms`,
                      onChange: (value) => handleSliderChange('headerHideDelay', value, false),
                      onCommit: (value) => handleSliderChange('headerHideDelay', value, true)
                    })}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="windowBgOpacity" className="text-xs text-white">Window Opacity: {Math.round((localPrefs.windowStyles?.windowBgOpacity || 0.85) * 100)}%</Label>
                    </div>
                    {renderSlider({
                      id: 'windowBgOpacity',
                      value: Math.round((localPrefs.windowStyles?.windowBgOpacity || 0.85) * 100),
                      min: 10,
                      max: 100,
                      step: 5,
                      format: (v) => `${v}%`,
                      onChange: (value) => handleSliderChange('windowBgOpacity', value / 100, false),
                      onCommit: (value) => handleSliderChange('windowBgOpacity', value / 100, true)
                    })}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="windowBorderRadius" className="text-xs text-white">Border Radius: {localPrefs.windowStyles?.windowBorderRadius || 8}px</Label>
                    </div>
                    {renderSlider({
                      id: 'windowBorderRadius',
                      value: localPrefs.windowStyles?.windowBorderRadius || 8,
                      min: 0,
                      max: 20,
                      step: 1,
                      format: (v) => `${v}px`,
                      onChange: (value) => handleSliderChange('windowBorderRadius', value, false),
                      onCommit: (value) => handleSliderChange('windowBorderRadius', value, true)
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Background Images */}
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <ImageIcon className="h-4 w-4" />
                  Background
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {backgroundImages.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => handlePreferenceChange("backgroundScene", bg.id)}
                      className={`relative aspect-video rounded-md overflow-hidden border transition-all duration-200 hover:scale-105 ${
                        localPrefs.backgroundScene === bg.id
                          ? "border-blue-500 ring-1 ring-blue-500/50"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${bg.path})`,
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-end">
                        <div className="p-1 w-full">
                          <div className="text-xs font-medium text-white">{bg.name}</div>
                        </div>
                      </div>
                      {localPrefs.backgroundScene === bg.id && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pomodoro" className="space-y-4 mt-0">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4" />
                  Pomodoro Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div>
                  <Label className="text-white mb-2 block text-sm">
                    Work: {localPrefs.pomodoroSettings.workDuration}m
                  </Label>
                  <Slider
                    value={[localPrefs.pomodoroSettings.workDuration]}
                    onValueChange={(value) => handlePomodoroChange("workDuration", value[0])}
                    max={60}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block text-sm">
                    Short Break: {localPrefs.pomodoroSettings.shortBreakDuration}m
                  </Label>
                  <Slider
                    value={[localPrefs.pomodoroSettings.shortBreakDuration]}
                    onValueChange={(value) => handlePomodoroChange("shortBreakDuration", value[0])}
                    max={30}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block text-sm">
                    Long Break: {localPrefs.pomodoroSettings.longBreakDuration}m
                  </Label>
                  <Slider
                    value={[localPrefs.pomodoroSettings.longBreakDuration]}
                    onValueChange={(value) => handlePomodoroChange("longBreakDuration", value[0])}
                    max={60}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white text-sm">Auto-start breaks</Label>
                    <Switch
                      checked={localPrefs.pomodoroSettings.autoStartBreaks}
                      onCheckedChange={(checked) => handlePomodoroChange("autoStartBreaks", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white text-sm">Sound enabled</Label>
                    <Switch
                      checked={localPrefs.pomodoroSettings.soundEnabled}
                      onCheckedChange={(checked) => handlePomodoroChange("soundEnabled", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-0">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white text-sm">Desktop notifications</Label>
                  <Switch
                    checked={localPrefs.notifications.desktop}
                    onCheckedChange={(checked) => handleNestedPreferenceChange("notifications", "desktop", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white text-sm">Sound notifications</Label>
                  <Switch
                    checked={localPrefs.notifications.sound}
                    onCheckedChange={(checked) => handleNestedPreferenceChange("notifications", "sound", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-white text-sm">Email notifications</Label>
                  <Switch
                    checked={localPrefs.notifications.email}
                    onCheckedChange={(checked) => handleNestedPreferenceChange("notifications", "email", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-0">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white text-sm">Analytics</Label>
                    <p className="text-xs text-gray-400">Help improve the app</p>
                  </div>
                  <Switch
                    checked={localPrefs.privacy.analytics}
                    onCheckedChange={(checked) => handleNestedPreferenceChange("privacy", "analytics", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white text-sm">Crash reports</Label>
                    <p className="text-xs text-gray-400">Auto-send crash reports</p>
                  </div>
                  <Switch
                    checked={localPrefs.privacy.crashReports}
                    onCheckedChange={(checked) => handleNestedPreferenceChange("privacy", "crashReports", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
