
export enum NoteType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  SKETCH = 'SKETCH',
}

export interface Note {
  id: string;
  title: string;
  content: string; // TEXT: markdown, AUDIO: transcription, SKETCH: base64 data URL
  type: NoteType;
  links: string[]; // Array of linked note IDs
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'dark' | 'light' | 'zen';
