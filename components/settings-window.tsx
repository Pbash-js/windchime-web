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
  { id: "bedroom", name: "Cozy Bedroom", path: "/images/bedroom-scene.png", type: "image" },
  { id: "library", name: "Library", path: "/images/library-scene.png", type: "image" },
  { id: "nature", name: "Nature View", path: "/images/nature-scene.png", type: "image" },
  { id: "office", name: "Modern Office", path: "/images/office-scene.png", type: "image" },
  { id: "arona-cherry-blossom", name: "Arona Cherry Blossom", path: "https://static.moewalls.com/videos/preview/2025/arona-cherry-blossom-blue-archive-preview.webm", type: "video" },
  { id: "gojo-kitty", name: "Gojo & Kitty", path: "https://static.moewalls.com/videos/preview/2023/gojo-and-kitty-jujutsu-kaisen-preview.webm", type: "video" },
  { id: "dragon-slayer", name: "Dragon Slayer", path: "https://static.moewalls.com/videos/preview/2023/the-dragon-slayer-sword-berserk-preview.webm", type: "video" },
  { id: "lofi-house", name: "Lofi House", path: "https://static.moewalls.com/videos/preview/2024/lofi-house-cloudy-day-1-preview.webm", type: "video" },
  { id: "lofi-furries", name: "Lofi Furries Camping", path: "https://static.moewalls.com/videos/preview/2023/lofi-furries-night-camping-preview.webm", type: "video" },
  { id: "lofi-homework", name: "Lofi Homework", path: "https://static.moewalls.com/videos/preview/2022/lofi-girl-doing-homework-preview.webm", type: "video" },
  { id: "thousand-years", name: "Thousand Years", path: "https://static.moewalls.com/videos/preview/2024/my-wife-is-from-thousand-years-ago-pixel-preview.webm", type: "video" },
  { id: "train-cloudy", name: "Train Journey", path: "https://static.moewalls.com/videos/preview/2024/train-cloudy-day-preview.webm", type: "video" },
  { id: "cat-rain", name: "Cat Watching Rain", path: "https://static.moewalls.com/videos/preview/2023/cat-watching-rain-preview.webm", type: "video" },
  { id: "autumn-bedroom", name: "Autumn Bedroom", path: "https://static.moewalls.com/videos/preview/2023/autumn-bedroom-preview.webm", type: "video" },
]

const colorOptions = [
  { name: 'Slate', value: '24,24,28' },
  { name: 'Stone', value: '30,28,28' },
  { name: 'Sky', value: '14,26,42' },
  { name: 'Violet', value: '32,18,48' },
  { name: 'Jet', value: '10,10,10' },
  { name: 'Frost', value: '250,250,250' },
  { name: 'Blush', value: '249,205,219' },
  { name: 'Canary', value: '253,246,203' },
];

const defaultWindowStyles = {
  headerAutoHide: false,
  headerHideDelay: 2000,
  windowBgOpacity: 0.85,
  windowBgBlur: 5,
  backgroundBlur: 0,
  windowBgColor: '24,24,28',
  windowBorderRadius: 8,
  windowShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
};

export function SettingsWindow() {
  const { 
    theme, 
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
  
  const [tempWindowStyles, setTempWindowStyles] = useState(() => ({ ...defaultWindowStyles, ...windowStyles }));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Sync context changes to our temporary local state for instant UI feedback
  useEffect(() => {
    setTempWindowStyles({ ...defaultWindowStyles, ...windowStyles });
  }, [windowStyles]);

  // Apply theme from context
  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [theme, setTheme]);

  // Apply styles to the document
  useEffect(() => {
    document.body.style.setProperty('--bg-image', `url(${backgroundImages.find(bg => bg.id === backgroundScene)?.path || backgroundImages[0].path})`);
    document.documentElement.style.setProperty('--window-bg-opacity', tempWindowStyles.windowBgOpacity.toString());
    const windowBlurValue = tempWindowStyles.windowBgBlur > 0 ? `blur(${tempWindowStyles.windowBgBlur}px)` : 'none';
    document.documentElement.style.setProperty('--window-bg-blur', windowBlurValue);
    const backgroundBlurValue = tempWindowStyles.backgroundBlur > 0 ? `blur(${tempWindowStyles.backgroundBlur}px)` : 'none';
    document.documentElement.style.setProperty('--background-blur', backgroundBlurValue);
    document.documentElement.style.setProperty('--window-bg-color', tempWindowStyles.windowBgColor);
    document.documentElement.style.setProperty('--window-border-radius', `${tempWindowStyles.windowBorderRadius}px`);
    document.documentElement.style.setProperty('--window-shadow', tempWindowStyles.windowShadow);
    document.documentElement.style.setProperty('--header-auto-hide', tempWindowStyles.headerAutoHide ? '1' : '0');
    document.documentElement.style.setProperty('--header-hide-delay', `${tempWindowStyles.headerHideDelay}ms`);
  }, [tempWindowStyles, backgroundScene]);

  // Event handlers ONLY call the context updater.
  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    updateLocalPreferences({ [key]: value });
  };
  
  const handleNestedPreferenceChange = <K extends 'pomodoroSettings' | 'notifications' | 'privacy'>(
    category: K, 
    key: keyof UserPreferences[K], 
    value: any
  ) => {
    const currentCategoryState = {
        'pomodoroSettings': pomodoroSettings,
        'notifications': notifications,
        'privacy': privacy,
    }[category] || {};

    const newCategory = { ...currentCategoryState, [key]: value };
    updateLocalPreferences({ [category]: newCategory });
  };

  const handleWindowStyleChange = (key: WindowStyleKey, value: any, saveImmediately = false) => {
    const newStyles = { ...tempWindowStyles, [key]: value };
    setTempWindowStyles(newStyles);
    setHasUnsavedChanges(true);
    if (saveImmediately) {
      saveWindowStyles(newStyles);
    }
  };
  
  const saveWindowStyles = (styles = tempWindowStyles) => {
    updateLocalPreferences({ windowStyles: styles });
    setHasUnsavedChanges(false);
    toast({ title: "Settings saved", description: "Your window style preferences have been updated." });
  };
  
  type WindowStyleKey = 'headerAutoHide' | 'headerHideDelay' | 'windowBgOpacity' | 'windowBgBlur' | 'backgroundBlur' | 'windowBgColor' | 'windowBorderRadius' | 'windowShadow';
  
  const handleSliderChange = useCallback((key: WindowStyleKey, value: any, isSliderCommit = false) => {
    handleWindowStyleChange(key, value, isSliderCommit);
  }, [tempWindowStyles]);

  // **RESTORED:** Full renderSlider implementation
  const renderSlider = useCallback(({ id, value, min, max, step, format = (v: number) => v.toString(), onChange, onCommit }: { id: string; value: number; min: number; max: number; step: number; format?: (value: number) => string; onChange: (value: number) => void; onCommit: (value: number) => void; }) => (
    <Slider id={id} min={min} max={max} step={step} value={[value]} onValueChange={([val]) => onChange(val)} onValueCommit={([val]) => onCommit(val)} className="w-full" />
  ), []);

  // Derive values from context for rendering, with fallbacks
  const currentPomodoroSettings = pomodoroSettings || {};
  const currentNotifications = notifications || {};
  const currentPrivacy = privacy || {};

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
          <TabsTrigger value="appearance" className="text-xs"> <Palette className="h-3 w-3 mr-1" /> Theme </TabsTrigger>
          <TabsTrigger value="pomodoro" className="text-xs"> <Timer className="h-3 w-3 mr-1" /> Timer </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs"> <Bell className="h-3 w-3 mr-1" /> Alerts </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs"> <Shield className="h-3 w-3 mr-1" /> Privacy </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="appearance" className="space-y-4 mt-0">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-sm"><Monitor className="h-4 w-4" />Theme</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <RadioGroup value={theme} onValueChange={(value) => handlePreferenceChange("theme", value as any)}>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="light" /><Label htmlFor="light" className="flex items-center gap-2 text-white text-sm"><Sun className="h-3 w-3" />Light</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="dark" id="dark" /><Label htmlFor="dark" className="flex items-center gap-2 text-white text-sm"><Moon className="h-3 w-3" />Dark</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="system" id="system" /><Label htmlFor="system" className="flex items-center gap-2 text-white text-sm"><Monitor className="h-3 w-3" />System</Label></div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-sm"><LayoutGrid className="h-4 w-4" />Window Styling</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1">
                  <Label className="text-xs text-white">Window Tint</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleWindowStyleChange('windowBgColor', color.value, true)}
                        className={`w-full aspect-square rounded-md border-2 transition-all flex items-center justify-center ${
                          tempWindowStyles.windowBgColor === color.value
                            ? 'border-white ring-2 ring-white/50'
                            : 'border-transparent hover:border-white/50'
                        }`}
                        style={{ backgroundColor: `rgb(${color.value})` }}
                        aria-label={`Set window tint to ${color.name}`}
                      >
                         <span className="text-xs text-black/50 mix-blend-difference invert">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* **RESTORED:** Full block of sliders and switches */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><Label htmlFor="headerAutoHide" className="text-xs text-white">Auto-hide Header</Label><Switch id="headerAutoHide" checked={tempWindowStyles.headerAutoHide} onCheckedChange={(checked) => handleWindowStyleChange('headerAutoHide', checked, true)}/></div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between"><Label htmlFor="headerHideDelay" className="text-xs text-white">Header Hide Delay: {tempWindowStyles.headerHideDelay || 2000}ms</Label></div>
                    {renderSlider({ id: 'headerHideDelay', value: tempWindowStyles.headerHideDelay || 2000, min: 500, max: 5000, step: 100, format: (v) => `${v}ms`, onChange: (value) => handleSliderChange('headerHideDelay', value, false), onCommit: (value) => handleSliderChange('headerHideDelay', value, true) })}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between"><Label htmlFor="windowBgOpacity" className="text-xs text-white">Window Opacity: {Math.round((tempWindowStyles.windowBgOpacity || 0.85) * 100)}%</Label></div>
                    {renderSlider({ id: 'windowBgOpacity', value: Math.round((tempWindowStyles.windowBgOpacity || 0.85) * 100), min: 0, max: 100, step: 5, format: (v) => `${v}%`, onChange: (value) => handleSliderChange('windowBgOpacity', value / 100, false), onCommit: (value) => handleSliderChange('windowBgOpacity', value / 100, true) })}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between"><Label htmlFor="windowBgBlur" className="text-xs text-white">Window Blur: {tempWindowStyles.windowBgBlur === 0 ? 'Off' : `${tempWindowStyles.windowBgBlur}px`}</Label></div>
                    {renderSlider({ id: 'windowBgBlur', value: tempWindowStyles.windowBgBlur || 0, min: 0, max: 20, step: 1, format: (v) => v === 0 ? 'Off' : `${v}px`, onChange: (value) => handleSliderChange('windowBgBlur', value, false), onCommit: (value) => handleSliderChange('windowBgBlur', value, true) })}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between"><Label htmlFor="backgroundBlur" className="text-xs text-white">Background Blur: {tempWindowStyles.backgroundBlur === 0 ? 'Off' : `${tempWindowStyles.backgroundBlur}px`}</Label></div>
                    {renderSlider({ id: 'backgroundBlur', value: tempWindowStyles.backgroundBlur || 0, min: 0, max: 20, step: 1, format: (v) => v === 0 ? 'Off' : `${v}px`, onChange: (value) => handleSliderChange('backgroundBlur', value, false), onCommit: (value) => handleSliderChange('backgroundBlur', value, true) })}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between"><Label htmlFor="windowBorderRadius" className="text-xs text-white">Border Radius: {tempWindowStyles.windowBorderRadius || 8}px</Label></div>
                    {renderSlider({ id: 'windowBorderRadius', value: tempWindowStyles.windowBorderRadius || 8, min: 0, max: 20, step: 1, format: (v) => `${v}px`, onChange: (value) => handleSliderChange('windowBorderRadius', value, false), onCommit: (value) => handleSliderChange('windowBorderRadius', value, true) })}
                  </div>
                  {hasUnsavedChanges && (<div className="pt-2"><button onClick={() => saveWindowStyles()} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 px-3 rounded transition-colors">Save Changes</button></div>)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-sm"><ImageIcon className="h-4 w-4" />Background</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {backgroundImages.map((bg) => (
                    <div key={bg.id} className="relative group">
                      {/* **RESTORED:** Full button content */}
                      <button onClick={() => handlePreferenceChange("backgroundScene", bg.id)} className={`relative w-full aspect-video rounded-md overflow-hidden border transition-all duration-200 hover:scale-105 ${backgroundScene === bg.id ? "border-blue-500 ring-1 ring-blue-500/50" : "border-gray-600 hover:border-gray-500"}`}>
                        {bg.type === 'video' ? (<video autoPlay loop muted playsInline className="w-full h-full object-cover" src={bg.path} onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => { e.currentTarget.currentTime = 0; e.currentTarget.pause(); }}/>) : (<div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${bg.path})` }}/>)}
                        <div className="absolute inset-0 bg-black/40 flex items-end"><div className="p-1 w-full"><div className="text-xs font-medium text-white">{bg.name}{bg.type === 'video' && (<span className="ml-1 text-xs text-blue-300">• Premium</span>)}</div></div></div>
                        {backgroundScene === bg.id && (<div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full" /></div>)}
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pomodoro" className="space-y-4 mt-0">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-sm"><Timer className="h-4 w-4" />Pomodoro Timer</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div><Label className="text-white mb-2 block text-sm">Work: {currentPomodoroSettings.workDuration || 25}m</Label><Slider value={[currentPomodoroSettings.workDuration || 25]} onValueChange={(value) => handleNestedPreferenceChange("pomodoroSettings", "workDuration", value[0])} max={60} min={5} step={5} className="w-full"/></div>
                <div><Label className="text-white mb-2 block text-sm">Short Break: {currentPomodoroSettings.shortBreakDuration || 5}m</Label><Slider value={[currentPomodoroSettings.shortBreakDuration || 5]} onValueChange={(value) => handleNestedPreferenceChange("pomodoroSettings", "shortBreakDuration", value[0])} max={30} min={1} step={1} className="w-full"/></div>
                <div><Label className="text-white mb-2 block text-sm">Long Break: {currentPomodoroSettings.longBreakDuration || 15}m</Label><Slider value={[currentPomodoroSettings.longBreakDuration || 15]} onValueChange={(value) => handleNestedPreferenceChange("pomodoroSettings", "longBreakDuration", value[0])} max={60} min={5} step={5} className="w-full"/></div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label className="text-white text-sm">Auto-start breaks</Label><Switch checked={currentPomodoroSettings.autoStartBreaks} onCheckedChange={(checked) => handleNestedPreferenceChange("pomodoroSettings", "autoStartBreaks", checked)}/></div>
                  <div className="flex items-center justify-between"><Label className="text-white text-sm">Sound enabled</Label><Switch checked={currentPomodoroSettings.soundEnabled} onCheckedChange={(checked) => handleNestedPreferenceChange("pomodoroSettings", "soundEnabled", checked)}/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-0">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-sm"><Bell className="h-4 w-4" />Notifications</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between"><Label className="text-white text-sm">Desktop notifications</Label><Switch checked={currentNotifications.desktop} onCheckedChange={(checked) => handleNestedPreferenceChange("notifications", "desktop", checked)}/></div>
                <div className="flex items-center justify-between"><Label className="text-white text-sm">Sound notifications</Label><Switch checked={currentNotifications.sound} onCheckedChange={(checked) => handleNestedPreferenceChange("notifications", "sound", checked)}/></div>
                <div className="flex items-center justify-between"><Label className="text-white text-sm">Email notifications</Label><Switch checked={currentNotifications.email} onCheckedChange={(checked) => handleNestedPreferenceChange("notifications", "email", checked)}/></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-0">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2 text-sm"><Shield className="h-4 w-4" />Privacy</CardTitle></CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div><Label className="text-white text-sm">Analytics</Label><p className="text-xs text-gray-400">Help improve the app</p></div>
                  <Switch checked={currentPrivacy.analytics} onCheckedChange={(checked) => handleNestedPreferenceChange("privacy", "analytics", checked)}/>
                </div>
                <div className="flex items-center justify-between">
                  <div><Label className="text-white text-sm">Crash reports</Label><p className="text-xs text-gray-400">Auto-send crash reports</p></div>
                  <Switch checked={currentPrivacy.crashReports} onCheckedChange={(checked) => handleNestedPreferenceChange("privacy", "crashReports", checked)}/>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}