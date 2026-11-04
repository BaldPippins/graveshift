export interface SoundDecoder<TBuffer> {
  decode(url: string): Promise<TBuffer>;
}
