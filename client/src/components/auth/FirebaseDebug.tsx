import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FirebaseDebug() {
  const [status, setStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Check Firebase configuration
    const checkConfig = () => {
      addResult('🔧 Checking Firebase configuration...');
      
      // Log environment variables
      addResult(`ENV - DEV: ${import.meta.env.DEV}`);
      addResult(`ENV - MODE: ${import.meta.env.MODE}`);
      addResult(`ENV - USE_EMULATOR: ${import.meta.env.VITE_USE_FIREBASE_EMULATOR}`);
      addResult(`ENV - AUTH_HOST: ${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST}`);
      addResult(`ENV - PROJECT_ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`);
      addResult(`ENV - API_KEY: ${import.meta.env.VITE_FIREBASE_API_KEY}`);
      addResult(`ENV - AUTH_DOMAIN: ${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}`);
      
      // Log all VITE_ environment variables
      addResult('--- All VITE Environment Variables ---');
      Object.keys(import.meta.env).forEach(key => {
        if (key.startsWith('VITE_')) {
          addResult(`${key}: ${import.meta.env[key]}`);
        }
      });
      addResult('--- End Environment Variables ---');
      
      // Check auth instance
      if (auth) {
        addResult(`✅ Auth instance created`);
        addResult(`Project ID: ${auth.app.options.projectId}`);
        addResult(`Auth Domain: ${auth.app.options.authDomain}`);
      } else {
        addResult(`❌ Auth instance not found`);
      }
      
      setStatus('Configuration checked');
    };

    checkConfig();
  }, []);

  const testAnonymousAuth = async () => {
    try {
      addResult('🧪 Testing anonymous authentication...');
      setError(null);
      
      const result = await signInAnonymously(auth);
      addResult(`✅ Anonymous auth successful: ${result.user.uid}`);
      
      // Sign out
      await auth.signOut();
      addResult('✅ Sign out successful');
      
    } catch (error: any) {
      const errorMsg = `❌ Anonymous auth failed: ${error.code} - ${error.message}`;
      addResult(errorMsg);
      setError(errorMsg);
    }
  };

  const testEmailAuth = async () => {
    try {
      addResult('🧪 Testing email/password authentication...');
      setError(null);
      
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      addResult(`Creating user: ${testEmail}`);
      
      const result = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      addResult(`✅ Email auth successful: ${result.user.uid}`);
      
      // Sign out
      await auth.signOut();
      addResult('✅ Sign out successful');
      
    } catch (error: any) {
      const errorMsg = `❌ Email auth failed: ${error.code} - ${error.message}`;
      addResult(errorMsg);
      setError(errorMsg);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setError(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Firebase Debug Console</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={testAnonymousAuth} variant="outline">
            Test Anonymous Auth
          </Button>
          <Button onClick={testEmailAuth} variant="outline">
            Test Email Auth
          </Button>
          <Button onClick={clearResults} variant="ghost">
            Clear
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h4 className="font-semibold mb-2">Debug Log:</h4>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No results yet...</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Expected Auth Emulator:</strong> http://127.0.0.1:9099</p>
          <p><strong>Current Project ID:</strong> {auth?.app?.options?.projectId}</p>
        </div>
      </CardContent>
    </Card>
  );
}