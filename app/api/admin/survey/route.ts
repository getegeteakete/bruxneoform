export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const SURVEY_FIELDS = ['how_found', 'interest_products', 'satisfaction', 'inquiry_type', 'catalog'];

export async function GET(req: NextRequest) {
  try {
    const formId = req.nextUrl.searchParams.get('form_id') || 'demo';

    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('answers')
      .eq('form_id', formId);

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ results: {}, totalResponses: 0 });
    }

    const results: Record<string, Record<string, number>> = {};

    submissions.forEach(sub => {
      const answers = sub.answers || {};
      SURVEY_FIELDS.forEach(fieldId => {
        if (answers[fieldId] !== undefined && answers[fieldId] !== null && answers[fieldId] !== '') {
          if (!results[fieldId]) results[fieldId] = {};
          const val = answers[fieldId];

          if (Array.isArray(val)) {
            val.forEach((v: string) => {
              results[fieldId][v] = (results[fieldId][v] || 0) + 1;
            });
          } else if (typeof val === 'number') {
            const label = `${val}`;
            results[fieldId][label] = (results[fieldId][label] || 0) + 1;
          } else {
            results[fieldId][val] = (results[fieldId][val] || 0) + 1;
          }
        }
      });
    });

    return NextResponse.json({
      results,
      totalResponses: submissions.length,
    });
  } catch (err) {
    console.error('Survey error:', err);
    return NextResponse.json({ error: 'survey error' }, { status: 500 });
  }
}
