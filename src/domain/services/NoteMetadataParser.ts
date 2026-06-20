/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NotesWithMetadata {
  notesText: string;
  dueDate?: string;
  debtType?: 'debito' | 'cartao' | 'emprestimo' | 'credito_outro';
  cardBank?: string;
  loanCompany?: string;
  otherCreditCompany?: string;
}

export class NoteMetadataParser {
  static parse(serializedNotes: string | undefined): NotesWithMetadata {
    if (!serializedNotes) return { notesText: '' };
    if (serializedNotes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(serializedNotes);
        return {
          notesText: parsed.notesText || parsed.text || '',
          dueDate: parsed.dueDate,
          debtType: parsed.debtType,
          cardBank: parsed.cardBank,
          loanCompany: parsed.loanCompany,
          otherCreditCompany: parsed.otherCreditCompany
        };
      } catch {
        // Fallback
      }
    }
    // Try pattern matching [VENCIMENTO:YYYY-MM-DD]
    const match = serializedNotes.match(/\[VENCIMENTO:([\d\-]+)\]/);
    if (match) {
      const dueDate = match[1];
      const notesText = serializedNotes.replace(/\[VENCIMENTO:([\d\-]+)\]/, '').trim();
      return { notesText, dueDate };
    }
    return { notesText: serializedNotes };
  }

  static serialize(
    notesText: string,
    dueDate?: string,
    debtType?: 'debito' | 'cartao' | 'emprestimo' | 'credito_outro',
    cardBank?: string,
    loanCompany?: string,
    otherCreditCompany?: string
  ): string {
    if (!dueDate && !debtType && !cardBank && !loanCompany && !otherCreditCompany) {
      return notesText;
    }
    return JSON.stringify({
      notesText,
      dueDate,
      debtType,
      cardBank,
      loanCompany,
      otherCreditCompany
    });
  }
}
