"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Palette, ImageIcon, Timer, Bell, Shield, Monitor, Sun, Moon, Cloud, CloudOff } from "lucide-react"
import { useFirestorePreferences } from "@/hooks/use-firestore-preferences"
import { useToast } from "@/hooks/use-toast"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { useTheme } from "next-themes"

const backgroundImages = [
  { id: "bedroom", name: "Cozy Bedroom", path: "/images/bedroom-scene.png" },
  { id: "library", name: "Library", path: "/images/library-scene.png" },
  { id: "nature", name: "Nature View", path: "/images/nature-scene.png" },
  { id: "office", name: "Modern Office", path: "/images/office-scene.png" },
]

export function SettingsWindow() {
  // Add default for background opacity if not present
  const getInitialOpacity = () => {
    if (preferences && typeof preferences.windowBgOpacity === 'number') return preferences.windowBgOpacity;
    return 0.85; // default opacity
  };

  const { preferences, loading, updatePreferences } = useFirestorePreferences()
  const { toast } = useToast()
  const { isOnline } = useNetworkStatus()
  const { setTheme } = useTheme()
  const [localPrefs, setLocalPrefs] = useState({ ...preferences, windowBgOpacity: getInitialOpacity() })

  // Update local preferences when global preferences change
  useEffect(() => {
    setLocalPrefs(preferences)
  }, [preferences])

  // Apply theme changes immediately
  useEffect(() => {
    if (localPrefs.theme) {
      setTheme(localPrefs.theme)
    }
  }, [localPrefs.theme, setTheme])

  const handlePomodoroChange = (key: string, value: any) => {
    const newPrefs = {
      ...localPrefs,
      pomodoroSettings: {
        ...localPrefs.pomodoroSettings,
        [key]: value,
      },
    }
    setLocalPrefs(newPrefs)
    // Auto-save for instant feedback
    updatePreferences(newPrefs)
  }

  // For opacity slider
  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0] / 100;
    const newPrefs = { ...localPrefs, windowBgOpacity: newOpacity };
    setLocalPrefs(newPrefs);
    updatePreferences(newPrefs);
    // Update CSS variable for immediate feedback
    document.documentElement.style.setProperty('--window-bg-opacity', newOpacity.toString());
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    const newPrefs = {
      ...localPrefs,
      [key]: value,
    }
    
    // Update local state immediately for instant UI feedback
    setLocalPrefs(newPrefs)
    
    // For background changes, update the DOM directly for immediate visual feedback
    if (key === 'backgroundScene') {
      const backgroundMap: Record<string, string> = {
        bedroom: "/images/bedroom-scene.png",
        library: "/images/library-scene.png",
        nature: "/images/nature-scene.png",
        office: "/images/office-scene.png",
      }
      const newBackground = backgroundMap[value as keyof typeof backgroundMap] || "/images/bedroom-scene.png"
      
      // Update the background immediately
      const bgElement = document.querySelector('.bg-update-element')
      if (bgElement) {
        bgElement.setAttribute('style', 
          `background-image: url(${newBackground}); 
           background-size: cover; 
           background-position: center; 
           background-repeat: no-repeat; 
           transition: background-image 0.5s ease-in-out;`)
      }
    }
    
    // Always update preferences in the background
    await updatePreferences(newPrefs)
  }

  const handleNestedPreferenceChange = (category: string, key: string, value: any) => {
    const newPrefs = {
      ...localPrefs,
      [category]: {
        ...localPrefs[category],
        [key]: value,
      },
    }
    setLocalPrefs(newPrefs)
    // Auto-save for instant feedback
    updatePreferences(newPrefs)
  }

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

          <TabsContent value="general" className="p-4">
            <div className="space-y-6">
              {/* Background Transparency Slider */}
              <div>
                <Label htmlFor="bg-opacity-slider" className="mb-2 block">Menu Background Transparency</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    id="bg-opacity-slider"
                    min={40}
                    max={100}
                    step={1}
                    value={[Math.round((localPrefs.windowBgOpacity ?? 0.85) * 100)]}
                    onValueChange={handleOpacityChange}
                    className="w-48"
                  />
                  <span className="text-xs text-gray-400">{Math.round((localPrefs.windowBgOpacity ?? 0.85) * 100)}%</span>
                </div>
              </div>
            </div>
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
