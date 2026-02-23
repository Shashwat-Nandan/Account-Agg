import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import type { BecknContext, BecknMessage, OndcDomain, OndcAction } from '@account-agg/shared';

export interface BecknConfig {
  bapId: string;
  bapUri: string;
  registryUrl: string;
  signingPrivateKey?: string;
}

/**
 * Beckn protocol BAP (Buyer-side Application Platform) adapter.
 * Implements the ONDC financial services protocol for product discovery and ordering.
 */
export class BecknAdapter {
  private readonly config: BecknConfig;
  private readonly http: AxiosInstance;
  private readonly callbackHandlers = new Map<string, (msg: BecknMessage) => void>();

  constructor(config: BecknConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.registryUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async search(intent: Record<string, unknown>, domain: string = 'ONDC:FIS12') {
    const context = this.buildContext('search', domain);
    const message: BecknMessage = {
      context,
      message: { intent },
    };
    return this.send(message);
  }

  async select(
    providerId: string,
    itemIds: string[],
    bppId: string,
    bppUri: string,
  ) {
    const context = this.buildContext('select');
    context.bpp_id = bppId;
    context.bpp_uri = bppUri;

    return this.send({
      context,
      message: {
        order: {
          provider: { id: providerId },
          items: itemIds.map((id) => ({ id })),
        },
      },
    });
  }

  async init(
    order: Record<string, unknown>,
    bppId: string,
    bppUri: string,
  ) {
    const context = this.buildContext('init');
    context.bpp_id = bppId;
    context.bpp_uri = bppUri;

    return this.send({
      context,
      message: { order },
    });
  }

  async confirm(
    order: Record<string, unknown>,
    bppId: string,
    bppUri: string,
  ) {
    const context = this.buildContext('confirm');
    context.bpp_id = bppId;
    context.bpp_uri = bppUri;

    return this.send({
      context,
      message: { order },
    });
  }

  /**
   * Register a callback handler for async responses (on_search, on_select, etc.)
   */
  onCallback(
    action: string,
    handler: (msg: BecknMessage) => void,
  ) {
    this.callbackHandlers.set(action, handler);
  }

  /**
   * Handle incoming callback from BPP.
   */
  handleCallback(action: string, payload: BecknMessage) {
    const handler = this.callbackHandlers.get(action);
    if (handler) {
      handler(payload);
    }
    return { message: { ack: { status: 'ACK' } } };
  }

  private async send(message: BecknMessage) {
    const response = await this.http.post(`/${message.context.action}`, message);
    return response.data;
  }

  private buildContext(
    action: string,
    domain: string = 'ONDC:FIS12',
  ): BecknContext {
    return {
      domain: domain as OndcDomain,
      action: action as OndcAction,
      bap_id: this.config.bapId,
      bap_uri: this.config.bapUri,
      transaction_id: randomUUID(),
      message_id: randomUUID(),
      timestamp: new Date().toISOString(),
      country: 'IND',
      city: 'std:080',
    };
  }
}
