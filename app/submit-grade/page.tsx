'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SubmissionForm {
  grading_key: string;
  claimed_grade: string;
  course: string;
  professor: string;
  semester: string;
  screenshot: File | null;
}

export default function SubmitGradePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [form, setForm] = useState<SubmissionForm>({
    grading_key: '',
    claimed_grade: '',
    course: '',
    professor: '',
    semester: '',
    screenshot: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      redirect('/login');
      return;
    }
    setSession(session);
    setLoading(false);
  }

  const gradeOptions = [
    { value: 'A+', gpa: 4.0 },
    { value: 'A', gpa: 4.0 },
    { value: 'A-', gpa: 3.7 },
    { value: 'B+', gpa: 3.3 },
    { value: 'B', gpa: 3.0 },
    { value: 'B-', gpa: 2.7 },
    { value: 'C+', gpa: 2.3 },
    { value: 'C', gpa: 2.0 },
    { value: 'C-', gpa: 1.7 },
    { value: 'D+', gpa: 1.3 },
    { value: 'D', gpa: 1.0 },
    { value: 'D-', gpa: 0.7 },
    { value: 'F', gpa: 0.0 },
  ];

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.grading_key.trim()) {
      newErrors.grading_key = 'Grading key is required';
    } else if (!form.grading_key.startsWith('BSET-GRADE-')) {
      newErrors.grading_key = 'Invalid grading key format';
    }

    if (!form.claimed_grade) {
      newErrors.claimed_grade = 'Grade is required';
    }

    if (!form.course.trim()) {
      newErrors.course = 'Course name is required';
    }

    if (!form.professor.trim()) {
      newErrors.professor = 'Professor name is required';
    }

    if (!form.semester.trim()) {
      newErrors.semester = 'Semester is required';
    }

    if (!form.screenshot) {
      newErrors.screenshot = 'Grade screenshot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Upload screenshot to Supabase Storage
      const fileExt = form.screenshot!.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `grade-screenshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('artifacts')
        .upload(filePath, form.screenshot!);

      if (uploadError) {
        alert('Failed to upload screenshot: ' + uploadError.message);
        setSubmitting(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('artifacts')
        .getPublicUrl(filePath);

      // Submit to API
      const selectedGrade = gradeOptions.find(g => g.value === form.claimed_grade);

      const response = await fetch('/api/grades/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          grading_key: form.grading_key.trim(),
          claimed_grade: form.claimed_grade,
          claimed_grade_gpa: selectedGrade!.gpa,
          course: form.course.trim(),
          professor: form.professor.trim(),
          semester: form.semester.trim(),
          screenshot_url: urlData.publicUrl,
          student_email: session.user.email
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to submit grade');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);

    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit grade verification');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-4">Grade Submitted!</h1>
          <p className="text-gray-400 mb-2">
            Your grade verification has been submitted for review.
          </p>
          <p className="text-gray-400 mb-6">
            You'll receive an email once it's been approved (typically within 24-48 hours).
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({
                  grading_key: '',
                  claimed_grade: '',
                  course: '',
                  professor: '',
                  semester: '',
                  screenshot: null
                });
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Submit Another Grade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit Grade for Verification</h1>
          <p className="text-gray-400">
            Earn the 🏆 Top Grade badge by verifying your A- or higher grade.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mb-8">
          <h3 className="font-semibold mb-2">Requirements:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Upload must be created with briefica desktop 6.2+ (has grading key)</li>
            <li>• Screenshot must clearly show your grade and course info</li>
            <li>• Grade must be A- (3.7) or higher to earn Top Grade badge</li>
            <li>• Verification typically takes 24-48 hours</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grading Key */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Grading Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.grading_key}
              onChange={(e) => setForm({ ...form, grading_key: e.target.value })}
              placeholder="BSET-GRADE-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
            {errors.grading_key && (
              <p className="text-red-500 text-sm mt-1">{errors.grading_key}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Found in briefica desktop when you created this .bset
            </p>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Grade <span className="text-red-500">*</span>
            </label>
            <select
              value={form.claimed_grade}
              onChange={(e) => setForm({ ...form, claimed_grade: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">Select grade...</option>
              {gradeOptions.map(grade => (
                <option key={grade.value} value={grade.value}>
                  {grade.value} ({grade.gpa.toFixed(1)} GPA)
                </option>
              ))}
            </select>
            {errors.claimed_grade && (
              <p className="text-red-500 text-sm mt-1">{errors.claimed_grade}</p>
            )}
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              placeholder="e.g., Criminal Procedure"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
            {errors.course && (
              <p className="text-red-500 text-sm mt-1">{errors.course}</p>
            )}
          </div>

          {/* Professor */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Professor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.professor}
              onChange={(e) => setForm({ ...form, professor: e.target.value })}
              placeholder="e.g., Prof. Langer"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
            {errors.professor && (
              <p className="text-red-500 text-sm mt-1">{errors.professor}</p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              placeholder="e.g., Fall 2025"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
            {errors.semester && (
              <p className="text-red-500 text-sm mt-1">{errors.semester}</p>
            )}
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Grade Screenshot <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, screenshot: e.target.files?.[0] || null })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
            />
            {errors.screenshot && (
              <p className="text-red-500 text-sm mt-1">{errors.screenshot}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Screenshot must clearly show your grade, course name, and professor
            </p>
          </div>

          {/* Certification */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Certification</h3>
            <p className="text-sm text-gray-400">
              By submitting this form, I certify that:
            </p>
            <ul className="text-sm text-gray-400 mt-2 space-y-1">
              <li>• This grade is authentic and unaltered</li>
              <li>• This .bset was used to study for this exam</li>
              <li>• All information provided is accurate</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}