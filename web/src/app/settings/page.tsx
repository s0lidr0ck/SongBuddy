'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDB } from '@/lib/db/rxdb';
import { importBollsFlat } from '@/lib/bible/importBollsFlat';

interface Translation {
  code: string;
  name: string;
  installed: boolean;
  size?: string;
}

export default function SettingsPage() {
  const [translations, setTranslations] = useState<Translation[]>([
    { code: 'KJV', name: 'King James Version', installed: false, size: '4.5MB' },
    { code: 'ESV', name: 'English Standard Version', installed: false, size: '4.2MB' },
    { code: 'NIV', name: 'New International Version', installed: false, size: '4.1MB' },
    { code: 'NASB', name: 'New American Standard Bible', installed: false, size: '4.3MB' },
    { code: 'NLT', name: 'New Living Translation', installed: false, size: '4.6MB' },
    { code: 'CSB', name: 'Christian Standard Bible', installed: false, size: '4.2MB' },
    { code: 'NKJV', name: 'New King James Version', installed: false, size: '4.4MB' },
    { code: 'AMP', name: 'Amplified Bible', installed: false, size: '5.8MB' },
  ]);
  
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    checkInstalledTranslations();
  }, []);

  const checkInstalledTranslations = async () => {
    try {
      const db = await getDB();
      const installedCodes = new Set();
      
      for (const trans of translations) {
        const doc = await db.verses.findOne({
          selector: { translation: trans.code }
        }).exec();
        
        if (doc) {
          installedCodes.add(trans.code);
        }
      }
      
      setTranslations(prev => prev.map(t => ({
        ...t,
        installed: installedCodes.has(t.code)
      })));
    } catch (error) {
      console.error('Error checking translations:', error);
    }
  };

  const handleFileUpload = async (translationCode: string, file: File) => {
    setUploading(translationCode);
    try {
      await importBollsFlat(translationCode, file);
      await checkInstalledTranslations();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import translation. Please check the file format.');
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveTranslation = async (translationCode: string) => {
    try {
      const db = await getDB();
      await db.verses.find({
        selector: { translation: translationCode }
      }).remove();
      await checkInstalledTranslations();
    } catch (error) {
      console.error('Failed to remove translation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Bible Translations</h2>
          
          <div className="space-y-4">
            {translations.map((translation) => (
              <div key={translation.code} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{translation.name}</h3>
                  <p className="text-sm text-gray-500">{translation.code} • {translation.size}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {translation.installed ? (
                    <>
                      <span className="text-green-600 font-medium">✓ Installed</span>
                      <button
                        onClick={() => handleRemoveTranslation(translation.code)}
                        className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {uploading === translation.code ? (
                        <span className="text-blue-600 font-medium">Installing...</span>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept=".json"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(translation.code, file);
                              }
                            }}
                            className="hidden"
                            id={`file-${translation.code}`}
                          />
                          <label
                            htmlFor={`file-${translation.code}`}
                            className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded cursor-pointer hover:bg-blue-50"
                          >
                            Upload JSON
                          </label>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to add translations:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Download Bolls Bible JSON files from reliable sources</li>
              <li>2. Ensure the JSON format has: translation, book, chapter, verse, text fields</li>
              <li>3. Click "Upload JSON" and select your file</li>
              <li>4. The translation will be available offline once installed</li>
            </ol>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">App Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Bible Translation
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-md">
                {translations.filter(t => t.installed).map(t => (
                  <option key={t.code} value={t.code}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-md">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default BPM
              </label>
              <input 
                type="number" 
                min="40" 
                max="200" 
                defaultValue="72"
                className="w-full p-2 border border-gray-300 rounded-md" 
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}