import {Cursor} from './Cursor';
import {CursorAnchor, SliceBehavior} from '../slice/constants';
import {PersistedSlice} from '../slice/PersistedSlice';
import {EditorSlices} from './EditorSlices';
import {Chars} from '../constants';
import {contains, equal} from '../../../json-crdt-patch/clock';
import {ChunkSlice} from '../util/ChunkSlice';
import {Anchor} from '../rga/constants';
import {isLetter, isPunctuation, isWhitespace} from './util';
import {next, prev} from 'sonic-forest/lib/util';
import type {ITimestampStruct} from '../../../json-crdt-patch/clock';
import type {Peritext} from '../Peritext';
import type {SliceType} from '../slice/types';
import type {MarkerSlice} from '../slice/MarkerSlice';
import type {CharIterator, CharPredicate} from './types';
import type {Chunk} from '../../../json-crdt/nodes/rga';
import type {Point} from '../rga/Point';
import type {Range} from '../rga/Range';
import {MarkerOverlayPoint} from '../overlay/MarkerOverlayPoint';

export class Editor<T = string> {
  public readonly saved: EditorSlices<T>;
  public readonly extra: EditorSlices<T>;
  public readonly local: EditorSlices<T>;

  constructor(public readonly txt: Peritext<T>) {
    this.saved = new EditorSlices(txt, txt.savedSlices);
    this.extra = new EditorSlices(txt, txt.extraSlices);
    this.local = new EditorSlices(txt, txt.localSlices);
  }

  // ------------------------------------------------------------------ cursors

  public firstCursor(): Cursor<T> | undefined {
    const iterator = this.txt.localSlices.iterator0();
    let cursor = iterator();
    while (cursor) {
      if (cursor instanceof Cursor) return cursor;
      cursor = iterator();
    }
    return;
  }

  /**
   * Returns the first cursor in the text. If there is no cursor, creates one
   * and inserts it at the start of the text. To work with multiple cursors, use
   * `.cursors()` method.
   *
   * Cursor is the the current user selection. It can be a caret or a range. If
   * range is collapsed to a single point, it is a *caret*.
   */
  public get cursor(): Cursor<T> {
    const maybeCursor = this.firstCursor();
    if (maybeCursor) return maybeCursor;
    const txt = this.txt;
    const cursor = txt.localSlices.ins<Cursor<T>, typeof Cursor>(
      txt.rangeAt(0),
      SliceBehavior.Cursor,
      CursorAnchor.Start,
      undefined,
      Cursor,
    );
    return cursor;
  }

  public cursors(callback: (cursor: Cursor<T>) => void): void {
    this.txt.localSlices.forEach((slice) => {
      if (slice instanceof Cursor) callback(slice);
    });
  }

  public delCursors(): void {
    this.cursors((cursor) => this.local.del(cursor));
  }

  // ------------------------------------------------------------- text editing

  /**
   * Insert inline text at current cursor position. If cursor selects a range,
   * the range is removed and the text is inserted at the start of the range.
   */
  public insert(text: string): void {
    let cnt = 0;
    this.cursors((cursor) => {
      cnt++;
      cursor.insert(text);
    });
    if (!cnt) this.cursor.insert(text);
  }

  /**
   * Deletes the previous character at current cursor position. If cursor
   * selects a range, deletes the whole range.
   */
  public delBwd(): void {
    this.cursors((cursor) => cursor.delBwd());
  }

  // ------------------------------------------------------------------ various

  /** @todo Add main impl details of this to `Cursor`, but here ensure there is only one cursor. */
  public selectAll(): boolean {
    const range = this.txt.rangeAll();
    if (!range) return false;
    this.cursor.setRange(range);
    return true;
  }

  public fwd0(chunk: undefined | Chunk<T>, offset: number): CharIterator<T> {
    const str = this.txt.str;
    return () => {
      if (!chunk) return;
      const offsetToReturn = offset;
      const chunkToReturn = chunk;
      const char = chunkToReturn.view().slice(offsetToReturn, offsetToReturn + 1);
      if (!char) return;
      offset++;
      if (offset >= chunk.span) {
        offset = 0;
        chunk = str.next(chunk);
        while (chunk && chunk.del) chunk = str.next(chunk);
      }
      return new ChunkSlice<T>(chunkToReturn, offsetToReturn, 1);
    };
  }

  public fwd1(id: ITimestampStruct, chunk?: Chunk<T>): CharIterator<T> {
    const str = this.txt.str;
    const startFromStrRoot = equal(id, str.id);
    if (startFromStrRoot) {
      chunk = str.first();
      while (chunk && chunk.del) chunk = str.next(chunk);
      return this.fwd0(chunk, 0);
    }
    let offset: number = 0;
    if (!chunk || !contains(chunk.id, chunk.span, id, 1)) {
      chunk = str.findById(id);
      if (!chunk) return () => undefined;
      offset = id.time - chunk.id.time;
    } else offset = id.time - chunk.id.time;
    if (!chunk.del) return this.fwd0(chunk, offset);
    while (chunk && chunk.del) chunk = str.next(chunk);
    return this.fwd0(chunk, 0);
  }

  public bwd0(chunk: undefined | Chunk<T>, offset: number): CharIterator<T> {
    const txt = this.txt;
    const str = txt.str;
    return () => {
      if (!chunk || offset < 0) return;
      const offsetToReturn = offset;
      const chunkToReturn = chunk;
      const char = chunkToReturn.view().slice(offsetToReturn, offsetToReturn + 1);
      if (!char) return;
      offset--;
      if (offset < 0) {
        chunk = str.prev(chunk);
        while (chunk && chunk.del) chunk = str.prev(chunk);
        if (chunk) offset = chunk.span - 1;
      }
      return new ChunkSlice(chunkToReturn, offsetToReturn, 1);
    };
  }

  public bwd1(id: ITimestampStruct, chunk?: Chunk<T>): CharIterator<T> {
    const str = this.txt.str;
    const startFromStrRoot = equal(id, str.id);
    if (startFromStrRoot) {
      chunk = str.last();
      while (chunk && chunk.del) chunk = str.prev(chunk);
      return this.bwd0(chunk, chunk ? chunk.span - 1 : 0);
    }
    let offset: number = 0;
    if (!chunk || !contains(chunk.id, chunk.span, id, 1)) {
      chunk = str.findById(id);
      if (!chunk) return () => undefined;
      offset = id.time - chunk.id.time;
    } else offset = id.time - chunk.id.time;
    if (!chunk.del) return this.bwd0(chunk, offset);
    while (chunk && chunk.del) chunk = str.prev(chunk);
    return this.bwd0(chunk, chunk ? chunk.span - 1 : 0);
  }

  private skipWord(iterator: CharIterator<T>, predicate: CharPredicate<string>, firstLetterFound: boolean): Point<T> | undefined {
    let next: ChunkSlice<T> | undefined;
    let prev: ChunkSlice<T> | undefined;
    while ((next = iterator())) {
      const char = (next.view() as string)[0];
      if (firstLetterFound) {
        if (!predicate(char)) break;
      } else if (predicate(char)) firstLetterFound = true;
      prev = next;
    }
    if (!prev) return;
    return this.txt.point(prev.id(), Anchor.After);
  }

  /**
   * Skips a word forward. A word is defined by the `predicate` function.
   *
   * @param point Point from which to start skipping.
   * @param predicate Character class to skip.
   * @param firstLetterFound Whether the first letter has already been found. If
   *        not, will skip any characters until the first letter, which is
   *        matched by the `predicate` is found.
   * @returns Point after the last character skipped.
   */
  public fwdSkipWord(point: Point<T>, predicate: CharPredicate<string> = isLetter, firstLetterFound: boolean = false): Point<T> {
    const firstChar = point.rightChar();
    if (!firstChar) return point;
    const fwd = this.fwd1(firstChar.id(), firstChar.chunk);
    return this.skipWord(fwd, predicate, firstLetterFound) || point;
  }

  /**
   * Skips a word backward. A word is defined by the `predicate` function.
   *
   * @param point Point from which to start skipping.
   * @param predicate Character class to skip.
   * @param firstLetterFound Whether the first letter has already been found. If
   *        not, will skip any characters until the first letter, which is
   *        matched by the `predicate` is found.
   * @returns Point after the last character skipped.
   */
  public bwdSkipWord(point: Point<T>, predicate: CharPredicate<string> = isLetter, firstLetterFound: boolean = false): Point<T> {
    const firstChar = point.leftChar();
    if (!firstChar) return point;
    const bwd = this.bwd1(firstChar.id(), firstChar.chunk);
    const endPoint = this.skipWord(bwd, predicate, firstLetterFound);
    if (endPoint) endPoint.anchor = Anchor.Before;
    return endPoint || point;
  }

  /**
   * Selects a word by extending the selection to the left and right of the point.
   *
   * @param point Point to the right of which is the starting character of the word.
   * @returns Range which contains the word.
   */
  public wordRange(point: Point<T>): Range<T> | undefined {
    const char = point.rightChar();
    if (!char) return;
    const c = (char.view() as string)[0];
    const predicate: CharPredicate<string> = isLetter(c) ? isLetter : isWhitespace(c) ? isWhitespace : isPunctuation;
    const start = this.bwdSkipWord(point, predicate, true);
    const end = this.fwdSkipWord(point, predicate, true);
    return this.txt.range(start, end);
  }

  public selectWord(at: number): void {
    const point = this.txt.pointAt(at);
    const range = this.wordRange(point);
    if (!range) return;
    const cursor = this.cursor;
    cursor.setRange(range);
    cursor.anchorSide = CursorAnchor.Start;
  }

  private skipLine(iterator: CharIterator<T>): Point<T> | undefined {
    let next: ChunkSlice<T> | undefined;
    let prev: ChunkSlice<T> | undefined;
    while ((next = iterator())) {
      const char = (next.view() as string)[0];
      if (char === '\n') break;
      prev = next;
    }
    if (!prev) return;
    return this.txt.point(prev.id(), Anchor.After);
  }

  /** Find end of line, starting from given point. */
  public eol(point: Point<T>): Point<T> | undefined {
    const firstChar = point.rightChar();
    if (!firstChar) return;
    const fwd = this.fwd1(firstChar.id(), firstChar.chunk);
    return this.skipLine(fwd);
  }

  /** Find beginning of line, starting from given point. */
  public bol(point: Point<T>): Point<T> | undefined {
    const firstChar = point.leftChar();
    if (!firstChar) return;
    const bwd = this.bwd1(firstChar.id(), firstChar.chunk);
    const endPoint = this.skipLine(bwd);
    if (endPoint) endPoint.anchor = Anchor.Before;
    return endPoint;
  }

  public end(): Point<T> {
    const txt = this.txt;
    return txt.pointEnd() ?? txt.pointAbsEnd();
  }

  public start(): Point<T> {
    const txt = this.txt;
    return txt.pointStart() ?? txt.pointAbsStart();
  }

  /**
   * Find end of block, starting from given point. Overlay should be refreshed
   * before calling this method.
   */
  public eob(point: Point<T>): Point<T> {
    const txt = this.txt;
    const overlay = txt.overlay;
    let overlayPoint = overlay.getOrNextHigher(point);
    if (!overlayPoint) return this.end();
    if (point.cmp(overlayPoint) === 0) overlayPoint = next(overlayPoint);
    while (!(overlayPoint instanceof MarkerOverlayPoint) && overlayPoint) overlayPoint = next(overlayPoint);
    if (overlayPoint instanceof MarkerOverlayPoint) {
      const point = overlayPoint.clone();
      point.refAfter();
      return point;
    } else return this.end();
  }

  /**
   * Find beginning of block, starting from given point. Overlay should be
   * refreshed before calling this method.
   */
  public bob(point: Point<T>): Point<T> {
    const overlay = this.txt.overlay;
    let overlayPoint = overlay.getOrNextLower(point);
    if (!overlayPoint) return this.start();
    while (!(overlayPoint instanceof MarkerOverlayPoint) && overlayPoint) overlayPoint = prev(overlayPoint);
    if (overlayPoint instanceof MarkerOverlayPoint) {
      const point = overlayPoint.clone();
      point.refBefore();
      return point;
    } else return this.start();
  }

  public blockRange(point: Point<T>): Range<T> {
    const start = this.bob(point);
    const end = this.eob(point);
    return this.txt.range(start, end);
  }

  public selectBlock(at: number): void {
    const txt = this.txt;
    const editor = txt.editor;
    const point = txt.pointAt(at);
    const range = editor.blockRange(point);
    if (!range) return;
    const cursor = editor.cursor;
    cursor.setRange(range);
    cursor.anchorSide = CursorAnchor.Start;
  }

  /** @deprecated use `.saved.insStack` */
  public insStackSlice(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T> {
    const range = this.cursor.range();
    return this.txt.savedSlices.ins(range, SliceBehavior.Stack, type, data);
  }

  /** @deprecated use `.saved.insOverwrite` */
  public insOverwriteSlice(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T> {
    const range = this.cursor.range();
    return this.txt.savedSlices.ins(range, SliceBehavior.Overwrite, type, data);
  }

  /** @deprecated use `.saved.insErase` */
  public insEraseSlice(type: SliceType, data?: unknown | ITimestampStruct): PersistedSlice<T> {
    const range = this.cursor.range();
    return this.txt.savedSlices.ins(range, SliceBehavior.Erase, type, data);
  }

  /** @deprecated use `.saved.insMarker` */
  public insMarker(type: SliceType, data?: unknown): MarkerSlice<T> {
    return this.saved.insMarker(type, data, Chars.BlockSplitSentinel)[0];
  }
}
