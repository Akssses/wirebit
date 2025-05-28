import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://wirebit.net/request-exportxml.xml', {
      headers: {
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    return new NextResponse(xmlText, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error fetching rates:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 