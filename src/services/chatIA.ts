// src/services/chatIA.ts

import { mockIA } from "./chatIA.mock";
import { AIResponse } from "@/lib/types";

export const chatIAService = {
  async sendMessage(message: string): Promise<AIResponse> {
    // Por enquanto usamos o mock
    return Promise.resolve(mockIA(message));
  },
};
