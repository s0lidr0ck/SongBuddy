import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  try {
    const base = process.env.API_DICT || 'https://api.dictionaryapi.dev/api/v2/entries/en';
    const response = await fetch(`${base}/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'SongBuddy/1.0' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Word not found', definitions: [] });
      }
      throw new Error(`Dictionary API responded with ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({ definitions: data });
  } catch (error) {
    console.error('Error fetching definition:', error);
    return NextResponse.json({ error: 'Failed to fetch definition', definitions: [] }, { status: 500 });
  }
}