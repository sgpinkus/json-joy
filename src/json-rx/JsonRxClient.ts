import {Message, MessageSubscribe, MessageError, MessageData, MessageComplete, MessageNotification} from './types';
import {Observable, Observer} from 'rxjs';
import {assertId, isArray} from './util';

export interface JsonRxClientParams {
  send: (message: Message) => void;
}

export class JsonRxClient {
  private readonly send: (message: Message) => void;
  private cnt: number = 1;

  private readonly observers = new Map<number, Observer<unknown>>();

  constructor({send}: JsonRxClientParams) {
    this.send = send;
  }

  private sendSubscribe(message: MessageSubscribe): void {
    this.send(message);
  }

  private sendUnsubscribe(id: number): void {
    this.send([-3, id]);
  }

  private onData(message: MessageData): void {
    const [, id, payload] = message;
    assertId(id);
    const observer = this.observers.get(id);
    if (!observer) return;
    observer.next(payload);
  }

  private onComplete(message: MessageComplete): void {
    const [, id, payload] = message;
    assertId(id);
    const observer = this.observers.get(id);
    if (!observer) return;
    if (payload !== undefined) observer.next(payload);
    observer.complete();
  }

  private onError(message: MessageError): void {
    const [, id, error] = message;
    assertId(id);
    const observer = this.observers.get(id);
    if (!observer) return;
    observer.error(error);
  }

  public onMessage(message: MessageData | MessageComplete | MessageError): void {
    if (!isArray(message)) throw new Error('Invalid message');
    const [type] = message;
    if (type === 0) return this.onComplete(message as MessageComplete);
    if (type === -1) return this.onError(message as MessageError);
    if (type === -2) return this.onData(message as MessageData);
    throw new Error('Invalid message');
  }

  public call(method: string, payload: unknown): Observable<unknown> {
    const id = this.cnt++;
    const observable = new Observable<unknown>((observer: Observer<unknown>) => {
      this.observers.set(id, observer);
      return () => {
        this.observers.delete(id);
        this.sendUnsubscribe(id);
      };
    });
    this.sendSubscribe([id, method, payload]);
    return observable;
  }

  public notify(name: string, payload?: unknown): void {
    const message: MessageNotification = payload !== undefined ? [name, payload] : [name];
    this.send(message);
  }
}