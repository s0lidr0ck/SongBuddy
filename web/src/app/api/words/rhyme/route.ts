import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  try {
    const base = process.env.API_DATAMUSE || 'https://api.datamuse.com';
    const response = await fetch(`${base}/words?rel_rhy=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'SongBuddy/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Datamuse API responded with ${response.status}`);
    }

    const data = await response.json();
    const words = data.map((item: any) => item.word);

    return NextResponse.json({ words });
  } catch (error) {
    console.error('Error fetching rhymes:', error);
    return NextResponse.json({ error: 'Failed to fetch rhymes', words: [] }, { status: 500 });
  }
}