import {
  authenticatedFetch,
  getApiError,
} from "@/lib/api/client";

interface GenerateProductDescriptionInput {
  name: string;
  category: string;
  is_customizable: boolean;
}

interface ProductDescriptionResponse {
  description: string;
}

interface BusinessAssistantResponse {
  answer: string;
}

export async function generateProductDescription(
  input: GenerateProductDescriptionInput,
): Promise<string> {
  const response = await authenticatedFetch(
    "/api/ai/product-description",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  const data =
    (await response.json()) as ProductDescriptionResponse;

  return data.description;
}

export async function askBusinessAssistant(
  question: string,
): Promise<string> {
  const response = await authenticatedFetch(
    "/api/ai/business-assistant",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question.trim(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  const data =
    (await response.json()) as BusinessAssistantResponse;

  return data.answer;
}