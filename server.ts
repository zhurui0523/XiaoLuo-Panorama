/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route: Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Route: AI Panorama Image Generation using Gemini SDK
  app.post('/api/panorama/generate', async (req, res) => {
    const { prompt, aspectRatio = '16:9', imageSize = '1K', referenceImages = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt parameter' });
    }

    try {
      const client = getAiClient();
      
      // Call Gemini Image generation model
      // Note: we can use 'gemini-3.1-flash-lite-image' as the fast light model, or fallback to 'gemini-3.1-flash-image'
      const response = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          }
        }
      });

      // Find image inline data
      let base64Data = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          break;
        }
      }

      if (base64Data) {
        res.json({ imageUrl: `data:image/png;base64,${base64Data}` });
      } else {
        throw new Error('No image was returned from the Gemini generation model.');
      }

    } catch (err: any) {
      console.error('Gemini image generation error:', err);
      res.status(500).json({ 
        error: err.message || 'Gemini image generation failed',
        code: 'GEMINI_ERROR'
      });
    }
  });

  // API Route: Proxy Download (circumvent browser CORS limitations for WebGL canvas load)
  app.get('/api/proxy-download', async (req, res) => {
    const urlString = req.query.url as string;
    if (!urlString) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
      const fetchResponse = await fetch(urlString);
      if (!fetchResponse.ok) {
        return res.status(fetchResponse.status).send(`Failed to fetch image: ${fetchResponse.statusText}`);
      }

      const contentType = fetchResponse.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');

      const arrayBuffer = await fetchResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (err: any) {
      console.error('Proxy download error:', err);
      res.status(500).json({ error: 'Failed to proxy download resource.' });
    }
  });

  // API Route: Seam healing mock fallback
  app.post('/api/panorama/heal-seam', (req, res) => {
    const { imageUrl } = req.body;
    res.json({ url: imageUrl, status: 'fallback', message: 'Seam healed on client' });
  });

  // Vite static middleware serving or production routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
