import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as zookeeper from 'node-zookeeper-client';

import {
  ZOOKEEPER_CONNECT_TIMEOUT_MS,
  ZOOKEEPER_COUNTER_PATH,
} from '../constants';
import { toError } from '../lib';

@Injectable()
export class IdGeneratorService implements OnModuleInit {
  private readonly logger = new Logger(IdGeneratorService.name);
  private client!: zookeeper.Client;
  private blockSize: number;

  // local in-memory range this instance currently owns, nobody else can touch these ids
  private currentId = 0;
  private maxId = 0;

  // guards against multiple concurrent requests all hitting zk at once when block runs out
  private allocating: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {
    this.blockSize = this.config.get<number>('ID_BLOCK_SIZE') ?? 1000;
  }

  async onModuleInit() {
    this.client = zookeeper.createClient(
      this.config.get<string>('ZOOKEEPER_CONNECTION_STRING') as string,
      { sessionTimeout: 30000, spinDelay: 1000, retries: 5 },
    );

    const client = this.client as any;

    // without this listener, any zk error crashes the entire node process, not just this call
    client.on('error', (err: any) => {
      this.logger.error('ZooKeeper client error', err);
    });

    // zk can drop connection on network blips, client auto-retries on its own using config above
    client.on('disconnected', () => {
      this.logger.warn(
        'ZooKeeper disconnected — will auto-retry per client config',
      );
    });

    // fires on first connect and also every reconnect after a drop
    client.on('connected', () => {
      this.logger.log('ZooKeeper (re)connected');
    });

    // block app startup until zk actually connects, fail fast if it never does
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              `ZooKeeper connection timed out after ${ZOOKEEPER_CONNECT_TIMEOUT_MS}ms`,
            ),
          ),
        ZOOKEEPER_CONNECT_TIMEOUT_MS,
      );
      client.once('connected', () => {
        clearTimeout(timeout);
        resolve();
      });
      this.client.connect();
    });

    // check if the shared counter node already exists in zk
    const exists = await new Promise((resolve, reject) =>
      this.client.exists(ZOOKEEPER_COUNTER_PATH, (err, stat) =>
        err ? reject(toError(err)) : resolve(stat),
      ),
    );

    // first instance ever to boot creates it starting at 0
    if (!exists) {
      try {
        await new Promise((resolve, reject) =>
          this.client.create(ZOOKEEPER_COUNTER_PATH, Buffer.from('0'), (err) =>
            err ? reject(toError(err)) : resolve(true),
          ),
        );
      } catch (err: any) {
        // two instances booted at the same moment, other one won the create race, that's fine
        if (err?.name !== 'NODE_EXISTS') throw err;
      }
    }

    this.logger.log('ZooKeeper ID generator ready');
  }

  async nextId(): Promise<number> {
    // local block used up, go refill from zk before handing out another id
    if (this.currentId >= this.maxId) {
      await this.allocateBlock();
    }
    // serve straight from memory, zero zk calls for 999 out of every 1000 requests
    return this.currentId++;
  }

  private async allocateBlock(): Promise<void> {
    // someone else already refilling right now, just wait on their result instead of duplicating work
    if (this.allocating) {
      await this.allocating;
      if (this.currentId < this.maxId) return;
    }

    this.allocating = this.doAllocateBlock();
    try {
      await this.allocating;
    } finally {
      this.allocating = null;
    }
  }

  private async doAllocateBlock(): Promise<void> {
    // retry loop handles the case where another node instance grabs the block first
    for (let attempt = 0; attempt < 10; attempt++) {
      // read current counter value plus its version number
      const { data, stat } = await new Promise<any>((resolve, reject) =>
        this.client.getData(ZOOKEEPER_COUNTER_PATH, (err, data, stat) =>
          err ? reject(toError(err)) : resolve({ data, stat }),
        ),
      );

      const current = parseInt(data.toString('utf8') || '0', 10);
      const next = current + this.blockSize;

      try {
        // atomic compare-and-swap: only succeeds if version still matches what we just read
        await new Promise((resolve, reject) =>
          this.client.setData(
            ZOOKEEPER_COUNTER_PATH,
            Buffer.from(String(next)),
            stat.version,
            (err) => (err ? reject(toError(err)) : resolve(true)),
          ),
        );

        // won the race, this block is ours and ours alone now
        this.currentId = current;
        this.maxId = next;
        return;
      } catch {
        // version conflict — another instance won the race, retry with fresh data
        this.logger.debug(
          `ZK version conflict on attempt ${attempt + 1}, retrying`,
        );
      }
    }

    // zk contention too high across 10 tries, something's wrong upstream, surface it loudly
    throw new Error(
      'Failed to allocate ID block — too much ZooKeeper contention',
    );
  }
}
