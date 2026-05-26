import { Fragment } from 'react';

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'INSERT', 'UPDATE', 'DELETE',
  'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT',
  'RIGHT', 'FULL', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT',
  'OFFSET', 'UNION', 'ALL', 'AS', 'DISTINCT', 'WITH', 'RECURSIVE', 'VALUES',
  'SET', 'INTO', 'RETURNING', 'EXISTS', 'BETWEEN', 'LIKE', 'ILIKE', 'IN',
  'IS', 'NULL', 'TRUE', 'FALSE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'CAST', 'COALESCE', 'NULLIF', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'ASC', 'DESC', 'INTERVAL', 'NOW', 'CROSS',
];

const SQL_TYPES = [
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'SERIAL', 'BIGSERIAL',
  'VARCHAR', 'CHAR', 'TEXT', 'STRING',
  'BOOLEAN', 'BOOL',
  'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ',
  'NUMERIC', 'DECIMAL', 'REAL', 'FLOAT', 'DOUBLE',
  'JSON', 'JSONB', 'UUID', 'ARRAY',
];

export function highlightSQL(sql: string): React.ReactNode[] {
  const lines = sql.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const lineElements: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Comment
      if (remaining.startsWith('--')) {
        lineElements.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-text-tertiary">
            {remaining}
          </span>
        );
        remaining = '';
        break;
      }

      // String literal
      const stringMatch = remaining.match(/^('(?:[^'\\]|\\.)*'?)/);
      if (stringMatch) {
        lineElements.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-success">
            {stringMatch[1]}
          </span>
        );
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }

      // Number
      const numberMatch = remaining.match(/^(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        lineElements.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-orange-400">
            {numberMatch[1]}
          </span>
        );
        remaining = remaining.slice(numberMatch[1].length);
        continue;
      }

      // Word (keyword, type, or identifier)
      const wordMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (wordMatch) {
        const word = wordMatch[1];
        const upperWord = word.toUpperCase();

        if (SQL_KEYWORDS.includes(upperWord)) {
          lineElements.push(
            <span key={`${lineIndex}-${keyIndex++}`} className="text-accent font-medium">
              {word}
            </span>
          );
        } else if (SQL_TYPES.includes(upperWord)) {
          lineElements.push(
            <span key={`${lineIndex}-${keyIndex++}`} className="text-purple-400">
              {word}
            </span>
          );
        } else {
          lineElements.push(
            <span key={`${lineIndex}-${keyIndex++}`}>{word}</span>
          );
        }
        remaining = remaining.slice(word.length);
        continue;
      }

      // Whitespace or symbol - take one char
      lineElements.push(
        <span key={`${lineIndex}-${keyIndex++}`}>{remaining[0]}</span>
      );
      remaining = remaining.slice(1);
    }

    elements.push(
      <Fragment key={lineIndex}>
        {lineElements}
        {lineIndex < lines.length - 1 && <br />}
      </Fragment>
    );
  });

  return elements;
}
