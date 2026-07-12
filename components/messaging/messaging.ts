export interface MinimalUser {
  _id: string;
  name?: string;
  email?: string;
  avatar?: { url?: string };
}

export interface ChatMessage {
  _id: string;
  userId: string | MinimalUser; // backend may return id or populated user
  message: string;
  file: Array<{ filename: string; url: string }>;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PagedMessages {
  success?: boolean;
  data: ChatMessage[];
  meta: { page: number; totalPages: number };
}
