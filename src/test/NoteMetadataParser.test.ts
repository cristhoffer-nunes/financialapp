/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { NoteMetadataParser } from '../domain/services/NoteMetadataParser';

describe('NoteMetadataParser', () => {
  it('correctly parses plain text notes without metadata', () => {
    const plainText = 'Esta é uma observação comum';
    const parsed = NoteMetadataParser.parse(plainText);
    expect(parsed.notesText).toBe(plainText);
    expect(parsed.dueDate).toBeUndefined();
  });

  it('correctly parses JSON with notesText and dueDate', () => {
    const serialized = JSON.stringify({ notesText: 'Pagar no banco', dueDate: '2026-06-25' });
    const parsed = NoteMetadataParser.parse(serialized);
    expect(parsed.notesText).toBe('Pagar no banco');
    expect(parsed.dueDate).toBe('2026-06-25');
  });

  it('correctly falls back on malformed JSON', () => {
    const brokenJson = '{"notesText": "test", broken:';
    const parsed = NoteMetadataParser.parse(brokenJson);
    expect(parsed.notesText).toBe(brokenJson);
    expect(parsed.dueDate).toBeUndefined();
  });

  it('correctly serializes text and due date into a JSON format', () => {
    const notesText = 'Lembra de mandar o comprovante';
    const dueDate = '2026-06-30';
    const serialized = NoteMetadataParser.serialize(notesText, dueDate);
    const parsed = JSON.parse(serialized);
    expect(parsed.notesText).toBe(notesText);
    expect(parsed.dueDate).toBe(dueDate);
  });

  it('returns plain text when serializing without a due date', () => {
    const notesText = 'Texto puro sem data';
    const serialized = NoteMetadataParser.serialize(notesText);
    expect(serialized).toBe(notesText);
  });
});
