// Note: this typing file is incomplete (https://github.com/mtth/avsc/pull/134).
// TODO: Wherever the type is just `any`, it was probably generated automatically.
//       Either finish documenting the type signature or document why `any` is appropriate.
// TODO: Wherever the argument names are just `args: any`, it was probably generated from the signature of util.deprecate. Fix argument counts and types.
// NOTE: This does not contain entries for functions available in the browser (functions/methods in etc/browser)

import * as stream from 'stream';
import { EventEmitter } from 'events'

type Schema = string | object;  // TODO object should be further specified

export type Callback<V, Err = any> = (err: Err, value: V) => void;

export type CodecTransformer = (buffer: Buffer, callback: () => void) => Buffer; // TODO

export interface CodecOptions {
  deflate: CodecTransformer;
  snappy: CodecTransformer;
}

export interface Decoder {
  on(type: 'metadata', callback: (type: Type) => void): this;
  on(type: 'data', callback: (value: object) => void): this;
}

export interface Encoder {
  // TODO
}

export interface ReaderOptions {
  // TODO
}

interface AssembleOptions {
  importHook: (filePath: string, type: 'idl', callback: Callback<object>) => void;
}

export function assemble(args: any): any;
export function assembleProtocol(filePath: string, opts: Partial<AssembleOptions>, callback: Callback<object>): void;
export function assembleProtocol(filePath: string, callback: Callback<object>): void;
export function combine(args: any): any;
export function createFileDecoder(fileName: string, codecs?: Partial<CodecOptions>): Decoder;
export function createFileEncoder(filePath: string, schema: Schema, options?: any): Encoder;
export function discoverProtocol(transport: Service.Transport, options: any, callback: Callback<any>): void;
export function discoverProtocol(transport: Service.Transport, callback: Callback<any>): void;
export function extractFileHeader(filePath: string, options?: any): void;
export function infer(args: any): any;
export function parse(schemaOrProtocolIdl: string, options?: any): any; // TODO protocol literal or Type
export function readProtocol(protocolIdl: string, options?: Partial<ReaderOptions>): any;
export function readSchema(schemaIdl: string, options?: Partial<ReaderOptions>): Schema;
// TODO streams

// TODO more specific types than `any`
export class Type {
  clone(val: any, opts?: any): any;
  compare(val1: any, val2: any): number;
  compareBuffers(buf1: any, buf2: any): number;
  constructor(schema: Schema, opts?: any);
  createResolver(type: any, opts?: any): any;  // TODO: opts not documented on wiki
  decode(buf: any, pos?: any, resolver?: any): any
  fingerprint(algorithm?: any): any;
  fromBuffer(buffer: Buffer, resolver?: any, noCheck?: boolean): Type; // TODO
  fromString(str: any): any;
  inspect(): string;
  isValid(val: any, opts?: any): any;
  random(): Type;
  schema(opts?: any): any;
  toBuffer(value: object): Buffer;
  toJSON(): string;
  toString(val?: any): any;
  wrap(val: any): any;
  _skip(tap: any): any;
  readonly aliases: string[]|undefined;
  readonly doc: string|undefined;
  readonly name: string|undefined;
  readonly branchName: string|undefined;
  readonly typeName: string;
  static forSchema(schema: Schema, opts?: any): Type;
  static forTypes(types: any, opts?: any): Type;
  static forValue(value: object, opts?: any): Type;
  static isType(arg: any, ...prefix: string[]): boolean;
  static __reset(size: number): void;
}

export class Service {
  constructor(name: any, messages: any, types: any, ptcl: any, server: any);
  createClient(options?: Partial<Service.ClientOptions>): Service.Client;
  createServer(options?: Partial<Service.ServerOptions>): Service.Server;
  equals(args: any): any;  // deprecated
  inspect(): string;
  message(name: string): any;
  type(name: string): Type|undefined;

  readonly doc: string|undefined;
  readonly hash: Buffer;
  readonly messages: any[];
  readonly name: string;
  readonly protocol: any;
  readonly types: Type[];

  static compatible(client: Service.Client, server: Service.Server): boolean;
  static forProtocol(protocol: any, options: any): Service;
  static isService(obj: any): boolean;
}

export namespace Service {
  interface ClientChannel extends EventEmitter {
    readonly client: Client;
    readonly destroyed: boolean;
    readonly draining: boolean;
    readonly pending: number;
    readonly timeout: number;
    ping(timeout?: number, cb?: any): void;
    destroy(noWait?: boolean): void;
  }

  interface ServerChannel extends EventEmitter  {
    readonly destroyed: boolean;
    readonly draining: boolean;
    readonly pending: number;
    readonly server: Server;
    destroy(noWait?: boolean): void;
  }

  interface ClientOptions {
    buffering: boolean;
    channelPolicy: any;
    strictTypes: boolean;
    timeout: number;
    remoteProtocols: boolean;
  }

  interface ServerOptions {
    objectMode: boolean;
  }

  type TransportFunction = () => void; // TODO

  type Transport = stream.Duplex | TransportFunction;

  interface ChannelCreateOptions {
    objectMode: boolean;
  }

  interface ChannelDestroyOptions {
    noWait: boolean;
  }

  class Server extends EventEmitter {
    constructor(svc: any, opts: any);

    readonly service: Service;
    // on<message>()

    activeChannels(): ServerChannel[];
    createChannel(transport: Transport, options?: Partial<ChannelCreateOptions>): ServerChannel;
    onMessage<T>(name: string, handler: (arg1: any, callback: Callback<T>) => void): this;
    remoteProtocols(): any[];
    use(...args: any[]): this;
  }

  class Client extends EventEmitter {
    constructor(svc: any, opts: any);
    activeChannels(): ClientChannel[];
    createChannel(transport: Transport, options?: Partial<ChannelCreateOptions>): ClientChannel;
    destroyChannels(options?: Partial<ChannelDestroyOptions>): void;
    emitMessage<T>(name: string, req: any, options?: any, callback?: Callback<T>): void // TODO
    remoteProtocols(): any[];
    use(...args: any[]): this;
  }
}

export namespace streams {
  class BlockDecoder {
    constructor(opts?: any);
    static defaultCodecs(): any;
  }

  class BlockEncoder {
    constructor(schema: Schema, opts: any);
    static defaultCodecs(): any;
  }

  class RawDecoder {
    constructor(schema: Schema, opts: any);
  }

  class RawEncoder {
    constructor(schema: Schema, opts: any);
  }
}

export namespace types {
  class ArrayType extends Type {
    constructor(schema: Schema, opts: any);
    readonly itemsType: Type;
    random(): ArrayType;
  }

  class BooleanType extends Type {  // TODO: Document this on the wiki
    constructor();
    random(): BooleanType;
  }

  class BytesType extends Type {  // TODO: Document this on the wiki
    constructor();
    random(): BytesType;
  }

  class DoubleType extends Type {  // TODO: Document this on the wiki
    constructor();
    random(): DoubleType;
  }

  class EnumType extends Type {
    constructor(schema: Schema, opts?: any);
    readonly symbols: string[];
    random(): EnumType;
  }

  class FixedType extends Type {
    constructor(schema: Schema, opts?: any);
    readonly size: number;
    random(): FixedType;
  }

  class FloatType extends Type {
    constructor();
    random(): FloatType;
  }

  class IntType extends Type {
    constructor();
    random(): IntType;
  }

  class LogicalType extends Type {
    constructor(schema: Schema, opts?: any);
    readonly underlyingType: Type;
    _export(schema: Schema): void;
    _fromValue(val: any): any;
    _resolve(type: Type): any;
    _toValue(any: any): any;
    random(): LogicalType;
  }

  class LongType extends Type {
    constructor();
    random(): LongType;
    static __with(methods: object, noUnpack?: boolean) : void;
  }

  class MapType extends Type {
    constructor(schema: Schema, opts?: any);
    readonly valuesType: any;
    random(): MapType;
  }

  class NullType extends Type {  // TODO: Document this on the wiki
    constructor();
    random(): NullType;
  }

  class RecordType extends Type {
    constructor(schema: Schema, opts?: any);
    readonly fields: Field[];
    readonly recordConstructor: any;  // TODO: typeof Record once Record interface/class exists
    field(name: string): Field;
    random(): RecordType;
  }

  class Field {
    aliases: string[];
    defaultValue(): any;
    name: string;
    order: string;
    type: Type;
  }

  class StringType extends Type {  // TODO: Document this on the wiki
    constructor();
    random(): StringType;
  }

  class UnwrappedUnionType extends Type {
    constructor(schema: Schema, opts: any);
    random(): UnwrappedUnionType;
  }

  class WrappedUnionType extends Type {
    constructor(schema: Schema, opts: any);
    random(): WrappedUnionType;
  }
}
