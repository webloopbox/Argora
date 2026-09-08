import { WatsonXAI } from '@ibm-cloud/watsonx-ai';
import { IamAuthenticator } from '@ibm-cloud/watsonx-ai/authentication';

const API_VERSION = '2024-05-31';

// IBM's own Granite embedding model - multilingual, 768 dimensions.
// Overridable via WATSONX_EMBEDDING_MODEL_ID for a different catalog entry.
export const DEFAULT_EMBEDDING_MODEL_ID =
  'ibm/granite-embedding-278m-multilingual';

export class WatsonxEmbeddingProvider {
  private readonly client: WatsonXAI;

  constructor(
    apiKey: string,
    serviceUrl: string,
    private readonly projectId: string,
    private readonly modelId: string = DEFAULT_EMBEDDING_MODEL_ID,
  ) {
    this.client = new WatsonXAI({
      version: API_VERSION,
      serviceUrl,
      authenticator: new IamAuthenticator({ apikey: apiKey }),
    });
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embedText({
      modelId: this.modelId,
      projectId: this.projectId,
      inputs: [text],
    });

    return response.result.results?.[0]?.embedding ?? [];
  }
}
