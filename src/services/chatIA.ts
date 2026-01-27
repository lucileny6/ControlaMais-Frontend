import { apiService } from "@/services/api";
import { AIResponse } from "@/lib/types";

export const chatIAService = {
  async sendMessage(message: string): Promise<AIResponse> {
    return apiService.sendChatIA(message);
  },
};
