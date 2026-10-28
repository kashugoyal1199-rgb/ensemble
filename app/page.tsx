'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';

type Role = 'admin' | 'subordinate' | null;

interface QuestionData {
  questionId: number;
  adminFaffResponse: string;
  adminDiscussionTopic: string;
  tlResponses: Array<{
    tlName: string;
    tlEmail: string;
    response: string;
    timestamp: string;
  }>;
}

interface ValidationError {
  field: string;
  message: string;
}

const dailyQuestions = [
  {
    id: 1,
    title: "How is everyone doing?",
    description: "Ask how everyone is doing and whether anything is affecting their ability to start the shift."
  },
  {
    id: 2,
    title: "Share updates",
    description: "Share new instructions, tool changes, important client updates, and previous-day learnings."
  },
  {
    id: 3,
    title: "Example discussion",
    description: "Discuss one real or anonymised example of a good interaction or a mistake."
  },
  {
    id: 4,
    title: "Escalations",
    description: "Discuss about most frequent escalations and a solution."
  },
  {
    id: 5,
    title: "Issue status updates",
    description: "Update on the status: resolved, in progress, or deprioritized."
  },
  {
    id: 6,
    title: "Bug reports",
    description: "Remind them to bug report everyday without fail."
  }
];

const mondayQuestions = [
  {
    id: 101,
    title: "Shoutout for exceptional performance",
    description: "Recognize team members who are doing exceptionally well."
  },
  {
    id: 102,
    title: "How is everything going?",
    description: "Share how you're doing overall. What's going well and what are you enjoying?"
  },
  {
    id: 103,
    title: "Feedback form completion",
    description: "Who has filled out the feedback form? Any blockers or concerns?"
  },
  {
    id: 104,
    title: "Team challenges and solutions",
    description: "What are we struggling to solve as a team? Let's brainstorm together."
  }
];

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

const validateResponse = (response: string): boolean => {
  return response.trim().length > 0 && response.trim().length <= 5000;
};

export default function Ensemble() {
  const [role, setRole] = useState<Role>(null);
  const [tlName, setTlName] = useState('');
  const [tlEmail, setTlEmail] = useState('');
  const [loginInputAdmin, setLoginInputAdmin] = useState('');
  const [loginEmailAdmin, setLoginEmailAdmin] = useState('');
  const [loginInputSubordinate, setLoginInputSubordinate] = useState('');
  const [loginEmailSubordinate, setLoginEmailSubordinate] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [dailyQuestionData, setDailyQuestionData] = useState<QuestionData[]>(
    dailyQuestions.map(q => ({
      questionId: q.id,
      adminFaffResponse: '',
      adminDiscussionTopic: '',
      tlResponses: []
    }))
  );
  const [mondayQuestionData, setMondayQuestionData] = useState<QuestionData[]>(
    mondayQuestions.map(q => ({
      questionId: q.id,
      adminFaffResponse: '',
      adminDiscussionTopic: '',
      tlResponses: []
    }))
  );
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [responseError, setResponseError] = useState('');
  const [savedMessage, setSavedMessage] = useState<{ questionId: number; type: string } | null>(null);
  const [activeView, setActiveView] = useState<'today' | 'monday'>('today');
  const [currentSection, setCurrentSection] = useState<'huddle' | 'feedback'>('huddle');
  const [feedbackFormLink, setFeedbackFormLink] = useState('');
  const [feedbackFormInput, setFeedbackFormInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [formResponseHeaders, setFormResponseHeaders] = useState<string[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('huddle_dailyQuestionData');
    if (stored) setDailyQuestionData(JSON.parse(stored));
    const storedMonday = localStorage.getItem('huddle_mondayQuestionData');
    if (storedMonday) setMondayQuestionData(JSON.parse(storedMonday));
    const storedFeedback = localStorage.getItem('huddle_feedbackFormLink');
    if (storedFeedback) setFeedbackFormLink(storedFeedback);
    const storedApiKey = localStorage.getItem('huddle_apiKey');
    if (storedApiKey) setApiKey(storedApiKey);
    const storedSheetId = localStorage.getItem('huddle_sheetId');
    if (storedSheetId) setSheetId(storedSheetId);
  }, []);

  useEffect(() => {
    localStorage.setItem('huddle_dailyQuestionData', JSON.stringify(dailyQuestionData));
  }, [dailyQuestionData]);

  useEffect(() => {
    localStorage.setItem('huddle_mondayQuestionData', JSON.stringify(mondayQuestionData));
  }, [mondayQuestionData]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: ValidationError[] = [];

    if (!validateName(loginInputAdmin)) {
      errors.push({ field: 'name', message: 'Name must be 2-50 characters' });
    }
    if (!validateEmail(loginEmailAdmin)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setRole('admin');
    setTlName(loginInputAdmin);
    setTlEmail(loginEmailAdmin);
    setLoginInputAdmin('');
    setLoginEmailAdmin('');
  };

  const handleSubordinateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: ValidationError[] = [];

    if (!validateName(loginInputSubordinate)) {
      errors.push({ field: 'name', message: 'Name must be 2-50 characters' });
    }
    if (!validateEmail(loginEmailSubordinate)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setRole('subordinate');
    setTlName(loginInputSubordinate);
    setTlEmail(loginEmailSubordinate);
    setLoginInputSubordinate('');
    setLoginEmailSubordinate('');
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!(window as any).google) {
        alert('Google Sign-In is loading. Please wait and try again.');
        return;
      }

      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleResponse
      });

      (window as any).google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large', width: '300' }
      );
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert('Failed to initialize Google Sign-In');
    }
  };

  const handleGoogleResponse = (response: any) => {
    try {
      const token = response.credential;
      const decoded = JSON.parse(atob(token.split('.')[1]));

      setRole('subordinate');
      setTlName(decoded.name);
      setTlEmail(decoded.email);
      setValidationErrors([]);
    } catch (error) {
      console.error('Google Sign-In decode error:', error);
      alert('Failed to sign in with Google');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      handleGoogleSignIn();
    }
  }, []);

  const updateAdminInput = (questionId: number, type: 'faff' | 'discussion', value: string) => {
    const isDaily = questionId <= 100;
    const data = isDaily ? dailyQuestionData : mondayQuestionData;
    const updated = data.map(q =>
      q.questionId === questionId
        ? {
            ...q,
            adminFaffResponse: type === 'faff' ? value : q.adminFaffResponse,
            adminDiscussionTopic: type === 'discussion' ? value : q.adminDiscussionTopic
          }
        : q
    );
    if (isDaily) setDailyQuestionData(updated);
    else setMondayQuestionData(updated);
  };

  const addTLResponse = (questionId: number) => {
    setResponseError('');

    if (!validateResponse(newResponse)) {
      if (!newResponse.trim()) {
        setResponseError('Response cannot be empty');
      } else if (newResponse.trim().length > 5000) {
        setResponseError('Response must be under 5000 characters');
      }
      return;
    }

    const isDaily = questionId <= 100;
    const data = isDaily ? dailyQuestionData : mondayQuestionData;
    const updated = data.map(q =>
      q.questionId === questionId
        ? {
            ...q,
            tlResponses: [
              ...q.tlResponses,
              {
                tlName,
                tlEmail,
                response: newResponse,
                timestamp: new Date().toISOString()
              }
            ]
          }
        : q
    );
    if (isDaily) setDailyQuestionData(updated);
    else setMondayQuestionData(updated);
    setNewResponse('');
    setSavedMessage({ questionId, type: 'response' });
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const deleteTLResponse = (questionId: number, index: number) => {
    const isDaily = questionId <= 100;
    const data = isDaily ? dailyQuestionData : mondayQuestionData;
    const updated = data.map(q =>
      q.questionId === questionId
        ? {
            ...q,
            tlResponses: q.tlResponses.filter((_, i) => i !== index)
          }
        : q
    );
    if (isDaily) setDailyQuestionData(updated);
    else setMondayQuestionData(updated);
  };

  const saveFeedbackFormLink = () => {
    if (!feedbackFormInput.trim()) {
      alert('Please enter a form link');
      return;
    }
    localStorage.setItem('huddle_feedbackFormLink', feedbackFormInput);
    setFeedbackFormLink(feedbackFormInput);
    setFeedbackFormInput('');
    setSavedMessage({ questionId: 999, type: 'link' });
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const saveGoogleToken = () => {
    if (!apiKey.trim() || !sheetId.trim()) {
      alert('Please fill in both API Key and Sheet ID');
      return;
    }
    localStorage.setItem('huddle_apiKey', apiKey);
    localStorage.setItem('huddle_sheetId', sheetId);
    setSavedMessage({ questionId: 998, type: 'token' });
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const currentQuestions = activeView === 'today' ? dailyQuestions : mondayQuestions;
  const currentData = activeView === 'today' ? dailyQuestionData : mondayQuestionData;

  const renderQuestions = () => {
    return (
      <div className="space-y-4">
        {currentQuestions.map((question) => {
          const qData = currentData.find(d => d.questionId === question.id);
          const isExpanded = expandedQuestion === question.id;

          return (
            <div key={question.id} className="card-clean overflow-hidden">
              <button
                onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                className="w-full p-6 flex items-start justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{question.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{question.description}</p>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 transition-transform duration-300 ml-4 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 p-6 bg-slate-50">
                  {role === 'admin' && (
                    <div className="space-y-6 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                          What Faffers are saying
                        </label>
                        <textarea
                          value={qData?.adminFaffResponse || ''}
                          onChange={(e) => updateAdminInput(question.id, 'faff', e.target.value)}
                          placeholder="Admin notes only (hidden from TLs)..."
                          maxLength={5000}
                          className="input-clean h-24 resize-none text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-2">{qData?.adminFaffResponse.length || 0}/5000</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                          What TLs should discuss
                        </label>
                        <textarea
                          value={qData?.adminDiscussionTopic || ''}
                          onChange={(e) => updateAdminInput(question.id, 'discussion', e.target.value)}
                          placeholder="This will be visible to all TLs..."
                          maxLength={5000}
                          className="input-clean h-24 resize-none text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-2">{qData?.adminDiscussionTopic.length || 0}/5000</p>
                        <button
                          onClick={() => {
                            localStorage.setItem('huddle_dailyQuestionData', JSON.stringify(dailyQuestionData));
                            localStorage.setItem('huddle_mondayQuestionData', JSON.stringify(mondayQuestionData));
                            setSavedMessage({ questionId: question.id, type: 'discussion' });
                            setTimeout(() => setSavedMessage(null), 2000);
                          }}
                          className="mt-3 btn-primary text-sm"
                        >
                          Save
                        </button>
                        {savedMessage?.questionId === question.id && savedMessage?.type === 'discussion' && (
                          <div className="mt-2 text-sm text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle size={14} /> Saved successfully
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {role === 'subordinate' && (
                    <div className="mb-6 p-4 bg-white rounded-lg border border-blue-100">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Discussion topic:</p>
                      <p className="text-sm text-slate-700">{qData?.adminDiscussionTopic || '—'}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-3">
                        Your response
                      </label>
                      <textarea
                        value={newResponse}
                        onChange={(e) => {
                          setNewResponse(e.target.value);
                          setResponseError('');
                        }}
                        placeholder="Add your response here..."
                        maxLength={5000}
                        className="input-clean h-20 resize-none text-sm"
                      />
                      <div className="flex justify-between items-start mt-2">
                        <div>
                          {responseError && (
                            <div className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle size={14} /> {responseError}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{newResponse.length}/5000</p>
                      </div>
                      <button
                        onClick={() => addTLResponse(question.id)}
                        className="mt-3 btn-primary text-sm flex items-center gap-2"
                      >
                        <Plus size={16} /> Add response
                      </button>
                    </div>

                    {qData?.tlResponses && qData.tlResponses.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Responses from team</p>
                        <div className="space-y-3">
                          {qData.tlResponses.map((response, idx) => (
                            <div key={idx} className="flex gap-3 p-3 bg-white rounded-lg border border-slate-200">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">{response.tlName}</p>
                                <p className="text-xs text-slate-500">{response.tlEmail}</p>
                                <p className="text-sm text-slate-700 mt-1">{response.response}</p>
                              </div>
                              {role === 'admin' && (
                                <button
                                  onClick={() => deleteTLResponse(question.id, idx)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900">Ensemble</h2>
            <p className="text-slate-600 mt-2">Team synchronization platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleAdminLogin} className="card-clean p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Admin Lead</h3>

              {validationErrors.some(e => e.field === 'name') && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    {validationErrors.find(e => e.field === 'name')?.message}
                  </p>
                </div>
              )}

              <input
                type="text"
                value={loginInputAdmin}
                onChange={(e) => setLoginInputAdmin(e.target.value)}
                placeholder="Full name (2-50 characters)"
                className="input-clean mb-4"
              />

              {validationErrors.some(e => e.field === 'email') && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    {validationErrors.find(e => e.field === 'email')?.message}
                  </p>
                </div>
              )}

              <input
                type="email"
                value={loginEmailAdmin}
                onChange={(e) => setLoginEmailAdmin(e.target.value)}
                placeholder="Work email address"
                className="input-clean mb-6"
              />

              <button type="submit" className="btn-primary w-full">
                Continue as Admin
              </button>
            </form>

            <form onSubmit={handleSubordinateLogin} className="card-clean p-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">Team Lead</h3>

              {validationErrors.some(e => e.field === 'name') && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    {validationErrors.find(e => e.field === 'name')?.message}
                  </p>
                </div>
              )}

              <input
                type="text"
                value={loginInputSubordinate}
                onChange={(e) => setLoginInputSubordinate(e.target.value)}
                placeholder="Full name (2-50 characters)"
                className="input-clean mb-4"
              />

              {validationErrors.some(e => e.field === 'email') && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    {validationErrors.find(e => e.field === 'email')?.message}
                  </p>
                </div>
              )}

              <input
                type="email"
                value={loginEmailSubordinate}
                onChange={(e) => setLoginEmailSubordinate(e.target.value)}
                placeholder="Work email address"
                className="input-clean mb-6"
              />

              <button type="submit" className="btn-primary w-full mb-4">
                Continue as Team Lead
              </button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-white text-slate-600">or</span>
                </div>
              </div>

              <div id="google-signin-button" className="flex justify-center"></div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {activeView === 'today' ? "Today's Huddle" : "Monday Huddle"}
          </h1>
          <p className="text-slate-600 mt-1">Welcome, {tlName} • {tlEmail}</p>
        </div>
        <button
          onClick={() => {
            setRole(null);
            setTlName('');
            setTlEmail('');
          }}
          className="btn-secondary"
        >
          Sign out
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveView('today')}
          className={`tab-button ${activeView === 'today' ? 'active' : 'inactive'}`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveView('monday')}
          className={`tab-button ${activeView === 'monday' ? 'active' : 'inactive'}`}
        >
          Monday
        </button>
      </div>

      {currentSection === 'huddle' && renderQuestions()}

      {role === 'admin' && (
        <div className="flex gap-2 mt-8">
          <button
            onClick={() => setCurrentSection('huddle')}
            className={`tab-button ${currentSection === 'huddle' ? 'active' : 'inactive'}`}
          >
            Huddle
          </button>
          <button
            onClick={() => setCurrentSection('feedback')}
            className={`tab-button ${currentSection === 'feedback' ? 'active' : 'inactive'}`}
          >
            Feedback & Analytics
          </button>
        </div>
      )}

      {currentSection === 'feedback' && role === 'admin' && (
        <div className="space-y-6 mt-8">
          <div className="card-clean p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Feedback Form</h2>
            <input
              type="url"
              value={feedbackFormInput}
              onChange={(e) => setFeedbackFormInput(e.target.value)}
              placeholder="https://forms.google.com/..."
              className="input-clean mb-4"
            />
            <button
              onClick={saveFeedbackFormLink}
              className="btn-primary mb-4"
            >
              Save Form Link
            </button>
            {feedbackFormLink && (
              <a
                href={feedbackFormLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                → Open feedback form
              </a>
            )}
          </div>

          <div className="card-clean p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Google Sheets Integration</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Google API Key"
                className="input-clean"
              />
              <input
                type="text"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                placeholder="Google Sheet ID"
                className="input-clean"
              />
              <button onClick={saveGoogleToken} className="btn-primary">
                Save credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
