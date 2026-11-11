export interface SendFidelMessageParams {
  message: string;
  sessionId?: string;             // ID único por usuario o pestaña (ej: 'session_elena_vargas')
  activeProject?: string;         // 'Todos' | 'Proyecto París' | 'Proyecto Sagaleta'
  activeDatasets?: string[];      // Lista de nombres de las tarjetas marcadas con checkbox azul
  injectedDataSummary?: string;   // Resumen o JSON en texto de los datos que se ven en pantalla
}

export interface FidelChatResponse {
  replyText: string;
  sessionId: string;
  detectedProductKey?: string;
  extractedFields?: Array<{ key: string; value: string }>;
}

export async function sendMessageToFidel({
  message,
  sessionId = 'session_clearestate_manager',
  activeProject = 'Todos',
  activeDatasets = [],
  injectedDataSummary = '',
}: SendFidelMessageParams): Promise<FidelChatResponse> {
  const apiUrl =
    (typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_FIDEL_API_URL']) ||
    (import.meta as any).env?.VITE_FIDEL_API_URL ||
    'https://fidelback-mcp.onrender.com/api';

  const tenantKey =
    (typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_FIDEL_TENANT_KEY']) ||
    (import.meta as any).env?.VITE_FIDEL_TENANT_KEY;

  if (!tenantKey) {
    throw new Error('Falta configurar la variable FIDEL_TENANT_KEY en el .env');
  }

  // Empaquetamos la pregunta del usuario con el contexto visual de la pantalla:
  const enrichedMessage = `[CONTEXTO PANTALLA CLEARESTATE]
Proyecto seleccionado: ${activeProject}
Fuentes activas marcadas: ${activeDatasets.join(', ') || 'Todas'}
${injectedDataSummary ? `Datos visibles en pantalla:\n${injectedDataSummary}` : ''}
---
Pregunta del usuario:
${message}`;

  const response = await fetch(`${apiUrl}/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-key': tenantKey,
    },
    body: JSON.stringify({
      sessionId,
      message: enrichedMessage,
      tenantSlug: 'clearestate',
      provider: 'gemini',
      model: 'gemini-flash-lite-latest',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en el Asistente Fidel (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    replyText: data.replyText || 'No pude obtener una respuesta en este momento.',
    sessionId: data.sessionId,
    detectedProductKey: data.detectedProductKey,
    extractedFields: data.extractedFields,
  };
}
