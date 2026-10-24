import axios from 'axios';

const getOllamaBase = () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const getOllamaModel = () => process.env.OLLAMA_MODEL || 'llama3.2';

// Check if Ollama is reachable
export const checkOllamaStatus = async () => {
  try {
    const resp = await axios.get(`${getOllamaBase()}/api/tags`, { timeout: 3000 });
    const models = resp.data?.models || [];
    const model = getOllamaModel();
    const modelAvailable = models.some((m) => m.name.startsWith(model));
    return {
      available: true,
      model,
      modelAvailable,
      models: models.map((m) => m.name),
      baseUrl: getOllamaBase(),
    };
  } catch {
    return {
      available: false,
      model: getOllamaModel(),
      modelAvailable: false,
      baseUrl: getOllamaBase(),
      error: 'Ollama is not running or unreachable. Start it with: ollama serve',
    };
  }
};

// Build a prompt for filename suggestions
const buildFilenamePrompt = (files) => {
  const fileList = files
    .map((f) => `- "${f.name}" (${f.extension}, ${f.category}, ${Math.round((f.sizeBytes || 0) / 1024)}KB)`)
    .join('\n');

  return `You are a file organization assistant. Analyze these files and suggest better, descriptive filenames.

Files:
${fileList}

For each file, respond with a JSON array. Each item must have:
- "original": the original filename
- "suggested": a clean, descriptive filename (snake_case, include extension)
- "reason": one concise sentence explaining the suggestion
- "confidence": number 0-1

Respond ONLY with valid JSON. No other text.`;
};

// Build a prompt for folder organization suggestions
const buildOrganizationPrompt = (files) => {
  const fileList = files
    .slice(0, 50) // Limit to avoid token overflow
    .map((f) => `- "${f.relativePath}" (${f.category})`)
    .join('\n');

  return `You are a file organization expert. Suggest a logical folder structure for these files.

Files:
${fileList}

Respond with a JSON array. Each item must have:
- "sourceRelativePath": the current relative path
- "destinationRelativePath": suggested destination relative path
- "reason": one concise sentence

Respond ONLY with valid JSON. No other text.`;
};

// Validate AI response structure for filename suggestions
const validateFilenameResponse = (data) => {
  if (!Array.isArray(data)) throw new Error('Expected JSON array');
  return data.map((item) => ({
    original: String(item.original || ''),
    suggested: String(item.suggested || ''),
    reason: String(item.reason || ''),
    confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
  }));
};

// Validate AI response for organization suggestions
const validateOrganizationResponse = (data) => {
  if (!Array.isArray(data)) throw new Error('Expected JSON array');
  return data.map((item) => ({
    sourceRelativePath: String(item.sourceRelativePath || ''),
    destinationRelativePath: String(item.destinationRelativePath || ''),
    reason: String(item.reason || ''),
  }));
};

// Call Ollama API
const callOllama = async (prompt, timeoutMs = 30000) => {
  const response = await axios.post(
    `${getOllamaBase()}/api/generate`,
    {
      model: getOllamaModel(),
      prompt,
      stream: false,
      format: 'json',
    },
    { timeout: timeoutMs }
  );

  const text = response.data?.response || '';
  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found in AI response');
  return JSON.parse(jsonMatch[0]);
};

// GET /api/ai/status
export const getAiStatus = async (req, res, next) => {
  try {
    const status = await checkOllamaStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/analyze - suggest better filenames
export const analyzeFiles = async (req, res, next) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, message: 'files array is required' });
    }

    const status = await checkOllamaStatus();
    if (!status.available) {
      return res.status(503).json({
        success: false,
        message: 'Local AI unavailable',
        error: status.error,
        fallback: true,
      });
    }

    const prompt = buildFilenamePrompt(files.slice(0, 30));
    let rawData;
    try {
      rawData = await callOllama(prompt);
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'AI model returned an invalid response',
        error: err.message,
      });
    }

    const validated = validateFilenameResponse(rawData);
    res.json({ success: true, data: validated, model: getOllamaModel() });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/suggest-organization
export const suggestOrganization = async (req, res, next) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, message: 'files array is required' });
    }

    const status = await checkOllamaStatus();
    if (!status.available) {
      return res.status(503).json({
        success: false,
        message: 'Local AI unavailable',
        error: status.error,
        fallback: true,
      });
    }

    const prompt = buildOrganizationPrompt(files);
    let rawData;
    try {
      rawData = await callOllama(prompt, 60000);
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'AI model returned an invalid response',
        error: err.message,
      });
    }

    const validated = validateOrganizationResponse(rawData);
    res.json({ success: true, data: validated, model: getOllamaModel() });
  } catch (error) {
    next(error);
  }
};
