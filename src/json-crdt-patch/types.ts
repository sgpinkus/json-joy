import type {LogicalTimestamp} from './clock';

/**
 * Something in the document that can be identified by ID. All operations have
 * and ID and operations result into JSON nodes and chunks, which also have IDs.
 */
export interface Identifiable {
  /**
   * Unique ID within a document.
   */
  id: LogicalTimestamp;

  /**
   * Sometimes an Identifiable can be a compound entity, which holds multiple
   * entries with sequentially growing timestamps. In this case `span` represents
   * the number of entries.
   */
  getSpan?(): number;

  /**
   * Used for debugging.
   */
  toString(tab?: string): string;
}
