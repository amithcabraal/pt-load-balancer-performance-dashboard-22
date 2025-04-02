import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  HelpCircle,
  Database,
  FileText,
  Settings,
  ExternalLink,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload
} from 'lucide-react';
import { useThemeStore } from '../store/theme';
import { useSettingsStore } from '../store/settings';
import { QueryGenerator } from './QueryGenerator';

interface BurgerMenuProps {
  onShowInstructions: () => void;
}

export function BurgerMenu({ onShowInstructions }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQueryGenerator, setShowQueryGenerator] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const settingsStore = useSettingsStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.getElementById('burger-menu');
      if (menu && !menu.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const MenuItem = ({ icon: Icon, children, onClick, className = '' }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );

  const SubMenuItem = ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 pl-10 pr-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <ExternalLink className="w-4 h-4" />
      {children}
    </a>
  );

  const handleExportSettings = () => {
    const settings = {
      theme: theme,
      chartConfigs: settingsStore.chartConfigs,
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pt-dashboard-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleImportSettings = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        
        // Validate and import theme
        if (settings.theme && ['light', 'dark', 'system'].includes(settings.theme)) {
          setTheme(settings.theme);
        }

        // Import chart configs
        if (settings.chartConfigs) {
          settingsStore.importSettings({ chartConfigs: settings.chartConfigs });
        }

        setIsOpen(false);
      } catch (error) {
        alert('Error importing settings: Invalid format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div id="burger-menu" className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
          <div className="py-2">
            <MenuItem
              icon={HelpCircle}
              onClick={() => {
                onShowInstructions();
                setIsOpen(false);
              }}
            >
              Instructions
            </MenuItem>

            <div className="relative group">
              <MenuItem icon={Database}>
                Data Sources
                <span className="ml-auto">›</span>
              </MenuItem>
              <div className="hidden group-hover:block absolute right-full top-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 mr-1">
                <div className="py-2">
                  <SubMenuItem href="https://eu-west-2.console.aws.amazon.com/athena/home?region=eu-west-2">
                    Open AWS Athena
                  </SubMenuItem>
                  <SubMenuItem href="https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/cache">
                    CF Cache Stats
                  </SubMenuItem>
                  <SubMenuItem href="https://us-east-1.console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/popular_urls">
                    CF Popular Objects
                  </SubMenuItem>
                  <SubMenuItem href="https://loadrunner-cloud-eur.saas.microfocus.com/results/?TENANTID=335176489&projectId=1">
                    LoadRunner Results
                  </SubMenuItem>
                </div>
              </div>
            </div>

            <MenuItem
              icon={FileText}
              onClick={() => {
                setShowQueryGenerator(true);
                setIsOpen(false);
              }}
            >
              Generate LB Query
            </MenuItem>

            <div className="relative group">
              <MenuItem icon={Settings}>
                Settings
                <span className="ml-auto">›</span>
              </MenuItem>
              <div className="hidden group-hover:block absolute right-full top-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 mr-1">
                <div className="py-2">
                  <MenuItem
                    icon={Sun}
                    onClick={() => setTheme('light')}
                    className={`text-sm ${theme === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    Light Mode
                  </MenuItem>
                  <MenuItem
                    icon={Moon}
                    onClick={() => setTheme('dark')}
                    className={`text-sm ${theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    Dark Mode
                  </MenuItem>
                  <MenuItem
                    icon={Monitor}
                    onClick={() => setTheme('system')}
                    className={`text-sm ${theme === 'system' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    System
                  </MenuItem>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <MenuItem
                    icon={Download}
                    onClick={handleExportSettings}
                    className="text-sm"
                  >
                    Export Settings
                  </MenuItem>
                  <MenuItem
                    icon={Upload}
                    onClick={handleImportSettings}
                    className="text-sm"
                  >
                    Import Settings
                  </MenuItem>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <QueryGenerator
        isOpen={showQueryGenerator}
        onClose={() => setShowQueryGenerator(false)}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
      />
    </div>
  );
}