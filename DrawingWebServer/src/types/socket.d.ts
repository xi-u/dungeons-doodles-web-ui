// This file defines the types used for socket communication in the drawing application.

export type DrawingTool = "draw" | "erase";

export type SocketAckResult = {
  ok: boolean;
  error?: string;
};

export type JoinSessionPayload = {
  sessionId: string | null;
  webToken: string | null;
};

export type DrawingSubmitPayload = {
  png: string;
};
