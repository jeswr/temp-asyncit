import { EventEmitter } from "events";
import { 
  CAN_EMIT_READABLE, 
  DESTINATION, 
  EMIT_DATA_PENDING_OR_RUNNING, 
  ERROR, 
  FLOWING, 
  ON_PARENT_READABLE,
  READABLE,
  STATE
} from "../constants";

export declare class AsyncIteratorBase<T> extends EventEmitter {
  private [STATE]: number;
  public readable: boolean;

  // Handling readable status and events
  private [READABLE]: boolean;
  private [CAN_EMIT_READABLE]: boolean;

  // Handling flowing mode
  private [FLOWING]: boolean;
  private [EMIT_DATA_PENDING_OR_RUNNING]: boolean;

  // For optimised chaining of iterators
  private [DESTINATION]?: AsyncIteratorBase<any>;
  private [ON_PARENT_READABLE]?(parent: AsyncIteratorBase<any>): void;

  // For handling error events
  private [ERROR]?: any;

  // private _properties?: { [name: string]: any };
  // private _propertyCallbacks?: { [name: string]: [(value: any) => void] };

  read(): T | null;
}
