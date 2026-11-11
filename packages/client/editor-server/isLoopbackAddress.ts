import { BlockList, isIP } from 'node:net';

const loopback = new BlockList();
loopback.addSubnet('127.0.0.0', 8, 'ipv4');
loopback.addAddress('::1', 'ipv6');

export function isLoopbackAddress(address: string | undefined): boolean {
  if (address === undefined) {
    return false;
  }
  const version = isIP(address);
  return version === 4
    ? loopback.check(address, 'ipv4')
    : version === 6 && loopback.check(address, 'ipv6');
}
