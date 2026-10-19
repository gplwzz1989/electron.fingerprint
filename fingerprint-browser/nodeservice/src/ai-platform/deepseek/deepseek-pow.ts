const DEFAULT_TARGET_PATH = '/api/v0/chat/completion';

const ROUND_CONSTANTS = new Uint32Array([
  0, 1, 0, 32898, 2147483648, 32906, 2147483648, 2147516416, 0, 32907, 0, 2147483649, 2147483648, 2147516545,
  2147483648, 32777, 0, 138, 0, 136, 0, 2147516425, 0, 2147483658, 0, 2147516555, 2147483648, 139, 2147483648, 32905,
  2147483648, 32771, 2147483648, 32770, 2147483648, 128, 0, 32778, 2147483648, 2147483658, 2147483648, 2147516545,
  2147483648, 32896, 0, 2147483649, 2147483648, 2147516424,
]);

const RHO_PI_LANES = [10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1];

const RHO_SHIFTS = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44];

export type DeepSeekPowInput = {
  algorithm?: string;
  challenge: string;
  salt: string;
  signature?: string;
  difficulty: number;
  expireAt?: number;
  expire_at?: number;
  targetPath?: string;
  target_path?: string;
};

export type DeepSeekPowNormalizedInput = {
  algorithm: string;
  challenge: string;
  salt: string;
  signature?: string;
  difficulty: number;
  expireAt: number;
  targetPath: string;
};

export type DeepSeekPowPayload = {
  algorithm: string;
  challenge: string;
  salt: string;
  answer: number;
  signature?: string;
  target_path: string;
};

type DeepSeekHash = {
  update(input: string): DeepSeekHash;
  digest(encoding?: BufferEncoding): string;
  copy(): DeepSeekHash;
  _setSponge(nextSponge: DeepSeekSponge256): void;
};

function copyLane(src: Uint32Array, srcLaneIndex: number, dst: Uint32Array, dstLaneIndex: number): void {
  const srcOffset = srcLaneIndex * 2;
  const dstOffset = dstLaneIndex * 2;
  dst[dstOffset] = src[srcOffset];
  dst[dstOffset + 1] = src[srcOffset + 1];
}

function chi(state: Uint32Array, scratch: Uint32Array): void {
  for (let row = 0; row < 25; row += 5) {
    for (let col = 0; col < 5; col += 1) {
      copyLane(state, row + col, scratch, col);
    }

    for (let col = 0; col < 5; col += 1) {
      const lane = (row + col) * 2;
      const next = ((col + 1) % 5) * 2;
      const nextNext = ((col + 2) % 5) * 2;
      state[lane] ^= ~scratch[next] & scratch[nextNext];
      state[lane + 1] ^= ~scratch[next + 1] & scratch[nextNext + 1];
    }
  }
}

function iota(state: Uint32Array, roundIndex: number): void {
  const offset = roundIndex * 2;
  state[0] ^= ROUND_CONSTANTS[offset];
  state[1] ^= ROUND_CONSTANTS[offset + 1];
}

function rhoPi(state: Uint32Array, scratch: Uint32Array, work: Uint32Array): void {
  let laneIndex = 0;
  copyLane(state, laneIndex + 1, work, laneIndex);

  for (; laneIndex < 24; laneIndex += 1) {
    const targetLane = RHO_PI_LANES[laneIndex];
    const shift = RHO_SHIFTS[laneIndex];
    copyLane(state, targetLane, scratch, 0);

    const low = work[0];
    const high = work[1];
    const shiftBase = 32 - shift;
    const workIndex = shift < 32 ? 0 : 1;

    work[workIndex] = (low << shift) | (high >>> shiftBase);
    work[(workIndex + 1) % 2] = (high << shift) | (low >>> shiftBase);

    copyLane(work, 0, state, targetLane);
    copyLane(scratch, 0, work, 0);
  }
}

function theta(state: Uint32Array, columnParity: Uint32Array, laneMix: Uint32Array, work: Uint32Array): void {
  for (let column = 0; column < 5; column += 1) {
    const base = 2 * column;
    const plus5 = (column + 5) * 2;
    const plus10 = (column + 10) * 2;
    const plus15 = (column + 15) * 2;
    const plus20 = (column + 20) * 2;

    columnParity[base] = state[base] ^ state[plus5] ^ state[plus10] ^ state[plus15] ^ state[plus20];
    columnParity[base + 1] =
      state[base + 1] ^ state[plus5 + 1] ^ state[plus10 + 1] ^ state[plus15 + 1] ^ state[plus20 + 1];
  }

  for (let column = 0; column < 5; column += 1) {
    copyLane(columnParity, (column + 1) % 5, work, 0);
    const low = work[0];
    const high = work[1];
    work[0] = (low << 1) | (high >>> 31);
    work[1] = (high << 1) | (low >>> 31);

    laneMix[2 * column] = columnParity[((column + 4) % 5) * 2] ^ work[0];
    laneMix[2 * column + 1] = columnParity[((column + 4) % 5) * 2 + 1] ^ work[1];

    for (let row = 0; row < 25; row += 5) {
      const lane = (row + column) * 2;
      state[lane] ^= laneMix[2 * column];
      state[lane + 1] ^= laneMix[2 * column + 1];
    }
  }
}

function xorQueueIntoState(queue: Uint8Array, state: Uint32Array): Uint32Array {
  for (let offset = 0; offset < queue.length; offset += 8) {
    const lane = offset / 4;
    state[lane] ^= (queue[offset + 7] << 24) | (queue[offset + 6] << 16) | (queue[offset + 5] << 8) | queue[offset + 4];
    state[lane + 1] ^= (queue[offset + 3] << 24) | (queue[offset + 2] << 16) | (queue[offset + 1] << 8) | queue[offset];
  }

  return state;
}

function stateToBytes(state: Uint32Array, target: Uint8Array): Uint8Array {
  for (let offset = 0; offset < target.length; offset += 8) {
    const lane = offset / 4;
    target[offset] = state[lane + 1];
    target[offset + 1] = state[lane + 1] >>> 8;
    target[offset + 2] = state[lane + 1] >>> 16;
    target[offset + 3] = state[lane + 1] >>> 24;
    target[offset + 4] = state[lane];
    target[offset + 5] = state[lane] >>> 8;
    target[offset + 6] = state[lane] >>> 16;
    target[offset + 7] = state[lane] >>> 24;
  }

  return target;
}

class DeepSeekSponge256 {
  private readonly capacity: number;
  private readonly padding: number;
  private readonly outputBytes: number;
  private readonly rateBytes: number;
  readonly state: Uint32Array;
  readonly queue: Buffer;
  queueOffset: number;

  constructor(options: { capacity: number; padding: number }) {
    const { capacity, padding } = options;
    this.capacity = capacity;
    this.padding = padding;
    this.outputBytes = capacity / 8;
    this.rateBytes = 200 - capacity / 4;
    this.state = new Uint32Array(50);
    this.queue = Buffer.allocUnsafe(this.rateBytes);
    this.queueOffset = 0;
  }

  permute(): void {
    const scratch = new Uint32Array(10);
    const laneMix = new Uint32Array(10);
    const work = new Uint32Array(2);

    for (let round = 1; round < 24; round += 1) {
      theta(this.state, scratch, laneMix, work);
      rhoPi(this.state, scratch, work);
      chi(this.state, scratch);
      iota(this.state, round);
    }
  }

  update(input: Uint8Array): this {
    for (let i = 0; i < input.length; i += 1) {
      this.queue[this.queueOffset] = input[i];
      this.queueOffset += 1;

      if (this.queueOffset >= this.rateBytes) {
        xorQueueIntoState(this.queue, this.state);
        this.permute();
        this.queueOffset = 0;
      }
    }

    return this;
  }

  digest(encoding: BufferEncoding = 'hex'): string {
    const output = Buffer.allocUnsafe(this.outputBytes);
    const queue = Buffer.allocUnsafe(this.queue.length);
    const state = new Uint32Array(this.state.length);

    this.queue.copy(queue);
    state.set(this.state);

    queue.fill(0, this.queueOffset);
    queue[this.queueOffset] |= this.padding;
    queue[this.rateBytes - 1] |= 128;

    xorQueueIntoState(queue, state);

    for (let offset = 0; offset < output.length; offset += this.rateBytes) {
      const tmp = new DeepSeekSponge256({
        capacity: this.capacity,
        padding: this.padding,
      });
      tmp.state.set(state);
      tmp.permute();
      state.set(tmp.state);
      stateToBytes(state, output.subarray(offset, offset + this.rateBytes));
    }

    return output.toString(encoding);
  }

  copy(): DeepSeekSponge256 {
    const next = new DeepSeekSponge256({
      capacity: this.capacity,
      padding: this.padding,
    });
    next.state.set(this.state);
    this.queue.copy(next.queue);
    next.queueOffset = this.queueOffset;
    return next;
  }
}

export function createDeepSeekHash(): DeepSeekHash {
  const sponge = new DeepSeekSponge256({
    capacity: 256,
    padding: 0x06,
  });

  return {
    update(input: string): DeepSeekHash {
      if (typeof input !== 'string') {
        throw new TypeError('input must be a string');
      }

      sponge.update(Buffer.from(input, 'utf8'));
      return this;
    },
    digest(encoding: BufferEncoding = 'hex'): string {
      return sponge.digest(encoding);
    },
    copy(): DeepSeekHash {
      const clone = createDeepSeekHash();
      clone._setSponge(sponge.copy());
      return clone;
    },
    _setSponge(nextSponge: DeepSeekSponge256): void {
      this.update = function update(input: string): DeepSeekHash {
        if (typeof input !== 'string') {
          throw new TypeError('input must be a string');
        }

        nextSponge.update(Buffer.from(input, 'utf8'));
        return this;
      };

      this.digest = function digest(encoding: BufferEncoding = 'hex'): string {
        return nextSponge.digest(encoding);
      };

      this.copy = function copy(): DeepSeekHash {
        const clone = createDeepSeekHash();
        clone._setSponge(nextSponge.copy());
        return clone;
      };
    },
  };
}

export function buildPrefix(salt: string, expireAt: number): string {
  return `${salt}_${expireAt}_`;
}

export function normalizePowEntryInput(input: DeepSeekPowInput): DeepSeekPowNormalizedInput {
  if (!input || typeof input !== 'object') {
    throw new TypeError('input must be an object');
  }

  const expireAt = input.expireAt ?? input.expire_at;
  if (!Number.isSafeInteger(expireAt)) {
    throw new TypeError('challenge.expireAt must be a safe integer');
  }

  return {
    algorithm: input.algorithm || 'DeepSeekHashV1',
    challenge: input.challenge,
    salt: input.salt,
    signature: input.signature,
    targetPath: input.targetPath ?? input.target_path ?? DEFAULT_TARGET_PATH,
    difficulty: input.difficulty,
    expireAt: expireAt as number,
  };
}

export function validateChallenge(challenge: DeepSeekPowNormalizedInput): void {
  if (!challenge || typeof challenge !== 'object') {
    throw new TypeError('challenge must be an object');
  }

  if (challenge.algorithm !== 'DeepSeekHashV1') {
    throw new Error(`Unsupported algorithm: ${challenge.algorithm}`);
  }

  if (typeof challenge.challenge !== 'string' || challenge.challenge.length % 2 !== 0) {
    throw new TypeError('challenge.challenge must be an even-length hex string');
  }

  if (typeof challenge.salt !== 'string' || challenge.salt.length === 0) {
    throw new TypeError('challenge.salt must be a non-empty string');
  }

  if (!Number.isSafeInteger(challenge.difficulty) || challenge.difficulty <= 0) {
    throw new TypeError('challenge.difficulty must be a positive safe integer');
  }

  if (!Number.isSafeInteger(challenge.expireAt)) {
    throw new TypeError('challenge.expireAt must be a safe integer');
  }
}

export function solvePowChallenge(input: DeepSeekPowInput): DeepSeekPowPayload {
  const challenge = normalizePowEntryInput(input);
  validateChallenge(challenge);

  const prefix = buildPrefix(challenge.salt, challenge.expireAt);
  const hashBase = createDeepSeekHash().update(prefix);

  for (let answer = 0; answer < challenge.difficulty; answer += 1) {
    const digest = hashBase.copy().update(String(answer)).digest('hex');
    if (digest === challenge.challenge) {
      return {
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        salt: challenge.salt,
        answer,
        signature: challenge.signature,
        target_path: challenge.targetPath,
      };
    }
  }

  throw new Error(
    `No solution found: algorithm=${challenge.algorithm}, challenge=${challenge.challenge}, difficulty=${challenge.difficulty}, prefix=${prefix}`,
  );
}

export function buildPowBase64Payload(input: DeepSeekPowInput): DeepSeekPowPayload {
  return solvePowChallenge(input);
}

export function buildPowResponseBase64(input: DeepSeekPowInput): string {
  return Buffer.from(JSON.stringify(buildPowBase64Payload(input)), 'utf8').toString('base64');
}
